import type { PronunciationType } from '@/typings'
import { romajiToHiragana } from '@/utils/kana'

/**
 * MOBEI deployment: backup pronunciation when the Youdao audio can't load or play.
 *   1. MOBEI's own Microsoft (Azure) voice at /api/tts — English (us/uk) words only
 *   2. the browser's built-in speech synthesis
 * so learners are never left without sound.
 */
const LANG: Partial<Record<Exclude<PronunciationType, false>, string>> = {
  us: 'en-US',
  uk: 'en-GB',
  romaji: 'ja-JP',
  ja: 'ja-JP',
  zh: 'zh-CN',
  de: 'de-DE',
  id: 'id-ID',
  hapin: 'ru-RU',
  kk: 'ru-RU',
}
const TTS_TEXT = /^[A-Za-z][A-Za-z' .-]{0,39}$/

let current: HTMLAudioElement | null = null
/** Words whose /api/tts request failed this session — go straight to browser speech for them */
const ttsFailed = new Set<string>()

export function canSpeakFallback(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'
}

function speakWithBrowser(word: string, type: PronunciationType, rate: number, volume: number): boolean {
  if (!canSpeakFallback()) return false
  const lang = LANG[type] ?? 'en-US'
  const text = type === 'romaji' ? romajiToHiragana(word) : word
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  utterance.rate = Math.min(Math.max(rate, 0.5), 2)
  utterance.volume = Math.min(Math.max(volume, 0), 1)
  const voices = window.speechSynthesis.getVoices()
  const voice = voices.find((v) => v.lang === lang) ?? voices.find((v) => v.lang.startsWith(lang.slice(0, 2)))
  if (voice) utterance.voice = voice
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
  return true
}

/** Try MOBEI's Azure voice; resolves false if it can't play (not configured, offline, rate-limited…). */
function playMobeiTts(word: string, type: PronunciationType, rate: number, volume: number): Promise<boolean> {
  const voice = type === 'uk' ? 'uk' : type === 'us' ? 'us' : null
  const text = word.trim()
  const key = `${voice}:${text.toLowerCase()}`
  if (!voice || !TTS_TEXT.test(text) || ttsFailed.has(key) || typeof Audio === 'undefined') return Promise.resolve(false)
  return new Promise((resolve) => {
    const audio = new Audio(`/api/tts?voice=${voice}&text=${encodeURIComponent(text)}`)
    audio.volume = Math.min(Math.max(volume, 0), 1)
    audio.playbackRate = Math.min(Math.max(rate, 0.5), 2)
    const fail = () => {
      ttsFailed.add(key)
      resolve(false)
    }
    audio.addEventListener('error', fail, { once: true })
    current = audio
    audio.play().then(() => resolve(true), fail)
  })
}

/** Start backup pronunciation. Returns false only when nothing at all can speak. */
let lastStart = { key: '', at: 0 }

export function speakFallback(word: string, type: PronunciationType, rate = 1, volume = 1): boolean {
  if (!word) return false
  // One failure can surface twice (play promise + error event); speak once
  const key = `${type}:${word}`
  const now = Date.now()
  if (lastStart.key === key && now - lastStart.at < 500) return true
  lastStart = { key, at: now }
  stopSpeakFallback()
  void playMobeiTts(word, type, rate, volume).then((ok) => {
    if (!ok) speakWithBrowser(word, type, rate, volume)
  })
  return true
}

export function stopSpeakFallback(): void {
  if (current) {
    current.pause()
    current = null
  }
  if (canSpeakFallback()) window.speechSynthesis.cancel()
}
