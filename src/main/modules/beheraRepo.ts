import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, statSync, copyFileSync } from 'fs'
import { spawn } from 'child_process'
import { randomUUID } from 'crypto'
import { BeheraTrack, BeheraPlaylist, AudioMetadata, RepoFolder } from './types'
import { settingsManager } from './settings'
import { audioRepoManager } from './audioRepo'


const BEHERA_REPO_JSON = 'behera_repo.json'
const BEHERA_PLAYLISTS_JSON = 'behera_playlists.json'
const BEHERA_FOLDERS_JSON = 'behera_folders.json'

export class BeheraRepoManager {
  public getRepoPath(): string {
    const repoPath = settingsManager.getSettings().repoPath

    if (!existsSync(repoPath)) {
      mkdirSync(repoPath, { recursive: true })
    }
    return repoPath
  }

  private getTracksFilePath(): string {
    return join(this.getRepoPath(), BEHERA_REPO_JSON)
  }

  private getPlaylistsFilePath(): string {
    return join(this.getRepoPath(), BEHERA_PLAYLISTS_JSON)
  }

  private getFoldersFilePath(): string {
    return join(this.getRepoPath(), BEHERA_FOLDERS_JSON)
  }

  public getTracks(): BeheraTrack[] {
    try {
      const filePath = this.getTracksFilePath()
      if (existsSync(filePath)) {
        const raw = readFileSync(filePath, 'utf-8')
        const items: BeheraTrack[] = JSON.parse(raw)
        return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      }
    } catch (e) {
      console.error('Error reading behera_repo.json:', e)
    }
    return []
  }

  public saveTracks(tracks: BeheraTrack[]): void {
    try {
      const filePath = this.getTracksFilePath()
      writeFileSync(filePath, JSON.stringify(tracks, null, 2), 'utf-8')
    } catch (e) {
      console.error('Error writing behera_repo.json:', e)
    }
  }

  public getFolders(): RepoFolder[] {
    try {
      const filePath = this.getFoldersFilePath()
      let explicitFolders: RepoFolder[] = []
      if (existsSync(filePath)) {
        explicitFolders = JSON.parse(readFileSync(filePath, 'utf-8'))
      }

      // Also gather folders referenced in tracks
      const tracks = this.getTracks()
      const folderMap = new Map<string, RepoFolder>()

      // Default root folder categories
      const defaults = ['Bhagavad Gita', 'Srimad Bhagavatam', 'Lectures', 'Q&A Sessions', 'Seminars']
      defaults.forEach((d) => {
        folderMap.set(d, {
          id: `folder_${d.toLowerCase().replace(/\s+/g, '_')}`,
          name: d,
          path: d,
          parentPath: undefined,
          itemCount: 0,
          createdAt: new Date().toISOString()
        })
      })

      explicitFolders.forEach((f) => {
        folderMap.set(f.path, { ...f, itemCount: 0 })
      })

      tracks.forEach((t) => {
        const p = t.folderPath || t.category || 'Lectures'
        if (!folderMap.has(p)) {
          const parts = p.split('/')
          const name = parts[parts.length - 1]
          const parentPath = parts.length > 1 ? parts.slice(0, -1).join('/') : undefined
          folderMap.set(p, {
            id: `folder_${p.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}`,
            name: name || p,
            path: p,
            parentPath,
            itemCount: 0,
            createdAt: new Date().toISOString()
          })
        }
        const f = folderMap.get(p)
        if (f) f.itemCount = (f.itemCount || 0) + 1
      })

      return Array.from(folderMap.values())
    } catch (e) {
      console.error('Error getting folders:', e)
      return []
    }
  }

  public createFolder(folderPath: string, parentPath?: string): RepoFolder {
    let cleanPath = folderPath.trim().replace(/^\/+|\/+$/g, '')
    if (parentPath && parentPath.trim()) {
      const cleanParent = parentPath.trim().replace(/^\/+|\/+$/g, '')
      if (!cleanPath.startsWith(cleanParent + '/')) {
        cleanPath = `${cleanParent}/${cleanPath}`
      }
    }
    const name = cleanPath.split('/').pop() || cleanPath
    const determinedParent = cleanPath.includes('/')
      ? cleanPath.split('/').slice(0, -1).join('/')
      : undefined

    const newFolder: RepoFolder = {
      id: `folder_${Date.now()}_${randomUUID().substring(0, 6)}`,
      name,
      path: cleanPath,
      parentPath: determinedParent,
      itemCount: 0,
      createdAt: new Date().toISOString()
    }

    try {
      const filePath = this.getFoldersFilePath()
      let folders: RepoFolder[] = []
      if (existsSync(filePath)) {
        folders = JSON.parse(readFileSync(filePath, 'utf-8'))
      }
      if (!folders.some((f) => f.path === cleanPath)) {
        folders.push(newFolder)
        writeFileSync(filePath, JSON.stringify(folders, null, 2), 'utf-8')
      }
    } catch (e) {
      console.warn('Error saving folder:', e)
    }

    return newFolder
  }

  public deleteFolder(folderPath: string): boolean {
    try {
      const cleanPath = folderPath.trim().replace(/^\/+|\/+$/g, '')
      const filePath = this.getFoldersFilePath()
      if (existsSync(filePath)) {
        let folders: RepoFolder[] = JSON.parse(readFileSync(filePath, 'utf-8'))
        folders = folders.filter((f) => f.path !== cleanPath && !f.path.startsWith(cleanPath + '/'))
        writeFileSync(filePath, JSON.stringify(folders, null, 2), 'utf-8')
      }

      // Reassign tracks in deleted folder to root / Lectures
      const tracks = this.getTracks()
      let changed = false
      tracks.forEach((t) => {
        if (t.folderPath === cleanPath || (t.folderPath && t.folderPath.startsWith(cleanPath + '/'))) {
          t.folderPath = 'Lectures'
          t.category = 'Lectures'
          changed = true
        }
      })
      if (changed) {
        this.saveTracks(tracks)
      }
      return true
    } catch (e) {
      console.error('Error deleting folder:', e)
      return false
    }
  }

  public moveTrackToFolder(trackId: string, folderPath: string): BeheraTrack | null {
    const tracks = this.getTracks()
    const track = tracks.find((t) => t.id === trackId)
    if (!track) return null

    track.folderPath = folderPath
    track.category = folderPath.split('/')[0] || folderPath
    this.saveTracks(tracks)
    return track
  }

  public async cropAndAddTrack(options: {
    sourcePath: string
    startTime: number
    endTime: number
    title: string
    speaker?: string
    topic?: string
    category?: string
    folderPath?: string
    metadata?: Record<string, any>
    videoInfo?: any
  }): Promise<BeheraTrack> {
    const {
      sourcePath,
      startTime,
      endTime,
      title,
      speaker = 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)',
      topic = 'Discourse Clip',
      category = 'Lectures',
      folderPath = 'Lectures',
      metadata = {},
      videoInfo
    } = options

    if (!existsSync(sourcePath)) {
      throw new Error(`Source audio file not found at: ${sourcePath}`)
    }

    const duration = Math.max(0, endTime - startTime)
    const { binaryPath: ffmpegBinary } = settingsManager.resolveFfmpeg()
    const repoPath = this.getRepoPath()
    const subDir = folderPath ? join(repoPath, folderPath) : repoPath
    if (!existsSync(subDir)) {
      mkdirSync(subDir, { recursive: true })
    }

    const cleanTitle = (title || 'Dr_Laxmidhar_Behera_Lecture').replace(/[^a-zA-Z0-9_\-\u0900-\u097F ]/g, '_')
    const fileName = `behera_${Date.now()}_${cleanTitle.substring(0, 40).trim()}.mp3`
    const outputFilePath = join(subDir, fileName)

    const args = [
      '-y',
      '-ss',
      startTime.toFixed(3),
      '-i',
      sourcePath,
      '-t',
      duration.toFixed(3),
      '-af',
      'highpass=f=75,lowpass=f=8000,afftdn=nr=10,dynaudnorm=f=150:g=15',
      '-c:a',
      'libmp3lame',
      '-b:a',
      '24k',
      '-ar',
      '22050',
      '-ac',
      '1',
      '-metadata',
      `title=${title}`,
      '-metadata',
      `artist=${speaker}`,
      '-metadata',
      `album=${folderPath || category || 'Vani Vault - Dr. Laxmidhar Behera'}`,
      '-metadata',
      `genre=Spiritual Discourse`,
      '-metadata',
      `date=${metadata.dateRecorded || new Date().toISOString().split('T')[0]}`,
      '-metadata',
      `comment=${metadata.verse ? `Verse: ${metadata.verse}` : metadata.description || ''}`,
      outputFilePath
    ]

    await new Promise<void>((resolve, reject) => {
      const child = spawn(ffmpegBinary, args)
      child.on('close', (code) => {
        if (code === 0 && existsSync(outputFilePath)) {
          resolve()
        } else {
          reject(new Error(`FFmpeg trimming failed with code ${code}`))
        }
      })
      child.on('error', reject)
    })

    let fileSize = 0
    try {
      fileSize = statSync(outputFilePath).size
    } catch {}

    const newTrack = this.addTrack({
      title: title || 'Trimmed Discourse Clip',
      speaker,
      topic,
      category,
      folderPath,
      filePath: outputFilePath,
      fileName,
      duration: Math.round(duration * 100) / 100,
      startTime: 0,
      endTime: Math.round(duration * 100) / 100,
      fileSize,
      thumbnail: videoInfo?.thumbnail,
      sourceUrl: videoInfo?.url,
      metadata: {
        ...metadata,
        dateRecorded: metadata.dateRecorded || new Date().toISOString().split('T')[0],
        originalSource: sourcePath,
        clipStartTime: startTime,
        clipEndTime: endTime,
        trimmedAt: new Date().toISOString()
      }
    })

    return newTrack
  }

  public addTrack(trackData: Partial<BeheraTrack>): BeheraTrack {
    const tracks = this.getTracks()
    const nextOrder = tracks.length > 0 ? Math.max(...tracks.map((t) => t.order || 0)) + 1 : 0

    const newTrack: BeheraTrack = {
      id: trackData.id || `behera_${Date.now()}_${randomUUID().substring(0, 8)}`,
      title: trackData.title || 'Untitled Lecture / Audio',
      speaker: trackData.speaker || 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)',

      topic: trackData.topic || 'General Discourse',
      category: trackData.category || 'Lectures',
      folderPath: trackData.folderPath || trackData.category || 'Lectures',
      filePath: trackData.filePath || '',
      fileName: trackData.fileName || '',
      duration: trackData.duration || 0,
      startTime:
        trackData.startTime !== undefined ? trackData.startTime : trackData.metadata?.startTime,
      endTime:
        trackData.endTime !== undefined ? trackData.endTime : trackData.metadata?.endTime,
      order: trackData.order !== undefined ? trackData.order : nextOrder,

      metadata: trackData.metadata || {
        date: new Date().toISOString().split('T')[0],
        language: 'Hindi/English',
        keyPoints: [],
        notes: '',
        verse: '',
        rating: 5
      },
      createdAt: trackData.createdAt || new Date().toISOString(),
      thumbnail: trackData.thumbnail,
      sourceUrl: trackData.sourceUrl,
      fileSize: trackData.fileSize || 0
    }

    tracks.push(newTrack)
    this.saveTracks(tracks)

    // Trigger background auto-upload to Cloudflare R2
    setTimeout(async () => {
      try {
        const { cloudflareR2Manager } = await import('./cloudflareR2')
        await cloudflareR2Manager.uploadBeheraTrack(newTrack.id)
      } catch (e: any) {
        console.warn('Auto-upload of new track to R2 deferred:', e.message)
      }
    }, 200)

    return newTrack
  }


  public updateTrackMetadata(
    id: string,
    metadataDict: Record<string, any>,
    baseFields?: Partial<BeheraTrack>
  ): BeheraTrack | null {
    const tracks = this.getTracks()
    const index = tracks.findIndex((t) => t.id === id)
    if (index === -1) return null

    const current = tracks[index]
    const updated: BeheraTrack = {
      ...current,
      ...(baseFields || {}),
      metadata: {
        ...(current.metadata || {}),
        ...(metadataDict || {})
      }
    }

    tracks[index] = updated
    this.saveTracks(tracks)
    return updated
  }

  public async compressTrack(id: string): Promise<BeheraTrack> {
    const tracks = this.getTracks()
    const track = tracks.find((t) => t.id === id)
    if (!track || !track.filePath || !existsSync(track.filePath)) {
      throw new Error('Track audio file not found')
    }

    const { binaryPath: ffmpegBinary } = settingsManager.resolveFfmpeg()
    const originalPath = track.filePath
    const ext = originalPath.endsWith('.opus') ? '.opus' : '.mp3'
    const compressedPath = originalPath.replace(/\.[a-zA-Z0-9]+$/, `_compact${ext}`)

    const args = [
      '-y',
      '-i',
      originalPath,
      '-af',
      'highpass=f=75,lowpass=f=8000,afftdn=nr=10,dynaudnorm=f=150:g=15',
      '-c:a',
      ext === '.opus' ? 'libopus' : 'libmp3lame',
      '-b:a',
      '24k',
      '-ar',
      ext === '.opus' ? '24000' : '22050',
      '-ac',
      '1',
      compressedPath
    ]


    await new Promise<void>((resolve, reject) => {
      const child = spawn(ffmpegBinary, args)
      child.on('close', (code) => {
        if (code === 0 && existsSync(compressedPath)) {
          resolve()
        } else {
          reject(new Error(`Compression failed with exit code ${code}`))
        }
      })
      child.on('error', reject)
    })

    try {
      unlinkSync(originalPath)
    } catch (_) {}
    copyFileSync(compressedPath, originalPath)
    try {
      unlinkSync(compressedPath)
    } catch (_) {}

    const stats = statSync(originalPath)
    const updated = this.updateTrackMetadata(id, track.metadata || {}, {
      fileSize: stats.size
    })


    if (!updated) throw new Error('Could not update track stats')

    // In background, auto-upload the new lightweight compressed version to Cloudflare R2
    import('./cloudflareR2')
      .then(({ cloudflareR2Manager }) => {
        cloudflareR2Manager.uploadFile(
          originalPath,
          track.r2Key || `behera-audio/Lectures/${track.fileName}`
        )
      })
      .catch(() => {})

    return updated
  }


  public reorderTracks(orderedTrackIds: string[]): BeheraTrack[] {
    const tracks = this.getTracks()
    const trackMap = new Map(tracks.map((t) => [t.id, t]))

    const reordered: BeheraTrack[] = []
    orderedTrackIds.forEach((id, idx) => {
      const item = trackMap.get(id)
      if (item) {
        item.order = idx
        reordered.push(item)
        trackMap.delete(id)
      }
    })

    trackMap.forEach((item) => {
      item.order = reordered.length
      reordered.push(item)
    })

    this.saveTracks(reordered)
    return reordered
  }

  public deleteTrack(id: string, deleteFile = false): boolean {
    const tracks = this.getTracks()
    const target = tracks.find((t) => t.id === id)
    if (!target) return false

    if (deleteFile && target.filePath && existsSync(target.filePath)) {
      try {
        unlinkSync(target.filePath)
      } catch (e) {
        console.warn('Could not delete audio file from disk:', e)
      }
    }

    const filtered = tracks.filter((t) => t.id !== id)
    filtered.forEach((t, idx) => {
      t.order = idx
    })
    this.saveTracks(filtered)
    return true
  }

  public importFromAudioRepo(audioRepoId: string): BeheraTrack | null {
    const repoItems: AudioMetadata[] = audioRepoManager.getRepositoryItems()
    const item = repoItems.find((i) => i.id === audioRepoId)
    if (!item) return null

    return this.addTrack({
      title: item.title,
      speaker: item.artist || 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)',
      topic: (item.tags && item.tags[0]) || 'Audio Clip',
      category: 'Audio Repo Clip',
      folderPath: item.folderPath || 'Audio Repo Clip',
      filePath: item.filePath,
      fileName: item.fileName,
      duration: item.duration,
      startTime: item.startTime,
      endTime: item.endTime,
      sourceUrl: item.sourceUrl,

      thumbnail: item.thumbnail,
      fileSize: item.fileSize,
      metadata: {
        sourceRepoId: item.id,
        originalTags: item.tags || [],
        date: item.createdAt ? item.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        startTime: item.startTime,
        endTime: item.endTime,
        notes: 'Imported from Audio Repository'
      }
    })
  }

  public getPlaylists(): BeheraPlaylist[] {
    try {
      const filePath = this.getPlaylistsFilePath()
      if (existsSync(filePath)) {
        const raw = readFileSync(filePath, 'utf-8')
        return JSON.parse(raw)
      }
    } catch (e) {
      console.error('Error reading behera_playlists.json:', e)
    }
    return []
  }

  public savePlaylists(playlists: BeheraPlaylist[]): void {
    try {
      const filePath = this.getPlaylistsFilePath()
      writeFileSync(filePath, JSON.stringify(playlists, null, 2), 'utf-8')
    } catch (e) {
      console.error('Error writing behera_playlists.json:', e)
    }
  }

  public createPlaylist(name: string, description = '', trackIds: string[] = []): BeheraPlaylist {
    const playlists = this.getPlaylists()
    const newPlaylist: BeheraPlaylist = {
      id: `playlist_${Date.now()}_${randomUUID().substring(0, 6)}`,
      name: name || 'New Playlist',
      description,
      trackIds,
      createdAt: new Date().toISOString()
    }
    playlists.push(newPlaylist)
    this.savePlaylists(playlists)
    return newPlaylist
  }
}

export const beheraRepoManager = new BeheraRepoManager()
