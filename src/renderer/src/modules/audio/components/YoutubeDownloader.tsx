import React, { useState, useEffect } from 'react'
import {
  Video,
  Download,
  Clipboard,
  Loader2,
  AlertCircle,
  Clock,
  User,
  Music2,
  Check
} from 'lucide-react'
import { DownloadProgress, VideoInfo } from '../../../../../main/modules/types'


interface YoutubeDownloaderProps {
  onAudioReady: (tempFilePath: string, videoInfo: VideoInfo) => void
  disabled?: boolean
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const hrs = Math.floor(mins / 60)
  if (hrs > 0) {
    const remMins = mins % 60
    return `${hrs}:${remMins < 10 ? '0' : ''}${remMins}:${secs < 10 ? '0' : ''}${secs}`
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

const YoutubeDownloader: React.FC<YoutubeDownloaderProps> = ({ onAudioReady, disabled }) => {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState<DownloadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewInfo, setPreviewInfo] = useState<VideoInfo | null>(null)
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    // Register progress listener
    const cleanup = window.audioAPI.onDownloadProgress((prog) => {
      setProgress(prog)
    })
    return () => {
      cleanup()
    }
  }, [])

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text && (text.includes('youtube.com') || text.includes('youtu.be'))) {
        setUrl(text.trim())
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      }
    } catch (e) {
      console.warn('Could not read clipboard:', e)
    }
  }

  const handleFetchAndDownload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setError(null)
    setIsLoading(true)
    setProgress({ percent: 0, status: 'Contacting YouTube via yt-dlp...' })

    try {
      // First fetch quick info for UI preview
      try {
        const info = await window.audioAPI.fetchInfo(url.trim())
        setPreviewInfo(info)
      } catch (err) {
        console.warn('Video info pre-fetch warning:', err)
      }

      // Perform download
      const result = await window.audioAPI.downloadAudio(url.trim())
      if (result.tempFilePath) {
        onAudioReady(result.tempFilePath, result.videoInfo)
      }
    } catch (err: any) {
      console.error('Download error:', err)
      const rawMsg = err?.message || 'Failed to download audio. Please verify YouTube URL and network connection.'
      const cleanMsg = rawMsg
        .replace(/^Error invoking remote method '[^']+':\s*/, '')
        .replace(/^Error:\s*/, '')
        .replace(/^Command failed:[^\n]+ERROR:\s*/, '')
      setError(cleanMsg)
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="bg-[#161922] border border-[#2b3144] rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
          <Video className="w-5 h-5 text-rose-500" />
          Fetch Audio from YouTube
        </div>
        <span className="text-[11px] text-gray-400">

          High-fidelity MP3 extraction via yt-dlp & FFmpeg
        </span>
      </div>

      <form onSubmit={handleFetchAndDownload} className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Paste YouTube Video or Music URL (e.g. https://www.youtube.com/watch?v=...)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading || disabled}
              className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg pl-3 pr-24 py-2.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition font-mono disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handlePaste}
              disabled={isLoading || disabled}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#1f2330] hover:bg-[#2b3144] text-gray-300 text-[11px] font-medium rounded flex items-center gap-1 transition"
            >
              {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Clipboard className="w-3 h-3" />}
              {isCopied ? 'Pasted!' : 'Paste'}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || !url.trim() || disabled}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Fetch & Load
              </>
            )}
          </button>
        </div>
      </form>

      {/* Live Download Progress Feedback */}
      {isLoading && progress && (
        <div className="bg-[#0f1117] border border-[#2b3144] rounded-lg p-3 space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-300 font-medium flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              {progress.status || 'Downloading...'}
            </span>
            <span className="font-mono text-indigo-400 font-semibold">
              {progress.percent ? `${progress.percent.toFixed(1)}%` : '0%'}
            </span>
          </div>

          <div className="w-full bg-[#1f2330] h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, progress.percent || 0))}%` }}
            />
          </div>

          {(progress.speed || progress.eta) && (
            <div className="flex justify-between text-[11px] text-gray-500 font-mono">
              <span>Speed: {progress.speed || 'N/A'}</span>
              <span>ETA: {progress.eta || 'N/A'}</span>
            </div>
          )}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3 rounded-lg text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Download Failed</p>
            <p className="text-[11px] text-rose-300/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Video Preview Card if loaded */}
      {previewInfo && !isLoading && (
        <div className="flex items-center gap-3 bg-[#0f1117] border border-[#2b3144] p-2.5 rounded-lg">
          {previewInfo.thumbnail ? (
            <img
              src={previewInfo.thumbnail}
              alt={previewInfo.title}
              className="w-16 h-12 object-cover rounded bg-black/40 shrink-0"
            />
          ) : (
            <div className="w-16 h-12 rounded bg-[#1f2330] flex items-center justify-center text-gray-500 shrink-0">
              <Music2 className="w-5 h-5" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-200 truncate">{previewInfo.title}</p>
            <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1">
              <span className="flex items-center gap-1 truncate">
                <User className="w-3 h-3 text-gray-500" />
                {previewInfo.uploader}
              </span>
              <span className="flex items-center gap-1 font-mono shrink-0">
                <Clock className="w-3 h-3 text-gray-500" />
                {formatDuration(previewInfo.duration)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default YoutubeDownloader
