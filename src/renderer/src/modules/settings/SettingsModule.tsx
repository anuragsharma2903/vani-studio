import React, { useState, useEffect } from 'react'
import {
  Settings,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  HardDrive,
  Cpu,
  Sliders,
  ExternalLink,
  Cloud,
  CloudUpload,
  Key,
  Database,
  Globe,
  Loader2
} from 'lucide-react'
import { AppSettings, SystemToolStatus, CloudflareR2Config } from '../../../../main/modules/types'

const SettingsModule: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    repoPath: '',
    ffmpegPath: 'ffmpeg',
    ytdlpPath: 'yt-dlp',
    defaultFormat: 'mp3',
    defaultBitrate: '192k',
    theme: 'dark',
    cloudflareR2: {
      accountId: '',
      accessKeyId: '',
      secretAccessKey: '',
      bucketName: 'audio-repository',
      publicDomain: '',
      enabled: false
    }
  })
  const [toolStatus, setToolStatus] = useState<SystemToolStatus | null>(null)
  const [isCheckingTools, setIsCheckingTools] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // Cloudflare R2 Testing & Sync state
  const [isTestingR2, setIsTestingR2] = useState(false)
  const [r2TestResult, setR2TestResult] = useState<{ success: boolean; message: string } | null>(
    null
  )
  const [isSyncingR2, setIsSyncingR2] = useState(false)
  const [r2SyncResult, setR2SyncResult] = useState<string | null>(null)

  // Auto-Updater State
  const [updateStatus, setUpdateStatus] = useState<any>(null)
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)

  const handleCheckForUpdates = async () => {
    setIsCheckingUpdate(true)
    try {
      const res = await window.updaterAPI.checkForUpdates()
      setUpdateStatus(res)
    } catch (e: any) {
      setUpdateStatus({ status: 'error', error: e.message, currentVersion: '1.0.0' })
    } finally {
      setIsCheckingUpdate(false)
    }
  }

  useEffect(() => {
    const fetchInitialStatus = async () => {
      try {
        const s = await window.updaterAPI.getStatus()
        setUpdateStatus(s)
      } catch (e) {
        console.warn('Could not get initial updater status:', e)
      }
    }
    fetchInitialStatus()

    const unsubscribe = window.updaterAPI.onStatusChanged((status) => {
      setUpdateStatus(status)
      setIsCheckingUpdate(false)
    })
    return () => unsubscribe()
  }, [])


  const loadSettingsAndTools = async () => {
    try {
      const currentSettings = await window.settingsAPI.getSettings()
      setSettings({
        ...currentSettings,
        cloudflareR2: currentSettings.cloudflareR2 || {
          accountId: '',
          accessKeyId: '',
          secretAccessKey: '',
          bucketName: 'audio-repository',
          publicDomain: '',
          enabled: false
        }
      })
    } catch (e) {
      console.error('Error fetching settings:', e)
    }

    await checkTools()
  }

  const checkTools = async () => {
    setIsCheckingTools(true)
    try {
      const status = await window.settingsAPI.checkTools()
      setToolStatus(status)
    } catch (e) {
      console.error('Error checking tools:', e)
    } finally {
      setIsCheckingTools(false)
    }
  }

  useEffect(() => {
    loadSettingsAndTools()
  }, [])

  const handleSelectFolder = async () => {
    const chosen = await window.settingsAPI.selectDirectory()
    if (chosen) {
      setSettings((prev) => ({ ...prev, repoPath: chosen }))
    }
  }

  const handleOpenFolder = async () => {
    if (settings.repoPath) {
      await window.systemAPI.openPath(settings.repoPath)
    }
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    setSaveMessage(null)
    try {
      await window.settingsAPI.saveSettings(settings)
      setSaveMessage('Settings saved successfully!')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (e: any) {
      console.error('Failed to save settings:', e)
      setSaveMessage(`Error saving settings: ${e.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestR2Connection = async () => {
    if (!settings.cloudflareR2) return
    setIsTestingR2(true)
    setR2TestResult(null)
    try {
      const result = await window.cloudflareAPI.testConnection(settings.cloudflareR2)
      setR2TestResult(result)
    } catch (e: any) {
      setR2TestResult({ success: false, message: e.message || 'Connection failed.' })
    } finally {
      setIsTestingR2(false)
    }
  }

  const handleSyncAllToR2 = async () => {
    setIsSyncingR2(true)
    setR2SyncResult(null)
    try {
      // First ensure current settings are saved
      await window.settingsAPI.saveSettings(settings)
      const res = await window.cloudflareAPI.syncAll()
      setR2SyncResult(`Synced ${res.uploadedAudio} audio files to Cloudflare R2 bucket!`)
      setTimeout(() => setR2SyncResult(null), 4000)
    } catch (e: any) {
      setR2SyncResult(`Sync error: ${e.message}`)
    } finally {
      setIsSyncingR2(false)
    }
  }

  const r2Config: CloudflareR2Config = settings.cloudflareR2 || {
    accountId: '',
    accessKeyId: '',
    secretAccessKey: '',
    bucketName: 'audio-repository',
    publicDomain: '',
    enabled: false
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto overflow-y-auto pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#2b3144] pb-4">
        <div>
          <h1 className="text-lg font-bold text-gray-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            Settings & System Diagnostics
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Configure local audio storage paths, Cloudflare R2 cloud backup, and FFmpeg/yt-dlp tools.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {saveMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* System Diagnostics & Dependency Status */}
      <div className="bg-[#161922] border border-[#2b3144] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
            <Cpu className="w-4 h-4 text-indigo-400" />
            System Tool Dependencies
          </div>
          <button
            onClick={checkTools}
            disabled={isCheckingTools}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingTools ? 'animate-spin' : ''}`} />
            Recheck Tools
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* FFmpeg Card */}
          <div className="bg-[#0f1117] border border-[#2b3144] p-3.5 rounded-lg flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-gray-200 flex items-center gap-1.5">
                FFmpeg (Audio Slicing & Encoding)
              </div>
              <p className="text-[11px] text-gray-400 font-mono">
                {toolStatus?.ffmpegVersion || (toolStatus?.ffmpeg ? 'Detected in WinGet/System' : 'Not found')}
              </p>
            </div>
            {toolStatus?.ffmpeg ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ready
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                <AlertCircle className="w-3.5 h-3.5" />
                Missing
              </span>
            )}
          </div>

          {/* yt-dlp Card */}
          <div className="bg-[#0f1117] border border-[#2b3144] p-3.5 rounded-lg flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-gray-200 flex items-center gap-1.5">
                yt-dlp (YouTube Audio Extractor)
              </div>
              <p className="text-[11px] text-gray-400 font-mono">
                {toolStatus?.ytdlpVersion || (toolStatus?.ytdlp ? 'Detected in WinGet/System' : 'Not found')}
              </p>
            </div>
            {toolStatus?.ytdlp ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ready
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                <AlertCircle className="w-3.5 h-3.5" />
                Missing
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Cloudflare R2 Storage Configuration Card */}
      <div className="bg-[#161922] border border-[#2b3144] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
            <Cloud className="w-4 h-4 text-indigo-400" />
            Cloudflare R2 Storage (10 GB Free, $0 Egress Bandwidth)
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={r2Config.enabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  cloudflareR2: { ...r2Config, enabled: e.target.checked }
                })
              }
              className="accent-indigo-500 rounded"
            />
            Enable Cloudflare R2 Sync
          </label>
        </div>

        <p className="text-xs text-gray-400">
          Upload master audio files to Cloudflare R2 for free global streaming and on-demand clip downloading with zero bandwidth fees.
        </p>

        {r2TestResult && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 animate-fadeIn ${
              r2TestResult.success
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}
          >
            {r2TestResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{r2TestResult.message}</span>
          </div>
        )}

        {r2SyncResult && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 p-3 rounded-lg text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{r2SyncResult}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              Cloudflare Account ID
            </label>
            <input
              type="text"
              placeholder="e.g. 9a7b8c... (Found on Cloudflare R2 dashboard)"
              value={r2Config.accountId}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  cloudflareR2: { ...r2Config, accountId: e.target.value }
                })
              }
              className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              R2 Bucket Name
            </label>
            <input
              type="text"
              placeholder="audio-repository"
              value={r2Config.bucketName}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  cloudflareR2: { ...r2Config, bucketName: e.target.value }
                })
              }
              className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              R2 Access Key ID
            </label>
            <input
              type="text"
              placeholder="API Token Access Key ID"
              value={r2Config.accessKeyId}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  cloudflareR2: { ...r2Config, accessKeyId: e.target.value }
                })
              }
              className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              R2 Secret Access Key
            </label>
            <input
              type="password"
              placeholder="API Token Secret Access Key"
              value={r2Config.secretAccessKey}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  cloudflareR2: { ...r2Config, secretAccessKey: e.target.value }
                })
              }
              className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              Public CDN Domain / Worker URL (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. https://audio.myrepo.com or https://pub-xxx.r2.dev"
              value={r2Config.publicDomain}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  cloudflareR2: { ...r2Config, publicDomain: e.target.value }
                })
              }
              className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#2b3144]">
          <button
            type="button"
            onClick={handleTestR2Connection}
            disabled={isTestingR2 || !r2Config.accountId || !r2Config.accessKeyId}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1f2330] hover:bg-[#282d3e] text-gray-200 border border-[#2b3144] rounded-lg text-xs font-medium transition disabled:opacity-50"
          >
            {isTestingR2 ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            ) : (
              <Cloud className="w-4 h-4 text-indigo-400" />
            )}
            {isTestingR2 ? 'Testing Bucket Connection...' : 'Test R2 Connection'}
          </button>

          <button
            type="button"
            onClick={handleSyncAllToR2}
            disabled={isSyncingR2 || !r2Config.enabled}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition disabled:opacity-50"
          >
            {isSyncingR2 ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CloudUpload className="w-4 h-4" />
            )}
            {isSyncingR2 ? 'Syncing Audio to Cloud...' : 'Sync All Audio to Cloudflare R2'}
          </button>
        </div>
      </div>

      {/* Local Storage Directory */}
      <div className="bg-[#161922] border border-[#2b3144] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
          <HardDrive className="w-4 h-4 text-indigo-400" />
          Repository Storage Folder
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">
            Audio Clips & Metadata Storage Path
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={settings.repoPath}
              onChange={(e) => setSettings({ ...settings, repoPath: e.target.value })}
              className="flex-1 bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              type="button"
              onClick={handleSelectFolder}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#1f2330] hover:bg-[#282d3e] text-gray-200 border border-[#2b3144] rounded-lg text-xs font-medium transition"
            >
              <FolderOpen className="w-4 h-4 text-indigo-400" />
              Browse
            </button>
            <button
              type="button"
              onClick={handleOpenFolder}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#1f2330] hover:bg-[#282d3e] text-gray-200 border border-[#2b3144] rounded-lg text-xs font-medium transition"
              title="Reveal folder in Explorer"
            >
              <ExternalLink className="w-4 h-4 text-gray-400" />
              Open
            </button>
          </div>
          <p className="text-[11px] text-gray-500 mt-1.5">
            Cropped clips, source masters, and the search indices <code className="text-gray-400">repo.json</code> & <code className="text-gray-400">behera_repo.json</code> are saved here.
          </p>
        </div>
      </div>

      {/* Audio Quality & Output Defaults */}
      <div className="bg-[#161922] border border-[#2b3144] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
          <Sliders className="w-4 h-4 text-indigo-400" />
          Audio Quality Defaults
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Default Export Format
            </label>
            <select
              value={settings.defaultFormat}
              onChange={(e) =>
                setSettings({ ...settings, defaultFormat: e.target.value as 'mp3' | 'wav' | 'aac' })
              }
              className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="mp3">MP3 (Universal, Compressed)</option>
              <option value="wav">WAV (Lossless PCM)</option>
              <option value="aac">AAC (High Efficiency)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Default Bitrate (MP3/AAC)
            </label>
            <select
              value={settings.defaultBitrate}
              onChange={(e) => setSettings({ ...settings, defaultBitrate: e.target.value })}
              className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="128k">128 kbps (Standard Quality)</option>
              <option value="192k">192 kbps (High Quality - Recommended)</option>
              <option value="256k">256 kbps (Very High Quality)</option>
              <option value="320k">320 kbps (Maximum Quality)</option>
            </select>
          </div>
        </div>
      </div>


      {/* In-App Auto Updates & Version */}
      <div className="bg-[#161922] border border-[#2b3144] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
            <RefreshCw className="w-4 h-4 text-indigo-400" />
            Software Updates & Version
          </div>
          <span className="text-xs font-mono text-gray-400 bg-[#0f1117] px-2.5 py-1 rounded-lg border border-[#2b3144]">
            v{updateStatus?.currentVersion || '1.0.0'}
          </span>
        </div>

        <div className="p-4 bg-[#0f1117] border border-[#2b3144] rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-200">
              {updateStatus?.status === 'checking'
                ? 'Checking for latest releases...'
                : updateStatus?.status === 'available'
                  ? `🚀 New Version Available: v${updateStatus.version}`
                  : updateStatus?.status === 'downloading'
                    ? `⬇️ Downloading Update (${updateStatus.percent}%) at ${updateStatus.speed}`
                    : updateStatus?.status === 'downloaded'
                      ? '✨ Update Downloaded! Ready to restart and apply.'
                      : updateStatus?.status === 'error'
                        ? `Update Check: ${updateStatus.error}`
                        : 'Your desktop app is running the latest version.'}
            </p>
            <p className="text-[11px] text-gray-400">
              Updates preserve all your local audio clips, playlists, folders, and settings automatically.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {updateStatus?.status === 'available' ? (
              <button
                type="button"
                onClick={async () => {
                  await window.updaterAPI.downloadUpdate()
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition"
              >
                Download Update
              </button>
            ) : updateStatus?.status === 'downloaded' ? (
              <button
                type="button"
                onClick={() => {
                  window.updaterAPI.quitAndInstall()
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition"
              >
                Restart & Apply Update
              </button>
            ) : (
              <button
                type="button"
                disabled={isCheckingUpdate}
                onClick={handleCheckForUpdates}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#1f2330] hover:bg-[#282d3e] text-gray-200 border border-[#2b3144] rounded-lg text-xs font-semibold transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin text-indigo-400' : ''}`} />
                {isCheckingUpdate ? 'Checking...' : 'Check for Updates'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsModule

