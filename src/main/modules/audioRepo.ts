import { app, shell, WebContents } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, statSync, readdirSync, copyFileSync } from 'fs'
import { spawn, exec } from 'child_process'
import { promisify } from 'util'
import { randomUUID } from 'crypto'
import { AudioMetadata, CropOptions, DownloadProgress, VideoInfo } from './types'
import { settingsManager } from './settings'

const execAsync = promisify(exec)

const REPO_JSON_NAME = 'repo.json'

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '_').trim()
}

function findAudioFile(tempDir: string, id: string): string | null {
  const directMp3 = join(tempDir, `${id}.mp3`)
  if (existsSync(directMp3)) return directMp3

  try {
    const files = readdirSync(tempDir)
    const candidate = files.find(
      (f) =>
        f.startsWith(id) &&
        (f.endsWith('.mp3') ||
          f.endsWith('.m4a') ||
          f.endsWith('.wav') ||
          f.endsWith('.webm') ||
          f.endsWith('.opus') ||
          f.endsWith('.mp4'))
    )
    if (candidate) {
      return join(tempDir, candidate)
    }
  } catch (e) {
    console.warn('Error finding audio file:', e)
  }
  return null
}

function parseTimestampToSeconds(t: string): number {
  if (/^\d+$/.test(t)) {
    return parseInt(t, 10)
  }
  let total = 0
  const hours = t.match(/(\d+)h/)
  const minutes = t.match(/(\d+)m/)
  const seconds = t.match(/(\d+)s/)
  if (hours) total += parseInt(hours[1], 10) * 3600
  if (minutes) total += parseInt(minutes[1], 10) * 60
  if (seconds) total += parseInt(seconds[1], 10)
  return total
}

export function normalizeYouTubeUrl(rawUrl: string): { normalizedUrl: string; startTime?: number } {
  try {
    const trimmed = rawUrl.trim()
    const parsed = new URL(trimmed)
    let videoId: string | null = null
    let startTime: number | undefined = undefined

    const tParam = parsed.searchParams.get('t') || parsed.searchParams.get('time_continue')
    if (tParam) {
      startTime = parseTimestampToSeconds(tParam)
    }

    if (parsed.hostname.includes('youtu.be')) {
      videoId = parsed.pathname.replace(/^\//, '').split('/')[0]
    } else if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/live/')) {
        videoId = parsed.pathname.replace(/^\/live\//, '').split('/')[0]
      } else if (parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.replace(/^\/shorts\//, '').split('/')[0]
      } else if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.replace(/^\/embed\//, '').split('/')[0]
      } else if (parsed.searchParams.has('v')) {
        videoId = parsed.searchParams.get('v')
      }
    }

    if (videoId) {
      videoId = videoId.replace(/[?&#/].*$/, '')
      return {
        normalizedUrl: `https://www.youtube.com/watch?v=${videoId}`,
        startTime
      }
    }
  } catch {
    const liveMatch = rawUrl.match(
      /(?:youtube\.com\/live\/|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/|watch\?v=)([a-zA-Z0-9_-]{11})/
    )
    if (liveMatch && liveMatch[1]) {
      const timeMatch = rawUrl.match(/[?&]t=(\d+)/)
      return {
        normalizedUrl: `https://www.youtube.com/watch?v=${liveMatch[1]}`,
        startTime: timeMatch ? parseInt(timeMatch[1], 10) : undefined
      }
    }
  }

  return { normalizedUrl: rawUrl.trim() }
}

export class AudioRepoManager {
  private tempDir: string

  constructor() {
    this.tempDir = join(app.getPath('temp'), 'modular_app_audio')
    if (!existsSync(this.tempDir)) {
      mkdirSync(this.tempDir, { recursive: true })
    }
  }

  private getRepoJsonPath(): string {
    const repoPath = settingsManager.getSettings().repoPath
    if (!existsSync(repoPath)) {
      mkdirSync(repoPath, { recursive: true })
    }
    return join(repoPath, REPO_JSON_NAME)
  }

  public getSourcesDir(): string {
    const sourcesPath = join(settingsManager.getSettings().repoPath, 'sources')
    if (!existsSync(sourcesPath)) {
      mkdirSync(sourcesPath, { recursive: true })
    }
    return sourcesPath
  }

  public getRepositoryItems(): AudioMetadata[] {
    try {
      const repoJsonPath = this.getRepoJsonPath()
      if (existsSync(repoJsonPath)) {
        const raw = readFileSync(repoJsonPath, 'utf-8')
        const items: AudioMetadata[] = JSON.parse(raw)
        return items.filter((item) => item && item.id)
      }
    } catch (e) {
      console.error('Error reading repo.json:', e)
    }
    return []
  }

  public saveRepositoryItems(items: AudioMetadata[]): void {
    try {
      const repoJsonPath = this.getRepoJsonPath()
      writeFileSync(repoJsonPath, JSON.stringify(items, null, 2), 'utf-8')
    } catch (e) {
      console.error('Error writing repo.json:', e)
    }
  }

  public async fetchVideoInfo(url: string): Promise<VideoInfo> {
    const { normalizedUrl, startTime } = normalizeYouTubeUrl(url)
    const ytdlpPath = settingsManager.resolveYtdlpPath()
    const command = `"${ytdlpPath}" --dump-single-json --no-warnings --no-playlist "${normalizedUrl}"`

    try {
      const { stdout } = await execAsync(command, { maxBuffer: 15 * 1024 * 1024 })
      const data = JSON.parse(stdout)

      return {
        id: data.id || '',
        title: data.title || 'Unknown Title',
        uploader: data.uploader || data.channel || 'Unknown Creator',
        duration: data.duration || 0,
        thumbnail: data.thumbnail || (data.thumbnails && data.thumbnails[0]?.url) || '',
        url: normalizedUrl,
        initialStartTime: startTime
      }
    } catch (err: any) {
      const errStr = (err?.message || err?.stderr || String(err)).toLowerCase()
      if (errStr.includes('this live event has ended') || errStr.includes('live event')) {
        throw new Error(
          'This YouTube live stream has recently ended and is still being processed into a replay by YouTube. Please wait a few minutes for YouTube to finish archiving it, then try again.'
        )
      } else if (
        errStr.includes('video unavailable') ||
        errStr.includes('private video') ||
        errStr.includes('members-only')
      ) {
        throw new Error(
          'This video is currently unavailable or private on YouTube. If this was a recent live stream, please wait a few moments for YouTube to publish the replay.'
        )
      }
      const match = err?.message?.match(/ERROR:\s*(\[youtube\]\s*.+)/)
      if (match && match[1]) {
        throw new Error(match[1])
      }
      throw err
    }
  }


  public async downloadAudio(
    url: string,
    sender?: WebContents
  ): Promise<{ tempFilePath: string; videoInfo: VideoInfo }> {
    const videoInfo = await this.fetchVideoInfo(url)
    const ytdlpPath = settingsManager.resolveYtdlpPath()
    const { binDir: ffmpegBinDir } = settingsManager.resolveFfmpeg()

    const outputTemplate = join(this.tempDir, `${videoInfo.id}.%(ext)s`)
    const cachedFile = findAudioFile(this.tempDir, videoInfo.id)

    // Also check if already saved in repository sources
    const sourcesDir = this.getSourcesDir()
    const permanentSource = findAudioFile(sourcesDir, videoInfo.id)
    if (permanentSource) {
      if (sender && !sender.isDestroyed()) {
        sender.send('download-progress', {
          percent: 100,
          speed: 'Saved Source',
          eta: '00:00',
          status: 'Loaded from local library sources'
        } as DownloadProgress)
      }
      return { tempFilePath: permanentSource, videoInfo }
    }

    if (cachedFile) {
      if (sender && !sender.isDestroyed()) {
        sender.send('download-progress', {
          percent: 100,
          speed: 'Cached',
          eta: '00:00',
          status: 'Audio ready from cache'
        } as DownloadProgress)
      }
      return { tempFilePath: cachedFile, videoInfo }
    }

    return new Promise((resolve, reject) => {
      const args = [
        '-f',
        'ba[abr<=64]/ba*/bestaudio/best',
        '-x',
        '--audio-format',
        'mp3',
        '--ffmpeg-location',
        ffmpegBinDir,
        '--postprocessor-args',
        'ExtractAudio:-c:a libmp3lame -b:a 24k -ar 22050 -ac 1',
        '-N',
        '4',
        '--buffer-size',
        '16K',
        '--http-chunk-size',
        '10M',
        '--no-playlist',
        '--newline',
        '-o',
        outputTemplate,
        videoInfo.url
      ]

      const child = spawn(ytdlpPath, args)
      let stderrOutput = ''

      child.stdout.on('data', (chunk) => {
        const text = chunk.toString()
        const match = text.match(
          /\[download\]\s+([\d.]+)%\s+of\s+~?\s*([\d.\w]+)\s+at\s+([\d.\w/]+)\s+ETA\s+([\d:]+)/
        )
        if (match && sender && !sender.isDestroyed()) {
          const progress: DownloadProgress = {
            percent: parseFloat(match[1]),
            speed: match[3],
            eta: match[4],
            status: `Downloading audio stream (${match[1]}%)`
          }
          sender.send('download-progress', progress)
        } else if (text.includes('[ExtractAudio]') || text.includes('[ffmpeg]')) {
          if (sender && !sender.isDestroyed()) {
            sender.send('download-progress', {
              percent: 98,
              speed: 'Processing',
              eta: '00:01',
              status: 'Converting audio to MP3 with FFmpeg...'
            } as DownloadProgress)
          }
        }
      })

      child.stderr.on('data', (chunk) => {
        stderrOutput += chunk.toString()
        console.warn('yt-dlp stderr:', chunk.toString())
      })

      child.on('close', (code) => {
        const downloadedFile = findAudioFile(this.tempDir, videoInfo.id)
        if (code === 0 && downloadedFile) {
          // Copy to permanent sources folder so it is preserved for multiple clips
          try {
            const destPermanent = join(this.getSourcesDir(), `${videoInfo.id}.mp3`)
            if (!existsSync(destPermanent)) {
              copyFileSync(downloadedFile, destPermanent)
            }
          } catch (e) {
            console.warn('Could not copy to sources folder:', e)
          }

          if (sender && !sender.isDestroyed()) {
            sender.send('download-progress', {
              percent: 100,
              speed: '',
              eta: '00:00',
              status: 'Download Complete'
            } as DownloadProgress)
          }
          resolve({ tempFilePath: downloadedFile, videoInfo })
        } else {
          const lowErr = stderrOutput.toLowerCase()
          if (lowErr.includes('this live event has ended') || lowErr.includes('live event')) {
            reject(
              new Error(
                'This YouTube live stream has recently ended and is still being processed into a replay by YouTube. Please wait a few minutes for YouTube to finish archiving it, then try again.'
              )
            )
          } else if (
            lowErr.includes('video unavailable') ||
            lowErr.includes('private video') ||
            lowErr.includes('members-only')
          ) {
            reject(
              new Error(
                'This video is currently unavailable or private on YouTube. If this was a recent live stream, please wait a few moments for YouTube to publish the replay.'
              )
            )
          } else {
            const errorMatch = stderrOutput.match(/ERROR:\s*(.+)/)
            const errorReason = errorMatch ? errorMatch[1].trim() : `yt-dlp exited with code ${code}`
            reject(new Error(`Download failed: ${errorReason}`))
          }
        }
      })


      child.on('error', (err) => {
        reject(new Error(`Failed to spawn yt-dlp: ${err.message}`))
      })
    })
  }

  public async cropAudio(options: CropOptions): Promise<AudioMetadata> {
    const {
      sourcePath,
      startTime,
      endTime,
      title,
      artist,
      tags = [],
      format = 'mp3',
      customFileName,
      videoInfo,
      saveAsVirtual = false
    } = options

    if (!existsSync(sourcePath)) {
      throw new Error(`Source audio file not found at: ${sourcePath}`)
    }

    const settings = settingsManager.getSettings()
    const repoPath = settings.repoPath
    if (!existsSync(repoPath)) {
      mkdirSync(repoPath, { recursive: true })
    }

    // Ensure master source audio is preserved in sources/
    const sourcesDir = this.getSourcesDir()
    const videoId = videoInfo?.id || `src_${Date.now()}`
    const permanentSourcePath = join(sourcesDir, `${videoId}.mp3`)
    if (!existsSync(permanentSourcePath)) {
      try {
        copyFileSync(sourcePath, permanentSourcePath)
      } catch (e) {
        console.warn('Could not cache permanent source audio:', e)
      }
    }

    const duration = Math.max(0, endTime - startTime)
    const baseName = sanitizeFilename(customFileName || title || 'Audio_Clip')
    const newId = `audio_${Date.now()}_${randomUUID().substring(0, 8)}`

    // MODE 1: VIRTUAL CLIP (Non-destructive, zero duplicated disk space, instant)
    if (saveAsVirtual) {
      let fileSize = 0
      try {
        const stats = statSync(existsSync(permanentSourcePath) ? permanentSourcePath : sourcePath)
        fileSize = stats.size
      } catch (e) {
        console.warn('Could not read source size:', e)
      }

      const virtualItem: AudioMetadata = {
        id: newId,
        title: title || 'Untitled Audio Clip',
        artist: artist || videoInfo?.uploader || 'Unknown Artist',
        sourceUrl: videoInfo?.url,
        originalDuration: videoInfo?.duration,
        duration: Math.round(duration * 100) / 100,
        filePath: existsSync(permanentSourcePath) ? permanentSourcePath : sourcePath,
        fileName: `${baseName} (Virtual Clip).mp3`,
        startTime: Math.round(startTime * 100) / 100,
        endTime: Math.round(endTime * 100) / 100,
        createdAt: new Date().toISOString(),
        tags: [...tags, 'virtual-clip'],
        fileSize: fileSize,
        thumbnail: videoInfo?.thumbnail,
        isVirtualClip: true,
        sourceAudioPath: existsSync(permanentSourcePath) ? permanentSourcePath : sourcePath,
        sourceVideoId: videoInfo?.id
      }

      const currentItems = this.getRepositoryItems()
      currentItems.unshift(virtualItem)
      this.saveRepositoryItems(currentItems)
      return virtualItem
    }

    // MODE 2: PHYSICAL TRIM WITH FFMPEG
    const { binaryPath: ffmpegBinary } = settingsManager.resolveFfmpeg()
    const folderPath = options.folderPath || ''
    const targetDir = folderPath ? join(repoPath, folderPath) : repoPath
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true })
    }

    const fileName = `${baseName}_${Date.now()}.${format}`
    const outputFilePath = join(targetDir, fileName)

    const shouldEnhance = options.enhanceAudio !== false
    const args = [
      '-y',
      '-ss',
      startTime.toFixed(3),
      '-i',
      sourcePath,
      '-t',
      duration.toFixed(3),
      ...(shouldEnhance ? ['-af', 'highpass=f=75,lowpass=f=8000,afftdn=nr=10,dynaudnorm=f=150:g=15'] : []),
      '-c:a',
      format === 'opus'
        ? 'libopus'
        : format === 'wav'
          ? 'pcm_s16le'
          : format === 'aac'
            ? 'aac'
            : 'libmp3lame',
      '-b:a',
      '24k',
      '-ar',
      format === 'opus' ? '24000' : '22050',
      '-ac',
      '1',
      '-metadata',
      `title=${title || 'Audio Clip'}`,
      '-metadata',
      `artist=${options.speaker || artist || videoInfo?.uploader || 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)'}`,
      '-metadata',
      `album=${options.scripture || folderPath || "Dr. Laxmidhar Behera's Sacred Vault"}`,
      '-metadata',
      `genre=Spiritual Discourse`,
      '-metadata',
      `date=${options.dateRecorded || new Date().toISOString().split('T')[0]}`,
      '-metadata',
      `comment=${options.verse ? `Verse: ${options.verse}` : options.description || ''}`,
      outputFilePath
    ]


    await new Promise<void>((resolve, reject) => {
      const child = spawn(ffmpegBinary, args)
      child.stderr.on('data', () => {})
      child.on('close', (code) => {
        if (code === 0 && existsSync(outputFilePath)) {
          resolve()
        } else {
          reject(new Error(`FFmpeg crop failed with exit code ${code}`))
        }
      })
      child.on('error', (err) => {
        reject(new Error(`Failed to spawn FFmpeg: ${err.message}`))
      })
    })

    let fileSize = 0
    try {
      const stats = statSync(outputFilePath)
      fileSize = stats.size
    } catch (e) {
      console.warn('Could not read file size:', e)
    }

    const newItem: AudioMetadata = {
      id: newId,
      title: title || 'Untitled Audio',
      artist: options.speaker || artist || videoInfo?.uploader || 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)',
      speaker: options.speaker || artist || videoInfo?.uploader || 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)',
      scripture: options.scripture,
      verse: options.verse,
      dateRecorded: options.dateRecorded,
      location: options.location,
      folderPath: folderPath,
      sourceUrl: videoInfo?.url,
      originalDuration: videoInfo?.duration,
      duration: Math.round(duration * 100) / 100,
      filePath: outputFilePath,
      fileName: fileName,
      startTime: Math.round(startTime * 100) / 100,
      endTime: Math.round(endTime * 100) / 100,
      createdAt: new Date().toISOString(),
      tags: tags,
      fileSize: fileSize,
      thumbnail: videoInfo?.thumbnail,
      isVirtualClip: false,
      sourceAudioPath: existsSync(permanentSourcePath) ? permanentSourcePath : sourcePath,
      sourceVideoId: videoInfo?.id,
      metadata: options.metadata || {
        speaker: options.speaker || artist,
        scripture: options.scripture,
        verse: options.verse,
        dateRecorded: options.dateRecorded,
        location: options.location,
        description: options.description
      }
    }

    const currentItems = this.getRepositoryItems()
    currentItems.unshift(newItem)
    this.saveRepositoryItems(currentItems)

    // Trigger background auto-upload to Cloudflare R2
    setTimeout(async () => {
      try {
        const { cloudflareR2Manager } = await import('./cloudflareR2')
        await cloudflareR2Manager.uploadAudioClip(newItem.id)
      } catch (e: any) {
        console.warn('Auto-upload of clip to R2 deferred:', e.message)
      }
    }, 200)

    return newItem
  }

  public async exportPhysicalClip(clipId: string): Promise<AudioMetadata> {
    const items = this.getRepositoryItems()
    const item = items.find((i) => i.id === clipId)
    if (!item) throw new Error('Clip not found')

    const sourceFile = item.sourceAudioPath || item.filePath
    if (!existsSync(sourceFile)) throw new Error('Source master audio file not found on disk')

    const startTime = item.startTime || 0
    const endTime = item.endTime || item.duration
    const duration = Math.max(0, endTime - startTime)
    const baseName = sanitizeFilename(item.title)
    const settings = settingsManager.getSettings()
    const repoPath = settings.repoPath
    const targetDir = item.folderPath ? join(repoPath, item.folderPath) : repoPath
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true })
    }
    const fileName = `${baseName}_exported_${Date.now()}.mp3`
    const outputFilePath = join(targetDir, fileName)

    const { binaryPath: ffmpegBinary } = settingsManager.resolveFfmpeg()
    const args = [
      '-y',
      '-ss',
      startTime.toFixed(3),
      '-i',
      sourceFile,
      '-t',
      duration.toFixed(3),
      '-c:a',
      'libmp3lame',
      '-b:a',
      '24k',
      '-ar',
      '22050',
      '-ac',
      '1',
      '-metadata',
      `title=${item.title}`,
      '-metadata',
      `artist=${item.artist || 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)'}`,
      outputFilePath
    ]

    await new Promise<void>((resolve, reject) => {
      const child = spawn(ffmpegBinary, args)
      child.on('close', (code) => {
        if (code === 0 && existsSync(outputFilePath)) {
          resolve()
        } else {
          reject(new Error(`FFmpeg export failed with exit code ${code}`))
        }
      })
      child.on('error', (err) => reject(err))
    })


    let fileSize = 0
    try {
      fileSize = statSync(outputFilePath).size
    } catch {}

    // Update item record to be a physical standalone file
    item.isVirtualClip = false
    item.filePath = outputFilePath
    item.fileName = fileName
    item.fileSize = fileSize
    this.saveRepositoryItems(items)

    return item
  }

  public deleteRepositoryItem(id: string, deleteFile = true): boolean {
    const items = this.getRepositoryItems()
    const target = items.find((i) => i.id === id)
    if (!target) return false

    // Only delete physical file if it's not a shared source master
    if (deleteFile && !target.isVirtualClip && target.filePath && existsSync(target.filePath)) {
      try {
        unlinkSync(target.filePath)
      } catch (e) {
        console.warn('Could not delete file from disk:', e)
      }
    }

    const filtered = items.filter((i) => i.id !== id)
    this.saveRepositoryItems(filtered)
    return true
  }

  public showInExplorer(filePath: string): void {
    if (existsSync(filePath)) {
      shell.showItemInFolder(filePath)
    } else {
      const repoPath = settingsManager.getSettings().repoPath
      shell.openPath(repoPath)
    }
  }
}

export const audioRepoManager = new AudioRepoManager()
