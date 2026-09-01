import { spawn } from 'child_process'
import { YouTubeSearchResult, AppSettings } from './types'
import { settingsManager } from './settings'
import { queueManager } from './queueManager'
import { parseDiscourseFromTitle } from './metadataParser'

function parseIsoDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)
  return hours * 3600 + minutes * 60 + seconds
}

function formatSeconds(secs: number): string {
  if (isNaN(secs) || secs <= 0) return '0:00'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.floor(secs % 60)
  if (h > 0) {
    return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
  }
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

export class YouTubeApiManager {
  /**
   * Search for videos of Dr. Laxmidhar Behera / Lila Purushottam Das
   * Uses Google YouTube Data API v3 if API key configured, otherwise falls back to yt-dlp search.
   */
  public async searchVideos(
    query: string,
    maxResults: number = 25,
    customApiKey?: string
  ): Promise<{ results: YouTubeSearchResult[]; source: 'google_api' | 'ytdlp_search' }> {
    const settings: AppSettings = settingsManager.getSettings()
    const apiKey = customApiKey || settings.youtubeApiKey

    if (apiKey && apiKey.trim()) {
      try {
        const res = await this.searchViaGoogleApi(query.trim(), maxResults, apiKey.trim())
        if (res.length > 0) {
          return { results: res, source: 'google_api' }
        }
      } catch (e) {
        console.warn('Google YouTube API search failed, falling back to yt-dlp:', e)
      }
    }

    // Fallback: yt-dlp search
    const ytdlpResults = await this.searchViaYtdlp(query.trim(), maxResults)
    return { results: ytdlpResults, source: 'ytdlp_search' }
  }

  /**
   * Search using Google YouTube Data API v3
   */
  private async searchViaGoogleApi(
    query: string,
    maxResults: number,
    apiKey: string
  ): Promise<YouTubeSearchResult[]> {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      query
    )}&type=video&maxResults=${maxResults}&key=${apiKey}`

    const searchResponse = await fetch(searchUrl)
    if (!searchResponse.ok) {
      const err = await searchResponse.text()
      throw new Error(`YouTube API Error (${searchResponse.status}): ${err}`)
    }

    const searchData = await searchResponse.json()
    const items = searchData.items || []
    if (items.length === 0) return []

    const videoIds = items.map((i: any) => i.id?.videoId).filter(Boolean)
    if (videoIds.length === 0) return []

    // Fetch video contentDetails for duration & statistics
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds.join(
      ','
    )}&key=${apiKey}`
    const detailsResponse = await fetch(detailsUrl)
    let detailsMap: Record<string, any> = {}

    if (detailsResponse.ok) {
      const detailsData = await detailsResponse.json()
      for (const d of detailsData.items || []) {
        detailsMap[d.id] = d
      }
    }

    return items.map((item: any): YouTubeSearchResult => {
      const vidId = item.id?.videoId || ''
      const detail = detailsMap[vidId]
      const durationSec = detail?.contentDetails?.duration
        ? parseIsoDuration(detail.contentDetails.duration)
        : undefined

      const snippet = detail?.snippet || item.snippet || {}

      return {
        id: vidId,
        title: snippet.title || 'Untitled Discourse',
        url: `https://www.youtube.com/watch?v=${vidId}`,
        thumbnail:
          snippet.thumbnails?.high?.url ||
          snippet.thumbnails?.medium?.url ||
          snippet.thumbnails?.default?.url ||
          `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
        channelTitle: snippet.channelTitle || 'YouTube',
        publishedAt: snippet.publishedAt || '',
        duration: durationSec,
        durationFormatted: durationSec ? formatSeconds(durationSec) : undefined,
        description: snippet.description || ''
      }
    })
  }

  /**
   * Search using yt-dlp search extractor (No API Key Required)
   */
  private async searchViaYtdlp(query: string, maxResults: number): Promise<YouTubeSearchResult[]> {
    const ytdlpBinary = settingsManager.resolveYtdlpPath()
    const searchQuery = `ytsearch${maxResults}:${query}`

    const args = [
      '--dump-single-json',
      '--flat-playlist',
      '--no-warnings',
      '--no-check-certificates',
      searchQuery
    ]

    return new Promise((resolve) => {
      let stdoutData = ''
      const child = spawn(ytdlpBinary, args)

      child.stdout.on('data', (data) => {
        stdoutData += data.toString()
      })

      child.on('close', (code) => {
        if (code === 0 && stdoutData) {
          try {
            const parsed = JSON.parse(stdoutData)
            const entries = parsed.entries || (parsed.id ? [parsed] : [])
            const results: YouTubeSearchResult[] = entries.map((entry: any) => {
              const vidId = entry.id || ''
              const dur = typeof entry.duration === 'number' ? entry.duration : undefined

              return {
                id: vidId,
                title: entry.title || 'Untitled Video',
                url: entry.url || `https://www.youtube.com/watch?v=${vidId}`,
                thumbnail:
                  entry.thumbnail ||
                  entry.thumbnails?.[0]?.url ||
                  `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
                channelTitle: entry.uploader || entry.channel || 'YouTube',
                publishedAt: entry.upload_date || '',
                duration: dur,
                durationFormatted: dur ? formatSeconds(dur) : undefined,
                description: entry.description || ''
              }
            })
            resolve(results)
          } catch (e) {
            console.error('Error parsing yt-dlp search JSON:', e)
            resolve([])
          }
        } else {
          resolve([])
        }
      })

      child.on('error', (err) => {
        console.error('yt-dlp search error:', err)
        resolve([])
      })
    })
  }

  /**
   * Batch enqueue discovered YouTube videos to download & extract minimal audio
   */
  public async enqueueDiscoveredVideos(
    videos: YouTubeSearchResult[],
    targetFolder?: string
  ): Promise<{ enqueuedCount: number }> {
    if (!videos || videos.length === 0) return { enqueuedCount: 0 }

    for (const v of videos) {
      const parsed = parseDiscourseFromTitle(v.title, v.description, v.channelTitle)
      const folder = targetFolder || parsed.suggestedFolderPath || 'Lectures'

      await queueManager.addToQueue([v.url], {
        folderPath: folder,
        speaker: 'Dr. Laxmidhar Behera (Lila Purushottam Das)',
        autoAddToRepo: true
      })
    }

    return { enqueuedCount: videos.length }
  }
}

export const youtubeApiManager = new YouTubeApiManager()
