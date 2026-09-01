import React, { useState, useEffect } from 'react'
import {
  Search,
  Key,
  CheckCircle2,
  Sparkles,
  Zap,
  Folder,
  CheckSquare,
  Square,
  ExternalLink,
  Loader2,
  BookOpen,
  User,
  Calendar
} from 'lucide-react'

import { YouTubeSearchResult, RepoFolder } from '../../../../../main/modules/types'

interface YouTubeDiscoveryFetcherProps {
  onSwitchedToQueue?: () => void
}

const PRESETS = [
  { label: 'Dr. Laxmidhar Behera', query: 'Dr Laxmidhar Behera', icon: '👤' },
  { label: 'HG Lila Purushottam Das', query: 'Lila Purushottam Das', icon: '🪔' },
  { label: 'Laxmidhar Behera - Bhagavatam', query: 'Laxmidhar Behera Srimad Bhagavatam', icon: '📖' },
  { label: 'Laxmidhar Behera - Bhagavad Gita', query: 'Laxmidhar Behera Bhagavad Gita', icon: '📜' },
  { label: 'Laxmidhar Behera - Science & Spirit', query: 'Laxmidhar Behera Science Spirituality', icon: '🔬' },
  { label: 'Lila Purushottam Das - ISKCON', query: 'Lila Purushottam Das ISKCON', icon: '✨' }
]

const YouTubeDiscoveryFetcher: React.FC<YouTubeDiscoveryFetcherProps> = ({ onSwitchedToQueue }) => {
  const [searchQuery, setSearchQuery] = useState('Dr Laxmidhar Behera')
  const [apiKey, setApiKey] = useState('')
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [results, setResults] = useState<YouTubeSearchResult[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSearching, setIsSearching] = useState(false)
  const [searchSource, setSearchSource] = useState<'google_api' | 'ytdlp_search' | null>(null)
  const [targetFolder, setTargetFolder] = useState('Lectures')
  const [folders, setFolders] = useState<RepoFolder[]>([])
  const [isEnqueueing, setIsEnqueueing] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [settings, folderList] = await Promise.all([
          window.settingsAPI.getSettings(),
          window.beheraAPI.getFolders()
        ])
        if (settings.youtubeApiKey) {
          setApiKey(settings.youtubeApiKey)
        }
        setFolders(folderList || [])
      } catch (e) {
        console.warn('Error loading settings:', e)
      }
    }
    loadSettings()
    // Perform initial search for Dr. Laxmidhar Behera
    handleSearch('Dr Laxmidhar Behera')
  }, [])

  const handleSaveApiKey = async () => {
    try {
      await window.settingsAPI.saveSettings({ youtubeApiKey: apiKey.trim() })
      setShowApiKeyInput(false)
      setStatusMessage('Google YouTube Data API Key saved successfully!')
      setTimeout(() => setStatusMessage(null), 3000)
    } catch (e: any) {
      alert(`Failed to save API key: ${e.message}`)
    }
  }

  const handleSearch = async (queryToSearch?: string) => {
    const q = queryToSearch || searchQuery
    if (!q.trim()) return

    setIsSearching(true)
    setStatusMessage(null)
    try {
      const res = await window.youtubeAPI.searchVideos(q.trim(), 30, apiKey.trim() || undefined)
      setResults(res.results || [])
      setSearchSource(res.source)
      // Select all by default for easy 1-click batch ingestion
      setSelectedIds(new Set((res.results || []).map((r) => r.id)))
    } catch (err: any) {
      alert(`Search failed: ${err.message}`)
    } finally {
      setIsSearching(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === results.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(results.map((r) => r.id)))
    }
  }

  const toggleVideo = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  const handleBatchEnqueue = async () => {
    const selectedVideos = results.filter((r) => selectedIds.has(r.id))
    if (selectedVideos.length === 0) {
      alert('Please select at least one video to extract.')
      return
    }

    setIsEnqueueing(true)
    try {
      const res = await window.youtubeAPI.enqueueVideos(selectedVideos, targetFolder)
      setStatusMessage(`Successfully queued ${res.enqueuedCount} discourse(s) for 24 kbps audio extraction!`)
      if (onSwitchedToQueue) {
        setTimeout(() => onSwitchedToQueue(), 1500)
      }
    } catch (err: any) {
      alert(`Error enqueueing videos: ${err.message}`)
    } finally {
      setIsEnqueueing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner & API Key Setup */}
      <div className="bg-[#161922] border border-[#2b3144] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                YouTube Discourse Discovery & Ingestion
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                  Dr. Laxmidhar Behera / Lila Purushottam Das
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Fetch full audio discourses from YouTube and extract them into minimal 24 kbps Voice HD files.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0f1117] hover:bg-[#1f2330] text-gray-300 text-xs rounded-lg border border-[#2b3144] transition"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            {apiKey ? 'API Key Configured' : 'Configure Google API Key'}
          </button>
        </div>

        {/* API Key Drawer */}
        {showApiKeyInput && (
          <div className="p-4 bg-[#0f1117] rounded-xl border border-[#2b3144] space-y-2 animate-fadeIn">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              Google YouTube Data API v3 Key (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1 bg-[#161922] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100 font-mono focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition"
              >
                Save
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              💡 If left blank, the app will automatically use the built-in yt-dlp search engine with zero API keys required.
            </p>
          </div>
        )}

        {/* Preset Search Chips */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Quick Discovery Presets (Dr. Laxmidhar Behera / Lila Purushottam Das)
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.query}
                type="button"
                onClick={() => {
                  setSearchQuery(p.query)
                  handleSearch(p.query)
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  searchQuery === p.query
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-[#0f1117] text-gray-300 hover:bg-[#1f2330] border border-[#2b3144]'
                }`}
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Search Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSearch()
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Laxmidhar Behera or Lila Purushottam Das lectures..."
              className="w-full bg-[#0f1117] border border-[#2b3144] rounded-xl pl-9 pr-3 py-2.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-2 disabled:opacity-50"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Search YouTube
              </>
            )}
          </button>
        </form>

        {statusMessage && (
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-center gap-2 animate-fadeIn font-medium">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Results Header & Batch Action Bar */}
      {results.length > 0 && (
        <div className="bg-[#161922] border border-[#2b3144] rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 sticky top-4 z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-200 hover:text-white"
            >
              {selectedIds.size === results.length ? (
                <CheckSquare className="w-4 h-4 text-indigo-400" />
              ) : (
                <Square className="w-4 h-4 text-gray-500" />
              )}
              {selectedIds.size === results.length ? 'Deselect All' : 'Select All'} ({selectedIds.size}/{results.length})
            </button>

            <span className="text-[11px] text-gray-500 font-mono">
              Engine: {searchSource === 'google_api' ? '⚡ Google YouTube Data API v3' : '🔍 yt-dlp Native Search'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={targetFolder}
                onChange={(e) => setTargetFolder(e.target.value)}
                className="bg-[#0f1117] border border-[#2b3144] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-indigo-500"
              >
                <option value="Lectures">📁 Lectures</option>
                <option value="Srimad Bhagavatam">📖 Srimad Bhagavatam</option>
                <option value="Bhagavad Gita">🪔 Bhagavad Gita</option>
                <option value="Festivals">🌺 Festivals</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.path}>
                    📂 {f.path}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleBatchEnqueue}
              disabled={selectedIds.size === 0 || isEnqueueing}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition disabled:opacity-40"
            >
              {isEnqueueing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Queueing Audio...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Extract Audio for Selected ({selectedIds.size})
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Video Cards Grid */}
      {isSearching ? (
        <div className="p-16 text-center bg-[#161922] border border-[#2b3144] rounded-2xl space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-gray-300">Searching YouTube for Dr. Laxmidhar Behera discourses...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="p-16 text-center bg-[#161922] border border-[#2b3144] rounded-2xl space-y-2">
          <BookOpen className="w-8 h-8 text-gray-600 mx-auto" />
          <p className="text-sm font-bold text-gray-200">No discourses found</p>
          <p className="text-xs text-gray-400">Try selecting one of the presets above or typing a custom search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((video) => {
            const isSelected = selectedIds.has(video.id)

            return (
              <div
                key={video.id}
                onClick={() => toggleVideo(video.id)}
                className={`p-3.5 bg-[#161922] border rounded-2xl transition cursor-pointer flex flex-col justify-between space-y-3 hover:border-indigo-500/50 ${
                  isSelected ? 'border-indigo-500 bg-[#1a1e2d] shadow-lg shadow-indigo-500/5' : 'border-[#2b3144]'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Thumbnail with duration badge */}
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-black/50 border border-[#2b3144]">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {video.durationFormatted && (
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-white text-[10px] font-mono font-bold">
                        {video.durationFormatted}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.systemAPI.openExternal(video.url)
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white/80 hover:text-white hover:bg-black/90 transition"
                      title="Watch on YouTube"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Title & Info */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-100 line-clamp-2 leading-relaxed" title={video.title}>
                      {video.title}
                    </p>
                    <p className="text-[11px] text-indigo-400 truncate flex items-center gap-1 font-medium">
                      <User className="w-3 h-3 shrink-0" />
                      {video.channelTitle}
                    </p>
                  </div>
                </div>

                {/* Footer Selection Row */}
                <div className="pt-2 border-t border-[#2b3144]/60 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-gray-500 flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3" />
                    {video.publishedAt.substring(0, 10) || 'YouTube'}
                  </span>

                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <span className={isSelected ? 'text-indigo-400' : 'text-gray-500'}>
                      {isSelected ? 'Selected' : 'Click to Select'}
                    </span>
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-600 shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default YouTubeDiscoveryFetcher
