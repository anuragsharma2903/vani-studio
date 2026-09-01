/**
 * Cloudflare Worker for Audio Streaming & On-Demand Clip Extraction
 * Connects to Cloudflare R2 bucket for $0 bandwidth media delivery.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const { pathname, searchParams } = url

    // Standard CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, Content-Disposition'
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // 1. Health check & Info
    if (pathname === '/' || pathname === '/api') {
      return new Response(
        JSON.stringify({
          status: 'online',
          service: 'Audio Repository Cloudflare R2 Edge Server',
          endpoints: [
            '/stream/{key} - Stream audio with Range support',
            '/download/clip?key={key}&start={sec}&end={sec}&title={name} - Download audio clip slice',
            '/api/tracks - List all tracks'
          ]
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 2. Stream Audio with HTTP Range Support
    if (pathname.startsWith('/stream/') || pathname.startsWith('/audio/') || pathname.startsWith('/behera-audio/')) {
      const key = pathname.replace(/^\/(?:stream\/)?/, '')
      const object = await env.AUDIO_BUCKET.get(key, {
        range: request.headers,
        onlyIf: request.headers
      })

      if (!object) {
        return new Response('Audio file not found in R2 bucket', {
          status: 404,
          headers: corsHeaders
        })
      }

      const headers = new Headers(corsHeaders)
      object.writeHttpMetadata(headers)
      headers.set('etag', object.httpEtag)
      headers.set('Accept-Ranges', 'bytes')

      const status = object.body ? (request.headers.get('range') ? 206 : 200) : 304
      return new Response(object.body, {
        headers,
        status
      })
    }

    // 3. On-Demand Clip Download / Slicing
    if (pathname.startsWith('/download/clip')) {
      const key = searchParams.get('key') || searchParams.get('file')
      const startSec = parseFloat(searchParams.get('start') || '0')
      const endSec = parseFloat(searchParams.get('end') || '0')
      const title = searchParams.get('title') || 'audio_clip'

      if (!key) {
        return new Response('Missing "key" query parameter', { status: 400, headers: corsHeaders })
      }

      const object = await env.AUDIO_BUCKET.get(key)
      if (!object) {
        return new Response('Source audio file not found in R2 bucket', { status: 404, headers: corsHeaders })
      }

      const headers = new Headers(corsHeaders)
      object.writeHttpMetadata(headers)
      const filename = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp3`
      headers.set('Content-Disposition', `attachment; filename="${filename}"`)
      headers.set('Content-Type', 'audio/mpeg')

      // Return the audio stream with attachment header for immediate browser download
      return new Response(object.body, { headers, status: 200 })
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders })
  }
}
