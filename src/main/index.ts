import { app, shell, BrowserWindow, ipcMain, protocol } from 'electron'
import { join } from 'path'
import { existsSync, statSync, createReadStream } from 'fs'
import { Readable } from 'stream'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'


import { audioRepoManager } from './modules/audioRepo'
import { beheraRepoManager } from './modules/beheraRepo'
import { cloudflareR2Manager } from './modules/cloudflareR2'
import { settingsManager } from './modules/settings'
import { appUpdaterManager } from './modules/updater'
import { queueManager } from './modules/queueManager'
import { CropOptions, AppSettings, BeheraTrack, CloudflareR2Config } from './modules/types'




// Automatically augment process.env.PATH with machine, user, and WinGet tool paths
function augmentProcessPath(): void {
  const { binDir: ffmpegDir } = settingsManager.resolveFfmpeg()
  const ytdlpPath = settingsManager.resolveYtdlpPath()
  const ytdlpDir = join(ytdlpPath, '..')

  const currentPath = process.env.PATH || ''
  const extraPaths = [ffmpegDir, ytdlpDir].filter((p) => p && p !== 'ffmpeg' && p !== 'yt-dlp')

  process.env.PATH = `${extraPaths.join(';')};${currentPath}`
}

augmentProcessPath()

// Register standard scheme privilege before app ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      stream: true
    }
  }
])

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 980,
    minHeight: 650,
    show: false,
    autoHideMenuBar: true,
    title: 'Vani Studio Pro - Sacred Audio & Cloud Vault',
    icon,
    webPreferences: {

      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerIpcHandlers(): void {
  // Audio Module IPCs
  ipcMain.handle('audio:fetch-info', async (_, url: string) => {
    return await audioRepoManager.fetchVideoInfo(url)
  })

  ipcMain.handle('audio:download', async (event, url: string) => {
    return await audioRepoManager.downloadAudio(url, event.sender)
  })

  ipcMain.handle('audio:crop', async (_, options: CropOptions) => {
    return await audioRepoManager.cropAudio(options)
  })

  ipcMain.handle('audio:get-repo', async () => {
    return audioRepoManager.getRepositoryItems()
  })

  ipcMain.handle('audio:delete-repo-item', async (_, id: string, deleteFile = true) => {
    return audioRepoManager.deleteRepositoryItem(id, deleteFile)
  })

  ipcMain.handle('audio:show-in-explorer', async (_, filePath: string) => {
    audioRepoManager.showInExplorer(filePath)
    return true
  })

  ipcMain.handle('audio:export-physical-clip', async (_, clipId: string) => {
    return await audioRepoManager.exportPhysicalClip(clipId)
  })


  // Behera Sir's Audio Repository IPCs
  ipcMain.handle('behera:get-tracks', async () => {
    return beheraRepoManager.getTracks()
  })

  ipcMain.handle('behera:add-track', async (_, trackData: Partial<BeheraTrack>) => {
    return beheraRepoManager.addTrack(trackData)
  })

  ipcMain.handle(
    'behera:update-metadata',
    async (
      _,
      id: string,
      metadataDict: Record<string, any>,
      baseFields?: Partial<BeheraTrack>
    ) => {
      return beheraRepoManager.updateTrackMetadata(id, metadataDict, baseFields)
    }
  )

  ipcMain.handle('behera:reorder-tracks', async (_, orderedTrackIds: string[]) => {
    return beheraRepoManager.reorderTracks(orderedTrackIds)
  })

  ipcMain.handle('behera:delete-track', async (_, id: string, deleteFile = false) => {
    return beheraRepoManager.deleteTrack(id, deleteFile)
  })

  ipcMain.handle('behera:import-from-repo', async (_, audioRepoId: string) => {
    return beheraRepoManager.importFromAudioRepo(audioRepoId)
  })

  ipcMain.handle('behera:get-playlists', async () => {
    return beheraRepoManager.getPlaylists()
  })

  ipcMain.handle(
    'behera:create-playlist',
    async (_, name: string, description?: string, trackIds?: string[]) => {
      return beheraRepoManager.createPlaylist(name, description, trackIds)
    }
  )

  ipcMain.handle('behera:get-folders', async () => {
    return beheraRepoManager.getFolders()
  })

  ipcMain.handle('behera:create-folder', async (_, folderPath: string, parentPath?: string) => {
    return beheraRepoManager.createFolder(folderPath, parentPath)
  })

  ipcMain.handle('behera:delete-folder', async (_, folderPath: string) => {
    return beheraRepoManager.deleteFolder(folderPath)
  })

  ipcMain.handle('behera:move-to-folder', async (_, trackId: string, folderPath: string) => {
    return beheraRepoManager.moveTrackToFolder(trackId, folderPath)
  })

  ipcMain.handle('behera:crop-track', async (_, options: any) => {
    return await beheraRepoManager.cropAndAddTrack(options)
  })

  ipcMain.handle('behera:compress-track', async (_, trackId: string) => {
    return await beheraRepoManager.compressTrack(trackId)
  })




  // Cloudflare R2 IPCs
  ipcMain.handle('cloudflare:test-connection', async (_, config: CloudflareR2Config) => {
    return await cloudflareR2Manager.testConnection(config)
  })

  ipcMain.handle('cloudflare:upload-clip', async (_, clipId: string) => {
    return await cloudflareR2Manager.uploadAudioClip(clipId)
  })

  ipcMain.handle('cloudflare:upload-behera-track', async (_, trackId: string) => {
    return await cloudflareR2Manager.uploadBeheraTrack(trackId)
  })

  ipcMain.handle('cloudflare:sync-all', async () => {
    return await cloudflareR2Manager.syncAllToR2()
  })

  ipcMain.handle('cloudflare:pull-from-r2', async () => {
    return await cloudflareR2Manager.pullFromR2()
  })

  ipcMain.handle('cloudflare:get-presigned-url', async (_, r2Key: string) => {
    return await cloudflareR2Manager.getPresignedStreamUrl(r2Key)
  })

  ipcMain.handle('cloudflare:download-offline', async (_, trackId: string) => {
    return await cloudflareR2Manager.downloadTrackForOffline(trackId)
  })



  // Settings Module IPCs
  ipcMain.handle('settings:get', async () => {
    return settingsManager.getSettings()
  })

  ipcMain.handle('settings:save', async (_, newSettings: Partial<AppSettings>) => {
    return settingsManager.saveSettings(newSettings)
  })

  ipcMain.handle('settings:select-directory', async () => {
    return await settingsManager.selectDirectory()
  })

  ipcMain.handle('settings:check-tools', async () => {
    return await settingsManager.checkSystemTools()
  })

  // Updater IPCs
  ipcMain.handle('updater:check', async () => {
    return await appUpdaterManager.checkForUpdates()
  })

  ipcMain.handle('updater:download', async () => {
    await appUpdaterManager.downloadUpdate()
    return true
  })

  ipcMain.handle('updater:install', async () => {
    appUpdaterManager.quitAndInstall()
    return true
  })

  // Queue & Parallel Download IPCs
  ipcMain.handle(
    'queue:add',
    async (
      _,
      urls: string[],
      options?: { folderPath?: string; speaker?: string; autoAddToRepo?: boolean }
    ) => {
      return queueManager.addToQueue(urls, options)
    }
  )

  ipcMain.handle('queue:get', async () => {
    return queueManager.getQueue()
  })

  ipcMain.handle('queue:cancel', async (_, id: string) => {
    return queueManager.cancelItem(id)
  })

  ipcMain.handle('queue:retry', async (_, id: string) => {
    return queueManager.retryItem(id)
  })

  ipcMain.handle('queue:clear-completed', async () => {
    queueManager.clearCompleted()
    return true
  })

  ipcMain.handle('queue:clear-all', async () => {
    queueManager.clearAll()
    return true
  })

  ipcMain.handle('queue:set-concurrency', async (_, limit: number) => {
    return queueManager.setConcurrency(limit)
  })

  // Channel Watcher IPCs
  ipcMain.handle('watcher:get-channels', async () => {
    const { channelWatcherManager } = await import('./modules/channelWatcher')
    return channelWatcherManager.getChannels()
  })

  ipcMain.handle(
    'watcher:add-channel',
    async (
      _,
      url: string,
      options?: { name?: string; folderPath?: string; speaker?: string; autoUploadR2?: boolean }
    ) => {
      const { channelWatcherManager } = await import('./modules/channelWatcher')
      return channelWatcherManager.addChannel(url, options)
    }
  )

  ipcMain.handle('watcher:remove-channel', async (_, id: string) => {
    const { channelWatcherManager } = await import('./modules/channelWatcher')
    return channelWatcherManager.removeChannel(id)
  })

  ipcMain.handle('watcher:toggle-channel', async (_, id: string, enabled: boolean) => {
    const { channelWatcherManager } = await import('./modules/channelWatcher')
    return channelWatcherManager.toggleChannel(id, enabled)
  })

  ipcMain.handle('watcher:check-now', async (_, id?: string) => {
    const { channelWatcherManager } = await import('./modules/channelWatcher')
    if (id) {
      return await channelWatcherManager.checkChannel(id)
    }
    return await channelWatcherManager.checkAllChannels()
  })

  // Google YouTube Data API & Discovery IPCs
  ipcMain.handle(
    'youtube:search',
    async (_, query: string, maxResults?: number, customApiKey?: string) => {
      const { youtubeApiManager } = await import('./modules/youtubeApi')
      return youtubeApiManager.searchVideos(query, maxResults, customApiKey)
    }
  )

  ipcMain.handle(
    'youtube:enqueue',
    async (_, videos: any[], targetFolder?: string) => {
      const { youtubeApiManager } = await import('./modules/youtubeApi')
      return youtubeApiManager.enqueueDiscoveredVideos(videos, targetFolder)
    }
  )

  // Discourse Playlist & LGLG Catalog IPCs
  ipcMain.handle('playlist:get-all', async () => {
    const { playlistCatalogManager } = await import('./modules/playlistCatalog')
    return playlistCatalogManager.getPlaylists()
  })

  ipcMain.handle('playlist:add-custom', async (_, playlist: any) => {
    const { playlistCatalogManager } = await import('./modules/playlistCatalog')
    return playlistCatalogManager.addCustomPlaylist(playlist)
  })

  ipcMain.handle('playlist:remove', async (_, id: string) => {
    const { playlistCatalogManager } = await import('./modules/playlistCatalog')
    return playlistCatalogManager.removePlaylist(id)
  })

  ipcMain.handle('playlist:fetch-from-url', async (_, playlistUrl: string) => {
    const { playlistCatalogManager } = await import('./modules/playlistCatalog')
    return playlistCatalogManager.fetchVideosFromYouTubePlaylist(playlistUrl)
  })

  ipcMain.handle('playlist:enqueue-batch', async (_, playlistId: string, targetFolder?: string) => {
    const { playlistCatalogManager } = await import('./modules/playlistCatalog')
    return playlistCatalogManager.batchEnqueuePlaylist(playlistId, targetFolder)
  })
}






app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.vanistudio.app')

  // Handle media protocol with full HTTP 206 Byte-Range streaming for local & cloud audio

  protocol.handle('media', async (request) => {
    try {
      const rawPath = decodeURIComponent(request.url.replace(/^media:\/\/local-file\//, ''))

      if (!existsSync(rawPath)) {
        // Check if rawPath is an R2 key or track with cloud url
        if (rawPath.startsWith('behera-audio/') || rawPath.startsWith('audio/')) {
          try {
            const streamUrl = await cloudflareR2Manager.getPresignedStreamUrl(rawPath)
            return Response.redirect(streamUrl, 302)
          } catch (_) {}
        }
        return new Response('Media file not found', { status: 404 })
      }

      const stat = statSync(rawPath)
      const fileSize = stat.size

      const rangeHeader = request.headers.get('range')

      if (rangeHeader) {
        const match = rangeHeader.match(/bytes=(\d+)-(\d+)?/)
        if (match) {
          const start = parseInt(match[1], 10)
          const end = match[2] ? parseInt(match[2], 10) : fileSize - 1
          const chunkSize = end - start + 1
          const stream = createReadStream(rawPath, { start, end })
          const webStream = Readable.toWeb(stream) as unknown as ReadableStream

          return new Response(webStream, {
            status: 206,
            statusText: 'Partial Content',
            headers: {
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': String(chunkSize),
              'Content-Type': 'audio/mpeg'
            }
          })
        }
      }

      const stream = createReadStream(rawPath)
      const webStream = Readable.toWeb(stream) as unknown as ReadableStream
      return new Response(webStream, {
        status: 200,
        headers: {
          'Content-Length': String(fileSize),
          'Accept-Ranges': 'bytes',
          'Content-Type': 'audio/mpeg'
        }
      })
    } catch (e: any) {
      console.error('Error in media protocol handler:', e)
      return new Response(`Error streaming media: ${e.message}`, { status: 500 })
    }
  })


  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers()
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
