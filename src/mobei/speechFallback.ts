import type { PronunciationType } from '@/typings'
import { romajiToHiragana } from '@/utils/kana'

/**
 * MOBEI deployment: when the Youdao pronunciation audio can't load or play,
 * read the word with the browser's built-in speech instead, so learners are
 * never left without sound.
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

export function canSpeakFallback(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'
}

export function speakFallback(word: string, type: PronunciationType, rate = 1, volume = 1): boolean {
  if (!word || !canSpeakFallback()) return false
  const lang = LANG[type] ?? 'en-US'
  const text = type === 'romaji' ? romajiToHiragana(word) : word
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  utterance.rate = Math.min(Math.max(rate, 0.5), 2)
  utterance.volume = Math.min(Math.max(volume, 0), 1)
  const voice =
    window.speechSynthesis.getVoices().find((v) => v.lang === lang) ??
    window.speechSynthesis.getVoices().find((v) => v.lang.startsWith(lang.slice(0, 2)))
  if (voice) utterance.voice = voice
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
  return true
}

export function stopSpeakFallback(): void {
  if (canSpeakFallback()) window.speechSynthesis.cancel()
}
