import React from 'react'
import {
  Music,
  Headphones,
  Settings,
  FileText,
  CheckSquare,
  LucideIcon
} from 'lucide-react'

import AudioRepoModule from './audio/AudioRepoModule'
import BeheraRepoModule from './behera/BeheraRepoModule'
import SettingsModule from './settings/SettingsModule'
import PlaceholderModule from './placeholders/PlaceholderModule'

export interface AppModule {
  id: string
  name: string
  icon: LucideIcon
  description: string
  badge?: string
  component: React.ComponentType
  category: 'core' | 'plugin' | 'system'
  isAvailable: boolean
}

export const APP_MODULES: AppModule[] = [
  {
    id: 'behera-repo',
    name: "Dr. Laxmidhar Behera's Vault",
    icon: Headphones,
    description: "Hierarchical archive for Dr. Laxmidhar Behera's discourses, sequential playlist arranger, tagged clip player, and Cloudflare R2 cloud sync.",
    badge: 'R2 Cloud',
    component: BeheraRepoModule,
    category: 'core',
    isAvailable: true
  },

  {
    id: 'audio-repo',
    name: 'Batch Studio & Trimmer',
    icon: Music,
    description: 'High-speed multi-threaded YouTube ingestion, batch queue downloader, and waveform voice cropper.',
    badge: 'Turbo 9MB/s',
    component: AudioRepoModule,
    category: 'core',
    isAvailable: true
  },
  {
    id: 'pdf-organizer',
    name: 'Vani Scribe & Transcripts',
    icon: FileText,
    description: 'AI-assisted speech-to-text transcript generator, summary cards, and PDF lecture notes.',
    badge: 'Plug-in',
    component: () =>
      React.createElement(PlaceholderModule, {
        title: 'Vani Scribe & Transcription Studio',
        description: 'Automatic Whisper / Gemini lecture transcription, verse dictionary lookup, and PDF export.',
        icon: FileText,
        suggestedTools: ['Whisper.cpp', 'Gemini AI', 'PDF-Lib']
      }),
    category: 'plugin',
    isAvailable: false
  },
  {
    id: 'task-tracker',
    name: 'Discourse Curation Tasks',
    icon: CheckSquare,
    description: 'Collaborative audio curation workflow, review queue, and audio quality QA.',
    badge: 'Plug-in',
    component: () =>
      React.createElement(PlaceholderModule, {
        title: 'Discourse Curation & QA Pipeline',
        description: 'Track daily audio trimming goals, lecture tagging checklists, and contributor milestones.',
        icon: CheckSquare,
        suggestedTools: ['Local SQLite', 'Markdown Tracker', 'Live Sync']
      }),
    category: 'plugin',
    isAvailable: false
  },
  {
    id: 'settings',
    name: 'Cloud Vault & Preferences',
    icon: Settings,
    description: 'Configure Cloudflare R2 credentials, check embedded FFmpeg/yt-dlp tools, and manage automatic updates.',
    badge: 'R2 S3',
    component: SettingsModule,
    category: 'system',
    isAvailable: true
  }
]

