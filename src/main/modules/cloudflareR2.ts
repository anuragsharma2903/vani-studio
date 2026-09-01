import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { existsSync, readFileSync, mkdirSync, createWriteStream, statSync } from 'fs'
import { spawn } from 'child_process'
import { basename, extname, join } from 'path'
import { Readable } from 'stream'

import { pipeline } from 'stream/promises'

import { CloudflareR2Config, AudioMetadata, BeheraTrack } from './types'
import { settingsManager } from './settings'
import { audioRepoManager } from './audioRepo'
import { beheraRepoManager } from './beheraRepo'

function getContentType(filePath: string): string {
  const ext = extname(filePath).toLowerCase()
  switch (ext) {
    case '.mp3':
      return 'audio/mpeg'
    case '.wav':
      return 'audio/wav'
    case '.m4a':
    case '.aac':
      return 'audio/aac'
    case '.ogg':
    case '.opus':
      return 'audio/ogg'
    case '.json':
      return 'application/json'
    default:
      return 'application/octet-stream'
  }
}

export class CloudflareR2Manager {
  private getClient(customConfig?: CloudflareR2Config): S3Client | null {
    const config = customConfig || settingsManager.getSettings().cloudflareR2
    if (!config || !config.accountId || !config.accessKeyId || !config.secretAccessKey) {
      return null
    }

    return new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId.trim()}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId.trim(),
        secretAccessKey: config.secretAccessKey.trim()
      }
    })
  }

  public async testConnection(
    config: CloudflareR2Config
  ): Promise<{ success: boolean; message: string }> {
    try {
      const client = this.getClient(config)
      if (!client) {
        return {
          success: false,
          message: 'Missing Cloudflare R2 Account ID, Access Key ID, or Secret Access Key.'
        }
      }

      await client.send(
        new ListObjectsV2Command({
          Bucket: config.bucketName.trim(),
          MaxKeys: 1
        })
      )

      return {
        success: true,
        message: `Successfully connected to Cloudflare R2 bucket: "${config.bucketName}"!`
      }
    } catch (e: any) {
      console.error('R2 Connection test failed:', e)
      return {
        success: false,
        message: e.message || 'Failed to authenticate with Cloudflare R2.'
      }
    }
  }

  public async getPresignedStreamUrl(r2Key: string): Promise<string> {
    const config = settingsManager.getSettings().cloudflareR2
    const client = this.getClient(config)
    if (!client || !config) {
      throw new Error('Cloudflare R2 is not configured.')
    }

    if (config.publicDomain) {
      const domain = config.publicDomain.replace(/\/$/, '')
      return `${domain}/${r2Key}`
    }

    // Generate authenticated signed URL valid for 24 hours (86400 seconds)
    const command = new GetObjectCommand({
      Bucket: config.bucketName.trim(),
      Key: r2Key
    })

    return await getSignedUrl(client, command, { expiresIn: 86400 })
  }

  public async uploadFile(
    localFilePath: string,
    r2Key: string,
    metadataDict: Record<string, string> = {}
  ): Promise<string> {
    const config = settingsManager.getSettings().cloudflareR2
    if (!config) {
      throw new Error('Cloudflare R2 is not configured.')
    }

    const client = this.getClient(config)
    if (!client) {
      throw new Error('Could not initialize Cloudflare R2 client.')
    }

    if (!existsSync(localFilePath)) {
      throw new Error(`File does not exist: ${localFilePath}`)
    }

    const fileBuffer = readFileSync(localFilePath)
    const contentType = getContentType(localFilePath)

    await client.send(
      new PutObjectCommand({
        Bucket: config.bucketName.trim(),
        Key: r2Key,
        Body: fileBuffer,
        ContentType: contentType,
        Metadata: metadataDict
      })
    )

    return await this.getPresignedStreamUrl(r2Key)
  }

  public async downloadFile(r2Key: string, targetLocalPath: string): Promise<string> {
    const config = settingsManager.getSettings().cloudflareR2
    const client = this.getClient(config)
    if (!client || !config) {
      throw new Error('Cloudflare R2 is not configured.')
    }

    const targetDir = join(targetLocalPath, '..')
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true })
    }

    const res = await client.send(
      new GetObjectCommand({
        Bucket: config.bucketName.trim(),
        Key: r2Key
      })
    )

    if (!res.Body) {
      throw new Error(`Empty response body for R2 object: ${r2Key}`)
    }

    const writeStream = createWriteStream(targetLocalPath)
    await pipeline(res.Body as Readable, writeStream)
    return targetLocalPath
  }

  public async uploadBeheraTrack(trackId: string): Promise<BeheraTrack> {
    const tracks = beheraRepoManager.getTracks()
    const track = tracks.find((t) => t.id === trackId)
    if (!track) throw new Error(`Track ${trackId} not found.`)

    let localFile = track.filePath
    if (!existsSync(localFile)) throw new Error(`Audio file not found: ${localFile}`)

    // If track has tagged bounds and is referencing master source or large file, extract minimal 24k clip first!
    if (
      track.startTime !== undefined &&
      track.endTime !== undefined &&
      track.endTime > track.startTime &&
      track.startTime > 0
    ) {
      try {
        const { binaryPath: ffmpegBinary } = settingsManager.resolveFfmpeg()
        const clipFileName = `${track.id}.mp3`
        const clipFilePath = join(beheraRepoManager.getRepoPath(), clipFileName)

        const args = [
          '-y',
          '-ss',
          track.startTime.toFixed(3),
          '-to',
          track.endTime.toFixed(3),
          '-i',
          localFile,
          '-c:a',
          'libmp3lame',
          '-b:a',
          '24k',
          '-ar',
          '22050',
          '-ac',
          '1',
          clipFilePath
        ]

        await new Promise<void>((resolve, reject) => {
          const child = spawn(ffmpegBinary, args)
          child.on('close', (code) =>
            code === 0 ? resolve() : reject(new Error(`Clip extraction failed: ${code}`))
          )
          child.on('error', reject)
        })

        if (existsSync(clipFilePath)) {
          const clipStats = statSync(clipFilePath)
          track.filePath = clipFilePath
          track.fileName = clipFileName
          track.fileSize = clipStats.size
          track.duration = track.endTime - track.startTime
          track.startTime = 0
          track.endTime = track.duration
          localFile = clipFilePath
        }
      } catch (cropErr) {
        console.warn('Could not pre-crop minimal clip before upload:', cropErr)
      }
    }

    const folderPrefix = track.folderPath ? `${track.folderPath.replace(/^\/+|\/+$/g, '')}/` : ''
    const r2Key = `behera-audio/${folderPrefix}${basename(localFile)}`
    const publicUrl = await this.uploadFile(localFile, r2Key, {
      title: encodeURIComponent(track.title),
      speaker: encodeURIComponent(track.speaker),
      topic: encodeURIComponent(track.topic)
    })

    track.r2Url = publicUrl
    track.r2Key = r2Key
    beheraRepoManager.saveTracks(tracks)

    // Upload index as well
    await this.uploadIndexFiles()

    return track
  }


  public async uploadAudioClip(clipId: string): Promise<AudioMetadata> {
    const items = audioRepoManager.getRepositoryItems()
    const item = items.find((i) => i.id === clipId)
    if (!item) throw new Error(`Clip ${clipId} not found in repository.`)

    const localFile = item.filePath
    if (!existsSync(localFile)) throw new Error(`Audio file not found: ${localFile}`)

    const r2Key = `audio/${basename(localFile)}`
    const publicUrl = await this.uploadFile(localFile, r2Key, {
      title: encodeURIComponent(item.title),
      duration: String(item.duration)
    })

    item.r2Url = publicUrl
    item.r2Key = r2Key
    audioRepoManager.saveRepositoryItems(items)

    // Upload index as well
    await this.uploadIndexFiles()

    return item
  }

  public async uploadIndexFiles(): Promise<void> {
    const config = settingsManager.getSettings().cloudflareR2
    const client = this.getClient(config)
    if (!client || !config) return

    try {
      const beheraTracks = beheraRepoManager.getTracks()
      await client.send(
        new PutObjectCommand({
          Bucket: config.bucketName.trim(),
          Key: 'indexes/behera_repo.json',
          Body: JSON.stringify(beheraTracks, null, 2),
          ContentType: 'application/json'
        })
      )

      const repoItems = audioRepoManager.getRepositoryItems()
      await client.send(
        new PutObjectCommand({
          Bucket: config.bucketName.trim(),
          Key: 'indexes/repo.json',
          Body: JSON.stringify(repoItems, null, 2),
          ContentType: 'application/json'
        })
      )
    } catch (e) {
      console.warn('Could not upload index JSONs to R2:', e)
    }
  }

  public async syncAllToR2(): Promise<{ uploadedAudio: number; uploadedIndexes: number }> {
    const config = settingsManager.getSettings().cloudflareR2
    if (!config) throw new Error('Cloudflare R2 is not configured.')

    let audioCount = 0

    // 1. Upload all Behera tracks with folder hierarchy
    const beheraTracks = beheraRepoManager.getTracks()
    for (const track of beheraTracks) {
      if (track.filePath && existsSync(track.filePath) && !track.r2Key) {
        try {
          const folderPrefix = track.folderPath
            ? `${track.folderPath.replace(/^\/+|\/+$/g, '')}/`
            : ''
          const r2Key = `behera-audio/${folderPrefix}${basename(track.filePath)}`
          const url = await this.uploadFile(track.filePath, r2Key)
          track.r2Url = url
          track.r2Key = r2Key
          audioCount++
        } catch (e) {
          console.warn(`Error uploading track ${track.title} to R2:`, e)
        }
      }
    }
    beheraRepoManager.saveTracks(beheraTracks)

    // 2. Upload audio clips
    const repoItems = audioRepoManager.getRepositoryItems()
    for (const item of repoItems) {
      if (item.filePath && existsSync(item.filePath) && !item.r2Key) {
        try {
          const folderPrefix = item.folderPath
            ? `${item.folderPath.replace(/^\/+|\/+$/g, '')}/`
            : ''
          const r2Key = `audio/${folderPrefix}${basename(item.filePath)}`
          const url = await this.uploadFile(item.filePath, r2Key)
          item.r2Url = url
          item.r2Key = r2Key
          audioCount++
        } catch (e) {
          console.warn(`Error uploading clip ${item.title} to R2:`, e)
        }
      }
    }
    audioRepoManager.saveRepositoryItems(repoItems)

    // 3. Upload master JSON indexes
    await this.uploadIndexFiles()

    return { uploadedAudio: audioCount, uploadedIndexes: 2 }
  }

  public async pullFromR2(): Promise<{
    pulledTracks: number
    pulledClips: number
    message: string
  }> {
    const config = settingsManager.getSettings().cloudflareR2
    const client = this.getClient(config)
    if (!client || !config) {
      throw new Error('Cloudflare R2 is not configured.')
    }

    let pulledTracks = 0
    let pulledClips = 0

    // 1. Try to fetch indexes/behera_repo.json from R2
    try {
      const res = await client.send(
        new GetObjectCommand({
          Bucket: config.bucketName.trim(),
          Key: 'indexes/behera_repo.json'
        })
      )
      if (res.Body) {
        const raw = await res.Body.transformToString()
        const cloudTracks: BeheraTrack[] = JSON.parse(raw)
        const localTracks = beheraRepoManager.getTracks()

        for (const cTrack of cloudTracks) {
          const existing = localTracks.find((l) => l.id === cTrack.id)
          if (!existing) {
            // Check if local audio file exists, otherwise generate live presigned streaming URL
            let streamUrl = cTrack.r2Url
            if (cTrack.r2Key) {
              try {
                streamUrl = await this.getPresignedStreamUrl(cTrack.r2Key)
              } catch (signErr) {
                console.warn('Could not presign URL for cloud track:', signErr)
              }
            }

            localTracks.push({
              ...cTrack,
              r2Url: streamUrl,
              filePath:
                cTrack.filePath && existsSync(cTrack.filePath) ? cTrack.filePath : ''
            })
            pulledTracks++
          } else {
            // Refresh stream URL
            if (cTrack.r2Key) {
              try {
                existing.r2Key = cTrack.r2Key
                existing.r2Url = await this.getPresignedStreamUrl(cTrack.r2Key)
              } catch (_) {}
            }
          }
        }
        beheraRepoManager.saveTracks(localTracks)
      }
    } catch (e: any) {
      console.warn('No remote indexes/behera_repo.json found or fetch failed:', e.message)
    }

    // 2. Scan all objects in behera-audio/ on R2 to discover newly added files
    try {
      const listRes = await client.send(
        new ListObjectsV2Command({
          Bucket: config.bucketName.trim(),
          Prefix: 'behera-audio/'
        })
      )

      if (listRes.Contents && listRes.Contents.length > 0) {
        const localTracks = beheraRepoManager.getTracks()
        for (const obj of listRes.Contents) {
          if (!obj.Key || obj.Key.endsWith('/')) continue

          const key = obj.Key
          const alreadyIndexed = localTracks.some((t) => t.r2Key === key)
          if (!alreadyIndexed) {
            const fileName = basename(key)
            const parts = key.replace('behera-audio/', '').split('/')
            const folderPath = parts.length > 1 ? parts[0] : 'Lectures'
            const streamUrl = await this.getPresignedStreamUrl(key)

            localTracks.push({
              id: `r2_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              title: fileName.replace(/\.[^/.]+$/, ''),
              speaker: 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)',
              topic: folderPath,
              category: folderPath,
              folderPath: folderPath,
              filePath: '',
              fileName: fileName,
              duration: 0,
              order: localTracks.length,
              r2Key: key,
              r2Url: streamUrl,
              fileSize: obj.Size,
              createdAt: obj.LastModified ? obj.LastModified.toISOString() : new Date().toISOString(),
              metadata: { importedFromCloud: true }
            })
            pulledTracks++
          }
        }
        beheraRepoManager.saveTracks(localTracks)
      }
    } catch (scanErr: any) {
      console.warn('Error listing R2 behera-audio objects:', scanErr.message)
    }

    return {
      pulledTracks,
      pulledClips,
      message: `Successfully synchronized with Cloudflare R2! (${pulledTracks} new items added to library)`
    }
  }

  public async downloadTrackForOffline(trackId: string): Promise<BeheraTrack> {
    const tracks = beheraRepoManager.getTracks()
    const track = tracks.find((t) => t.id === trackId)
    if (!track) throw new Error(`Track ${trackId} not found.`)
    if (!track.r2Key) throw new Error(`Track ${track.title} does not have a Cloudflare R2 key.`)

    const repoPath = settingsManager.getSettings().repoPath
    const sourcesDir = join(repoPath, 'sources')
    if (!existsSync(sourcesDir)) {
      mkdirSync(sourcesDir, { recursive: true })
    }

    const localPath = join(sourcesDir, basename(track.r2Key))
    await this.downloadFile(track.r2Key, localPath)

    track.filePath = localPath
    beheraRepoManager.saveTracks(tracks)
    return track
  }
}

export const cloudflareR2Manager = new CloudflareR2Manager()
