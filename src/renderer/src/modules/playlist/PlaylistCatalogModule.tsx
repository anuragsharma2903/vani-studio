import React, { useState, useEffect } from 'react'
import {
  ListMusic,
  Plus,
  Trash2,
  ExternalLink,
  Zap,
  Loader2,
  Sparkles,
  Layers,
  Search,
  ArrowLeft,
  Clock
} from 'lucide-react'
import { DiscoursePlaylist, PlaylistItem } from '../../../../main/modules/types'


interface PlaylistCatalogModuleProps {
  onSwitchedToQueue?: () => void
}

const CATEGORIES = [
  { key: 'All', label: '🌟 All Playlists' },
  { key: 'LGLG', label: '🔥 LGLG Series' },
  { key: 'Srimad Bhagavatam', label: '📖 Srimad Bhagavatam' },
  { key: 'Bhagavad Gita', label: '🪔 Bhagavad Gita' },
  { key: 'Science & Consciousness', label: '🔬 Science & Spirit' },
  { key: 'Festivals', label: '🌺 Festivals' },
  { key: 'Custom', label: '✨ Custom Playlists' }
]

const PlaylistCatalogModule: React.FC<PlaylistCatalogModuleProps> = ({ onSwitchedToQueue }) => {
  const [playlists, setPlaylists] = useState<DiscoursePlaylist[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('LGLG')
  const [activePlaylist, setActivePlaylist] = useState<DiscoursePlaylist | null>(null)
  const [showAddModal, setShowAddModal] = useState<boolean>(false)
  const [playlistUrlInput, setPlaylistUrlInput] = useState<string>('')
  const [newCategory, setNewCategory] = useState<string>('LGLG')
  const [newTitle, setNewTitle] = useState<string>('')
  const [isFetchingUrl, setIsFetchingUrl] = useState<boolean>(false)
  const [isEnqueueing, setIsEnqueueing] = useState<boolean>(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [searchFilter, setSearchFilter] = useState<string>('')

  const loadPlaylists = async () => {
    try {
      const data = await window.playlistAPI.getAll()
      setPlaylists(data || [])
    } catch (e) {
      console.warn('Error loading playlists:', e)
    }
  }

  useEffect(() => {
    loadPlaylists()
  }, [])

  const handleFetchAndAdd = async () => {
    if (!playlistUrlInput.trim()) {
      alert('Please enter a valid YouTube Playlist URL.')
      return
    }

    setIsFetchingUrl(true)
    setStatusMessage('Scanning YouTube playlist videos with yt-dlp...')
    try {
      const res = await window.playlistAPI.fetchFromUrl(playlistUrlInput.trim())
      const customPl: Partial<DiscoursePlaylist> = {
        title: newTitle.trim() || res.title,
        category: newCategory as any,
        url: playlistUrlInput.trim(),
        speaker: res.uploader || 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)',
        itemCount: res.items.length,
        items: res.items,
        isCustom: true
      }

      await window.playlistAPI.addCustom(customPl)
      await loadPlaylists()
      setShowAddModal(false)
      setPlaylistUrlInput('')
      setNewTitle('')
      setStatusMessage(`Successfully imported playlist with ${res.items.length} videos!`)
      setTimeout(() => setStatusMessage(null), 4000)
    } catch (e: any) {
      alert(`Failed to import playlist: ${e.message}`)
    } finally {
      setIsFetchingUrl(false)
    }
  }

  const handleDeletePlaylist = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to remove this playlist from the catalog?')) {
      await window.playlistAPI.remove(id)
      if (activePlaylist?.id === id) {
        setActivePlaylist(null)
      }
      await loadPlaylists()
    }
  }

  const handleBatchEnqueuePlaylist = async (pl: DiscoursePlaylist) => {
    setIsEnqueueing(true)
    try {
      const res = await window.playlistAPI.enqueueBatch(pl.id)
      setStatusMessage(`Enqueued ${res.enqueuedCount} discourse(s) from "${pl.title}" for 24 kbps audio extraction!`)
      if (onSwitchedToQueue) {
        setTimeout(() => onSwitchedToQueue(), 1500)
      }
    } catch (e: any) {
      alert(`Error queueing playlist: ${e.message}`)
    } finally {
      setIsEnqueueing(false)
    }
  }

  const handleExtractSingleVideo = async (item: PlaylistItem) => {
    try {
      await window.queueAPI.addToQueue([item.url], {
        folderPath: activePlaylist?.category === 'LGLG' ? 'LGLG Discourses' : activePlaylist?.category || 'Lectures',
        speaker: activePlaylist?.speaker || 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)',
        autoAddToRepo: true
      })
      alert(`Added "${item.title}" to the parallel download queue!`)
    } catch (e: any) {
      alert(`Error: ${e.message}`)
    }
  }

  const filteredPlaylists = playlists.filter((p) => {
    if (selectedCategory !== 'All' && p.category !== selectedCategory) {
      if (selectedCategory === 'Custom' && !p.isCustom) return false
      if (selectedCategory !== 'Custom') return false
    }
    if (!searchFilter.trim()) return true
    const q = searchFilter.toLowerCase().trim()
    return (
      p.title.toLowerCase().includes(q) ||
      p.speaker.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#161922] border border-[#2b3144] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ListMusic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                Categorized Playlists & LGLG Section
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                  LGLG / Live Gyan / Lila Govinda Series
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Browse categorized playlist collections of Dr. Laxmidhar Behera (HG Lila Purushottam Das) and batch extract audio.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition"
          >
            <Plus className="w-4 h-4" />
            Import / Add Playlist URL
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => {
                setSelectedCategory(c.key)
                setActivePlaylist(null)
              }}
              className={`px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap transition ${
                selectedCategory === c.key
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-[#0f1117] text-gray-400 hover:text-white border border-[#2b3144]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Search Filter Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter playlists by title, topic, or speaker..."
            className="w-full bg-[#0f1117] border border-[#2b3144] rounded-xl pl-9 pr-3 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {statusMessage && (
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-center gap-2 animate-fadeIn font-medium">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Add / Import Playlist Modal */}
      {showAddModal && (
        <div className="p-6 bg-[#161922] border border-[#2b3144] rounded-2xl shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[#2b3144] pb-3">
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              Import YouTube Playlist to Catalog
            </h3>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="text-xs text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1">
              <label className="text-[11px] font-semibold text-gray-300">YouTube Playlist URL / Link *</label>
              <input
                type="text"
                placeholder="https://www.youtube.com/playlist?list=PL..."
                value={playlistUrlInput}
                onChange={(e) => setPlaylistUrlInput(e.target.value)}
                className="w-full bg-[#0f1117] border border-[#2b3144] rounded-xl px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-300">Category Section</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-[#0f1117] border border-[#2b3144] rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="LGLG">🔥 LGLG Series</option>
                <option value="Srimad Bhagavatam">📖 Srimad Bhagavatam</option>
                <option value="Bhagavad Gita">🪔 Bhagavad Gita</option>
                <option value="Science & Consciousness">🔬 Science & Spirit</option>
                <option value="Festivals">🌺 Festivals</option>
                <option value="Custom">✨ Custom</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 bg-[#0f1117] hover:bg-[#1f2330] text-gray-400 text-xs rounded-xl border border-[#2b3144] transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleFetchAndAdd}
              disabled={!playlistUrlInput.trim() || isFetchingUrl}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition disabled:opacity-40"
            >
              {isFetchingUrl ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scanning Playlist...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Fetch & Save to Catalog
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main View: Either Playlist Grid OR Expanded Active Playlist Tracks */}
      {!activePlaylist ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlaylists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => setActivePlaylist(pl)}
              className="p-5 bg-[#161922] border border-[#2b3144] hover:border-indigo-500/50 rounded-2xl shadow-xl transition cursor-pointer flex flex-col justify-between space-y-4 hover:bg-[#1a1e2d]"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold uppercase tracking-wider">
                    {pl.category}
                  </span>
                  <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    {pl.items?.length || pl.itemCount} discourses
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-gray-100 line-clamp-2 leading-relaxed" title={pl.title}>
                    {pl.title}
                  </h3>
                  <p className="text-[11px] text-indigo-400 truncate mt-0.5">{pl.speaker}</p>
                </div>

                {pl.description && (
                  <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{pl.description}</p>
                )}
              </div>

              <div className="pt-3 border-t border-[#2b3144]/60 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleBatchEnqueuePlaylist(pl)
                  }}
                  disabled={isEnqueueing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-xl text-[11px] font-bold transition"
                  title="Extract all discourses in this playlist at 24 kbps"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Extract All ({pl.items?.length || pl.itemCount})
                </button>

                {pl.isCustom && (
                  <button
                    type="button"
                    onClick={(e) => handleDeletePlaylist(pl.id, e)}
                    className="p-1.5 text-gray-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition"
                    title="Remove custom playlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Expanded Playlist View */
        <div className="bg-[#161922] border border-[#2b3144] rounded-2xl p-6 shadow-xl space-y-6 animate-fadeIn">
          {/* Top Bar of Expanded View */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2b3144] pb-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActivePlaylist(null)}
                className="p-2 bg-[#0f1117] hover:bg-[#1f2330] border border-[#2b3144] text-gray-300 hover:text-white rounded-xl transition"
                title="Back to all playlists"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold uppercase">
                    {activePlaylist.category}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">{activePlaylist.items.length} Discourses</span>
                </div>
                <h2 className="text-sm font-bold text-gray-100 mt-1">{activePlaylist.title}</h2>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleBatchEnqueuePlaylist(activePlaylist)}
              disabled={isEnqueueing}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition"
            >
              <Zap className="w-4 h-4" />
              Extract Entire Playlist ({activePlaylist.items.length} Audios)
            </button>
          </div>

          {/* List of Videos in Active Playlist */}
          <div className="space-y-2.5">
            {activePlaylist.items.map((item, idx) => (
              <div
                key={item.id}
                className="p-3.5 bg-[#0f1117] border border-[#2b3144] rounded-xl flex items-center justify-between gap-3 hover:border-indigo-500/40 transition"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="w-6 text-center text-xs font-mono font-bold text-gray-500">
                    #{idx + 1}
                  </span>

                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs font-bold text-gray-100 truncate" title={item.title}>
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 flex-wrap">
                      {item.scripture && (
                        <span className="text-indigo-300 font-semibold">{item.scripture}</span>
                      )}
                      {item.verse && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                          {item.verse}
                        </span>
                      )}
                      {item.durationFormatted && (
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-gray-500" />
                          {item.durationFormatted}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => window.systemAPI.openExternal(item.url)}
                    className="p-2 bg-[#161922] border border-[#2b3144] hover:text-white text-gray-400 rounded-lg text-xs transition"
                    title="Watch on YouTube"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExtractSingleVideo(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition shadow"
                  >
                    <Zap className="w-3 h-3" />
                    Extract (24 kbps)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PlaylistCatalogModule
