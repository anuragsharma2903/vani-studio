import { app, dialog } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'
import { AppSettings, SystemToolStatus } from './types'

const execAsync = promisify(exec)

const SETTINGS_FILE_NAME = 'settings.json'

export class SettingsManager {
  private settingsPath: string
  private settings: AppSettings

  constructor() {
    const userDataPath = app.getPath('userData')
    this.settingsPath = join(userDataPath, SETTINGS_FILE_NAME)
    this.settings = this.loadSettings()
  }

  private getDefaultSettings(): AppSettings {
    const defaultRepo = join(app.getPath('documents'), 'MyRepo', 'Audio')
    return {
      repoPath: defaultRepo,
      ffmpegPath: 'ffmpeg',
      ytdlpPath: 'yt-dlp',
      defaultFormat: 'mp3',
      defaultBitrate: '24k',
      theme: 'dark',


      cloudflareR2: {
        accountId: 'd3eb1c422f7a5f6d2ae0699bd2384f3e',
        accessKeyId: '3c75c549764c2bc1c5b22e8e5b97e07d',
        secretAccessKey: '52fcd3fc2662b60935e66dddd2746c99848332e299b69642aa52c7311fbaa2b2',
        bucketName: 'behera-sir-audio',
        publicDomain: '',
        enabled: true
      }
    }
  }



  public loadSettings(): AppSettings {
    try {
      if (existsSync(this.settingsPath)) {
        const raw = readFileSync(this.settingsPath, 'utf-8')
        const data = JSON.parse(raw)
        this.settings = { ...this.getDefaultSettings(), ...data }
      } else {
        this.settings = this.getDefaultSettings()
        this.saveSettings(this.settings)
      }
    } catch (e) {
      console.error('Failed to read settings file, using defaults:', e)
      this.settings = this.getDefaultSettings()
    }

    // Ensure repo directory exists
    try {
      if (!existsSync(this.settings.repoPath)) {
        mkdirSync(this.settings.repoPath, { recursive: true })
      }
    } catch (e) {
      console.error('Failed to create repository directory:', e)
    }

    return this.settings
  }

  public getSettings(): AppSettings {
    return { ...this.settings }
  }

  public saveSettings(newSettings: Partial<AppSettings>): AppSettings {
    this.settings = { ...this.settings, ...newSettings }
    try {
      const dir = join(this.settingsPath, '..')
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
      writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2), 'utf-8')
      if (!existsSync(this.settings.repoPath)) {
        mkdirSync(this.settings.repoPath, { recursive: true })
      }
    } catch (e) {
      console.error('Failed to write settings file:', e)
    }
    return this.settings
  }

  public async selectDirectory(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      defaultPath: this.settings.repoPath,
      title: 'Select Audio Repository Location'
    })

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  }

  /**
   * Resolves the exact absolute path to ffmpeg.exe and its parent bin folder.
   */
  public resolveFfmpeg(): { binaryPath: string; binDir: string } {
    // 0. Check bundled resources in packaged app or dev
    const possibleBundledDirs = [
      join(process.resourcesPath || '', 'bin'),
      join(app.getAppPath(), 'resources', 'bin'),
      join(process.cwd(), 'resources', 'bin')
    ]
    for (const dir of possibleBundledDirs) {
      const exe = join(dir, 'ffmpeg.exe')
      if (existsSync(exe)) {
        return { binaryPath: exe, binDir: dir }
      }
    }

    // 1. If custom path configured and exists
    if (this.settings.ffmpegPath && this.settings.ffmpegPath !== 'ffmpeg' && existsSync(this.settings.ffmpegPath)) {
      const isDir = existsSync(join(this.settings.ffmpegPath, 'ffmpeg.exe'))
      const binaryPath = isDir ? join(this.settings.ffmpegPath, 'ffmpeg.exe') : this.settings.ffmpegPath
      const binDir = isDir ? this.settings.ffmpegPath : join(this.settings.ffmpegPath, '..')
      return { binaryPath, binDir }
    }

    // 2. Look in WinGet Packages directory
    const localAppData = process.env.LOCALAPPDATA || ''
    if (localAppData) {
      const wingetDir = join(localAppData, 'Microsoft', 'WinGet', 'Packages')
      if (existsSync(wingetDir)) {
        try {
          const packages = readdirSync(wingetDir)
          const ffmpegPkg = packages.find(
            (p) => p.includes('Gyan.FFmpeg') || p.includes('yt-dlp.FFmpeg') || p.toLowerCase().includes('ffmpeg')
          )
          if (ffmpegPkg) {
            const pkgPath = join(wingetDir, ffmpegPkg)
            const checkBin = (dir: string): { binaryPath: string; binDir: string } | null => {
              if (existsSync(join(dir, 'ffmpeg.exe'))) {
                return { binaryPath: join(dir, 'ffmpeg.exe'), binDir: dir }
              }
              if (existsSync(join(dir, 'bin', 'ffmpeg.exe'))) {
                return { binaryPath: join(dir, 'bin', 'ffmpeg.exe'), binDir: join(dir, 'bin') }
              }
              const entries = readdirSync(dir, { withFileTypes: true })
              for (const entry of entries) {
                if (entry.isDirectory()) {
                  const found = checkBin(join(dir, entry.name))
                  if (found) return found
                }
              }
              return null
            }
            const found = checkBin(pkgPath)
            if (found) return found
          }
        } catch (e) {
          console.warn('Error scanning winget packages for ffmpeg:', e)
        }
      }
    }

    return { binaryPath: 'ffmpeg', binDir: 'ffmpeg' }
  }

  /**
   * Resolves the exact absolute path to yt-dlp.exe.
   */
  public resolveYtdlpPath(): string {
    // 0. Check bundled resources in packaged app or dev
    const possibleBundledDirs = [
      join(process.resourcesPath || '', 'bin'),
      join(app.getAppPath(), 'resources', 'bin'),
      join(process.cwd(), 'resources', 'bin')
    ]
    for (const dir of possibleBundledDirs) {
      const exe = join(dir, 'yt-dlp.exe')
      if (existsSync(exe)) {
        return exe
      }
    }

    // 1. If custom path configured and exists
    if (this.settings.ytdlpPath && this.settings.ytdlpPath !== 'yt-dlp' && existsSync(this.settings.ytdlpPath)) {
      return this.settings.ytdlpPath
    }

    // 2. Look in WinGet Packages directory
    const localAppData = process.env.LOCALAPPDATA || ''
    if (localAppData) {
      const wingetDir = join(localAppData, 'Microsoft', 'WinGet', 'Packages')
      if (existsSync(wingetDir)) {
        try {
          const packages = readdirSync(wingetDir)
          const ytdlpPkg = packages.find((p) => p.includes('yt-dlp.yt-dlp') || p.toLowerCase().includes('yt-dlp'))
          if (ytdlpPkg) {
            const pkgPath = join(wingetDir, ytdlpPkg)
            if (existsSync(join(pkgPath, 'yt-dlp.exe'))) {
              return join(pkgPath, 'yt-dlp.exe')
            }
          }
        } catch (e) {
          console.warn('Error scanning winget packages for yt-dlp:', e)
        }
      }
    }

    return 'yt-dlp'
  }


  public async checkSystemTools(): Promise<SystemToolStatus> {
    const status: SystemToolStatus = {
      node: true,
      nodeVersion: process.version,
      ffmpeg: false,
      ytdlp: false
    }

    const { binaryPath: ffmpegBinary, binDir: ffmpegDir } = this.resolveFfmpeg()
    const ytdlpBinary = this.resolveYtdlpPath()

    // Check FFmpeg
    try {
      const { stdout } = await execAsync(`"${ffmpegBinary}" -version`)
      const firstLine = stdout.split('\n')[0]
      status.ffmpeg = true
      status.ffmpegVersion = firstLine
      status.ffmpegPath = ffmpegBinary === 'ffmpeg' ? 'ffmpeg (System PATH)' : ffmpegDir
    } catch {
      status.ffmpeg = false
    }

    // Check yt-dlp
    try {
      const { stdout } = await execAsync(`"${ytdlpBinary}" --version`)
      status.ytdlp = true
      status.ytdlpVersion = stdout.trim()
      status.ytdlpPath = ytdlpBinary
    } catch {
      status.ytdlp = false
    }

    return status
  }
}

export const settingsManager = new SettingsManager()
