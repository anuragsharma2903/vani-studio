import { ElectronAPI } from '@electron-toolkit/preload'
import {
  AudioMetadata,
  CropOptions,
  DownloadProgress,
  VideoInfo,
  AppSettings,
  SystemToolStatus,
  BeheraTrack,
  BeheraPlaylist,
  CloudflareR2Config,
  RepoFolder
} from '../main/modules/types'


export interface AudioAPI {
  fetchInfo: (url: string) => Promise<VideoInfo>
  downloadAudio: (url: string) => Promise<{ tempFilePath: string; videoInfo: VideoInfo }>
  cropAudio: (options: CropOptions) => Promise<AudioMetadata>
  getRepo: () => Promise<AudioMetadata[]>
  deleteRepoItem: (id: string, deleteFile?: boolean) => Promise<boolean>
  showInExplorer: (filePath: string) => Promise<boolean>
  exportPhysicalClip: (clipId: string) => Promise<AudioMetadata>
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => () => void
  toMediaUrl: (filePath: string) => string
}

export interface BeheraAPI {
  getTracks: () => Promise<BeheraTrack[]>
  addTrack: (trackData: Partial<BeheraTrack>) => Promise<BeheraTrack>
  updateTrackMetadata: (
    id: string,
    metadataDict: Record<string, any>,
    baseFields?: Partial<BeheraTrack>
  ) => Promise<BeheraTrack | null>
  reorderTracks: (orderedTrackIds: string[]) => Promise<BeheraTrack[]>
  deleteTrack: (id: string, deleteFile?: boolean) => Promise<boolean>
  importFromRepo: (audioRepoId: string) => Promise<BeheraTrack | null>
  getPlaylists: () => Promise<BeheraPlaylist[]>
  createPlaylist: (
    name: string,
    description?: string,
    trackIds?: string[]
  ) => Promise<BeheraPlaylist>
  getFolders: () => Promise<RepoFolder[]>
  createFolder: (folderPath: string, parentPath?: string) => Promise<RepoFolder>
  deleteFolder: (folderPath: string) => Promise<boolean>
  moveToFolder: (trackId: string, folderPath: string) => Promise<BeheraTrack | null>
  cropTrack: (options: any) => Promise<BeheraTrack>
  compressTrack: (trackId: string) => Promise<BeheraTrack>
}




export interface CloudflareAPI {
  testConnection: (config: CloudflareR2Config) => Promise<{ success: boolean; message: string }>
  uploadClip: (clipId: string) => Promise<AudioMetadata>
  uploadBeheraTrack: (trackId: string) => Promise<BeheraTrack>
  syncAll: () => Promise<{ uploadedAudio: number; uploadedIndexes: number }>
  pullFromR2: () => Promise<{ pulledTracks: number; pulledClips: number; message: string }>
  getPresignedUrl: (r2Key: string) => Promise<string>
  downloadOffline: (trackId: string) => Promise<BeheraTrack>
}


export interface SettingsAPI {
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>
  selectDirectory: () => Promise<string | null>
  checkTools: () => Promise<SystemToolStatus>
}

export interface SystemAPI {
  openExternal: (url: string) => Promise<boolean>
  openPath: (path: string) => Promise<string>
}

export interface UpdaterAPI {
  checkForUpdates: () => Promise<any>
  downloadUpdate: () => Promise<boolean>
  quitAndInstall: () => Promise<boolean>
  getStatus: () => Promise<any>
  onStatusChanged: (callback: (status: any) => void) => () => void
}

export interface QueueAPI {
  addToQueue: (
    urls: string[],
    options?: { folderPath?: string; speaker?: string; autoAddToRepo?: boolean }
  ) => Promise<any[]>
  getQueue: () => Promise<any[]>
  cancelItem: (id: string) => Promise<boolean>
  retryItem: (id: string) => Promise<boolean>
  clearCompleted: () => Promise<boolean>
  clearAll: () => Promise<boolean>
  setConcurrency: (limit: number) => Promise<number>
  onQueueUpdated: (callback: (items: any[]) => void) => () => void
}

export interface WatcherAPI {
  getChannels: () => Promise<WatchedChannel[]>
  addChannel: (
    url: string,
    options?: { name?: string; folderPath?: string; speaker?: string; autoUploadR2?: boolean }
  ) => Promise<WatchedChannel>
  removeChannel: (id: string) => Promise<boolean>
  toggleChannel: (id: string, enabled: boolean) => Promise<WatchedChannel | null>
  checkNow: (id?: string) => Promise<any>
}

export interface YouTubeAPI {
  searchVideos: (
    query: string,
    maxResults?: number,
    customApiKey?: string
  ) => Promise<{ results: YouTubeSearchResult[]; source: 'google_api' | 'ytdlp_search' }>
  enqueueVideos: (
    videos: YouTubeSearchResult[],
    targetFolder?: string
  ) => Promise<{ enqueuedCount: number }>
}

export interface PlaylistAPI {
  getAll: () => Promise<DiscoursePlaylist[]>
  addCustom: (playlist: Partial<DiscoursePlaylist>) => Promise<DiscoursePlaylist>
  remove: (id: string) => Promise<boolean>
  fetchFromUrl: (playlistUrl: string) => Promise<{ title: string; uploader: string; items: PlaylistItem[] }>
  enqueueBatch: (playlistId: string, targetFolder?: string) => Promise<{ enqueuedCount: number }>
}

declare global {
  interface Window {
    electron: ElectronAPI
    audioAPI: AudioAPI
    beheraAPI: BeheraAPI
    cloudflareAPI: CloudflareAPI
    settingsAPI: SettingsAPI
    systemAPI: SystemAPI
    updaterAPI: UpdaterAPI
    queueAPI: QueueAPI
    watcherAPI: WatcherAPI
    youtubeAPI: YouTubeAPI
    playlistAPI: PlaylistAPI
  }
}





