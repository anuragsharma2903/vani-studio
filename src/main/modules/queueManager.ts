import { BrowserWindow } from 'electron'
import { randomUUID } from 'crypto'
import { QueueItem, VideoInfo } from './types'
import { audioRepoManager } from './audioRepo'
import { beheraRepoManager } from './beheraRepo'
import { parseDiscourseFromTitle } from './metadataParser'

export class QueueManager {

  private items: QueueItem[] = []
  private concurrency: number = 2
  private activeCount: number = 0
  private isProcessing: boolean = false

  constructor() {
    this.items = []
  }

  private broadcastUpdate(): void {
    const allWindows = BrowserWindow.getAllWindows()
    allWindows.forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send('queue:updated', this.getQueue())
      }
    })
  }

  public getQueue(): QueueItem[] {
    return [...this.items]
  }

  public setConcurrency(limit: number): number {
    this.concurrency = Math.max(1, Math.min(6, limit))
    this.processQueue()
    return this.concurrency
  }

  public getConcurrency(): number {
    return this.concurrency
  }

  public addToQueue(
    urls: string[],
    options?: {
      folderPath?: string
      speaker?: string
      autoAddToRepo?: boolean
    }
  ): QueueItem[] {
    const newItems: QueueItem[] = []

    urls.forEach((rawUrl) => {
      const url = rawUrl.trim()
      if (!url) return

      const item: QueueItem = {
        id: `q_${Date.now()}_${randomUUID().substring(0, 6)}`,
        url,
        title: url,
        folderPath: options?.folderPath || 'Lectures',
        speaker: options?.speaker || 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)',
        status: 'queued',
        percent: 0,
        addedAt: new Date().toISOString()
      }

      this.items.push(item)
      newItems.push(item)
    })

    this.broadcastUpdate()
    this.processQueue(options?.autoAddToRepo)
    return newItems
  }

  public cancelItem(id: string): boolean {
    const item = this.items.find((i) => i.id === id)
    if (!item) return false

    if (item.status === 'queued' || item.status === 'downloading') {
      item.status = 'cancelled'
      item.error = 'Cancelled by user'
      this.broadcastUpdate()
      this.processQueue()
      return true
    }
    return false
  }

  public retryItem(id: string): boolean {
    const item = this.items.find((i) => i.id === id)
    if (!item) return false

    item.status = 'queued'
    item.percent = 0
    item.error = undefined
    this.broadcastUpdate()
    this.processQueue()
    return true
  }

  public clearCompleted(): void {
    this.items = this.items.filter((i) => i.status !== 'completed' && i.status !== 'cancelled')
    this.broadcastUpdate()
  }

  public clearAll(): void {
    // Only cancel active ones and remove the rest
    this.items.forEach((i) => {
      if (i.status === 'queued' || i.status === 'downloading') {
        i.status = 'cancelled'
      }
    })
    this.items = []
    this.broadcastUpdate()
  }

  private async processQueue(autoAddToRepo = true): Promise<void> {
    if (this.isProcessing) return
    this.isProcessing = true

    try {
      while (this.activeCount < this.concurrency) {
        const nextItem = this.items.find((i) => i.status === 'queued')
        if (!nextItem) break

        // Launch worker
        this.activeCount++
        nextItem.status = 'downloading'
        this.broadcastUpdate()

        // Run worker asynchronously
        this.runDownloadWorker(nextItem, autoAddToRepo)
          .finally(() => {
            this.activeCount = Math.max(0, this.activeCount - 1)
            this.broadcastUpdate()
            this.processQueue(autoAddToRepo)
          })
      }
    } finally {
      this.isProcessing = false
    }
  }

  private async runDownloadWorker(item: QueueItem, autoAddToRepo: boolean): Promise<void> {
    try {
      // 1. Fetch metadata first to get real title
      let videoInfo: VideoInfo | null = null
      try {
        videoInfo = await audioRepoManager.fetchVideoInfo(item.url)
        item.videoInfo = videoInfo
        item.title = videoInfo.title
        item.uploader = videoInfo.uploader
        item.duration = videoInfo.duration
        item.thumbnail = videoInfo.thumbnail
        this.broadcastUpdate()
      } catch (infoErr) {
        console.warn('Could not pre-fetch info for queued item, continuing to download:', infoErr)
      }

      // 2. Download and compress to 16k Mono Opus
      const mockSender = {
        send: (_channel: string, progress: any) => {
          item.percent = progress.percent || item.percent
          item.speed = progress.speed
          item.eta = progress.eta
          this.broadcastUpdate()
        },
        isDestroyed: () => false
      }

      const result = await audioRepoManager.downloadAudio(item.url, mockSender as any)
      item.tempFilePath = result.tempFilePath
      item.videoInfo = result.videoInfo || videoInfo || undefined
      item.title = result.videoInfo?.title || item.title
      item.duration = result.videoInfo?.duration || item.duration
      item.status = 'completed'
      item.percent = 100
      item.completedAt = new Date().toISOString()

      // 3. If autoAddToRepo is requested, add into Behera Sir's repo with deep metadata
      if (autoAddToRepo && result.tempFilePath) {
        const parsed = parseDiscourseFromTitle(
          item.title,
          result.videoInfo?.description || '',
          item.speaker || result.videoInfo?.uploader
        )

        const destFolder =
          item.folderPath && item.folderPath !== 'Lectures'
            ? item.folderPath
            : parsed.suggestedFolderPath || 'Lectures'

        beheraRepoManager.addTrack({
          title: item.title,
          speaker: item.speaker || parsed.speaker || 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)',
          topic: parsed.philosophyTopic || destFolder,
          category: destFolder,
          folderPath: destFolder,
          filePath: result.tempFilePath,
          fileName: `${result.videoInfo?.id || 'audio'}.opus`,
          duration: item.duration || 0,
          sourceUrl: item.url,
          thumbnail: item.thumbnail || result.videoInfo?.thumbnail,
          metadata: {
            ...parsed.metadata,
            sourceUrl: item.url,
            date: parsed.dateRecorded || new Date().toISOString().split('T')[0],
            importedVia: 'batch-queue'
          }
        })
      }


      this.broadcastUpdate()
    } catch (e: any) {
      item.status = 'error'
      item.error = e.message || 'Download failed'
      this.broadcastUpdate()
    }
  }
}

export const queueManager = new QueueManager()
