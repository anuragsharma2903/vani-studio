import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { spawn } from 'child_process'
import { WatchedChannel, AppSettings } from './types'
import { settingsManager } from './settings'
import { queueManager } from './queueManager'


export class ChannelWatcherManager {
  private getFilePath(): string {
    const settings: AppSettings = settingsManager.getSettings()
    const dir = settings.repoPath
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    return join(dir, 'watched_channels.json')
  }

  public getChannels(): WatchedChannel[] {
    try {
      const filePath = this.getFilePath()
      if (existsSync(filePath)) {
        const raw = readFileSync(filePath, 'utf-8')
        return JSON.parse(raw)
      }
    } catch (e) {
      console.warn('Error loading watched channels:', e)
    }
    return []
  }

  public saveChannels(channels: WatchedChannel[]): void {
    try {
      const filePath = this.getFilePath()
      writeFileSync(filePath, JSON.stringify(channels, null, 2), 'utf-8')
    } catch (e) {
      console.error('Error saving watched channels:', e)
    }
  }

  public addChannel(
    url: string,
    options?: { name?: string; folderPath?: string; speaker?: string; autoUploadR2?: boolean }
  ): WatchedChannel {
    const channels = this.getChannels()
    const cleanUrl = url.trim()

    const existing = channels.find((c) => c.url === cleanUrl)
    if (existing) {
      existing.enabled = true
      if (options?.folderPath) existing.folderPath = options.folderPath
      if (options?.speaker) existing.speaker = options.speaker
      this.saveChannels(channels)
      return existing
    }

    const newChannel: WatchedChannel = {
      id: `watch_${Date.now()}_${randomUUID().substring(0, 6)}`,
      url: cleanUrl,
      name: options?.name || cleanUrl,
      folderPath: options?.folderPath || 'Lectures',
      speaker: options?.speaker || 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)',
      lastChecked: undefined,
      lastVideoId: undefined,
      autoUploadR2: options?.autoUploadR2 !== false,
      enabled: true,
      createdAt: new Date().toISOString()
    }

    channels.push(newChannel)
    this.saveChannels(channels)

    // Trigger immediate check
    this.checkChannel(newChannel.id).catch((e) => console.warn('Channel check deferred:', e))

    return newChannel
  }

  public removeChannel(id: string): boolean {
    const channels = this.getChannels()
    const filtered = channels.filter((c) => c.id !== id)
    if (filtered.length !== channels.length) {
      this.saveChannels(filtered)
      return true
    }
    return false
  }

  public toggleChannel(id: string, enabled: boolean): WatchedChannel | null {
    const channels = this.getChannels()
    const ch = channels.find((c) => c.id === id)
    if (!ch) return null
    ch.enabled = enabled
    this.saveChannels(channels)
    return ch
  }

  public async checkChannel(id: string): Promise<{ newVideosFound: number; videoIds: string[] }> {
    const channels = this.getChannels()
    const ch = channels.find((c) => c.id === id)
    if (!ch || !ch.enabled) return { newVideosFound: 0, videoIds: [] }

    const ytdlpBinary = settingsManager.resolveYtdlpPath()

    const args = [
      '--dump-single-json',
      '--flat-playlist',
      '--playlist-end',
      '5',
      '--no-warnings',
      '--no-check-certificates',
      ch.url
    ]

    return new Promise((resolve) => {
      let stdoutData = ''
      const child = spawn(ytdlpBinary, args)

      child.stdout.on('data', (data) => {
        stdoutData += data.toString()
      })

      child.on('close', async (code) => {
        if (code === 0 && stdoutData) {
          try {
            const parsed = JSON.parse(stdoutData)
            const entries = parsed.entries || (parsed.id ? [parsed] : [])
            const newUrls: string[] = []

            for (const entry of entries) {
              const videoId = entry.id
              const videoUrl = entry.url || `https://www.youtube.com/watch?v=${videoId}`

              if (videoId && (!ch.lastVideoId || ch.lastVideoId !== videoId)) {
                newUrls.push(videoUrl)
              }
            }

            if (entries.length > 0 && entries[0].id) {
              ch.lastVideoId = entries[0].id
            }
            ch.lastChecked = new Date().toISOString()
            this.saveChannels(channels)

            if (newUrls.length > 0) {
              await queueManager.addToQueue(newUrls, {
                folderPath: ch.folderPath,
                speaker: ch.speaker,
                autoAddToRepo: true
              })
            }


            resolve({ newVideosFound: newUrls.length, videoIds: newUrls })
          } catch (e) {
            console.error('Error parsing watcher output:', e)
            resolve({ newVideosFound: 0, videoIds: [] })
          }
        } else {
          resolve({ newVideosFound: 0, videoIds: [] })
        }
      })

      child.on('error', () => {
        resolve({ newVideosFound: 0, videoIds: [] })
      })
    })
  }

  public async checkAllChannels(): Promise<{ checked: number; totalNew: number }> {
    const channels = this.getChannels().filter((c) => c.enabled)
    let totalNew = 0

    for (const ch of channels) {
      try {
        const res = await this.checkChannel(ch.id)
        totalNew += res.newVideosFound
      } catch (e) {
        console.warn(`Error checking channel ${ch.name}:`, e)
      }
    }

    return { checked: channels.length, totalNew }
  }
}

export const channelWatcherManager = new ChannelWatcherManager()
