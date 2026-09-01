import React, { useState, useEffect } from 'react'
import {
  ListPlus,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Scissors,
  FolderOpen,
  Folder,
  Layers,
  Zap,
  User,
  Sliders,
  Radio,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink
} from 'lucide-react'


import { QueueItem, VideoInfo, RepoFolder, WatchedChannel } from '../../../../../main/modules/types'

interface BatchQueueDownloaderProps {
  onSendToTrimmer: (tempFilePath: string, videoInfo: VideoInfo) => void
}

function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const hrs = Math.floor(mins / 60)
  if (hrs > 0) {
    const remMins = mins % 60
    return `${hrs}:${remMins < 10 ? '0' : ''}${remMins}:${secs < 10 ? '0' : ''}${secs}`
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

const BatchQueueDownloader: React.FC<BatchQueueDownloaderProps> = ({ onSendToTrimmer }) => {
  const [urlInputText, setUrlInputText] = useState('')
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  const [concurrency, setConcurrency] = useState<number>(2)
  const [selectedFolder, setSelectedFolder] = useState<string>('Lectures')
  const [speaker, setSpeaker] = useState<string>('Dr. Laxmidhar Behera (HG Lila Purushottam Das)')
  const [autoAddToRepo, setAutoAddToRepo] = useState<boolean>(true)
  const [folders, setFolders] = useState<RepoFolder[]>([])

  // Watched Channels State
  const [watchedChannels, setWatchedChannels] = useState<WatchedChannel[]>([])
  const [newChannelUrl, setNewChannelUrl] = useState('')
  const [newChannelName, setNewChannelName] = useState('')
  const [isCheckingChannels, setIsCheckingChannels] = useState(false)
  const [activeTab, setActiveTab] = useState<'queue' | 'watcher'>('queue')

  const loadData = async () => {
    try {
      const [items, folderList, channels] = await Promise.all([
        window.queueAPI.getQueue(),
        window.beheraAPI.getFolders(),
        window.watcherAPI.getChannels()
      ])
      setQueueItems(items || [])
      setFolders(folderList || [])
      setWatchedChannels(channels || [])
    } catch (e) {
      console.warn('Error loading queue & watcher data:', e)
    }
  }


  useEffect(() => {
    loadData()

    const unsubscribe = window.queueAPI.onQueueUpdated((items) => {
      setQueueItems(items || [])
    })
    return () => unsubscribe()
  }, [])

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInputText.trim()) return

    // Split by newlines or commas
    const lines = urlInputText
      .split(/[\n,]/)
      .map((l) => l.trim())
      .filter((l) => l.startsWith('http'))

    if (lines.length === 0) {
      alert('Please enter at least one valid YouTube URL.')
      return
    }

    await window.queueAPI.addToQueue(lines, {
      folderPath: selectedFolder,
      speaker: speaker.trim() || 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)',
      autoAddToRepo: autoAddToRepo
    })

    setUrlInputText('')
  }

  const handleSetConcurrency = async (limit: number) => {
    setConcurrency(limit)
    await window.queueAPI.setConcurrency(limit)
  }

  const handleAddWatchedChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChannelUrl.trim()) return
    try {
      const added = await window.watcherAPI.addChannel(newChannelUrl.trim(), {
        name: newChannelName.trim() || newChannelUrl.trim(),
        folderPath: selectedFolder,
        speaker: speaker.trim() || 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)'
      })
      setWatchedChannels((prev) => [...prev.filter((c) => c.id !== added.id), added])
      setNewChannelUrl('')
      setNewChannelName('')
      alert('Channel added to automatic background watcher!')
    } catch (e: any) {
      alert(`Error adding channel: ${e.message}`)
    }
  }

  const handleRemoveChannel = async (id: string) => {
    if (!confirm('Remove this channel from the automatic watcher?')) return
    await window.watcherAPI.removeChannel(id)
    setWatchedChannels((prev) => prev.filter((c) => c.id !== id))
  }

  const handleToggleChannel = async (id: string, current: boolean) => {
    const updated = await window.watcherAPI.toggleChannel(id, !current)
    if (updated) {
      setWatchedChannels((prev) => prev.map((c) => (c.id === id ? updated : c)))
    }
  }

  const handleCheckChannelsNow = async () => {
    setIsCheckingChannels(true)
    try {
      const res = await window.watcherAPI.checkNow()
      await loadData()
      alert(`Checked ${res.checked} channels. Added ${res.totalNew} new discourse(s) to download queue!`)
    } catch (e: any) {
      alert(`Check error: ${e.message}`)
    } finally {
      setIsCheckingChannels(false)
    }
  }

  const completedCount = queueItems.filter((i) => i.status === 'completed').length
  const downloadingCount = queueItems.filter((i) => i.status === 'downloading').length
  const queuedCount = queueItems.filter((i) => i.status === 'queued').length
  const errorCount = queueItems.filter((i) => i.status === 'error').length

  return (
    <div className="space-y-6">
      {/* Top Tab Bar: Manual Batch Queue vs Auto Channel Watcher */}
      <div className="flex items-center gap-2 border-b border-[#2b3144] pb-3">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'queue'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-[#161922] text-gray-400 hover:text-white border border-[#2b3144]'
          }`}
        >
          <ListPlus className="w-4 h-4" />
          Batch URL Queue ({queueItems.length})
        </button>

        <button
          onClick={() => setActiveTab('watcher')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'watcher'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-[#161922] text-gray-400 hover:text-white border border-[#2b3144]'
          }`}
        >
          <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
          🤖 Auto Channel Watcher ({watchedChannels.length})
        </button>
      </div>

      {/* Mode 1: Manual Batch Ingestion Card */}
      {activeTab === 'queue' && (
        <>
          <div className="bg-[#161922] border border-[#2b3144] rounded-2xl p-6 shadow-xl space-y-4">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListPlus className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-gray-100">
              Batch URL Ingestion & Parallel Queue
            </h2>
          </div>
          <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            24 kbps Voice Compression
          </span>
        </div>


        <p className="text-xs text-gray-400">
          Paste multiple YouTube links (one per line) to download, compress, and organize them into folders in parallel.
        </p>

        <form onSubmit={handleAddBatch} className="space-y-4">
          <textarea
            rows={4}
            value={urlInputText}
            onChange={(e) => setUrlInputText(e.target.value)}
            placeholder="Paste YouTube URLs here (one per line)...&#10;https://www.youtube.com/watch?v=...&#10;https://www.youtube.com/live/..."
            className="w-full bg-[#0f1117] border border-[#2b3144] rounded-xl p-3.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono"
          />

          {/* Ingestion Settings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-medium text-gray-400 block mb-1 flex items-center gap-1">
                <Folder className="w-3.5 h-3.5 text-indigo-400" />
                Target Collection Folder
              </label>
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="Bhagavad Gita">Bhagavad Gita</option>
                <option value="Srimad Bhagavatam">Srimad Bhagavatam</option>
                <option value="Lectures">Lectures</option>
                <option value="Seminars 2026">Seminars 2026</option>
                <option value="Q&A Sessions">Q&A Sessions</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.path}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-400 block mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                Speaker / Teacher
              </label>
              <input
                type="text"
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                placeholder="Dr. Laxmidhar Behera (HG Lila Purushottam Das)"
                className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-400 block mb-1 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                Parallel Workers
              </label>
              <div className="flex bg-[#0f1117] rounded-lg p-0.5 border border-[#2b3144] text-xs font-semibold">
                {[1, 2, 3, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleSetConcurrency(num)}
                    className={`flex-1 py-1 rounded transition ${
                      concurrency === num
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {num}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoAddToRepo}
                onChange={(e) => setAutoAddToRepo(e.target.checked)}
                className="accent-indigo-500 rounded"
              />
              Auto-add finished tracks into Behera Sir’s Library
            </label>

            <button
              type="submit"
              disabled={!urlInputText.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition disabled:opacity-40"
            >
              <ListPlus className="w-4 h-4" />
              Add to Download Queue
            </button>
          </div>
        </form>
      </div>

      {/* Queue Monitoring Card */}
      <div className="bg-[#161922] border border-[#2b3144] rounded-2xl p-6 shadow-xl space-y-4">
        {/* Header Stats & Batch Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2b3144] pb-4">
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="text-gray-200">
              Total Queue: <span className="text-indigo-400 font-mono">{queueItems.length}</span>
            </span>
            <span className="text-amber-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Queued: <span className="font-mono">{queuedCount}</span>
            </span>
            <span className="text-indigo-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              Active: <span className="font-mono">{downloadingCount}</span>
            </span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Done: <span className="font-mono">{completedCount}</span>
            </span>
            {errorCount > 0 && (
              <span className="text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Errors: <span className="font-mono">{errorCount}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {completedCount > 0 && (
              <button
                type="button"
                onClick={() => window.queueAPI.clearCompleted()}
                className="px-3 py-1.5 bg-[#1f2330] hover:bg-[#282d3e] text-gray-300 rounded-lg text-xs font-medium border border-[#2b3144] transition"
              >
                Clear Completed
              </button>
            )}
            {queueItems.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Cancel and clear all queue items?')) {
                    window.queueAPI.clearAll()
                  }
                }}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg text-xs font-medium border border-rose-500/20 transition"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Queue Items Table / Cards */}
        {queueItems.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-gray-300">The Download Queue is Empty</p>
            <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
              Paste YouTube URLs in the box above to run parallel background downloads.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {queueItems.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-[#0f1117] border border-[#2b3144] rounded-xl space-y-2.5 hover:border-[#3d4560] transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-gray-100 truncate">{item.title}</p>
                      <span className="text-[10px] px-2 py-0.2 rounded bg-[#161922] text-indigo-300 border border-indigo-500/20 flex items-center gap-1 shrink-0 font-mono">
                        <Folder className="w-2.5 h-2.5" />
                        {item.folderPath}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-mono truncate">
                      {item.uploader ? `${item.uploader} • ` : ''}
                      {item.duration ? `${formatDuration(item.duration)} • ` : ''}
                      {item.url}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0 flex items-center gap-2">
                    {item.status === 'queued' && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Queued
                      </span>
                    )}
                    {item.status === 'downloading' && (
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1 animate-pulse">
                        <Zap className="w-3.5 h-3.5" />
                        {item.percent}% {item.speed ? `(${item.speed})` : ''}
                      </span>
                    )}
                    {item.status === 'completed' && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Completed
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Failed
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar (during downloading) */}
                {item.status === 'downloading' && (
                  <div className="w-full bg-[#161922] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                )}

                {/* Error message */}
                {item.status === 'error' && item.error && (
                  <p className="text-xs text-rose-300 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20 leading-relaxed">
                    {item.error
                      .replace(/^Error invoking remote method '[^']+':\s*/, '')
                      .replace(/^Error:\s*/, '')
                      .replace(/^Command failed:[^\n]+ERROR:\s*/, '')}
                  </p>
                )}

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="text-[11px] text-gray-500">
                    {item.status === 'downloading' && item.eta && `ETA: ${item.eta}`}
                    {item.status === 'completed' && 'Saved in sources as 24 kbps Voice MP3'}
                  </div>


                  <div className="flex items-center gap-2">
                    {item.status === 'completed' && item.tempFilePath && item.videoInfo && (
                      <button
                        type="button"
                        onClick={() => onSendToTrimmer(item.tempFilePath!, item.videoInfo!)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        Crop & Trim
                      </button>
                    )}

                    {item.status === 'completed' && item.tempFilePath && (
                      <button
                        type="button"
                        onClick={() => window.audioAPI.showInExplorer(item.tempFilePath!)}
                        className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#1f2330] transition"
                        title="Reveal in Explorer"
                      >
                        <FolderOpen className="w-4 h-4" />
                      </button>
                    )}

                    {item.status === 'error' && (
                      <button
                        type="button"
                        onClick={() => window.queueAPI.retryItem(item.id)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-lg text-xs font-medium border border-amber-500/20 transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Retry
                      </button>
                    )}

                    {(item.status === 'queued' || item.status === 'downloading') && (
                      <button
                        type="button"
                        onClick={() => window.queueAPI.cancelItem(item.id)}
                        className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg text-xs font-medium border border-rose-500/20 transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}


      {/* Mode 2: Auto Channel Watcher Management Card */}
      {activeTab === 'watcher' && (
        <div className="space-y-6">
          <div className="bg-[#161922] border border-[#2b3144] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-rose-400" />
                <h2 className="text-sm font-bold text-gray-100">
                  Automated YouTube Channel & Playlist Watcher
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCheckChannelsNow}
                disabled={isCheckingChannels || watchedChannels.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingChannels ? 'animate-spin' : ''}`} />
                {isCheckingChannels ? 'Checking Channels...' : 'Check All Channels Now'}
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Add Dr. Laxmidhar Behera's YouTube channel or playlist URLs below. The background watcher automatically checks for newly uploaded discourses, compresses them to 24 kbps Voice HD, embeds ID3 metadata, and organizes them into your collections.
            </p>

            <form onSubmit={handleAddWatchedChannel} className="space-y-3 p-4 bg-[#0f1117] rounded-xl border border-[#2b3144]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-300">Channel or Playlist URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.youtube.com/@channelName or playlist URL"
                    value={newChannelUrl}
                    onChange={(e) => setNewChannelUrl(e.target.value)}
                    className="w-full bg-[#161922] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100 placeholder-gray-500 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-300">Custom Label / Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Laxmidhar Behera Daily SB Classes"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    className="w-full bg-[#161922] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-gray-400">
                  Target folder: <span className="text-indigo-300 font-mono">{selectedFolder}</span>
                </span>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Monitored Channel
                </button>
              </div>
            </form>
          </div>

          {/* List of Monitored Channels */}
          <div className="bg-[#161922] border border-[#2b3144] rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              Active Monitored Feeds ({watchedChannels.length})
            </h3>

            {watchedChannels.length === 0 ? (
              <div className="text-center p-8 text-xs text-gray-400">
                No channels are currently being monitored. Add a YouTube channel URL above to enable automatic lecture ingestion.
              </div>
            ) : (
              <div className="space-y-3">
                {watchedChannels.map((channel) => (
                  <div
                    key={channel.id}
                    className="p-4 bg-[#0f1117] border border-[#2b3144] rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:border-indigo-500/40 transition"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${channel.enabled ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                        <p className="text-xs font-bold text-gray-100 truncate">{channel.name}</p>
                        <span className="text-[10px] px-2 py-0.2 rounded bg-[#161922] text-indigo-300 border border-indigo-500/20 font-mono">
                          📁 {channel.folderPath || 'Lectures'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 font-mono truncate">{channel.url}</p>
                      <p className="text-[10px] text-gray-500">
                        Last Checked: {channel.lastChecked ? new Date(channel.lastChecked).toLocaleString() : 'Pending first scan'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleChannel(channel.id, channel.enabled)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          channel.enabled
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {channel.enabled ? 'Enabled' : 'Paused'}
                      </button>

                      <button
                        type="button"
                        onClick={() => window.systemAPI.openExternal(channel.url)}
                        className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-[#1f2330] transition"
                        title="Open in Browser"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveChannel(channel.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-400 rounded hover:bg-rose-500/10 transition"
                        title="Remove Channel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default BatchQueueDownloader

