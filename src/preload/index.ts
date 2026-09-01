import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
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


const audioAPI = {
  fetchInfo: (url: string): Promise<VideoInfo> => ipcRenderer.invoke('audio:fetch-info', url),

  downloadAudio: (
    url: string
  ): Promise<{ tempFilePath: string; videoInfo: VideoInfo }> =>
    ipcRenderer.invoke('audio:download', url),

  cropAudio: (options: CropOptions): Promise<AudioMetadata> =>
    ipcRenderer.invoke('audio:crop', options),

  getRepo: (): Promise<AudioMetadata[]> => ipcRenderer.invoke('audio:get-repo'),

  deleteRepoItem: (id: string, deleteFile = true): Promise<boolean> =>
    ipcRenderer.invoke('audio:delete-repo-item', id, deleteFile),

  showInExplorer: (filePath: string): Promise<boolean> =>
    ipcRenderer.invoke('audio:show-in-explorer', filePath),

  exportPhysicalClip: (clipId: string): Promise<AudioMetadata> =>
    ipcRenderer.invoke('audio:export-physical-clip', clipId),

  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => {
    const subscription = (_event: IpcRendererEvent, progress: DownloadProgress) => {
      callback(progress)
    }
    ipcRenderer.on('download-progress', subscription)
    return () => {
      ipcRenderer.removeListener('download-progress', subscription)
    }
  },

  toMediaUrl: (filePath: string): string => {
    return `media://local-file/${encodeURIComponent(filePath)}`
  }
}

const beheraAPI = {
  getTracks: (): Promise<BeheraTrack[]> => ipcRenderer.invoke('behera:get-tracks'),

  addTrack: (trackData: Partial<BeheraTrack>): Promise<BeheraTrack> =>
    ipcRenderer.invoke('behera:add-track', trackData),

  updateTrackMetadata: (
    id: string,
    metadataDict: Record<string, any>,
    baseFields?: Partial<BeheraTrack>
  ): Promise<BeheraTrack | null> =>
    ipcRenderer.invoke('behera:update-metadata', id, metadataDict, baseFields),

  reorderTracks: (orderedTrackIds: string[]): Promise<BeheraTrack[]> =>
    ipcRenderer.invoke('behera:reorder-tracks', orderedTrackIds),

  deleteTrack: (id: string, deleteFile = false): Promise<boolean> =>
    ipcRenderer.invoke('behera:delete-track', id, deleteFile),

  importFromRepo: (audioRepoId: string): Promise<BeheraTrack | null> =>
    ipcRenderer.invoke('behera:import-from-repo', audioRepoId),

  getPlaylists: (): Promise<BeheraPlaylist[]> => ipcRenderer.invoke('behera:get-playlists'),

  createPlaylist: (
    name: string,
    description?: string,
    trackIds?: string[]
  ): Promise<BeheraPlaylist> =>
    ipcRenderer.invoke('behera:create-playlist', name, description, trackIds),

  getFolders: (): Promise<RepoFolder[]> => ipcRenderer.invoke('behera:get-folders'),

  createFolder: (folderPath: string, parentPath?: string): Promise<RepoFolder> =>
    ipcRenderer.invoke('behera:create-folder', folderPath, parentPath),

  deleteFolder: (folderPath: string): Promise<boolean> =>
    ipcRenderer.invoke('behera:delete-folder', folderPath),

  moveToFolder: (trackId: string, folderPath: string): Promise<BeheraTrack | null> =>
    ipcRenderer.invoke('behera:move-to-folder', trackId, folderPath),

  cropTrack: (options: any): Promise<BeheraTrack> =>
    ipcRenderer.invoke('behera:crop-track', options),

  compressTrack: (trackId: string): Promise<BeheraTrack> =>
    ipcRenderer.invoke('behera:compress-track', trackId)
}




const cloudflareAPI = {
  testConnection: (
    config: CloudflareR2Config
  ): Promise<{ success: boolean; message: string }> =>
    ipcRenderer.invoke('cloudflare:test-connection', config),

  uploadClip: (clipId: string): Promise<AudioMetadata> =>
    ipcRenderer.invoke('cloudflare:upload-clip', clipId),

  uploadBeheraTrack: (trackId: string): Promise<BeheraTrack> =>
    ipcRenderer.invoke('cloudflare:upload-behera-track', trackId),

  syncAll: (): Promise<{ uploadedAudio: number; uploadedIndexes: number }> =>
    ipcRenderer.invoke('cloudflare:sync-all'),

  pullFromR2: (): Promise<{ pulledTracks: number; pulledClips: number; message: string }> =>
    ipcRenderer.invoke('cloudflare:pull-from-r2'),

  getPresignedUrl: (r2Key: string): Promise<string> =>
    ipcRenderer.invoke('cloudflare:get-presigned-url', r2Key),

  downloadOffline: (trackId: string): Promise<BeheraTrack> =>
    ipcRenderer.invoke('cloudflare:download-offline', trackId)
}


const settingsAPI = {
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke('settings:save', settings),
  selectDirectory: (): Promise<string | null> => ipcRenderer.invoke('settings:select-directory'),
  checkTools: (): Promise<SystemToolStatus> => ipcRenderer.invoke('settings:check-tools')
}

const systemAPI = {
  openExternal: (url: string): Promise<boolean> => ipcRenderer.invoke('system:open-external', url),
  openPath: (path: string): Promise<string> => ipcRenderer.invoke('system:open-path', path)
}

const updaterAPI = {
  checkForUpdates: (): Promise<any> => ipcRenderer.invoke('updater:check'),
  downloadUpdate: (): Promise<boolean> => ipcRenderer.invoke('updater:download'),
  quitAndInstall: (): Promise<boolean> => ipcRenderer.invoke('updater:install'),
  getStatus: (): Promise<any> => ipcRenderer.invoke('updater:get-status'),
  onStatusChanged: (callback: (status: any) => void): (() => void) => {
    const handler = (_: IpcRendererEvent, status: any) => callback(status)
    ipcRenderer.on('updater:status-changed', handler)
    return () => {
      ipcRenderer.removeListener('updater:status-changed', handler)
    }
  }
}

const queueAPI = {
  addToQueue: (
    urls: string[],
    options?: { folderPath?: string; speaker?: string; autoAddToRepo?: boolean }
  ): Promise<any[]> => ipcRenderer.invoke('queue:add', urls, options),

  getQueue: (): Promise<any[]> => ipcRenderer.invoke('queue:get'),

  cancelItem: (id: string): Promise<boolean> => ipcRenderer.invoke('queue:cancel', id),

  retryItem: (id: string): Promise<boolean> => ipcRenderer.invoke('queue:retry', id),

  clearCompleted: (): Promise<boolean> => ipcRenderer.invoke('queue:clear-completed'),

  clearAll: (): Promise<boolean> => ipcRenderer.invoke('queue:clear-all'),

  setConcurrency: (limit: number): Promise<number> =>
    ipcRenderer.invoke('queue:set-concurrency', limit),

  onQueueUpdated: (callback: (items: any[]) => void): (() => void) => {
    const handler = (_: IpcRendererEvent, items: any[]) => callback(items)
    ipcRenderer.on('queue:updated', handler)
    return () => {
      ipcRenderer.removeListener('queue:updated', handler)
    }
  }
}

const watcherAPI = {
  getChannels: (): Promise<any[]> => ipcRenderer.invoke('watcher:get-channels'),
  addChannel: (
    url: string,
    options?: { name?: string; folderPath?: string; speaker?: string; autoUploadR2?: boolean }
  ): Promise<any> => ipcRenderer.invoke('watcher:add-channel', url, options),
  removeChannel: (id: string): Promise<boolean> => ipcRenderer.invoke('watcher:remove-channel', id),
  toggleChannel: (id: string, enabled: boolean): Promise<any> =>
    ipcRenderer.invoke('watcher:toggle-channel', id, enabled),
  checkNow: (id?: string): Promise<any> => ipcRenderer.invoke('watcher:check-now', id)
}

const youtubeAPI = {
  searchVideos: (
    query: string,
    maxResults?: number,
    customApiKey?: string
  ): Promise<{ results: any[]; source: 'google_api' | 'ytdlp_search' }> =>
    ipcRenderer.invoke('youtube:search', query, maxResults, customApiKey),
  enqueueVideos: (videos: any[], targetFolder?: string): Promise<{ enqueuedCount: number }> =>
    ipcRenderer.invoke('youtube:enqueue', videos, targetFolder)
}

const playlistAPI = {
  getAll: (): Promise<any[]> => ipcRenderer.invoke('playlist:get-all'),
  addCustom: (playlist: any): Promise<any> => ipcRenderer.invoke('playlist:add-custom', playlist),
  remove: (id: string): Promise<boolean> => ipcRenderer.invoke('playlist:remove', id),
  fetchFromUrl: (playlistUrl: string): Promise<{ title: string; uploader: string; items: any[] }> =>
    ipcRenderer.invoke('playlist:fetch-from-url', playlistUrl),
  enqueueBatch: (playlistId: string, targetFolder?: string): Promise<{ enqueuedCount: number }> =>
    ipcRenderer.invoke('playlist:enqueue-batch', playlistId, targetFolder)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('audioAPI', audioAPI)
    contextBridge.exposeInMainWorld('beheraAPI', beheraAPI)
    contextBridge.exposeInMainWorld('cloudflareAPI', cloudflareAPI)
    contextBridge.exposeInMainWorld('settingsAPI', settingsAPI)
    contextBridge.exposeInMainWorld('systemAPI', systemAPI)
    contextBridge.exposeInMainWorld('updaterAPI', updaterAPI)
    contextBridge.exposeInMainWorld('queueAPI', queueAPI)
    contextBridge.exposeInMainWorld('watcherAPI', watcherAPI)
    contextBridge.exposeInMainWorld('youtubeAPI', youtubeAPI)
    contextBridge.exposeInMainWorld('playlistAPI', playlistAPI)
  } catch (error) {
    console.error('Error exposing APIs via contextBridge:', error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.audioAPI = audioAPI
  // @ts-ignore (define in dts)
  window.beheraAPI = beheraAPI
  // @ts-ignore (define in dts)
  window.cloudflareAPI = cloudflareAPI
  // @ts-ignore (define in dts)
  window.settingsAPI = settingsAPI
  // @ts-ignore (define in dts)
  window.systemAPI = systemAPI
  // @ts-ignore (define in dts)
  window.updaterAPI = updaterAPI
  // @ts-ignore (define in dts)
  window.queueAPI = queueAPI
  // @ts-ignore (define in dts)
  window.watcherAPI = watcherAPI
  // @ts-ignore (define in dts)
  window.youtubeAPI = youtubeAPI
  // @ts-ignore (define in dts)
  window.playlistAPI = playlistAPI
}



