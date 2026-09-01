export interface DiscourseMetadata {
  titleHindi?: string
  subtitle?: string
  speaker?: string
  coSpeakers?: string[]
  language?: string
  scripture?: string
  canto?: string
  chapter?: string
  verse?: string
  philosophyTopic?: string
  dateRecorded?: string
  festival?: string
  location?: string
  event?: string
  description?: string
  keyVersesCited?: string[]
  keyTakeaways?: string[]
  timestamps?: { time: string; label: string }[]
  bitrate?: string
  sampleRate?: string
  notes?: string
  [key: string]: any
}

export interface AudioMetadata {
  id: string
  title: string
  artist?: string
  sourceUrl?: string
  originalDuration?: number
  duration: number
  filePath: string
  fileName: string
  startTime?: number
  endTime?: number
  createdAt: string
  tags?: string[]
  fileSize?: number
  thumbnail?: string
  isVirtualClip?: boolean
  sourceAudioPath?: string
  sourceVideoId?: string
  r2Url?: string
  r2Key?: string
  folderPath?: string
  speaker?: string
  scripture?: string
  verse?: string
  dateRecorded?: string
  location?: string
  metadata?: DiscourseMetadata
}

export interface VideoInfo {
  id: string
  title: string
  uploader: string
  duration: number
  thumbnail: string
  url: string
  description?: string
  initialStartTime?: number
}


export interface DownloadProgress {
  percent: number
  speed?: string
  eta?: string
  status: string
}

export interface DownloadResult {
  success: boolean
  tempFilePath?: string
  videoInfo?: VideoInfo
  error?: string
}

export interface CropOptions {
  sourcePath: string
  startTime: number
  endTime: number
  title: string
  artist?: string
  tags?: string[]
  format?: 'opus' | 'mp3' | 'wav' | 'aac' | 'm4a'
  customFileName?: string
  videoInfo?: VideoInfo
  saveAsVirtual?: boolean
  folderPath?: string
  speaker?: string
  scripture?: string
  verse?: string
  dateRecorded?: string
  location?: string
  description?: string
  enhanceAudio?: boolean
  metadata?: DiscourseMetadata
}

export interface CloudflareR2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  publicDomain: string
  enabled: boolean
}

export interface AppSettings {
  repoPath: string
  ffmpegPath: string
  ytdlpPath: string
  defaultFormat: 'opus' | 'mp3' | 'wav' | 'aac'
  defaultBitrate: string
  theme: 'dark' | 'light' | 'system'
  enhanceAudioDefault?: boolean
  youtubeApiKey?: string
  cloudflareR2?: CloudflareR2Config
}

export interface YouTubeSearchResult {
  id: string
  title: string
  url: string
  thumbnail: string
  channelTitle: string
  publishedAt: string
  duration?: number
  durationFormatted?: string
  description: string
}


export interface PlaylistItem {
  id: string
  videoId: string
  title: string
  url: string
  thumbnail?: string
  duration?: number
  durationFormatted?: string
  position?: number
  scripture?: string
  verse?: string
  topic?: string
  downloadStatus?: 'idle' | 'queued' | 'downloading' | 'completed' | 'error'
}

export interface DiscoursePlaylist {
  id: string
  title: string
  category:
    | 'LGLG'
    | 'Srimad Bhagavatam'
    | 'Bhagavad Gita'
    | 'Chaitanya Charitamrita'
    | 'Science & Consciousness'
    | 'Festivals'
    | 'Q&A & Seminars'
    | 'Custom'
  description?: string
  url?: string
  playlistId?: string
  thumbnail?: string
  speaker: string
  itemCount: number
  items: PlaylistItem[]
  isCustom?: boolean
  createdAt: string
  updatedAt?: string
}

export interface SystemToolStatus {

  node: boolean
  nodeVersion?: string
  ffmpeg: boolean
  ffmpegVersion?: string
  ffmpegPath?: string
  ytdlp: boolean
  ytdlpVersion?: string
  ytdlpPath?: string
}

export interface RepoFolder {
  id: string
  name: string
  path: string
  parentPath?: string
  itemCount?: number
  createdAt: string
}

export interface BeheraTrack {
  id: string
  title: string
  speaker: string
  topic: string
  category: string
  folderPath?: string
  filePath: string
  fileName: string
  duration: number
  startTime?: number
  endTime?: number
  order: number

  metadata: DiscourseMetadata
  createdAt: string
  thumbnail?: string
  sourceUrl?: string
  fileSize?: number
  r2Url?: string
  r2Key?: string
}

export interface BeheraPlaylist {
  id: string
  name: string
  description?: string
  trackIds: string[]
  createdAt: string
}

export interface QueueItem {
  id: string
  url: string
  title: string
  uploader?: string
  duration?: number
  thumbnail?: string
  folderPath?: string
  speaker?: string
  status: 'queued' | 'downloading' | 'completed' | 'error' | 'cancelled'
  percent: number
  speed?: string
  eta?: string
  error?: string
  tempFilePath?: string
  videoInfo?: VideoInfo
  addedAt: string
  completedAt?: string
}

export interface WatchedChannel {
  id: string
  url: string
  name: string
  folderPath?: string
  speaker?: string
  lastChecked?: string
  lastVideoId?: string
  autoUploadR2?: boolean
  enabled: boolean
  createdAt: string
}



