import React, { useState, useEffect } from 'react'
import { Scissors, FolderHeart, ArrowLeft, Layers, Search, ListMusic } from 'lucide-react'
import YoutubeDownloader from './components/YoutubeDownloader'
import AudioWaveformTrimmer from './components/AudioWaveformTrimmer'
import RepositoryExplorer from './components/RepositoryExplorer'
import BatchQueueDownloader from './components/BatchQueueDownloader'
import YouTubeDiscoveryFetcher from './components/YouTubeDiscoveryFetcher'
import PlaylistCatalogModule from '../playlist/PlaylistCatalogModule'
import { VideoInfo } from '../../../../main/modules/types'

const AudioRepoModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'playlists' | 'discovery' | 'trimmer' | 'batch' | 'repo'>('playlists')
  const [activeTempAudio, setActiveTempAudio] = useState<{
    filePath: string
    videoInfo: VideoInfo
  } | null>(null)
  const [repoCount, setRepoCount] = useState<number>(0)
  const [repoKeyTrigger, setRepoKeyTrigger] = useState<number>(0)

  const updateRepoCount = async () => {
    try {
      const items = await window.audioAPI.getRepo()
      setRepoCount(items ? items.length : 0)
    } catch (e) {
      console.warn('Error fetching repo count:', e)
    }
  }

  useEffect(() => {
    updateRepoCount()
  }, [repoKeyTrigger])

  const handleAudioReady = (tempFilePath: string, videoInfo: VideoInfo) => {
    setActiveTempAudio({ filePath: tempFilePath, videoInfo })
  }

  const handleSavedToRepo = () => {
    setRepoKeyTrigger((prev) => prev + 1)
  }

  const handleSendToTrimmerFromBatch = (tempFilePath: string, videoInfo: VideoInfo) => {
    setActiveTempAudio({ filePath: tempFilePath, videoInfo })
    setActiveTab('trimmer')
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top Tab Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#2b3144] bg-[#161922]/60 backdrop-blur shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('playlists')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'playlists'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1f2330]'
            }`}
          >
            <ListMusic className="w-4 h-4 text-amber-300" />
            🔥 LGLG & Playlists
          </button>

          <button
            onClick={() => setActiveTab('discovery')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'discovery'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1f2330]'
            }`}
          >
            <Search className="w-4 h-4 text-indigo-300" />
            🔍 YouTube Discovery
          </button>

          <button
            onClick={() => setActiveTab('trimmer')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'trimmer'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1f2330]'
            }`}
          >
            <Scissors className="w-4 h-4" />
            Single Trimmer
          </button>

          <button
            onClick={() => setActiveTab('batch')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'batch'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1f2330]'
            }`}
          >
            <Layers className="w-4 h-4" />
            Batch Queue
          </button>

          <button
            onClick={() => setActiveTab('repo')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'repo'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1f2330]'
            }`}
          >
            <FolderHeart className="w-4 h-4" />
            Repository Library
            {repoCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'repo'
                    ? 'bg-white/20 text-white'
                    : 'bg-indigo-500/20 text-indigo-300'
                }`}
              >
                {repoCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'trimmer' && activeTempAudio && (
          <button
            onClick={() => setActiveTempAudio(null)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 px-3 py-1 rounded-lg border border-[#2b3144] hover:bg-[#1f2330] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Fetch Another Track
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
        {activeTab === 'playlists' ? (
          <PlaylistCatalogModule onSwitchedToQueue={() => setActiveTab('batch')} />
        ) : activeTab === 'discovery' ? (
          <YouTubeDiscoveryFetcher onSwitchedToQueue={() => setActiveTab('batch')} />
        ) : activeTab === 'trimmer' ? (
          <div className="space-y-6">
            {!activeTempAudio ? (
              <YoutubeDownloader onAudioReady={handleAudioReady} />
            ) : (
              <AudioWaveformTrimmer
                tempFilePath={activeTempAudio.filePath}
                videoInfo={activeTempAudio.videoInfo}
                onSavedToRepo={handleSavedToRepo}
                onCancel={() => setActiveTempAudio(null)}
              />
            )}
          </div>
        ) : activeTab === 'batch' ? (
          <BatchQueueDownloader onSendToTrimmer={handleSendToTrimmerFromBatch} />
        ) : (
          <RepositoryExplorer
            onStartNewClip={() => {
              setActiveTab('trimmer')
              setActiveTempAudio(null)
            }}
            keyTrigger={repoKeyTrigger}
          />
        )}
      </div>
    </div>
  )
}

export default AudioRepoModule


