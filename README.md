# Modular Desktop Application (Electron + React + Vite)

A modern, extensible desktop application built with a plugin-style architecture from the ground up using **Electron**, **React 19**, **TypeScript**, **Vite (`electron-vite`)**, and **Tailwind CSS**.

---

## 🎯 Features & Core Modules

### 1. 🎵 Audio Repository & Precision Cropper (Module 1)
- **YouTube Audio Extractor**: Enter any YouTube video or music URL to fetch metadata (title, uploader, thumbnail, duration) and download high-quality audio directly to temporary storage using `yt-dlp`.
- **Real-Time Download Progress**: Live status updates showing percentage, download speed, ETA, and FFmpeg conversion steps.
- **Waveform Canvas Visualizer**: Decodes audio peaks dynamically into a high-resolution waveform canvas with scrubable playhead.
- **Precision Trimmer**: Dual-range sliders, precision millisecond timestamps (`mm:ss.ms`), and 1-click *"Set to Current Playhead"* buttons.
- **In-App Audio Player**: Full playback controls (Play/Pause, Preview Selected Crop Only, Jump +/- 5s, Loop Selection, Volume & Mute).
- **Metadata Management**: Save trimmed clips with custom Title, Artist/Creator, and `#tags`.
- **Local Repository Explorer**: Search clips by title/artist/tags, filter by tag chips, listen to saved clips in-app, reveal in Windows File Explorer with one click, or delete.
- **Local JSON Indexing**: Stores all metadata in a portable `repo.json` next to audio files in `Documents/MyRepo/Audio` (or any custom folder).

### 2. ⚙️ Settings & System Diagnostics
- **Live Tool Diagnostics**: 1-click diagnostic check verifying Node.js, `FFmpeg`, and `yt-dlp` availability and versions.
- **Custom Repository Destination**: Select and change the local audio repository storage directory via native Windows folder picker.
- **Audio Output Defaults**: Configurable default format (MP3, WAV, AAC) and bitrate (128k, 192k, 256k, 320k).
- **Executable Overrides**: Support for custom binary paths if tools are installed in custom directories.

### 3. 🧩 Extensible Plugin Architecture
Designed with clean separation across backend, bridge, and frontend:
- **Main Process Modules**: [`src/main/modules/`](./src/main/modules/)
- **Preload Secure Bridge**: [`src/preload/index.ts`](./src/preload/index.ts)
- **Renderer Module Views**: [`src/renderer/src/modules/`](./src/renderer/src/modules/)
- Ready-to-use plugin slots in the sidebar for PDF Organizers, Task Trackers, Stock Market Scripts, etc.

---

## 🚀 Getting Started

### 1. Prerequisites (Already installed on your system)
- **Node.js LTS** (v24.x)
- **FFmpeg** (v8.1.1+)
- **yt-dlp** (2026.07+)

### 2. Start Development Server (with Hot Reloading)
```bash
npm run dev
```

### 3. Build & Package
```bash
# Type check & compile
npm run build

# Package Windows Installer (.exe)
npm run build:win
```

---

## 🏗️ Project Architecture

```
modular-desktop-app/
├── src/
│   ├── main/
│   │   ├── index.ts               # App lifecycle, window management, IPC registration, custom media:// protocol
│   │   └── modules/
│   │       ├── types.ts           # Shared TypeScript interfaces (Audio, Settings, Tools)
│   │       ├── audioRepo.ts       # yt-dlp downloader, FFmpeg precision trimmer, repo.json manager
│   │       └── settings.ts        # App configuration, diagnostics, and directory dialogs
│   ├── preload/
│   │   ├── index.ts               # contextBridge APIs (audioAPI, settingsAPI, systemAPI)
│   │   └── index.d.ts             # Global TypeScript declarations for window object
│   └── renderer/
│       ├── index.html             # HTML shell with media CSP
│       └── src/
│           ├── App.tsx            # Main shell with dynamic active module loader
│           ├── assets/
│           │   └── main.css       # Tailwind CSS v4 and dark theme design tokens
│           ├── components/
│           │   └── Sidebar.tsx    # Navigation menu with core modules, plugins, and settings
│           └── modules/
│               ├── index.ts       # Central Module Registry
│               ├── audio/         # Audio Repo & Cropper module components
│               │   ├── AudioRepoModule.tsx
│               │   └── components/
│               │       ├── YoutubeDownloader.tsx
│               │       ├── AudioWaveformTrimmer.tsx
│               │       └── RepositoryExplorer.tsx
│               ├── settings/      # Settings & System Diagnostics module
│               │   └── SettingsModule.tsx
│               └── placeholders/  # Plugin demonstration view
│                   └── PlaceholderModule.tsx
```
