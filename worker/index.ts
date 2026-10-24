/**
 * MOBEI Typing Worker (typing.mobei.win)
 *
 * Static assets are served by Cloudflare; this script only handles /api/*:
 *   GET /api/tts?text=<word>&voice=us|uk  →  audio/mpeg from Azure Speech
 *
 * Safety: the Azure key is a Worker secret (never sent to browsers); only this
 * site may call it; input is limited to short English words/phrases; every
 * result is cached at the edge so each word is synthesised once; uncached
 * requests are rate-limited per IP. Use the Azure F0 (free) tier so it can
 * never bill: F0 simply stops at its monthly quota and the site falls back to
 * browser speech.
 */
export interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> }
  AZURE_SPEECH_KEY?: string
  AZURE_SPEECH_REGION?: string
  TTS_LIMITER?: { limit: (opts: { key: string }) => Promise<{ success: boolean }> }
}

const VOICES: Record<string, { lang: string; name: string }> = {
  us: { lang: 'en-US', name: 'en-US-JennyNeural' },
  uk: { lang: 'en-GB', name: 'en-GB-SoniaNeural' },
}
const ALLOWED_HOSTS = new Set(['typing.mobei.win', 'localhost', '127.0.0.1'])
const TEXT_RE = /^[A-Za-z][A-Za-z' .-]{0,39}$/

const escapeXml = (s: string) =>
  s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] as string))

function fromThisSite(req: Request): boolean {
  if (req.headers.get('Sec-Fetch-Site') === 'same-origin') return true
  const ref = req.headers.get('Referer') || req.headers.get('Origin')
  if (!ref) return false
  try {
    return ALLOWED_HOSTS.has(new URL(ref).hostname)
  } catch {
    return false
  }
}

const text = (status: number, body: string) =>
  new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } })

async function tts(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (req.method !== 'GET') return text(405, 'method not allowed')
  const url = new URL(req.url)
  const word = (url.searchParams.get('text') || '').trim().replace(/\s+/g, ' ')
  const voiceKey = url.searchParams.get('voice') === 'uk' ? 'uk' : 'us'
  if (!TEXT_RE.test(word)) return text(400, 'bad text')
  if (!fromThisSite(req)) return text(403, 'forbidden')
  if (!env.AZURE_SPEECH_KEY || !env.AZURE_SPEECH_REGION) return text(503, 'tts not configured')

  // Normalised cache key: same word + voice → same cached audio for everyone
  const cacheKey = new Request(`https://typing.mobei.win/api/tts-cache/v1/${voiceKey}/${encodeURIComponent(word.toLowerCase())}`)
  const cache = caches.default
  const hit = await cache.match(cacheKey)
  if (hit) return hit

  if (env.TTS_LIMITER) {
    const ip = req.headers.get('CF-Connecting-IP') || 'unknown'
    const { success } = await env.TTS_LIMITER.limit({ key: ip })
    if (!success) return text(429, 'slow down')
  }

  const voice = VOICES[voiceKey]
  const ssml = `<speak version="1.0" xml:lang="${voice.lang}"><voice name="${voice.name}"><prosody rate="-5%">${escapeXml(
    word,
  )}</prosody></voice></speak>`
  const azure = await fetch(`https://${env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'mobei-typing',
    },
    body: ssml,
  })
  if (!azure.ok) return text(502, `tts upstream ${azure.status}`)

  const audio = await azure.arrayBuffer()
  const res = new Response(audio, {
    headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-MOBEI-TTS': voice.name },
  })
  ctx.waitUntil(cache.put(cacheKey, res.clone()))
  return res
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url)
    if (url.pathname === '/api/tts') return tts(req, env, ctx)
    if (url.pathname.startsWith('/api/')) return text(404, 'not found')
    return env.ASSETS.fetch(req)
  },
}
