import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Play,
  Pause,
  Scissors,
  RotateCcw,
  Volume2,
  VolumeX,
  Clock,
  Tag,
  CheckCircle2,
  Loader2,
  Sparkles,
  BookmarkPlus,
  FastForward,
  Rewind,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ListMusic,
  ExternalLink
} from 'lucide-react'

import { AudioMetadata, CropOptions, VideoInfo, RepoFolder } from '../../../../../main/modules/types'
import { parseDiscourseFromTitle } from '../../../../../main/modules/metadataParser'


interface AudioWaveformTrimmerProps {
  tempFilePath: string
  videoInfo: VideoInfo
  onSavedToRepo: (savedItem: AudioMetadata) => void
  onCancel?: () => void
}

function formatTime(seconds: number): string {
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
  if (!timeStr || !timeStr.trim()) return 0
  const parts = timeStr.trim().split(':')
  if (parts.length === 2) {
    const mins = parseFloat(parts[0]) || 0
    const secs = parseFloat(parts[1]) || 0
    return mins * 60 + secs
  }
  if (parts.length === 3) {
    const hrs = parseFloat(parts[0]) || 0
    const mins = parseFloat(parts[1]) || 0
    const secs = parseFloat(parts[2]) || 0
    return hrs * 3600 + mins * 60 + secs
  }
  return parseFloat(timeStr) || 0
}

const AudioWaveformTrimmer: React.FC<AudioWaveformTrimmerProps> = ({
  tempFilePath,
  videoInfo,
  onSavedToRepo,
  onCancel
}) => {
  const parsed = parseDiscourseFromTitle(videoInfo.title || '', '', videoInfo.uploader)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const canvasContainerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)
  const [playSelectionOnly, setPlaySelectionOnly] = useState<boolean>(false)

  const [isLooping, setIsLooping] = useState<boolean>(false)
  const [volume, setVolume] = useState<number>(1)
  const [isMuted, setIsMuted] = useState<boolean>(false)

  // Zoom level (1x to 10x) & Viewport Offset
  const [zoom, setZoom] = useState<number>(1)
  const [viewportOffset, setViewportOffset] = useState<number>(0) // 0 to 1

  // Crop Range State
  const initialStart = videoInfo.initialStartTime || 0
  const [startTime, setStartTime] = useState<number>(initialStart)
  const [endTime, setEndTime] = useState<number>(0)
  const [startInput, setStartInput] = useState<string>(formatTime(initialStart))
  const [endInput, setEndInput] = useState<string>('00:00.00')

  // Dragging State: 'start' | 'end' | 'region' | null
  const [dragMode, setDragMode] = useState<'start' | 'end' | 'region' | null>(null)
  const dragStartXRef = useRef<number>(0)
  const dragInitialStartRef = useRef<number>(0)
  const dragInitialEndRef = useRef<number>(0)

  // Metadata Form State (Auto-populated with NLP intelligence)
  const [title, setTitle] = useState<string>(parsed.title || videoInfo.title || 'My Audio Clip')
  const [speaker, setSpeaker] = useState<string>(parsed.speaker || 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)')
  const [scripture, setScripture] = useState<string>(parsed.scripture || 'Srimad Bhagavatam')
  const [verse, setVerse] = useState<string>(parsed.verse || '')
  const [dateRecorded, setDateRecorded] = useState<string>(parsed.dateRecorded || new Date().toISOString().split('T')[0])
  const [location, setLocation] = useState<string>(parsed.location || '')
  const [festival, setFestival] = useState<string>(parsed.festival || '')
  const [description, setDescription] = useState<string>('')
  const [folderPath, setFolderPath] = useState<string>(parsed.suggestedFolderPath || 'Lectures')
  const [folders, setFolders] = useState<RepoFolder[]>([])
  const [showNewFolderInput, setShowNewFolderInput] = useState<boolean>(false)
  const [newSubfolderName, setNewSubfolderName] = useState<string>('')
  const [tagInput, setTagInput] = useState<string>('')
  const [tags, setTags] = useState<string[]>(parsed.metadata.tags || ['discourse', 'lila-purushottam-das', 'laxmidhar-behera'])
  const [format, setFormat] = useState<'opus' | 'mp3' | 'wav' | 'aac'>('mp3')
  const [enhanceAudio, setEnhanceAudio] = useState<boolean>(true)

  const handleReParseFromTitle = (titleToParse?: string) => {
    const p = parseDiscourseFromTitle(titleToParse || title, description, speaker)
    setTitle(p.title)
    setSpeaker(p.speaker)
    if (p.scripture) setScripture(p.scripture)
    if (p.verse) setVerse(p.verse)
    if (p.festival) setFestival(p.festival)
    if (p.dateRecorded) setDateRecorded(p.dateRecorded)
    if (p.location) setLocation(p.location)
    if (p.suggestedFolderPath) setFolderPath(p.suggestedFolderPath)
    if (p.metadata.tags) setTags(p.metadata.tags)
  }





  // Multi-clips session list
  const [sessionClips, setSessionClips] = useState<AudioMetadata[]>([])

  // Loading & Saving State
  const [isDecodingAudio, setIsDecodingAudio] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null)
  const [audioPeaks, setAudioPeaks] = useState<number[]>([])

  const mediaSrc = window.audioAPI.toMediaUrl(tempFilePath)

  // 1. Decode Audio Buffer to generate high-resolution audio waveform peaks
  useEffect(() => {
    let isCancelled = false
    setIsDecodingAudio(true)

    const loadPeaks = async () => {
      try {
        const response = await fetch(mediaSrc)
        const arrayBuffer = await response.arrayBuffer()
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)

        if (isCancelled) return

        const channelData = audioBuffer.getChannelData(0)
        const totalDuration = audioBuffer.duration
        setDuration(totalDuration)

        const validStart =
          videoInfo.initialStartTime && videoInfo.initialStartTime < totalDuration
            ? videoInfo.initialStartTime
            : 0

        setStartTime(validStart)
        setStartInput(formatTime(validStart))
        setEndTime(totalDuration)
        setEndInput(formatTime(totalDuration))

        if (validStart > 0) {
          setCurrentTime(validStart)
          if (audioRef.current) {
            audioRef.current.currentTime = validStart
          }
        }

        // Generate 300 waveform peak points
        const sampleCount = 300
        const blockSize = Math.floor(channelData.length / sampleCount)
        const peaks: number[] = []

        for (let i = 0; i < sampleCount; i++) {
          const start = i * blockSize
          let sum = 0
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[start + j] || 0)
          }
          peaks.push(sum / blockSize)
        }

        const maxPeak = Math.max(...peaks, 0.001)
        const normalized = peaks.map((p) => Math.max(0.12, p / maxPeak))

        setAudioPeaks(normalized)
        setIsDecodingAudio(false)
        audioCtx.close()
      } catch (err) {
        console.error('Failed to decode waveform peaks:', err)
        const fallback = Array.from({ length: 200 }, () => 0.2 + Math.random() * 0.6)
        setAudioPeaks(fallback)
        setIsDecodingAudio(false)
      }
    }

    loadPeaks()
    return () => {
      isCancelled = true
    }
  }, [mediaSrc])

  // 2. Responsive Canvas Drawing with Handles and Selection Region
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current
    const container = canvasContainerRef.current
    if (!canvas || !container || audioPeaks.length === 0 || duration === 0) return

    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const width = rect.width
    const height = 96

    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    // Compute visible time range based on zoom and viewportOffset
    const visibleDuration = duration / zoom
    const viewStartTime = viewportOffset * (duration - visibleDuration)

    const timeToX = (t: number) => {

      return ((t - viewStartTime) / visibleDuration) * width
    }

    const startX = timeToX(startTime)
    const endX = timeToX(endTime)
    const currentX = timeToX(currentTime)

    // Draw active crop region background
    const clampedStartX = Math.max(0, startX)
    const clampedEndX = Math.min(width, endX)
    if (clampedEndX > clampedStartX) {
      ctx.fillStyle = 'rgba(99, 102, 241, 0.22)'
      ctx.fillRect(clampedStartX, 0, clampedEndX - clampedStartX, height)
    }

    // Draw Waveform Bars
    const totalBars = audioPeaks.length
    const barWidth = (width * zoom) / totalBars
    const gap = Math.max(1, barWidth * 0.2)

    audioPeaks.forEach((peak, i) => {
      const barTime = (i / totalBars) * duration
      const x = timeToX(barTime)

      if (x + barWidth < 0 || x > width) return

      const barH = peak * (height - 18)
      const y = (height - barH) / 2

      const isInSelection = barTime >= startTime && barTime <= endTime
      const isPastPlayhead = barTime <= currentTime

      if (isInSelection) {
        ctx.fillStyle = isPastPlayhead ? '#818cf8' : '#6366f1'
      } else {
        ctx.fillStyle = isPastPlayhead ? '#4b5563' : '#2b3144'
      }

      ctx.beginPath()
      ctx.roundRect(x + gap / 2, y, Math.max(1.5, barWidth - gap), barH, 2)
      ctx.fill()
    })

    // Draw Selection Left Handle (Start)
    if (startX >= 0 && startX <= width) {
      ctx.strokeStyle = '#6366f1'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(startX, 0)
      ctx.lineTo(startX, height)
      ctx.stroke()

      // Handle Head
      ctx.fillStyle = '#6366f1'
      ctx.beginPath()
      ctx.roundRect(startX - 6, 2, 12, 18, 3)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(startX - 2, 6, 1.5, 10)
      ctx.fillRect(startX + 0.5, 6, 1.5, 10)
    }

    // Draw Selection Right Handle (End)
    if (endX >= 0 && endX <= width) {
      ctx.strokeStyle = '#6366f1'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(endX, 0)
      ctx.lineTo(endX, height)
      ctx.stroke()

      // Handle Head
      ctx.fillStyle = '#6366f1'
      ctx.beginPath()
      ctx.roundRect(endX - 6, height - 20, 12, 18, 3)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(endX - 2, height - 16, 1.5, 10)
      ctx.fillRect(endX + 0.5, height - 16, 1.5, 10)
    }

    // Draw Playhead
    if (currentX >= 0 && currentX <= width) {
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(currentX, 0)
      ctx.lineTo(currentX, height)
      ctx.stroke()

      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(currentX, 6, 5, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [audioPeaks, duration, startTime, endTime, currentTime, zoom, viewportOffset])

  useEffect(() => {
    drawWaveform()
  }, [drawWaveform])

  // ResizeObserver to ensure responsiveness on window resizing
  useEffect(() => {
    const container = canvasContainerRef.current
    if (!container) return

    const ro = new ResizeObserver(() => {
      drawWaveform()
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [drawWaveform])

  // Coordinate Mapping: Canvas X -> Audio Timestamp
  const xToTime = useCallback(
    (clientX: number): number => {
      const container = canvasContainerRef.current
      if (!container || duration === 0) return 0
      const rect = container.getBoundingClientRect()
      const clickX = clientX - rect.left
      const ratio = Math.max(0, Math.min(1, clickX / rect.width))

      const visibleDuration = duration / zoom
      const viewStartTime = viewportOffset * (duration - visibleDuration)
      return viewStartTime + ratio * visibleDuration
    },
    [duration, zoom, viewportOffset]
  )

  const timeToScreenX = useCallback(
    (t: number): number => {
      const container = canvasContainerRef.current
      if (!container || duration === 0) return 0
      const rect = container.getBoundingClientRect()
      const visibleDuration = duration / zoom
      const viewStartTime = viewportOffset * (duration - visibleDuration)
      return ((t - viewStartTime) / visibleDuration) * rect.width
    },
    [duration, zoom, viewportOffset]
  )

  // Mouse Interaction on Waveform (Drag Handles, Drag Region, Seek Playhead)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (duration === 0) return
    const container = canvasContainerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const startScreenX = timeToScreenX(startTime)
    const endScreenX = timeToScreenX(endTime)

    dragStartXRef.current = e.clientX
    dragInitialStartRef.current = startTime
    dragInitialEndRef.current = endTime

    // Handle hit-testing (within 12px)
    if (Math.abs(mouseX - startScreenX) <= 12) {
      setDragMode('start')
    } else if (Math.abs(mouseX - endScreenX) <= 12) {
      setDragMode('end')
    } else if (mouseX > startScreenX && mouseX < endScreenX) {
      setDragMode('region')
    } else {
      // Seek playhead directly
      const clickedTime = Math.max(0, Math.min(duration, xToTime(e.clientX)))
      setCurrentTime(clickedTime)
      if (audioRef.current) {
        audioRef.current.currentTime = clickedTime
      }
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragMode || duration === 0) return

      const currentTimeAtMouse = xToTime(e.clientX)

      if (dragMode === 'start') {
        const newStart = Math.max(0, Math.min(endTime - 0.5, currentTimeAtMouse))
        setStartTime(newStart)
        setStartInput(formatTime(newStart))
      } else if (dragMode === 'end') {
        const newEnd = Math.max(startTime + 0.5, Math.min(duration, currentTimeAtMouse))
        setEndTime(newEnd)
        setEndInput(formatTime(newEnd))
      } else if (dragMode === 'region') {
        const container = canvasContainerRef.current
        if (!container) return
        const rect = container.getBoundingClientRect()
        const deltaX = e.clientX - dragStartXRef.current
        const deltaRatio = deltaX / rect.width
        const visibleDuration = duration / zoom
        const deltaTime = deltaRatio * visibleDuration

        const cropLen = dragInitialEndRef.current - dragInitialStartRef.current
        let newStart = dragInitialStartRef.current + deltaTime
        let newEnd = dragInitialEndRef.current + deltaTime

        if (newStart < 0) {
          newStart = 0
          newEnd = cropLen
        }
        if (newEnd > duration) {
          newEnd = duration
          newStart = Math.max(0, duration - cropLen)
        }

        setStartTime(newStart)
        setEndTime(newEnd)
        setStartInput(formatTime(newStart))
        setEndInput(formatTime(newEnd))
      }
    }

    const handleMouseUp = () => {
      if (dragMode) setDragMode(null)
    }

    if (dragMode) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragMode, duration, startTime, endTime, xToTime, zoom])

  // Playback Control Handlers
  const handleTimeUpdate = () => {
    if (!audioRef.current) return
    const cur = audioRef.current.currentTime
    setCurrentTime(cur)

    if (playSelectionOnly) {
      if (cur >= endTime) {
        if (isLooping) {
          audioRef.current.currentTime = startTime
          audioRef.current.play()
        } else {
          audioRef.current.pause()
          audioRef.current.currentTime = startTime
          setIsPlaying(false)
        }
      }
    }
  }

  const togglePlay = (selectionOnly = false) => {
    if (!audioRef.current) return
    setPlaySelectionOnly(selectionOnly)

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      if (selectionOnly) {
        if (currentTime < startTime || currentTime >= endTime) {
          audioRef.current.currentTime = startTime
        }
      }
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const setPlayheadAsStart = () => {
    const newStart = Math.min(currentTime, Math.max(0, endTime - 0.5))
    setStartTime(newStart)
    setStartInput(formatTime(newStart))
  }

  const setPlayheadAsEnd = () => {
    const newEnd = Math.max(currentTime, Math.min(duration, startTime + 0.5))
    setEndTime(newEnd)
    setEndInput(formatTime(newEnd))
  }

  const handleStartInputChange = (val: string) => {
    setStartInput(val)
    const secs = parseTimeToSeconds(val)
    if (secs < endTime) {
      setStartTime(secs)
    }
  }

  const handleEndInputChange = (val: string) => {
    setEndInput(val)
    const secs = parseTimeToSeconds(val)
    if (secs > startTime && secs <= duration) {
      setEndTime(secs)
    }
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!tags.includes(tagInput.trim().toLowerCase())) {
        setTags([...tags, tagInput.trim().toLowerCase()])
      }
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  // Load existing folders on mount
  useEffect(() => {
    window.beheraAPI
      .getFolders()
      .then((fList) => setFolders(fList || []))
      .catch((e) => console.warn('Could not load folders for trimmer:', e))
  }, [])

  const handleCreateSubfolder = async () => {
    if (!newSubfolderName.trim()) return
    try {
      const fullPath = folderPath && folderPath !== 'Lectures'
        ? `${folderPath}/${newSubfolderName.trim()}`
        : newSubfolderName.trim()
      const created = await window.beheraAPI.createFolder(fullPath)
      setFolders((prev) => [...prev, created])
      setFolderPath(created.path)
      setNewSubfolderName('')
      setShowNewFolderInput(false)
    } catch (e) {
      console.error('Error creating subfolder:', e)
    }
  }

  // Save Clip (Virtual or Physical)
  const handleSaveClip = async (asVirtual = false) => {
    if (startTime >= endTime) return

    setIsSaving(true)
    try {
      const options: CropOptions = {
        sourcePath: tempFilePath,
        startTime: startTime,
        endTime: endTime,
        title: title.trim() || `${videoInfo.title} (Clip ${sessionClips.length + 1})`,
        artist: speaker.trim() || videoInfo.uploader || 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)',
        speaker: speaker.trim() || 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)',
        scripture: scripture,
        verse: verse.trim(),
        dateRecorded: dateRecorded,
        location: location.trim(),
        description: description.trim(),
        folderPath: folderPath,
        tags: tags,
        format: format,
        videoInfo: videoInfo,
        saveAsVirtual: asVirtual,
        enhanceAudio: enhanceAudio,
        metadata: {

          speaker: speaker.trim() || 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)',
          scripture,
          verse: verse.trim(),
          dateRecorded,
          festival: festival.trim(),
          location: location.trim(),
          description: description.trim(),
          sourceVideoId: videoInfo?.id,
          sourceUrl: videoInfo?.url,
          tags
        }
      }

      const savedItem = await window.audioAPI.cropAudio(options)
      setSessionClips((prev) => [savedItem, ...prev])
      setSaveSuccessMsg(
        asVirtual
          ? 'Saved as Virtual Clip (Timestamp Bookmark) instantly!'
          : `Trimmed & saved ${format.toUpperCase()} into folder "${folderPath}"!`
      )

      // Notify parent
      onSavedToRepo(savedItem)

      // Suggest default title for NEXT clip so user can extract multiple clips effortlessly
      setTitle(`${videoInfo.title} (Clip ${sessionClips.length + 2})`)

      setTimeout(() => setSaveSuccessMsg(null), 3500)
    } catch (err: any) {
      console.error('Error saving clip:', err)
      alert(`Trimming error: ${err?.message || 'Failed to crop audio'}`)
    } finally {
      setIsSaving(false)
    }
  }


  const cropDuration = Math.max(0, endTime - startTime)

  return (
    <div className="bg-[#161922] border border-[#2b3144] rounded-xl p-5 shadow-sm space-y-5 animate-fadeIn">
      {/* Hidden Native Audio Element */}
      <audio
        ref={audioRef}
        src={mediaSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration)
            if (endTime === 0) {
              setEndTime(audioRef.current.duration)
              setEndInput(formatTime(audioRef.current.duration))
            }
          }
        }}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Header Info & Zoom Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#2b3144]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-100 flex items-center gap-2">
              Waveform Precision Trimmer
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Selection: {formatTime(cropDuration)}
              </span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xl">
              Source: {videoInfo.title}
            </p>
          </div>
        </div>

        {/* Zoom Controls & Cancel */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#0f1117] border border-[#2b3144] rounded-lg p-0.5 text-xs text-gray-300">
            <button
              onClick={() => setZoom((z) => Math.max(1, z - 1))}
              disabled={zoom <= 1}
              className="p-1.5 hover:bg-[#1f2330] rounded disabled:opacity-30 transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-indigo-300">{zoom}x</span>
            <button
              onClick={() => setZoom((z) => Math.min(10, z + 1))}
              disabled={zoom >= 10}
              className="p-1.5 hover:bg-[#1f2330] rounded disabled:opacity-30 transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoom > 1 && (
              <button
                onClick={() => {
                  setZoom(1)
                  setViewportOffset(0)
                }}
                className="p-1.5 hover:bg-[#1f2330] rounded text-gray-400 hover:text-white transition"
                title="Reset Zoom"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="text-xs text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded-lg border border-[#2b3144] hover:bg-[#1f2330] transition"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {saveSuccessMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Interactive Responsive Waveform Canvas */}
      <div className="space-y-2 select-none">
        <div
          ref={canvasContainerRef}
          onMouseDown={handleMouseDown}
          className={`relative bg-[#0f1117] border border-[#2b3144] rounded-xl p-3 h-28 flex items-center justify-center select-none overflow-hidden ${
            dragMode ? 'cursor-ew-resize' : 'cursor-pointer'
          }`}
          title="Drag left/right handles to adjust crop range, drag middle to slide window, or click to seek playhead"
        >
          {isDecodingAudio ? (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              Generating high-resolution waveform...
            </div>
          ) : (
            <canvas ref={canvasRef} className="w-full h-full block" />
          )}
        </div>

        {/* Viewport Panning Scrollbar if zoomed */}
        {zoom > 1 && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] text-gray-500 font-mono">Pan:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.005"
              value={viewportOffset}
              onChange={(e) => setViewportOffset(parseFloat(e.target.value))}
              className="flex-1 accent-indigo-500 h-1 bg-[#1f2330] rounded cursor-pointer"
            />
          </div>
        )}

        {/* Precision Timeline Stats & Master Scrub Bar */}
        <div className="space-y-1.5 px-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-gray-400 w-16 shrink-0">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={(e) => {
                const val = parseFloat(e.target.value)
                setCurrentTime(val)
                if (audioRef.current) {
                  audioRef.current.currentTime = val
                }
              }}
              className="flex-1 accent-indigo-500 h-1.5 bg-[#1f2330] rounded-lg cursor-pointer"
              title="Scrub playhead across audio"
            />
            <span className="text-[11px] font-mono text-gray-400 w-16 text-right shrink-0">
              {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span>Playhead: {formatTime(currentTime)}</span>
            <span className="text-[11px] text-indigo-400 font-semibold">
              Crop Range: [{formatTime(startTime)} → {formatTime(endTime)}] ({formatTime(cropDuration)})
            </span>
            <span>Total: {formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Playback Controls Toolbar */}
      <div className="bg-[#0f1117] border border-[#2b3144] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Play Full Track */}
          <button
            onClick={() => togglePlay(false)}
            className="p-2 rounded-lg bg-[#1f2330] hover:bg-[#2b3144] text-gray-200 text-xs font-medium flex items-center gap-1.5 transition"
            title="Play / Pause from current playhead"
          >
            {isPlaying && !playSelectionOnly ? (
              <Pause className="w-4 h-4 text-indigo-400" />
            ) : (
              <Play className="w-4 h-4 text-indigo-400" />
            )}
            {isPlaying && !playSelectionOnly ? 'Pause' : 'Play'}
          </button>

          {/* Play Selected Crop Only */}
          <button
            onClick={() => togglePlay(true)}
            className="px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            title="Preview only the selected crop interval"
          >
            {isPlaying && playSelectionOnly ? (
              <Pause className="w-4 h-4 text-indigo-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-indigo-400" />
            )}
            Preview Crop ({formatTime(cropDuration)})
          </button>

          {/* Quick Jump Buttons */}
          <div className="flex items-center gap-1 bg-[#161922] p-0.5 rounded-lg border border-[#2b3144] text-xs">
            <button
              onClick={() => {
                if (audioRef.current) {
                  const t = Math.max(0, currentTime - 30)
                  audioRef.current.currentTime = t
                  setCurrentTime(t)
                }
              }}
              className="px-1.5 py-1 hover:bg-[#1f2330] rounded text-gray-400 hover:text-white transition"
              title="Rewind 30s"
            >
              -30s
            </button>
            <button
              onClick={() => {
                if (audioRef.current) {
                  const t = Math.max(0, currentTime - 5)
                  audioRef.current.currentTime = t
                  setCurrentTime(t)
                }
              }}
              className="px-1.5 py-1 hover:bg-[#1f2330] rounded text-gray-400 hover:text-white transition"
              title="Rewind 5s"
            >
              <Rewind className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (audioRef.current) {
                  const t = Math.min(duration, currentTime + 5)
                  audioRef.current.currentTime = t
                  setCurrentTime(t)
                }
              }}
              className="px-1.5 py-1 hover:bg-[#1f2330] rounded text-gray-400 hover:text-white transition"
              title="Forward 5s"
            >
              <FastForward className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (audioRef.current) {
                  const t = Math.min(duration, currentTime + 30)
                  audioRef.current.currentTime = t
                  setCurrentTime(t)
                }
              }}
              className="px-1.5 py-1 hover:bg-[#1f2330] rounded text-gray-400 hover:text-white transition"
              title="Forward 30s"
            >
              +30s
            </button>
          </div>

          {/* Loop Crop Toggle */}
          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`p-2 rounded-lg border text-xs transition ${
              isLooping
                ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                : 'border-transparent hover:bg-[#1f2330] text-gray-400'
            }`}
            title="Loop Selected Crop Segment"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Volume Controls */}
        <div className="flex items-center gap-2">

          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.muted = !isMuted
                setIsMuted(!isMuted)
              }
            }}
            className="text-gray-400 hover:text-gray-200"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
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
            className="w-20 accent-indigo-500 h-1 bg-gray-700 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Start / End Timestamp Inputs & Set to Playhead Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0f1117] p-4 rounded-xl border border-[#2b3144]">
        {/* Start Point */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Crop Start Time (mm:ss.ms)
            </span>
            <button
              onClick={setPlayheadAsStart}
              className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/20 transition"
            >
              Set Playhead ({formatTime(currentTime)})
            </button>
          </div>
          <input
            type="text"
            value={startInput}
            onChange={(e) => handleStartInputChange(e.target.value)}
            className="w-full bg-[#161922] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-200 font-mono focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* End Point */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Crop End Time (mm:ss.ms)
            </span>
            <button
              onClick={setPlayheadAsEnd}
              className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/20 transition"
            >
              Set Playhead ({formatTime(currentTime)})
            </button>
          </div>
          <input
            type="text"
            value={endInput}
            onChange={(e) => handleEndInputChange(e.target.value)}
            className="w-full bg-[#161922] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-200 font-mono focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Metadata & Save Multiple Clips Form */}
      <div className="bg-[#0f1117] p-5 rounded-xl border border-[#2b3144] space-y-4">
        <div className="flex items-center justify-between border-b border-[#2b3144] pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
            <BookmarkPlus className="w-4 h-4 text-indigo-400" />
            Comprehensive Discourse Metadata & Storage Folder
          </div>
          <span className="text-[11px] text-gray-400">
            Extract multiple precision clips from this master discourse!
          </span>
        </div>

        {/* Row 1: Title & Output Format with Auto-Extraction button */}
        <div className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-gray-300">Discourse Title</label>
                <button
                  type="button"
                  onClick={() => handleReParseFromTitle()}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold hover:underline"
                >
                  <Sparkles className="w-3 h-3" />
                  Auto-Extract Details from Title
                </button>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. SB 10.2.13 - Balaram Jayanti Special Class"
                className="w-full bg-[#161922] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-300">Audio Quality Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full bg-[#161922] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="mp3">MP3 (24 kbps Voice HD, ~10 MB/hr)</option>
                <option value="opus">Opus (24 kbps Voice)</option>
                <option value="wav">WAV (Lossless PCM)</option>
                <option value="aac">AAC (Standard)</option>
              </select>
            </div>
          </div>

          {/* Quick detected metadata badges */}
          {(verse || festival || dateRecorded || scripture) && (
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono pt-0.5">
              <span className="text-gray-400">Extracted:</span>
              {scripture && (
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">
                  📖 {scripture}
                </span>
              )}
              {verse && (
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
                  📜 {verse}
                </span>
              )}
              {festival && (
                <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-semibold">
                  🌺 {festival}
                </span>
              )}
              {dateRecorded && (
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold">
                  📅 {dateRecorded}
                </span>
              )}
              {location && (
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-semibold">
                  📍 {location}
                </span>
              )}
            </div>
          )}
        </div>

        {/* DSP Voice Enhancement Banner Toggle */}
        <div className="flex items-center justify-between p-2.5 bg-[#161922] rounded-lg border border-[#2b3144]">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={enhanceAudio}
              onChange={(e) => setEnhanceAudio(e.target.checked)}
              className="accent-indigo-500 rounded"
            />
            <span className="flex items-center gap-1 text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              DSP Speech Clarifier & Dynamic Audio Normalizer
            </span>
          </label>
          <span className="text-[10px] text-gray-400">
            Auto-removes room hum, fan noise & balances volume levels
          </span>
        </div>

        {/* Row 2: Speaker, Scripture & Verse */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-300">Speaker / Teacher</label>
            <input
              type="text"
              value={speaker}
              onChange={(e) => setSpeaker(e.target.value)}
              placeholder="e.g. Dr. Laxmidhar Behera (HG Lila Purushottam Das)"
              className="w-full bg-[#161922] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-indigo-500"
            />
          </div>


          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-300">Scripture / Topic</label>
            <select
              value={scripture}
              onChange={(e) => setScripture(e.target.value)}
              className="w-full bg-[#161922] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="Srimad Bhagavatam">Srimad Bhagavatam</option>
              <option value="Bhagavad Gita">Bhagavad Gita</option>
              <option value="Chaitanya Charitamrita">Chaitanya Charitamrita</option>
              <option value="Bhakti Rasamrita Sindhu">Bhakti Rasamrita Sindhu</option>
              <option value="Upanishads">Upanishads</option>
              <option value="Special Seminars">Special Seminars</option>
              <option value="Q&A Session">Q&A Session</option>
              <option value="Morning Japa Walk">Morning Japa Walk</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-300">Canto / Verse Reference</label>
            <input
              type="text"
              value={verse}
              onChange={(e) => setVerse(e.target.value)}
              placeholder="e.g. SB 10.2.13 or BG 4.34"
              className="w-full bg-[#161922] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Row 3: Festival, Date & Location */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-300">Festival / Occasion</label>
            <input
              type="text"
              value={festival}
              onChange={(e) => setFestival(e.target.value)}
              placeholder="e.g. Balaram Jayanti / Janmashtami"
              className="w-full bg-[#161922] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-300">Recording Date</label>
            <input
              type="date"
              value={dateRecorded}
              onChange={(e) => setDateRecorded(e.target.value)}
              className="w-full bg-[#161922] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-300">Location / Temple</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Bhubaneswar / Vrindavan"
              className="w-full bg-[#161922] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Row 4: Subfolder Selection & Inline Subfolder Creation */}
        <div className="space-y-1.5 p-3 bg-[#161922] rounded-xl border border-[#2b3144]">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-gray-300 flex items-center gap-1.5">
              📁 Destination Subfolder
            </label>
            <button
              type="button"
              onClick={() => setShowNewFolderInput(!showNewFolderInput)}
              className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20"
            >
              ➕ Create New Subfolder
            </button>
          </div>

          {showNewFolderInput && (
            <div className="flex items-center gap-2 pt-1 pb-1">
              <input
                type="text"
                value={newSubfolderName}
                onChange={(e) => setNewSubfolderName(e.target.value)}
                placeholder="Subfolder name (e.g. 2026/Seminars or Canto 10)"
                className="flex-1 bg-[#0f1117] border border-indigo-500/40 rounded-lg px-3 py-1.5 text-xs text-gray-100 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreateSubfolder}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
              >
                Add Subfolder
              </button>
            </div>
          )}

          <select
            value={folderPath}
            onChange={(e) => setFolderPath(e.target.value)}
            className="w-full bg-[#0f1117] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 font-mono"
          >
            <option value="Lectures">📂 Lectures (Root)</option>
            <option value="Bhagavad Gita">📂 Bhagavad Gita</option>
            <option value="Srimad Bhagavatam">📂 Srimad Bhagavatam</option>
            <option value="Seminars">📂 Seminars</option>
            <option value="Q&A Sessions">📂 Q&A Sessions</option>
            {folders
              .filter(
                (f) =>
                  !['Lectures', 'Bhagavad Gita', 'Srimad Bhagavatam', 'Seminars', 'Q&A Sessions'].includes(
                    f.path
                  )
              )
              .map((f) => (
                <option key={f.path} value={f.path}>
                  📂 {f.path}
                </option>
              ))}
          </select>
        </div>

        {/* Row 5: Notes & Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-300">Discourse Synopsis / Notes</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief highlights or teachings in this clip..."
              className="w-full bg-[#161922] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-300 flex items-center gap-1">
              <Tag className="w-3 h-3 text-indigo-400" />
              Tags (press Enter)
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Type tag and press Enter"
              className="w-full bg-[#161922] border border-[#2b3144] rounded-lg px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap pt-0.5">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#1f2330] text-gray-300 text-[11px] rounded-md border border-[#2b3144]"
              >
                #{t}
                <button
                  type="button"
                  onClick={() => removeTag(t)}
                  className="text-gray-500 hover:text-rose-400 font-bold ml-1 text-xs"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Dual Save Action Buttons */}
        <div className="pt-3 border-t border-[#2b3144] flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-gray-400 max-w-sm">
            <span className="font-semibold text-gray-300">💡 24 kbps Voice Quality:</span> Trimming exports a crystal-clear, ultra-compact MP3 (~10 MB/hr) directly into <span className="font-mono text-indigo-300">{folderPath}</span>.
          </div>

          <div className="flex items-center gap-2.5">
            {/* Save as Virtual Clip (Timestamp Bookmark) */}
            <button
              onClick={() => handleSaveClip(true)}
              disabled={isSaving || startTime >= endTime}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
              title="Saves start & end timestamps pointing to master source with zero duplicated disk space"
            >
              <BookmarkPlus className="w-4 h-4" />
              Save Virtual Bookmark ({formatTime(cropDuration)})
            </button>

            {/* Trim & Export Physical MP3 (Primary Action) */}
            <button
              onClick={() => handleSaveClip(false)}
              disabled={isSaving || startTime >= endTime}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-lg transition disabled:opacity-50"
              title="Runs FFmpeg to crop and save physical 24 kbps voice MP3 file"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Trimming & Encoding MP3...
                </>
              ) : (
                <>
                  <Scissors className="w-4 h-4" />
                  Trim & Save Physical MP3 ({formatTime(cropDuration)})
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Clips Created in this Session */}
      {sessionClips.length > 0 && (
        <div className="bg-[#0f1117] border border-[#2b3144] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
              <ListMusic className="w-4 h-4 text-indigo-400" />
              Clips Created from this Audio Source ({sessionClips.length})
            </div>
            <span className="text-[10px] text-gray-500">Saved to Repository</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {sessionClips.map((clip) => (
              <div
                key={clip.id}
                className="p-2.5 bg-[#161922] border border-[#2b3144] rounded-lg flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-200 truncate">{clip.title}</p>
                  <p className="text-[11px] text-gray-400 font-mono">
                    [{formatTime(clip.startTime || 0)} → {formatTime(clip.endTime || 0)}] (
                    {formatTime(clip.duration)}) • {clip.isVirtualClip ? '⚡ Virtual Clip' : '📁 Standalone MP3'}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      if (clip.startTime !== undefined && clip.endTime !== undefined) {
                        setStartTime(clip.startTime)
                        setEndTime(clip.endTime)
                        setStartInput(formatTime(clip.startTime))
                        setEndInput(formatTime(clip.endTime))
                        setCurrentTime(clip.startTime)
                        if (audioRef.current) audioRef.current.currentTime = clip.startTime
                      }
                    }}
                    className="px-2 py-1 bg-[#1f2330] hover:bg-[#2b3144] text-indigo-300 rounded text-[11px] font-medium transition"
                  >
                    Load in Trimmer
                  </button>
                  <button
                    onClick={() => window.audioAPI.showInExplorer(clip.filePath)}
                    className="p-1.5 hover:bg-[#1f2330] rounded text-gray-400 hover:text-white transition"
                    title="Reveal in Explorer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
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

export default AudioWaveformTrimmer
