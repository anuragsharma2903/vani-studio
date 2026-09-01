import React, { useState, useEffect, useRef } from 'react'
import {
  FolderOpen,
  Play,
  Pause,
  Trash2,
  ExternalLink,
  Search,
  Tag,
  Clock,
  HardDrive,
  Copy,
  Check,
  Music,
  Scissors,
  Download,
  Loader2,
  Sparkles
} from 'lucide-react'

import { AudioMetadata } from '../../../../../main/modules/types'

interface RepositoryExplorerProps {
  onStartNewClip?: () => void
  keyTrigger?: number
}

function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const hrs = Math.floor(mins / 60)
  if (hrs > 0) {
    const remMins = mins % 60
    return `${hrs}:${remMins < 10 ? '0' : ''}${remMins}:${secs < 10 ? '0' : ''}${secs}`
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return 'N/A'
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(2)} MB`
}

function formatDate(isoStr?: string): string {
  if (!isoStr) return ''
  try {
    const d = new Date(isoStr)
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch {
    return ''
  }
}

const RepositoryExplorer: React.FC<RepositoryExplorerProps> = ({ onStartNewClip, keyTrigger }) => {
  const [items, setItems] = useState<AudioMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [exportingId, setExportingId] = useState<string | null>(null)

  // In-app Player State
  const [playingItem, setPlayingItem] = useState<AudioMetadata | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const loadRepoItems = async () => {
    setIsLoading(true)
    try {
      const data = await window.audioAPI.getRepo()
      setItems(data || [])
    } catch (e) {
      console.error('Error fetching repo items:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRepoItems()
  }, [keyTrigger])

  const handleDelete = async (id: string, fileName: string) => {
    if (window.confirm(`Are you sure you want to delete "${fileName}" from repository?`)) {
      if (playingItem?.id === id) {
        if (audioRef.current) audioRef.current.pause()
        setPlayingItem(null)
        setIsPlaying(false)
      }
      await window.audioAPI.deleteRepoItem(id, true)
      await loadRepoItems()
    }
  }

  const handleShowInExplorer = async (filePath: string) => {
    await window.audioAPI.showInExplorer(filePath)
  }

  const handleCopyPath = (filePath: string, id: string) => {
    navigator.clipboard.writeText(filePath)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handlePlayToggle = (item: AudioMetadata) => {
    if (playingItem?.id === item.id) {
      if (audioRef.current) {
        if (audioRef.current.paused) {
          audioRef.current.play()
          setIsPlaying(true)
        } else {
          audioRef.current.pause()
          setIsPlaying(false)
        }
      }
    } else {
      setPlayingItem(item)
      setIsPlaying(true)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = window.audioAPI.toMediaUrl(item.filePath)

        const start = item.startTime || 0
        const applySeekAndPlay = () => {
          if (audioRef.current) {
            if (start > 0) {
              audioRef.current.currentTime = start
            }
            audioRef.current.play().catch((e) => console.warn('Audio play error:', e))
          }
        }

        audioRef.current.onloadedmetadata = () => {
          applySeekAndPlay()
        }

        if (audioRef.current.readyState >= 1) {
          applySeekAndPlay()
        }
      }
    }
  }


  const handleAudioTimeUpdate = () => {
    if (!audioRef.current || !playingItem) return
    if (playingItem.isVirtualClip && playingItem.endTime !== undefined) {
      if (audioRef.current.currentTime >= playingItem.endTime) {
        audioRef.current.pause()
        if (playingItem.startTime !== undefined) {
          audioRef.current.currentTime = playingItem.startTime
        }
        setIsPlaying(false)
      }
    }
  }

  const handleExportPhysical = async (clipId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExportingId(clipId)
    try {
      await window.audioAPI.exportPhysicalClip(clipId)
      await loadRepoItems()
    } catch (err) {
      console.error('Export clip error:', err)
    } finally {
      setExportingId(null)
    }
  }

  const allTags = Array.from(
    new Set(items.flatMap((item) => (item.tags || []).map((t) => t.toLowerCase())))
  )

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.artist && item.artist.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.tags && item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())))

    const matchesTag = !selectedTag || (item.tags && item.tags.includes(selectedTag))

    return matchesSearch && matchesTag
  })

  const totalDurationSeconds = items.reduce((sum, item) => sum + (item.duration || 0), 0)
  const totalBytes = items.reduce((sum, item) => sum + (item.fileSize || 0), 0)

  return (
    <div className="space-y-4">
      {/* Hidden Audio Player for Repository Explorer */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleAudioTimeUpdate}
        onEnded={() => {
          setIsPlaying(false)
          setPlayingItem(null)
        }}
      />

      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#161922] border border-[#2b3144] p-3.5 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-medium">Saved Clips</p>
            <p className="text-base font-bold text-gray-100">{items.length} files</p>
          </div>
        </div>

        <div className="bg-[#161922] border border-[#2b3144] p-3.5 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-medium">Total Duration</p>
            <p className="text-base font-bold text-gray-100">
              {formatDuration(totalDurationSeconds)}
            </p>
          </div>
        </div>

        <div className="bg-[#161922] border border-[#2b3144] p-3.5 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-medium">Master & Clips Storage</p>
            <p className="text-base font-bold text-gray-100">{formatFileSize(totalBytes)}</p>
          </div>
        </div>
      </div>

      {/* Search & Tag Filter Bar */}
      <div className="bg-[#161922] border border-[#2b3144] p-3 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audio clips by title, artist, or #tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-gray-500 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              Tags:
            </span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border transition ${
                selectedTag === null
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-[#0f1117] text-gray-400 border-[#2b3144] hover:text-gray-200'
              }`}
            >
              All
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium border transition ${
                  selectedTag === t
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-[#0f1117] text-gray-400 border-[#2b3144] hover:text-gray-200'
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Item List */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-gray-400 bg-[#161922] border border-[#2b3144] rounded-xl">
          Loading audio repository...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-[#161922] border border-[#2b3144] rounded-xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-200">
              {items.length === 0 ? 'Your Repository is Empty' : 'No Clips Match Your Search'}
            </p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              {items.length === 0
                ? 'Download a YouTube video above, trim your favorite sample, and save it to your local library.'
                : 'Try adjusting your search query or removing the tag filter.'}
            </p>
          </div>
          {items.length === 0 && onStartNewClip && (
            <button
              onClick={onStartNewClip}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition inline-flex items-center gap-1.5"
            >
              <Scissors className="w-4 h-4" />
              Start New Audio Clip
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => {
            const isThisPlaying = playingItem?.id === item.id && isPlaying

            return (
              <div
                key={item.id}
                className={`p-3.5 bg-[#161922] border rounded-xl transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  isThisPlaying
                    ? 'border-indigo-500/50 shadow-md bg-[#181c27]'
                    : 'border-[#2b3144] hover:border-[#3b435d]'
                }`}
              >
                {/* Left: Thumbnail & Title Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => handlePlayToggle(item)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition ${
                      isThisPlaying
                        ? 'bg-indigo-600 text-white'
                        : 'bg-[#1f2330] hover:bg-indigo-600/30 text-indigo-400'
                    }`}
                  >
                    {isThisPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-gray-200 truncate">{item.title}</p>
                      {item.isVirtualClip && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30 flex items-center gap-1 shrink-0">
                          <Sparkles className="w-2.5 h-2.5" />
                          Virtual Clip
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400 mt-0.5">
                      {item.artist && (
                        <span className="text-gray-300 font-medium truncate">{item.artist}</span>
                      )}
                      <span className="flex items-center gap-1 font-mono text-indigo-400 font-medium">
                        <Clock className="w-3 h-3 text-indigo-500" />
                        {formatDuration(item.duration)}
                      </span>
                      {item.startTime !== undefined && item.endTime !== undefined && (
                        <span className="text-gray-500 font-mono">
                          [{formatDuration(item.startTime)} → {formatDuration(item.endTime)}]
                        </span>
                      )}
                      <span>{formatDate(item.createdAt)}</span>
                    </div>

                    {/* Tag list */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap mt-1.5">
                        {item.tags.map((t) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.2 bg-[#0f1117] text-gray-400 text-[10px] rounded border border-[#2b3144]"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-[#2b3144]">
                  {item.isVirtualClip && (
                    <button
                      onClick={(e) => handleExportPhysical(item.id, e)}
                      disabled={exportingId === item.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition disabled:opacity-50"
                      title="Extract and save as standalone MP3 via FFmpeg"
                    >
                      {exportingId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      Export MP3
                    </button>
                  )}

                  {item.sourceUrl && (
                    <button
                      onClick={() => window.systemAPI.openExternal(item.sourceUrl!)}
                      className="p-2 rounded-lg hover:bg-[#1f2330] text-gray-400 hover:text-gray-200 transition"
                      title="Open YouTube Source"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleCopyPath(item.filePath, item.id)}
                    className="p-2 rounded-lg hover:bg-[#1f2330] text-gray-400 hover:text-gray-200 transition"
                    title="Copy File Path"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => handleShowInExplorer(item.filePath)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1f2330] hover:bg-[#282d3e] text-gray-300 text-xs font-medium border border-[#2b3144] transition"
                    title="Show in Windows File Explorer"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                    Explorer
                  </button>

                  <button
                    onClick={() => handleDelete(item.id, item.fileName)}
                    className="p-2 rounded-lg hover:bg-rose-500/10 text-gray-500 hover:text-rose-400 transition"
                    title="Delete File"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default RepositoryExplorer
