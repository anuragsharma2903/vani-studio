import React, { useState, useEffect, useRef } from 'react'
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  ArrowUp,
  ArrowDown,
  Plus,
  FolderOpen,
  Folder,
  FolderPlus,
  Trash2,
  Edit3,
  Search,
  Headphones,
  Music,
  DownloadCloud,
  User,
  Sparkles,
  ListMusic,
  FolderInput,
  Cloud,
  CloudUpload,
  CheckCircle2,
  Zap,
  Scissors,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Calendar,
  MapPin,
  Tag,
  Layers,
  Check
} from 'lucide-react'



import { BeheraTrack, AudioMetadata, RepoFolder, DiscourseMetadata } from '../../../../main/modules/types'

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

function formatTimeWithMs(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00.00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 100)
  const hrs = Math.floor(mins / 60)
  if (hrs > 0) {
    const remMins = mins % 60
    return `${hrs}:${remMins < 10 ? '0' : ''}${remMins}:${secs < 10 ? '0' : ''}${secs}.${ms < 10 ? '0' : ''}${ms}`
  }
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}.${ms < 10 ? '0' : ''}${ms}`
}

function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0
  const parts = timeStr.split(':')
  if (parts.length === 3) {
    const hrs = parseFloat(parts[0]) || 0
    const mins = parseFloat(parts[1]) || 0
    const secs = parseFloat(parts[2]) || 0
    return Math.max(0, hrs * 3600 + mins * 60 + secs)
  }
  if (parts.length === 2) {
    const mins = parseFloat(parts[0]) || 0
    const secs = parseFloat(parts[1]) || 0
    return Math.max(0, mins * 60 + secs)
  }
  return Math.max(0, parseFloat(timeStr) || 0)
}

function getTrackBounds(track: BeheraTrack | null): { start: number; end: number; duration: number } {
  if (!track) return { start: 0, end: 0, duration: 0 }
  const start = Number(track.startTime ?? track.metadata?.startTime ?? 0)
  const end = Number(track.endTime ?? track.metadata?.endTime ?? 0)
  const dur = Number(track.duration ?? (end > start ? end - start : 0))
  return {
    start: isNaN(start) ? 0 : Math.max(0, start),
    end: isNaN(end) ? 0 : Math.max(0, end),
    duration: isNaN(dur) ? 0 : Math.max(0, dur)
  }
}


const BeheraRepoModule: React.FC = () => {
  const [tracks, setTracks] = useState<BeheraTrack[]>([])
  const [folders, setFolders] = useState<RepoFolder[]>([])
  const [repoAudioClips, setRepoAudioClips] = useState<AudioMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [activeScriptureFilter, setActiveScriptureFilter] = useState<string>('All')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())


  // Continuous Audio Player State
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [autoPlayNext, setAutoPlayNext] = useState(true)
  const [isShuffle, setIsShuffle] = useState(false)
  const [isRepeat, setIsRepeat] = useState(false)

  // Rich Metadata Inspector Modal State
  const [editingTrack, setEditingTrack] = useState<BeheraTrack | null>(null)
  const [activeEditTab, setActiveEditTab] = useState<'discourse' | 'occasion' | 'summary' | 'folder' | 'json' | 'tech'>('discourse')
  const [editTitle, setEditTitle] = useState('')
  const [editTitleHindi, setEditTitleHindi] = useState('')
  const [editSubtitle, setEditSubtitle] = useState('')
  const [editSpeaker, setEditSpeaker] = useState('')
  const [editLanguage, setEditLanguage] = useState('Hindi')
  const [editScripture, setEditScripture] = useState('Srimad Bhagavatam')
  const [editCanto, setEditCanto] = useState('')
  const [editChapter, setEditChapter] = useState('')
  const [editVerse, setEditVerse] = useState('')
  const [editPhilosophyTopic, setEditPhilosophyTopic] = useState('')
  const [editDateRecorded, setEditDateRecorded] = useState('')
  const [editFestival, setEditFestival] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editEvent, setEditEvent] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editKeyVersesCited, setEditKeyVersesCited] = useState('')
  const [editKeyTakeaways, setEditKeyTakeaways] = useState('')
  const [editFolderPath, setEditFolderPath] = useState('')
  const [editTags, setEditTags] = useState<string[]>([])
  const [editTagInput, setEditTagInput] = useState('')
  const [jsonDictText, setJsonDictText] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)

  // Subfolder Creation Modal State
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [parentFolderChoice, setParentFolderChoice] = useState<string>('')
  const [newFolderName, setNewFolderName] = useState('')

  // In-Vault Trimmer Modal State
  const [trimmingTrack, setTrimmingTrack] = useState<BeheraTrack | null>(null)
  const [trimStart, setTrimStart] = useState<number>(0)
  const [trimEnd, setTrimEnd] = useState<number>(0)
  const [trimStartInput, setTrimStartInput] = useState<string>('00:00.00')
  const [trimEndInput, setTrimEndInput] = useState<string>('00:00.00')
  const [trimTitle, setTrimTitle] = useState<string>('')
  const [trimScripture, setTrimScripture] = useState<string>('Srimad Bhagavatam')
  const [trimVerse, setTrimVerse] = useState<string>('')
  const [trimFolder, setTrimFolder] = useState<string>('Lectures')
  const [isTrimming, setIsTrimming] = useState<boolean>(false)

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false)

  // Move to Folder Dropdown State: trackId -> boolean
  const [movingTrackId, setMovingTrackId] = useState<string | null>(null)

  // Cloud Sync State
  const [isSyncingCloud, setIsSyncingCloud] = useState(false)
  const [cloudSyncMessage, setCloudSyncMessage] = useState<string | null>(null)
  const [compressingTrackId, setCompressingTrackId] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)


  const loadData = async () => {
    setIsLoading(true)
    try {
      const [trackList, folderList, repoClips] = await Promise.all([
        window.beheraAPI.getTracks(),
        window.beheraAPI.getFolders(),
        window.audioAPI.getRepo()
      ])
      setTracks(trackList || [])
      setFolders(folderList || [])
      setRepoAudioClips(repoClips || [])
    } catch (e) {
      console.error('Error loading Behera repo data:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloudSync = async () => {
    setIsSyncingCloud(true)
    setCloudSyncMessage('Synchronizing with Cloudflare R2...')
    try {
      await window.cloudflareAPI.syncAll()
      const res = await window.cloudflareAPI.pullFromR2()
      setCloudSyncMessage(res.message || 'Synced with Cloudflare R2!')
      await loadData()
    } catch (e: any) {
      console.warn('Cloud sync error:', e)
      setCloudSyncMessage(`Sync: ${e.message}`)
    } finally {
      setIsSyncingCloud(false)
      setTimeout(() => setCloudSyncMessage(null), 4000)
    }
  }

  const handleUploadSingleTrackToCloud = async (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await window.cloudflareAPI.uploadBeheraTrack(trackId)
      await loadData()
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`)
    }
  }

  const handleDownloadTrackOffline = async (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await window.cloudflareAPI.downloadOffline(trackId)
      await loadData()
    } catch (err: any) {
      alert(`Download failed: ${err.message}`)
    }
  }

  const handleCompressTrack = async (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setCompressingTrackId(trackId)
    try {
      await window.beheraAPI.compressTrack(trackId)
      await loadData()
    } catch (err: any) {
      alert(`Audio compression failed: ${err.message}`)
    } finally {
      setCompressingTrackId(null)
    }
  }


  useEffect(() => {
    loadData()
    handleCloudSync()
  }, [])

  // Current playing track object
  const currentTrack =
    currentTrackIndex !== null && tracks[currentTrackIndex] ? tracks[currentTrackIndex] : null

  // Play Specific Track by Index (supports local files, presigned Cloudflare R2 streaming, and tagged timestamp clipping)
  const playTrack = async (index: number) => {
    if (index < 0 || index >= tracks.length) return
    setCurrentTrackIndex(index)
    setIsPlaying(true)

    const track = tracks[index]
    const { start, duration: trackDur } = getTrackBounds(track)
    setCurrentTime(0)
    setDuration(trackDur)

    if (audioRef.current) {
      let src = ''
      if (track.filePath) {
        src = window.audioAPI.toMediaUrl(track.filePath)
      } else if (track.r2Url && track.r2Url.startsWith('http')) {
        src = track.r2Url
      } else if (track.r2Key) {
        try {
          src = await window.cloudflareAPI.getPresignedUrl(track.r2Key)
        } catch (_) {
          src = window.audioAPI.toMediaUrl(track.r2Key)
        }
      }

      audioRef.current.pause()
      audioRef.current.src = src

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

  const togglePlayPause = () => {
    if (!audioRef.current) return
    if (currentTrackIndex === null && tracks.length > 0) {
      playTrack(0)
      return
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch((e) => console.warn('Audio play error:', e))
      setIsPlaying(true)
    }
  }

  const playNextTrack = () => {
    if (tracks.length === 0) return
    if (isShuffle) {
      const nextIdx = Math.floor(Math.random() * tracks.length)
      playTrack(nextIdx)
      return
    }
    const nextIdx = currentTrackIndex !== null ? (currentTrackIndex + 1) % tracks.length : 0
    playTrack(nextIdx)
  }

  const playPrevTrack = () => {
    if (tracks.length === 0) return
    const prevIdx =
      currentTrackIndex !== null ? (currentTrackIndex - 1 + tracks.length) % tracks.length : 0
    playTrack(prevIdx)
  }

  const handleTrackEnded = () => {
    if (isRepeat) {
      if (audioRef.current && currentTrack) {
        const { start } = getTrackBounds(currentTrack)
        audioRef.current.currentTime = start
        audioRef.current.play().catch(() => {})
      }
    } else if (autoPlayNext) {
      playNextTrack()
    } else {
      setIsPlaying(false)
    }
  }


  // Reorder tracks in sequence (Move Up / Down)
  const moveTrack = async (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation()
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= tracks.length) return

    const newTracks = [...tracks]
    const temp = newTracks[index]
    newTracks[index] = newTracks[targetIndex]
    newTracks[targetIndex] = temp

    setTracks(newTracks)

    const orderedIds = newTracks.map((t) => t.id)
    const updated = await window.beheraAPI.reorderTracks(orderedIds)
    setTracks(updated)

    if (currentTrackIndex === index) {
      setCurrentTrackIndex(targetIndex)
    } else if (currentTrackIndex === targetIndex) {
      setCurrentTrackIndex(index)
    }
  }

  // Move Track to Folder
  const handleMoveToFolder = async (trackId: string, folderPath: string) => {
    await window.beheraAPI.moveToFolder(trackId, folderPath)
    setMovingTrackId(null)
    await loadData()
  }

  // Create New Folder / Subfolder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFolderName.trim()) return

    await window.beheraAPI.createFolder(newFolderName.trim(), parentFolderChoice || undefined)
    setNewFolderName('')
    setShowNewFolderModal(false)
    await loadData()
  }

  const handleDeleteFolder = async (folderPath: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm(`Delete folder "${folderPath}"? Tracks inside will be moved to Lectures.`)) {
      await window.beheraAPI.deleteFolder(folderPath)
      if (selectedFolder === folderPath) setSelectedFolder(null)
      await loadData()
    }
  }

  // Delete Track
  const handleDeleteTrack = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('Remove this discourse track from Dr. Laxmidhar Behera’s Sacred Archive?')) {
      if (currentTrack?.id === id) {
        if (audioRef.current) audioRef.current.pause()
        setIsPlaying(false)
        setCurrentTrackIndex(null)
      }
      await window.beheraAPI.deleteTrack(id, false)
      await loadData()
    }
  }

  // Import from Audio Repository
  const handleImportClip = async (audioRepoId: string) => {
    await window.beheraAPI.importFromRepo(audioRepoId)
    setShowImportModal(false)
    await loadData()
  }

  // Open In-Vault Trimmer Modal
  const openTrimmerModal = (track: BeheraTrack, e: React.MouseEvent) => {
    e.stopPropagation()
    setTrimmingTrack(track)
    const bounds = getTrackBounds(track)
    setTrimStart(bounds.start)
    setTrimEnd(bounds.end > bounds.start ? bounds.end : bounds.duration)
    setTrimStartInput(formatTimeWithMs(bounds.start))
    setTrimEndInput(formatTimeWithMs(bounds.end > bounds.start ? bounds.end : bounds.duration))
    setTrimTitle(`${track.title} (Clip)`)
    setTrimScripture(track.metadata?.scripture || 'Srimad Bhagavatam')
    setTrimVerse(track.metadata?.verse || '')
    setTrimFolder(track.folderPath || 'Lectures')
  }

  // Execute In-Vault Crop & Trim
  const handleExecuteInVaultCrop = async () => {
    if (!trimmingTrack || !trimmingTrack.filePath) return
    if (trimStart >= trimEnd) {
      alert('Start time must be less than end time.')
      return
    }

    setIsTrimming(true)
    try {
      await window.beheraAPI.cropTrack({
        sourcePath: trimmingTrack.filePath,
        startTime: trimStart,
        endTime: trimEnd,
        title: trimTitle.trim() || `${trimmingTrack.title} (Trimmed)`,
        speaker: trimmingTrack.speaker || 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)',
        topic: trimVerse || trimmingTrack.topic || 'Discourse Clip',
        category: trimFolder.split('/')[0] || 'Lectures',
        folderPath: trimFolder,
        metadata: {
          ...trimmingTrack.metadata,
          scripture: trimScripture,
          verse: trimVerse,
          dateRecorded: trimmingTrack.metadata?.dateRecorded || new Date().toISOString().split('T')[0],
          parentTrackTitle: trimmingTrack.title,
          parentTrackId: trimmingTrack.id
        },
        videoInfo: {
          thumbnail: trimmingTrack.thumbnail,
          url: trimmingTrack.sourceUrl
        }
      })

      setTrimmingTrack(null)
      await loadData()
      alert('Track trimmed and saved into Dr. Laxmidhar Behera\'s Vault as a high quality 24 kbps voice discourse!')
    } catch (err: any) {
      console.error('In-vault crop failed:', err)
      alert(`Trimming error: ${err.message}`)
    } finally {
      setIsTrimming(false)
    }
  }

  // Open Metadata Dict Editor
  const openMetadataEditor = (track: BeheraTrack, e: React.MouseEvent) => {
    e.stopPropagation()
    const m = track.metadata || {}
    setEditingTrack(track)
    setEditTitle(track.title)
    setEditTitleHindi(m.titleHindi || '')
    setEditSubtitle(m.subtitle || '')
    setEditSpeaker(track.speaker || m.speaker || 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)')
    setEditLanguage(m.language || 'Hindi')
    setEditScripture(m.scripture || 'Srimad Bhagavatam')
    setEditCanto(m.canto || '')
    setEditChapter(m.chapter || '')
    setEditVerse(m.verse || track.topic || '')
    setEditPhilosophyTopic(m.philosophyTopic || '')
    setEditDateRecorded(m.dateRecorded || m.date || '')
    setEditFestival(m.festival || '')
    setEditLocation(m.location || '')
    setEditEvent(m.event || '')
    setEditDescription(m.description || m.notes || '')
    setEditKeyVersesCited(Array.isArray(m.keyVersesCited) ? m.keyVersesCited.join(', ') : m.keyVersesCited || '')
    setEditKeyTakeaways(Array.isArray(m.keyTakeaways) ? m.keyTakeaways.join('\n') : m.keyTakeaways || '')
    setEditFolderPath(track.folderPath || track.category || 'Lectures')
    setEditTags(Array.isArray(m.tags) ? m.tags : m.originalTags || ['behera-sir'])
    setJsonDictText(JSON.stringify(track.metadata || {}, null, 2))
    setJsonError(null)
    setActiveEditTab('discourse')
  }

  // Save Metadata Dict
  const handleSaveMetadata = async () => {
    if (!editingTrack) return

    try {
      let updatedDict: DiscourseMetadata = {}
      if (activeEditTab === 'json') {
        updatedDict = JSON.parse(jsonDictText)
      } else {
        updatedDict = {
          ...(editingTrack.metadata || {}),
          titleHindi: editTitleHindi.trim(),
          subtitle: editSubtitle.trim(),
          speaker: editSpeaker.trim(),
          language: editLanguage.trim(),
          scripture: editScripture.trim(),
          canto: editCanto.trim(),
          chapter: editChapter.trim(),
          verse: editVerse.trim(),
          philosophyTopic: editPhilosophyTopic.trim(),
          dateRecorded: editDateRecorded.trim(),
          festival: editFestival.trim(),
          location: editLocation.trim(),
          event: editEvent.trim(),
          description: editDescription.trim(),
          keyVersesCited: editKeyVersesCited ? editKeyVersesCited.split(',').map((s) => s.trim()).filter(Boolean) : [],
          keyTakeaways: editKeyTakeaways ? editKeyTakeaways.split('\n').map((s) => s.trim()).filter(Boolean) : [],
          tags: editTags
        }
      }

      await window.beheraAPI.updateTrackMetadata(editingTrack.id, updatedDict, {
        title: editTitle.trim(),
        speaker: editSpeaker.trim(),
        topic: editVerse.trim() || editPhilosophyTopic.trim() || editingTrack.topic,
        category: editFolderPath.split('/')[0] || 'Lectures',
        folderPath: editFolderPath.trim()
      })

      setEditingTrack(null)
      await loadData()
    } catch (e: any) {
      setJsonError(`Invalid JSON Dictionary format: ${e.message}`)
    }
  }

  const toggleFolderExpand = (folderPath: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = new Set(expandedFolders)
    if (next.has(folderPath)) {
      next.delete(folderPath)
    } else {
      next.add(folderPath)
    }
    setExpandedFolders(next)
  }

  const filteredTracks = tracks.filter((t) => {
    const trackFolder = t.folderPath || t.category || 'Lectures'
    const matchesFolder = !selectedFolder || trackFolder === selectedFolder || trackFolder.startsWith(selectedFolder + '/')

    // Category / Scripture chip filter
    const meta = t.metadata || {}
    let matchesCategory = true
    if (activeScriptureFilter !== 'All') {
      const scr = (meta.scripture || t.category || '').toLowerCase()
      const fest = (meta.festival || '').toLowerCase()
      const topic = (t.topic || meta.philosophyTopic || '').toLowerCase()

      if (activeScriptureFilter === 'Srimad Bhagavatam') {
        matchesCategory = scr.includes('bhagavatam') || (meta.canto !== undefined && meta.canto !== '')
      } else if (activeScriptureFilter === 'Bhagavad Gita') {
        matchesCategory = scr.includes('gita')
      } else if (activeScriptureFilter === 'Chaitanya Charitamrita') {
        matchesCategory = scr.includes('chaitanya') || scr.includes('charitamrita')
      } else if (activeScriptureFilter === 'Festivals') {
        matchesCategory = !!meta.festival || fest.includes('jayanti') || fest.includes('festival') || topic.includes('jayanti') || topic.includes('festival')
      } else if (activeScriptureFilter === 'Q&A') {
        matchesCategory = topic.includes('q&a') || topic.includes('question') || t.title.toLowerCase().includes('q&a')
      }

    }

    const query = searchQuery.toLowerCase().trim()
    if (!query) return matchesFolder && matchesCategory

    // Deep multi-field full-text search
    const matchesSearch =
      t.title.toLowerCase().includes(query) ||
      (meta.titleHindi && meta.titleHindi.toLowerCase().includes(query)) ||
      (meta.subtitle && meta.subtitle.toLowerCase().includes(query)) ||
      t.speaker.toLowerCase().includes(query) ||
      (meta.coSpeakers && meta.coSpeakers.some((s) => s.toLowerCase().includes(query))) ||
      (t.topic && t.topic.toLowerCase().includes(query)) ||
      (meta.philosophyTopic && meta.philosophyTopic.toLowerCase().includes(query)) ||
      (meta.verse && meta.verse.toLowerCase().includes(query)) ||
      (meta.scripture && meta.scripture.toLowerCase().includes(query)) ||
      (meta.canto && meta.canto.toLowerCase().includes(query)) ||
      (meta.chapter && meta.chapter.toLowerCase().includes(query)) ||
      (meta.festival && meta.festival.toLowerCase().includes(query)) ||
      (meta.location && meta.location.toLowerCase().includes(query)) ||
      (meta.event && meta.event.toLowerCase().includes(query)) ||
      (meta.description && meta.description.toLowerCase().includes(query)) ||
      (meta.synopsis && meta.synopsis.toLowerCase().includes(query)) ||
      (meta.keyVersesCited && meta.keyVersesCited.some((v) => v.toLowerCase().includes(query))) ||
      (meta.keyTakeaways && meta.keyTakeaways.some((k) => k.toLowerCase().includes(query))) ||
      (meta.tags && meta.tags.some((tag) => tag.toLowerCase().includes(query))) ||
      (t.folderPath && t.folderPath.toLowerCase().includes(query))

    return matchesSearch && matchesFolder && matchesCategory
  })


  // Build Hierarchical Folder Tree Structure
  const rootFolders = folders.filter((f) => !f.path.includes('/'))
  const subFolders = folders.filter((f) => f.path.includes('/'))

  return (
    <div className="h-full flex flex-col justify-between overflow-hidden bg-[#0f1117]">
      {/* Audio Engine */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (!audioRef.current || currentTrackIndex === null) return
          const track = tracks[currentTrackIndex]
          if (!track) return

          const { start, end, duration: trackDur } = getTrackBounds(track)
          const rawCurrent = audioRef.current.currentTime

          // Check if reached tagged end point
          if (end > start && rawCurrent >= end) {
            handleTrackEnded()
            return
          }

          // Calculate relative clip current time (0 to trackDur)
          const relCurrent = Math.max(0, rawCurrent - start)
          setCurrentTime(relCurrent)

          if (trackDur > 0) {
            setDuration(trackDur)
          }
        }}
        onLoadedMetadata={() => {
          if (!audioRef.current || currentTrackIndex === null) return
          const track = tracks[currentTrackIndex]
          const { start, duration: trackDur } = getTrackBounds(track)
          if (start > 0) {
            audioRef.current.currentTime = start
          }
          setDuration(trackDur > 0 ? trackDur : audioRef.current.duration)
        }}
        onEnded={handleTrackEnded}
      />


      {/* Top Header Toolbar */}
      <div className="px-6 py-4 border-b border-[#2b3144] bg-[#161922]/70 backdrop-blur flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-base font-bold text-gray-100 flex items-center gap-2">
            <Headphones className="w-5 h-5 text-indigo-400" />
            Dr. Laxmidhar Behera’s Sacred Audio Archive
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              {tracks.length} Discourses ({folders.length} Folders)
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Preserved spiritual discourses by Dr. Laxmidhar Behera with hierarchical subfolders, precision trimming, and Cloudflare R2 sync.
          </p>

        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setParentFolderChoice('')
              setShowNewFolderModal(true)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1f2330] hover:bg-[#282d3e] text-gray-200 text-xs font-semibold rounded-lg border border-[#2b3144] transition shadow-sm"
          >
            <FolderPlus className="w-4 h-4 text-indigo-400" />
            New Subfolder
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <DownloadCloud className="w-4 h-4" />
            Import Clip
          </button>
        </div>
      </div>

      {/* Main Split Content: Folder Tree Sidebar + Tracks Table */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Hierarchical Subfolder Tree Navigation Sidebar */}
        <div className="w-72 border-r border-[#2b3144] bg-[#12141c] p-4 flex flex-col justify-between shrink-0 overflow-y-auto space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-gray-300 px-1">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                Folder Hierarchy
              </span>
              <button
                onClick={() => {
                  setParentFolderChoice('')
                  setShowNewFolderModal(true)
                }}
                className="text-gray-400 hover:text-indigo-400 p-1 rounded hover:bg-[#1f2330]"
                title="Create New Folder / Subfolder"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              {/* All Tracks Root Option */}
              <button
                onClick={() => setSelectedFolder(null)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                  selectedFolder === null
                    ? 'bg-indigo-600 text-white shadow-md font-semibold'
                    : 'text-gray-300 hover:bg-[#1f2330] hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <ListMusic className="w-4 h-4 shrink-0" />
                  All Discourses
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
                  {tracks.length}
                </span>
              </button>

              {/* Hierarchical Folder Tree */}
              {rootFolders.map((root) => {
                const childSubfolders = subFolders.filter((s) => s.path.startsWith(root.path + '/'))
                const hasChildren = childSubfolders.length > 0
                const isExpanded = expandedFolders.has(root.path)
                const isSelected = selectedFolder === root.path
                const count = tracks.filter((t) => {
                  const p = t.folderPath || t.category || 'Lectures'
                  return p === root.path || p.startsWith(root.path + '/')
                }).length

                return (
                  <div key={root.id} className="space-y-0.5">
                    {/* Root Folder Row */}
                    <div
                      className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'text-gray-300 hover:bg-[#1f2330] hover:text-white'
                      }`}
                      onClick={() => setSelectedFolder(isSelected ? null : root.path)}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {hasChildren ? (
                          <button
                            type="button"
                            onClick={(e) => toggleFolderExpand(root.path, e)}
                            className="p-0.5 hover:bg-black/20 rounded text-gray-400 hover:text-white"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-indigo-300" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        ) : (
                          <div className="w-3.5" />
                        )}
                        <Folder className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="truncate">{root.name}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Inline Add Subfolder Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setParentFolderChoice(root.path)
                            setShowNewFolderModal(true)
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/30 rounded text-indigo-300 hover:text-white transition"
                          title={`Create subfolder inside ${root.name}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
                          {count}
                        </span>
                      </div>
                    </div>

                    {/* Subfolders List (when expanded) */}
                    {hasChildren && isExpanded && (
                      <div className="pl-6 space-y-0.5 border-l border-[#2b3144] ml-3.5 my-1">
                        {childSubfolders.map((sub) => {
                          const isSubSelected = selectedFolder === sub.path
                          const subCount = tracks.filter(
                            (t) => (t.folderPath || t.category || 'Lectures') === sub.path
                          ).length
                          const displayName = sub.path.replace(`${root.path}/`, '')

                          return (
                            <div
                              key={sub.id}
                              className={`group flex items-center justify-between px-2 py-1 rounded-md text-xs transition cursor-pointer ${
                                isSubSelected
                                  ? 'bg-indigo-600/40 text-indigo-200 font-semibold border border-indigo-500/40'
                                  : 'text-gray-400 hover:bg-[#1f2330] hover:text-gray-200'
                              }`}
                              onClick={() => setSelectedFolder(isSubSelected ? null : sub.path)}
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <FolderOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span className="truncate">{displayName}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteFolder(sub.path, e)}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-400 transition"
                                  title="Delete Subfolder"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                                <span className="text-[9px] px-1 py-0.2 rounded bg-black/30 font-mono">
                                  {subCount}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="p-3 bg-[#161922] border border-[#2b3144] rounded-xl text-[11px] text-gray-400 space-y-1.5">
            <span className="font-semibold text-gray-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Ultra-Compact Storage
            </span>
            <p>Discourses encode at <b className="text-gray-200">24 kbps / 22.05 kHz Mono Voice HD</b> (~10 MB/hr) with ID3 scripture tags.</p>
          </div>
        </div>

        {/* Right Track Arranger Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-5xl mx-auto w-full">
          {/* Breadcrumb & Search Bar */}
          <div className="bg-[#161922] border border-[#2b3144] p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
              <span className="text-gray-500">Path:</span>
              <button
                onClick={() => setSelectedFolder(null)}
                className="hover:text-indigo-400 transition"
              >
                Archive
              </button>
              {selectedFolder && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                  <span className="px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                    {selectedFolder}
                  </span>
                </>
              )}
              <span className="text-gray-500">({filteredTracks.length} items)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCloudSync}
                disabled={isSyncingCloud}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                title="Synchronize with Cloudflare R2"
              >
                <Cloud className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin text-indigo-400' : ''}`} />
                {isSyncingCloud ? 'Syncing...' : 'Sync Cloud'}
              </button>

              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search verse, festival, topic, title, citations, takeaways..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Quick Filter Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {[
              { id: 'All', label: 'All Discourses', icon: '📜' },
              { id: 'Srimad Bhagavatam', label: 'Srimad Bhagavatam', icon: '📖' },
              { id: 'Bhagavad Gita', label: 'Bhagavad Gita', icon: '🪔' },
              { id: 'Chaitanya Charitamrita', label: 'Caitanya Caritamrta', icon: '✨' },
              { id: 'Festivals', label: 'Festivals & Jayantis', icon: '🌺' },
              { id: 'Q&A', label: 'Questions & Answers', icon: '❓' }
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setActiveScriptureFilter(chip.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition flex items-center gap-1.5 ${
                  activeScriptureFilter === chip.id
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-[#161922] text-gray-400 hover:text-white border border-[#2b3144] hover:border-gray-600'
                }`}
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
              </button>
            ))}
          </div>

          {cloudSyncMessage && (
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-center gap-2 animate-fadeIn">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>{cloudSyncMessage}</span>
            </div>
          )}



          {/* Tracks Table */}
          {isLoading ? (
            <div className="p-8 text-center text-xs text-gray-400 bg-[#161922] border border-[#2b3144] rounded-xl">
              Loading sacred audio discourses...
            </div>
          ) : filteredTracks.length === 0 ? (
            <div className="p-12 text-center bg-[#161922] border border-[#2b3144] rounded-xl space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
                <Folder className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-200">
                  {tracks.length === 0
                    ? 'No Discourses in Vault'
                    : `No Discourses in folder "${selectedFolder || 'All'}"`}
                </p>
                <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                  Import clips from the downloader trimmer, or crop existing master discourses into this subfolder.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredTracks.map((track) => {
                const actualIndex = tracks.findIndex((t) => t.id === track.id)
                const isThisPlaying = currentTrackIndex === actualIndex && isPlaying
                const meta = track.metadata || {}

                return (
                  <div
                    key={track.id}
                    onClick={() => playTrack(actualIndex)}
                    className={`p-4 bg-[#161922] border rounded-xl transition flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer group ${
                      currentTrackIndex === actualIndex
                        ? 'border-indigo-500 bg-[#191d2c] shadow-lg shadow-indigo-500/5'
                        : 'border-[#2b3144] hover:border-[#3d4560] hover:bg-[#181c26]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Sequence Number & Up/Down Arrange Controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={(e) => moveTrack(actualIndex, 'up', e)}
                            disabled={actualIndex === 0}
                            className="p-1 hover:bg-[#2b3144] rounded text-gray-400 hover:text-white disabled:opacity-20 transition"
                            title="Move Up in Sequence"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => moveTrack(actualIndex, 'down', e)}
                            disabled={actualIndex === tracks.length - 1}
                            className="p-1 hover:bg-[#2b3144] rounded text-gray-400 hover:text-white disabled:opacity-20 transition"
                            title="Move Down in Sequence"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="w-7 h-7 rounded-lg bg-[#0f1117] border border-[#2b3144] flex items-center justify-center font-mono font-bold text-xs text-indigo-400">
                          #{actualIndex + 1}
                        </div>
                      </div>

                      {/* Play Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (currentTrackIndex === actualIndex) {
                            togglePlayPause()
                          } else {
                            playTrack(actualIndex)
                          }
                        }}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition ${
                          isThisPlaying
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-[#1f2330] group-hover:bg-indigo-600/30 text-indigo-400'
                        }`}
                      >
                        {isThisPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </button>

                      {/* Track Details & Deep Metadata Badges */}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={`text-xs font-bold truncate ${
                              currentTrackIndex === actualIndex ? 'text-indigo-300' : 'text-gray-100'
                            }`}
                          >
                            {track.title}
                          </p>

                          {/* Scripture / Verse Badge */}
                          {(meta.verse || meta.scripture) && (
                            <span className="text-[10px] px-2 py-0.2 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono font-semibold flex items-center gap-1 shrink-0">
                              <BookOpen className="w-2.5 h-2.5" />
                              {meta.verse || meta.scripture}
                            </span>
                          )}

                          {/* Subfolder Badge */}
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#0f1117] text-indigo-300 border border-indigo-500/20 flex items-center gap-1 shrink-0 font-mono">
                            <Folder className="w-2.5 h-2.5" />
                            {track.folderPath || track.category || 'Lectures'}
                          </span>
                        </div>

                        {/* Secondary Metadata Info Row */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
                          <span className="flex items-center gap-1 text-gray-300">
                            <User className="w-3 h-3 text-indigo-400" />
                            {track.speaker || 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)'}
                          </span>

                          <span className="font-mono text-indigo-400 font-semibold">
                            {formatDuration(getTrackBounds(track).duration)}
                          </span>

                          {track.fileSize && track.fileSize > 0 && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                              💾 {(track.fileSize / 1024 / 1024).toFixed(1)} MB
                            </span>
                          )}

                          {meta.festival && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1">
                              🪔 {meta.festival}
                            </span>
                          )}

                          {meta.location && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5" />
                              {meta.location}
                            </span>
                          )}

                          {(meta.dateRecorded || meta.date) && (
                            <span className="text-[10px] text-gray-500 flex items-center gap-1 font-mono">
                              <Calendar className="w-2.5 h-2.5" />
                              {meta.dateRecorded || meta.date}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#2b3144]">
                      {/* In-Vault Precision Trimmer Button */}
                      <button
                        onClick={(e) => openTrimmerModal(track, e)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-500/30 transition"
                        title="Crop / Segment this Track"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        Crop
                      </button>

                      {/* Move to Folder */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setMovingTrackId(movingTrackId === track.id ? null : track.id)
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#0f1117] hover:bg-[#1f2330] text-gray-300 text-xs rounded-lg border border-[#2b3144] transition"
                          title="Move to Folder"
                        >
                          <FolderInput className="w-3.5 h-3.5 text-indigo-400" />
                          Move
                        </button>

                        {/* Move Dropdown Menu */}
                        {movingTrackId === track.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-9 w-52 bg-[#161922] border border-[#2b3144] rounded-xl shadow-2xl z-40 p-1.5 space-y-1 animate-fadeIn max-h-60 overflow-y-auto"
                          >
                            <p className="text-[10px] text-gray-500 font-semibold px-2 py-1 uppercase">Move to Subfolder</p>
                            {folders.map((f) => (
                              <button
                                key={f.id}
                                onClick={() => handleMoveToFolder(track.id, f.path)}
                                className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                                  (track.folderPath || track.category) === f.path
                                    ? 'bg-indigo-600 text-white font-semibold'
                                    : 'text-gray-300 hover:bg-[#1f2330]'
                                }`}
                              >
                                <span className="truncate font-mono text-[11px]">
                                  {f.path.includes('/') ? `↳ ${f.path}` : `📁 ${f.path}`}
                                </span>
                                {(track.folderPath || track.category) === f.path && (
                                  <Check className="w-3 h-3 text-white shrink-0" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Cloud Sync Status / Upload Action */}
                      {track.r2Key ? (
                        <button
                          type="button"
                          onClick={(e) => handleDownloadTrackOffline(track.id, e)}
                          className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 transition"
                          title={`Synced on Cloudflare R2 (${track.r2Key}). Click to force download.`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleUploadSingleTrackToCloud(track.id, e)}
                          className="p-1.5 bg-[#0f1117] hover:bg-[#1f2330] text-indigo-400 rounded-lg border border-[#2b3144] transition"
                          title="Upload to Cloudflare R2"
                        >
                          <CloudUpload className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Compact Voice Optimization */}
                      {track.filePath && (
                        <button
                          type="button"
                          onClick={(e) => handleCompressTrack(track.id, e)}
                          disabled={compressingTrackId === track.id}
                          className="p-1.5 bg-[#0f1117] hover:bg-[#1f2330] text-amber-400 rounded-lg border border-[#2b3144] transition disabled:opacity-50"
                          title="Compress to 24kbps voice HD"
                        >
                          <Zap className={`w-3.5 h-3.5 ${compressingTrackId === track.id ? 'animate-spin text-amber-400' : ''}`} />
                        </button>
                      )}

                      {/* Metadata Dict Inspector */}
                      <button
                        onClick={(e) => openMetadataEditor(track, e)}
                        className="p-1.5 bg-[#0f1117] hover:bg-[#1f2330] text-gray-300 rounded-lg border border-[#2b3144] transition"
                        title="Edit Full Metadata Dictionary"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                      </button>

                      {/* Delete Track */}
                      <button
                        onClick={(e) => handleDeleteTrack(track.id, e)}
                        className="p-1.5 bg-[#0f1117] hover:bg-rose-500/20 text-gray-400 hover:text-rose-300 rounded-lg border border-[#2b3144] hover:border-rose-500/30 transition"
                        title="Remove Track"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>


      {/* Bottom Sticky Continuous Player Bar */}
      <div className="border-t border-[#2b3144] bg-[#161922] p-4 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 shadow-2xl">
        {/* Left: Track Info */}
        <div className="flex items-center gap-3 w-full md:w-1/4 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-[#0f1117] border border-[#2b3144] flex items-center justify-center text-indigo-400 shrink-0">
            <Music className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-gray-100 truncate">
              {currentTrack ? currentTrack.title : 'No Discourse Selected'}
            </p>
            <p className="text-[11px] text-gray-400 truncate">
              {currentTrack
                ? `${currentTrack.speaker || 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)'} • ${currentTrack.folderPath || 'Lectures'}`
                : 'Select a discourse from above to play in sequence'}
            </p>
          </div>
        </div>

        {/* Center: Playback Controls & Progress Bar */}
        <div className="flex flex-col items-center gap-1.5 w-full md:w-2/4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsShuffle(!isShuffle)}
              className={`p-1.5 rounded transition ${
                isShuffle ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-400 hover:text-white'
              }`}
              title="Shuffle Mode"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={playPrevTrack}
              disabled={tracks.length === 0}
              className="p-1.5 rounded text-gray-300 hover:text-white hover:bg-[#1f2330] transition disabled:opacity-30"
              title="Previous Discourse"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlayPause}
              disabled={tracks.length === 0}
              className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition"
              title="Play / Pause"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>

            <button
              onClick={playNextTrack}
              disabled={tracks.length === 0}
              className="p-1.5 rounded text-gray-300 hover:text-white hover:bg-[#1f2330] transition disabled:opacity-30"
              title="Next Discourse"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsRepeat(!isRepeat)}
              className={`p-1.5 rounded transition ${
                isRepeat ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-400 hover:text-white'
              }`}
              title="Repeat Single Discourse"
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-full flex items-center gap-2.5 text-[10px] font-mono text-gray-400">
            <span>{formatDuration(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={(e) => {
                const relVal = parseFloat(e.target.value)
                setCurrentTime(relVal)
                if (audioRef.current && currentTrack) {
                  const { start } = getTrackBounds(currentTrack)
                  audioRef.current.currentTime = start + relVal
                }
              }}
              className="flex-1 accent-indigo-500 h-1.5 bg-gray-700 rounded cursor-pointer"
            />
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Right: Auto-Next & Volume */}
        <div className="flex items-center justify-end gap-3 w-full md:w-1/4">
          <label className="flex items-center gap-1.5 text-[11px] text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoPlayNext}
              onChange={(e) => setAutoPlayNext(e.target.checked)}
              className="accent-indigo-500 rounded"
            />
            Auto-Next
          </label>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.muted = !isMuted
                  setIsMuted(!isMuted)
                }
              }}
              className="text-gray-400 hover:text-white"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const val = parseFloat(e.target.value)
                setVolume(val)
                setIsMuted(false)
                if (audioRef.current) {
                  audioRef.current.volume = val
                  audioRef.current.muted = false
                }
              }}
              className="w-16 accent-indigo-500 h-1 bg-gray-700 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* New Subfolder Creation Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateFolder}
            className="bg-[#161922] border border-[#2b3144] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleIn p-6 space-y-4"
          >
            <div className="flex items-center gap-2 border-b border-[#2b3144] pb-3">
              <FolderPlus className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-gray-100">Create New Collection / Subfolder</h3>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Parent Folder Location</label>
              <select
                value={parentFolderChoice}
                onChange={(e) => setParentFolderChoice(e.target.value)}
                className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="">📁 [Top Level Root]</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.path}>
                    📂 {f.path}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Subfolder Name</label>
              <input
                type="text"
                placeholder="e.g. Canto 10 or 2026 Seminars"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-indigo-500 font-mono"
                autoFocus
              />
              {parentFolderChoice && (
                <p className="text-[11px] text-gray-400 font-mono">
                  Full Path: <span className="text-indigo-300">{parentFolderChoice}/{newFolderName || '...'}</span>
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#2b3144]">
              <button
                type="button"
                onClick={() => setShowNewFolderModal(false)}
                className="px-4 py-2 rounded-lg border border-[#2b3144] text-xs font-semibold text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
              >
                Create Subfolder
              </button>
            </div>
          </form>
        </div>
      )}

      {/* In-Vault Precision Trimmer Modal */}
      {trimmingTrack && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161922] border border-[#2b3144] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-scaleIn p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2b3144] pb-3">
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-gray-100">Precision Trimmer / Discourse Extractor</h3>
              </div>
              <button
                onClick={() => setTrimmingTrack(null)}
                className="text-gray-400 hover:text-white font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Crop a specific segment from <b className="text-gray-200">{trimmingTrack.title}</b> into a standalone 24 kbps voice discourse.
            </p>

            {/* Time range inputs */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-[#0f1117] rounded-xl border border-[#2b3144]">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-gray-300">Start Time (mm:ss.ms)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setTrimStart(currentTime)
                      setTrimStartInput(formatTimeWithMs(currentTime))
                    }}
                    className="text-[10px] text-indigo-400 hover:underline"
                  >
                    Use Playhead ({formatDuration(currentTime)})
                  </button>
                </div>
                <input
                  type="text"
                  value={trimStartInput}
                  onChange={(e) => {
                    setTrimStartInput(e.target.value)
                    setTrimStart(parseTimeToSeconds(e.target.value))
                  }}
                  className="w-full bg-[#161922] border border-[#2b3144] rounded-lg px-3 py-1.5 text-xs text-gray-100 font-mono"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-gray-300">End Time (mm:ss.ms)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setTrimEnd(currentTime)
                      setTrimEndInput(formatTimeWithMs(currentTime))
                    }}
                    className="text-[10px] text-indigo-400 hover:underline"
                  >
                    Use Playhead ({formatDuration(currentTime)})
                  </button>
                </div>
                <input
                  type="text"
                  value={trimEndInput}
                  onChange={(e) => {
                    setTrimEndInput(e.target.value)
                    setTrimEnd(parseTimeToSeconds(e.target.value))
                  }}
                  className="w-full bg-[#161922] border border-[#2b3144] rounded-lg px-3 py-1.5 text-xs text-gray-100 font-mono"
                />
              </div>
            </div>

            {/* Segment info */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-300">Clip Title</label>
                <input
                  type="text"
                  value={trimTitle}
                  onChange={(e) => setTrimTitle(e.target.value)}
                  className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-300">Scripture / Topic</label>
                  <select
                    value={trimScripture}
                    onChange={(e) => setTrimScripture(e.target.value)}
                    className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100"
                  >
                    <option value="Srimad Bhagavatam">Srimad Bhagavatam</option>
                    <option value="Bhagavad Gita">Bhagavad Gita</option>
                    <option value="Chaitanya Charitamrita">Chaitanya Charitamrita</option>
                    <option value="Special Seminars">Special Seminars</option>
                    <option value="Q&A Session">Q&A Session</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-300">Verse Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. SB 10.2.13"
                    value={trimVerse}
                    onChange={(e) => setTrimVerse(e.target.value)}
                    className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-300">Destination Subfolder</label>
                <select
                  value={trimFolder}
                  onChange={(e) => setTrimFolder(e.target.value)}
                  className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100 font-mono"
                >
                  {folders.map((f) => (
                    <option key={f.id} value={f.path}>
                      📂 {f.path}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#2b3144]">
              <button
                type="button"
                onClick={() => setTrimmingTrack(null)}
                className="px-4 py-2 rounded-lg border border-[#2b3144] text-xs font-semibold text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteInVaultCrop}
                disabled={isTrimming || trimStart >= trimEnd}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Scissors className="w-4 h-4" />
                {isTrimming ? 'Trimming Audio...' : `Trim & Save Clip (${formatDuration(Math.max(0, trimEnd - trimStart))})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Multi-Tab Metadata Inspector & Editor Modal */}
      {editingTrack && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161922] border border-[#2b3144] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleIn">
            <div className="px-6 py-4 border-b border-[#2b3144] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-gray-100">
                  Comprehensive Discourse Metadata & Subfolder Inspector
                </h3>
              </div>
              <button
                onClick={() => setEditingTrack(null)}
                className="text-gray-400 hover:text-white font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Tabs Bar */}
            <div className="flex items-center gap-1 px-6 pt-3 border-b border-[#2b3144] bg-[#12141c] overflow-x-auto text-xs">
              <button
                onClick={() => setActiveEditTab('discourse')}
                className={`px-3 py-2 border-b-2 font-medium transition whitespace-nowrap ${
                  activeEditTab === 'discourse'
                    ? 'border-indigo-500 text-indigo-300 font-semibold'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                📜 Scripture & Title
              </button>
              <button
                onClick={() => setActiveEditTab('occasion')}
                className={`px-3 py-2 border-b-2 font-medium transition whitespace-nowrap ${
                  activeEditTab === 'occasion'
                    ? 'border-indigo-500 text-indigo-300 font-semibold'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                🏛️ Occasion & Place
              </button>
              <button
                onClick={() => setActiveEditTab('summary')}
                className={`px-3 py-2 border-b-2 font-medium transition whitespace-nowrap ${
                  activeEditTab === 'summary'
                    ? 'border-indigo-500 text-indigo-300 font-semibold'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                📝 Synopsis & Citations
              </button>
              <button
                onClick={() => setActiveEditTab('folder')}
                className={`px-3 py-2 border-b-2 font-medium transition whitespace-nowrap ${
                  activeEditTab === 'folder'
                    ? 'border-indigo-500 text-indigo-300 font-semibold'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                📁 Subfolder & Tags
              </button>
              <button
                onClick={() => setActiveEditTab('json')}
                className={`px-3 py-2 border-b-2 font-medium transition whitespace-nowrap ${
                  activeEditTab === 'json'
                    ? 'border-indigo-500 text-indigo-300 font-semibold'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                💻 Raw JSON
              </button>
              <button
                onClick={() => setActiveEditTab('tech')}
                className={`px-3 py-2 border-b-2 font-medium transition whitespace-nowrap ${
                  activeEditTab === 'tech'
                    ? 'border-indigo-500 text-indigo-300 font-semibold'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                🎧 Tech Audio Specs
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Tab 1: Scripture & Title */}
              {activeEditTab === 'discourse' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-300">Discourse Title (English / Standard)</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-300">Title in Hindi / Devanagari (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. श्री बलराम जयंती विशेष"
                        value={editTitleHindi}
                        onChange={(e) => setEditTitleHindi(e.target.value)}
                        className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-300">Speaker / Teacher</label>
                      <input
                        type="text"
                        value={editSpeaker}
                        onChange={(e) => setEditSpeaker(e.target.value)}
                        className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-300">Primary Scripture</label>
                      <select
                        value={editScripture}
                        onChange={(e) => setEditScripture(e.target.value)}
                        className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Srimad Bhagavatam">Srimad Bhagavatam</option>
                        <option value="Bhagavad Gita">Bhagavad Gita</option>
                        <option value="Chaitanya Charitamrita">Chaitanya Charitamrita</option>
                        <option value="Bhakti Rasamrita Sindhu">Bhakti Rasamrita Sindhu</option>
                        <option value="Upanishads">Upanishads</option>
                        <option value="Special Seminars">Special Seminars</option>
                        <option value="Q&A Sessions">Q&A Sessions</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-300">Canto / Chapter</label>
                      <input
                        type="text"
                        placeholder="e.g. Canto 10, Ch 2"
                        value={editCanto}
                        onChange={(e) => setEditCanto(e.target.value)}
                        className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-300">Verse Number</label>
                      <input
                        type="text"
                        placeholder="e.g. SB 10.2.13"
                        value={editVerse}
                        onChange={(e) => setEditVerse(e.target.value)}
                        className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-300">Philosophy Topic</label>
                      <input
                        type="text"
                        placeholder="e.g. Guru-Tattva, Sambandha Jnana"
                        value={editPhilosophyTopic}
                        onChange={(e) => setEditPhilosophyTopic(e.target.value)}
                        className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-300">Primary Language</label>
                      <select
                        value={editLanguage}
                        onChange={(e) => setEditLanguage(e.target.value)}
                        className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Hindi">Hindi</option>
                        <option value="English">English</option>
                        <option value="Odia">Odia</option>
                        <option value="Bengali">Bengali</option>
                        <option value="Bilingual">Bilingual (Hindi + English)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Occasion & Place */}
              {activeEditTab === 'occasion' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-300">Festival / Vaisnava Tithi</label>
                      <input
                        type="text"
                        placeholder="e.g. Balaram Jayanti, Janmashtami, Gaura Purnima"
                        value={editFestival}
                        onChange={(e) => setEditFestival(e.target.value)}
                        className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-300">Recording Date (YYYY-MM-DD)</label>
                      <input
                        type="date"
                        value={editDateRecorded}
                        onChange={(e) => setEditDateRecorded(e.target.value)}
                        className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-300">Location / Temple / City</label>
                      <input
                        type="text"
                        placeholder="e.g. Bhubaneswar ISKCON, Vrindavan"
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                        className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-300">Program / Event Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Morning Bhagavatam Class, Intensive Retreat"
                        value={editEvent}
                        onChange={(e) => setEditEvent(e.target.value)}
                        className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Synopsis & Citations */}
              {activeEditTab === 'summary' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-300">Discourse Synopsis / Summary</label>
                    <textarea
                      rows={4}
                      placeholder="Detailed overview of the teachings, stories, and philosophical points discussed..."
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg p-3 text-xs text-gray-100 focus:outline-none focus:border-indigo-500 leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-300">Key Verses Cited (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. BG 4.34, SB 1.2.6, CC Adi 1.1"
                      value={editKeyVersesCited}
                      onChange={(e) => setEditKeyVersesCited(e.target.value)}
                      className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-300">Key Takeaways / Instructions (one per line)</label>
                    <textarea
                      rows={3}
                      placeholder="e.g.&#10;1. Service to Guru is the key to spiritual realization&#10;2. Balaram represents spiritual strength"
                      value={editKeyTakeaways}
                      onChange={(e) => setEditKeyTakeaways(e.target.value)}
                      className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg p-3 text-xs text-gray-100 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* Tab 4: Subfolder & Tags */}
              {activeEditTab === 'folder' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-300">Assigned Subfolder Location</label>
                    <select
                      value={editFolderPath}
                      onChange={(e) => setEditFolderPath(e.target.value)}
                      className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-indigo-500 font-mono"
                    >
                      {folders.map((f) => (
                        <option key={f.id} value={f.path}>
                          📂 {f.path}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-indigo-400" />
                      Discourse Tags
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add tag and press Enter"
                        value={editTagInput}
                        onChange={(e) => setEditTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && editTagInput.trim()) {
                            e.preventDefault()
                            if (!editTags.includes(editTagInput.trim())) {
                              setEditTags([...editTags, editTagInput.trim()])
                            }
                            setEditTagInput('')
                          }
                        }}
                        className="flex-1 bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-1.5 text-xs text-gray-100"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {editTags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-md bg-[#0f1117] text-indigo-300 border border-indigo-500/20 text-xs flex items-center gap-1"
                        >
                          #{t}
                          <button
                            type="button"
                            onClick={() => setEditTags(editTags.filter((tag) => tag !== t))}
                            className="text-gray-500 hover:text-rose-400 ml-1 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Raw JSON */}
              {activeEditTab === 'json' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Direct Dictionary JSON (Agent & Developer Access):</span>
                    <span className="text-[10px] font-mono text-indigo-400">behera_repo.json</span>
                  </div>
                  <textarea
                    rows={12}
                    value={jsonDictText}
                    onChange={(e) => {
                      setJsonDictText(e.target.value)
                      setJsonError(null)
                    }}
                    className="w-full bg-[#0f1117] border border-[#2b3144] rounded-xl p-3 font-mono text-xs text-emerald-400 focus:outline-none focus:border-indigo-500"
                  />
                  {jsonError && (
                    <p className="text-xs text-rose-400 font-medium">{jsonError}</p>
                  )}
                </div>
              )}

              {/* Tab 6: Audio & Technical Specs */}
              {activeEditTab === 'tech' && (
                <div className="space-y-2 text-xs font-mono text-gray-300">
                  <div className="p-3 bg-[#0f1117] border border-[#2b3144] rounded-xl space-y-2">
                    <p className="text-xs font-bold text-indigo-300">Audio Profile & Cloud Spec</p>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 bg-[#161922] rounded border border-[#2b3144]">
                        <span className="text-gray-500">Bitrate:</span> 24 kbps Voice HD
                      </div>
                      <div className="p-2 bg-[#161922] rounded border border-[#2b3144]">
                        <span className="text-gray-500">Sample Rate:</span> 22,050 Hz Mono
                      </div>
                      <div className="p-2 bg-[#161922] rounded border border-[#2b3144]">
                        <span className="text-gray-500">File Size:</span> {editingTrack.fileSize ? `${(editingTrack.fileSize / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                      </div>
                      <div className="p-2 bg-[#161922] rounded border border-[#2b3144]">
                        <span className="text-gray-500">Duration:</span> {formatDuration(editingTrack.duration)}
                      </div>
                    </div>
                    <div className="p-2 bg-[#161922] rounded border border-[#2b3144] truncate text-[11px]">
                      <span className="text-gray-500">File Path:</span> {editingTrack.filePath || 'Stored in Cloud'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-[#2b3144] bg-[#0e1017] flex justify-end gap-2">
              <button
                onClick={() => setEditingTrack(null)}
                className="px-4 py-2 rounded-lg border border-[#2b3144] text-xs font-semibold text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMetadata}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md"
              >
                Save Metadata Dictionary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161922] border border-[#2b3144] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-scaleIn">
            <div className="px-5 py-4 border-b border-[#2b3144] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DownloadCloud className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-gray-100">
                  Import Audio Clip from Audio Repository
                </h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-white text-sm font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-2">
              {repoAudioClips.length === 0 ? (
                <div className="text-center p-8 text-xs text-gray-400">
                  No audio clips found in the main Audio Repository yet. Download or crop clips in
                  Module 1 first.
                </div>
              ) : (
                repoAudioClips.map((clip) => (
                  <div
                    key={clip.id}
                    className="p-3 bg-[#0f1117] border border-[#2b3144] rounded-xl flex items-center justify-between gap-3 hover:border-indigo-500/50 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-200 truncate">{clip.title}</p>
                      <p className="text-[11px] text-gray-400 font-mono">
                        {formatDuration(clip.duration)} • {clip.artist || 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleImportClip(clip.id)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Import
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BeheraRepoModule
