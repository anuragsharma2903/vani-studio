import { autoUpdater } from 'electron-updater'
import { app, BrowserWindow } from 'electron'
import { is } from '@electron-toolkit/utils'

export interface UpdateStatus {
  status: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
  version?: string
  currentVersion: string
  percent?: number
  speed?: string
  error?: string
  releaseNotes?: string
}

export class AppUpdaterManager {
  private currentStatus: UpdateStatus = {
    status: 'idle',
    currentVersion: app.getVersion()
  }

  constructor() {
    this.configure()
    this.setupListeners()
  }

  private configure(): void {
    // Disable auto-downloading until user confirms
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true

    try {
      autoUpdater.setFeedURL({
        provider: 's3',
        bucket: 'behera-sir-audio',
        endpoint: 'https://d3eb1c422f7a5f6d2ae0699bd2384f3e.r2.cloudflarestorage.com',
        path: '/updates'
      })
    } catch (err) {
      console.warn('Could not initialize updater feed URL:', err)
    }

    if (is.dev) {
      autoUpdater.forceDevUpdateConfig = true
    }
  }


  private sendStatusToWindows(status: UpdateStatus): void {
    this.currentStatus = status
    const allWindows = BrowserWindow.getAllWindows()
    allWindows.forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send('updater:status-changed', status)
      }
    })
  }

  private setupListeners(): void {
    autoUpdater.on('checking-for-update', () => {
      this.sendStatusToWindows({
        status: 'checking',
        currentVersion: app.getVersion()
      })
    })

    autoUpdater.on('update-available', (info) => {
      this.sendStatusToWindows({
        status: 'available',
        version: info.version,
        currentVersion: app.getVersion(),
        releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : ''
      })
    })

    autoUpdater.on('update-not-available', () => {
      this.sendStatusToWindows({
        status: 'not-available',
        currentVersion: app.getVersion()
      })
    })

    autoUpdater.on('download-progress', (progressObj) => {
      this.sendStatusToWindows({
        status: 'downloading',
        currentVersion: app.getVersion(),
        percent: Math.round(progressObj.percent),
        speed: `${Math.round((progressObj.bytesPerSecond || 0) / 1024)} KB/s`
      })
    })

    autoUpdater.on('update-downloaded', (info) => {
      this.sendStatusToWindows({
        status: 'downloaded',
        version: info.version,
        currentVersion: app.getVersion()
      })
    })

    autoUpdater.on('error', (err) => {
      this.sendStatusToWindows({
        status: 'error',
        currentVersion: app.getVersion(),
        error: err ? err.message : 'Unknown updater error'
      })
    })
  }

  public async checkForUpdates(): Promise<UpdateStatus> {
    try {
      if (is.dev) {
        return {
          status: 'not-available',
          currentVersion: `${app.getVersion()} (Dev Mode)`
        }
      }
      await autoUpdater.checkForUpdates()
      return this.currentStatus
    } catch (e: any) {
      return {
        status: 'error',
        currentVersion: app.getVersion(),
        error: e.message
      }
    }
  }

  public async downloadUpdate(): Promise<void> {
    await autoUpdater.downloadUpdate()
  }

  public quitAndInstall(): void {
    autoUpdater.quitAndInstall(false, true)
  }

  public getStatus(): UpdateStatus {
    return { ...this.currentStatus, currentVersion: app.getVersion() }
  }
}

export const appUpdaterManager = new AppUpdaterManager()
