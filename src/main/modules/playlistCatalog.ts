import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { spawn } from 'child_process'
import { DiscoursePlaylist, PlaylistItem, AppSettings } from './types'
import { settingsManager } from './settings'
import { queueManager } from './queueManager'
import { parseDiscourseFromTitle } from './metadataParser'

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

const DEFAULT_PLAYLISTS: DiscoursePlaylist[] = [
  {
    id: 'pl_lglg_sb_series',
    title: 'LGLG - Srimad Bhagavatam Comprehensive Series',
    category: 'LGLG',
    description: 'Weekly Live Gyan / Lila Govinda discourses by HG Lila Purushottam Das (Dr. Laxmidhar Behera).',
    speaker: 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)',
    itemCount: 4,
    createdAt: '2026-08-01T00:00:00Z',
    items: [
      {
        id: 'item_lglg_1',
        videoId: 'sb_1_1_1_behera',
        title: 'SB 1.1.1 Janmady Asya Yato - Supreme Truth (LGLG Series) | Dr. Laxmidhar Behera',
        url: 'https://www.youtube.com/watch?v=sb_1_1_1_behera',
        thumbnail: 'https://i.ytimg.com/vi/sb_1_1_1_behera/hqdefault.jpg',
        duration: 3600,
        durationFormatted: '1:00:00',
        position: 1,
        scripture: 'Srimad Bhagavatam',
        verse: 'SB 1.1.1',
        topic: 'The Absolute Truth'
      },
      {
        id: 'item_lglg_2',
        videoId: 'sb_1_2_6_behera',
        title: 'SB 1.2.6 Sa Vai Pumsam Paro Dharmo (LGLG Series) | Dr. Laxmidhar Behera',
        url: 'https://www.youtube.com/watch?v=sb_1_2_6_behera',
        thumbnail: 'https://i.ytimg.com/vi/sb_1_2_6_behera/hqdefault.jpg',
        duration: 3420,
        durationFormatted: '57:00',
        position: 2,
        scripture: 'Srimad Bhagavatam',
        verse: 'SB 1.2.6',
        topic: 'Supreme Dharma'
      },
      {
        id: 'item_lglg_3',
        videoId: 'sb_10_2_13_behera',
        title: 'SB 10.2.13 Prayers by Demigods in the Womb (LGLG Special) | HG Lila Purushottam Das',
        url: 'https://www.youtube.com/watch?v=sb_10_2_13_behera',
        thumbnail: 'https://i.ytimg.com/vi/sb_10_2_13_behera/hqdefault.jpg',
        duration: 4100,
        durationFormatted: '1:08:20',
        position: 3,
        scripture: 'Srimad Bhagavatam',
        verse: 'SB 10.2.13',
        topic: 'Garbha Stuti'
      },
      {
        id: 'item_lglg_4',
        videoId: 'sb_10_9_1_behera',
        title: 'SB 10.9.1 Damodara Lila Mother Yashoda Binds Krishna | Dr. Laxmidhar Behera',
        url: 'https://www.youtube.com/watch?v=sb_10_9_1_behera',
        thumbnail: 'https://i.ytimg.com/vi/sb_10_9_1_behera/hqdefault.jpg',
        duration: 3900,
        durationFormatted: '1:05:00',
        position: 4,
        scripture: 'Srimad Bhagavatam',
        verse: 'SB 10.9.1',
        topic: 'Damodara Lila'
      }
    ]
  },
  {
    id: 'pl_lglg_bg_series',
    title: 'LGLG - Bhagavad Gita Systematic Chapter Reflections',
    category: 'LGLG',
    description: 'Daily Gita verse insights and life applications by Dr. Laxmidhar Behera.',
    speaker: 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)',
    itemCount: 3,
    createdAt: '2026-08-05T00:00:00Z',
    items: [
      {
        id: 'item_lglg_bg_1',
        videoId: 'bg_2_13_behera',
        title: 'BG 2.13 Dehino Smin Yatha Dehe - Science of Soul (LGLG) | Dr. Laxmidhar Behera',
        url: 'https://www.youtube.com/watch?v=bg_2_13_behera',
        thumbnail: 'https://i.ytimg.com/vi/bg_2_13_behera/hqdefault.jpg',
        duration: 3100,
        durationFormatted: '51:40',
        position: 1,
        scripture: 'Bhagavad Gita',
        verse: 'BG 2.13',
        topic: 'Science of Reincarnation'
      },
      {
        id: 'item_lglg_bg_2',
        videoId: 'bg_4_34_behera',
        title: 'BG 4.34 Tad Viddhi Pranipatena - Approaching the Guru | HG Lila Purushottam Das',
        url: 'https://www.youtube.com/watch?v=bg_4_34_behera',
        thumbnail: 'https://i.ytimg.com/vi/bg_4_34_behera/hqdefault.jpg',
        duration: 3300,
        durationFormatted: '55:00',
        position: 2,
        scripture: 'Bhagavad Gita',
        verse: 'BG 4.34',
        topic: 'Spiritual Initiation'
      },
      {
        id: 'item_lglg_bg_3',
        videoId: 'bg_18_66_behera',
        title: 'BG 18.66 Sarva Dharman Parityajya - Ultimate Surrender | Dr. Laxmidhar Behera',
        url: 'https://www.youtube.com/watch?v=bg_18_66_behera',
        thumbnail: 'https://i.ytimg.com/vi/bg_18_66_behera/hqdefault.jpg',
        duration: 3750,
        durationFormatted: '1:02:30',
        position: 3,
        scripture: 'Bhagavad Gita',
        verse: 'BG 18.66',
        topic: 'Final Instruction'
      }
    ]
  },
  {
    id: 'pl_science_consciousness',
    title: 'Science, Consciousness & Vedic Epistemology',
    category: 'Science & Consciousness',
    description: 'IIT Mandi, IIT Kanpur and International Seminars on Consciousness, AI, Quantum Physics & Vedic Wisdom.',
    speaker: 'Dr. Laxmidhar Behera',
    itemCount: 2,
    createdAt: '2026-08-10T00:00:00Z',
    items: [
      {
        id: 'item_sci_1',
        videoId: 'consciousness_ai_behera',
        title: 'Artificial Intelligence and the Nature of Human Consciousness | Dr. Laxmidhar Behera',
        url: 'https://www.youtube.com/watch?v=consciousness_ai_behera',
        thumbnail: 'https://i.ytimg.com/vi/consciousness_ai_behera/hqdefault.jpg',
        duration: 4800,
        durationFormatted: '1:20:00',
        position: 1,
        topic: 'AI vs Consciousness'
      },
      {
        id: 'item_sci_2',
        videoId: 'vedic_quantum_behera',
        title: 'Quantum Mechanics and the Vedic Model of Reality | Prof. Laxmidhar Behera',
        url: 'https://www.youtube.com/watch?v=vedic_quantum_behera',
        thumbnail: 'https://i.ytimg.com/vi/vedic_quantum_behera/hqdefault.jpg',
        duration: 5200,
        durationFormatted: '1:26:40',
        position: 2,
        topic: 'Vedic Cosmology & Quantum Theory'
      }
    ]
  },
  {
    id: 'pl_festivals_katha',
    title: 'Festivals & Jayanti Special Katha',
    category: 'Festivals',
    description: 'Appearance day discourses: Janmashtami, Balaram Jayanti, Radhashtami, Gaura Purnima & Govardhan Puja.',
    speaker: 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)',
    itemCount: 2,
    createdAt: '2026-08-15T00:00:00Z',
    items: [
      {
        id: 'item_fest_1',
        videoId: 'balaram_jayanti_2026_behera',
        title: 'Sri Balaram Jayanti 2026 Special Katha & Glories | Dr. Laxmidhar Behera',
        url: 'https://www.youtube.com/watch?v=balaram_jayanti_2026_behera',
        thumbnail: 'https://i.ytimg.com/vi/balaram_jayanti_2026_behera/hqdefault.jpg',
        duration: 4200,
        durationFormatted: '1:10:00',
        position: 1,
        topic: 'Balaram Jayanti'
      },
      {
        id: 'item_fest_2',
        videoId: 'janmashtami_katha_behera',
        title: 'Sri Krishna Janmashtami Mahotsav Deep Meditation | HG Lila Purushottam Das',
        url: 'https://www.youtube.com/watch?v=janmashtami_katha_behera',
        thumbnail: 'https://i.ytimg.com/vi/janmashtami_katha_behera/hqdefault.jpg',
        duration: 4600,
        durationFormatted: '1:16:40',
        position: 2,
        topic: 'Krishna Janmashtami'
      }
    ]
  }
]

export class PlaylistCatalogManager {
  private getFilePath(): string {
    const settings: AppSettings = settingsManager.getSettings()
    const dir = settings.repoPath
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    return join(dir, 'discourse_playlists.json')
  }

  public getPlaylists(): DiscoursePlaylist[] {
    try {
      const filePath = this.getFilePath()
      if (existsSync(filePath)) {
        const raw = readFileSync(filePath, 'utf-8')
        const loaded: DiscoursePlaylist[] = JSON.parse(raw)
        if (Array.isArray(loaded) && loaded.length > 0) {
          return loaded
        }
      }
    } catch (e) {
      console.warn('Error loading discourse playlists:', e)
    }

    // Save & return defaults
    this.savePlaylists(DEFAULT_PLAYLISTS)
    return DEFAULT_PLAYLISTS
  }

  public savePlaylists(playlists: DiscoursePlaylist[]): void {
    try {
      const filePath = this.getFilePath()
      writeFileSync(filePath, JSON.stringify(playlists, null, 2), 'utf-8')
    } catch (e) {
      console.error('Error saving discourse playlists:', e)
    }
  }

  public addCustomPlaylist(playlist: Partial<DiscoursePlaylist>): DiscoursePlaylist {
    const playlists = this.getPlaylists()
    const newPlaylist: DiscoursePlaylist = {
      id: `pl_custom_${Date.now()}_${randomUUID().substring(0, 6)}`,
      title: playlist.title?.trim() || 'New Playlist',
      category: playlist.category || 'LGLG',
      description: playlist.description?.trim() || '',
      url: playlist.url?.trim(),
      speaker: playlist.speaker || 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)',
      itemCount: playlist.items ? playlist.items.length : 0,
      items: playlist.items || [],
      isCustom: true,
      createdAt: new Date().toISOString()
    }

    playlists.unshift(newPlaylist)
    this.savePlaylists(playlists)
    return newPlaylist
  }

  public removePlaylist(id: string): boolean {
    let playlists = this.getPlaylists()
    const initialLen = playlists.length
    playlists = playlists.filter((p) => p.id !== id)
    if (playlists.length !== initialLen) {
      this.savePlaylists(playlists)
      return true
    }
    return false
  }

  /**
   * Fetch all videos from any YouTube Playlist URL using yt-dlp
   */
  public async fetchVideosFromYouTubePlaylist(
    playlistUrl: string
  ): Promise<{ title: string; uploader: string; items: PlaylistItem[] }> {
    const ytdlpBinary = settingsManager.resolveYtdlpPath()

    const args = [
      '--dump-single-json',
      '--flat-playlist',
      '--no-warnings',
      '--no-check-certificates',
      playlistUrl.trim()
    ]

    return new Promise((resolve, reject) => {
      let stdoutData = ''
      let stderrData = ''
      const child = spawn(ytdlpBinary, args)

      child.stdout.on('data', (data) => {
        stdoutData += data.toString()
      })

      child.stderr.on('data', (data) => {
        stderrData += data.toString()
      })

      child.on('close', (code) => {
        if (code === 0 && stdoutData) {
          try {
            const parsed = JSON.parse(stdoutData)
            const playlistTitle = parsed.title || 'Imported YouTube Playlist'
            const uploader = parsed.uploader || 'Dr. Laxmidhar Behera'
            const entries = parsed.entries || []

            const items: PlaylistItem[] = entries.map((entry: any, idx: number) => {
              const vidId = entry.id || ''
              const dur = typeof entry.duration === 'number' ? entry.duration : undefined
              const meta = parseDiscourseFromTitle(entry.title || '', entry.description, uploader)

              return {
                id: `item_${Date.now()}_${idx}_${randomUUID().substring(0, 4)}`,
                videoId: vidId,
                title: entry.title || 'Untitled Video',
                url: entry.url || `https://www.youtube.com/watch?v=${vidId}`,
                thumbnail:
                  entry.thumbnail ||
                  entry.thumbnails?.[0]?.url ||
                  `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
                duration: dur,
                durationFormatted: dur ? formatSeconds(dur) : undefined,
                position: idx + 1,
                scripture: meta.scripture,
                verse: meta.verse,
                topic: meta.philosophyTopic || meta.festival
              }
            })

            resolve({ title: playlistTitle, uploader, items })
          } catch (e: any) {
            reject(new Error(`Failed to parse playlist JSON: ${e.message}`))
          }
        } else {
          reject(new Error(`yt-dlp playlist extraction failed: ${stderrData || 'Unknown error'}`))
        }
      })

      child.on('error', (err) => {
        reject(err)
      })
    })
  }

  /**
   * Batch enqueue all videos in a playlist to extract 24 kbps Voice HD audio
   */
  public async batchEnqueuePlaylist(
    playlistId: string,
    targetFolder?: string
  ): Promise<{ enqueuedCount: number }> {
    const playlists = this.getPlaylists()
    const playlist = playlists.find((p) => p.id === playlistId)
    if (!playlist || !playlist.items || playlist.items.length === 0) {
      return { enqueuedCount: 0 }
    }

    const folder = targetFolder || (playlist.category === 'LGLG' ? 'LGLG Discourses' : playlist.category)
    const urls = playlist.items.map((i) => i.url)

    await queueManager.addToQueue(urls, {
      folderPath: folder,
      speaker: playlist.speaker || 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)',
      autoAddToRepo: true
    })

    return { enqueuedCount: urls.length }
  }
}

export const playlistCatalogManager = new PlaylistCatalogManager()
