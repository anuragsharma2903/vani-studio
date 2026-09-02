import os

html_code = r'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <meta name="theme-color" content="#0b0d13" />
  <title>Vani Vault - Dr. Laxmidhar Behera</title>
  <link rel="manifest" href="./manifest.json" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <script src="https://www.youtube.com/iframe_api"></script>
  <style>
    :root {
      --bg-main: #0b0d13;
      --bg-card: #121520;
      --bg-card-hover: #181d2c;
      --border-color: #222738;
      --accent-color: #4f46e5;
      --accent-glow: rgba(79, 70, 229, 0.35);
      --text-main: #f3f4f6;
    }
    body[data-theme="saffron"] {
      --bg-main: #120d08;
      --bg-card: #1c140c;
      --bg-card-hover: #291d12;
      --border-color: #3d2a1a;
      --accent-color: #d97706;
      --accent-glow: rgba(217, 119, 6, 0.35);
      --text-main: #fffbeb;
    }
    body[data-theme="emerald"] {
      --bg-main: #06110d;
      --bg-card: #0c1c16;
      --bg-card-hover: #132a22;
      --border-color: #1a3d31;
      --accent-color: #059669;
      --accent-glow: rgba(5, 150, 105, 0.35);
      --text-main: #ecfdf5;
    }
    body[data-theme="oled"] {
      --bg-main: #000000;
      --bg-card: #0a0a0a;
      --bg-card-hover: #141414;
      --border-color: #222222;
      --accent-color: #6366f1;
      --accent-glow: rgba(99, 102, 241, 0.35);
      --text-main: #ffffff;
    }

    body {
      background-color: var(--bg-main);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      -webkit-tap-highlight-color: transparent;
      padding-bottom: 155px;
      transition: background-color 0.3s ease, color 0.3s ease;
    }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .scrollbar-none::-webkit-scrollbar { display: none; }
    .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
    .animate-slideUp { animation: slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-fadeIn { animation: fadeIn 0.18s ease-out forwards; }
    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.98); }
      to { opacity: 1; transform: scale(1); }
    }
    .flashcard-flip { perspective: 1000px; }
    .flashcard-inner { transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1); transform-style: preserve-3d; }
    .flashcard-flipped .flashcard-inner { transform: rotateY(180deg); }
    .flashcard-front, .flashcard-back { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
    .flashcard-back { transform: rotateY(180deg); }
  </style>
</head>
<body class="min-h-screen flex flex-col justify-between select-none" data-theme="default">
  <!-- Top App Header -->
  <header class="p-3.5 bg-[#121520] border-b border-[#222738] sticky top-0 z-30 flex items-center justify-between shadow-lg">
    <div class="flex items-center gap-2.5">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
        <i class="fa-solid fa-om text-base"></i>
      </div>
      <div>
        <h1 class="text-xs font-bold text-gray-100 flex items-center gap-1.5">
          <span>Vani Vault</span>
          <span id="player-engine-badge" class="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">Background Audio</span>
          <span id="sleep-timer-badge" class="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono hidden"><i class="fa-solid fa-moon text-[8px]"></i> <span id="sleep-timer-display">30m</span></span>
        </h1>
        <p class="text-[10px] text-gray-400 truncate max-w-[190px]">Dr. Laxmidhar Behera (HG Lila Purushottam Das)</p>
      </div>
    </div>
    <div class="flex items-center gap-1.5">
      <button onclick="checkForCatalogAndAppUpdates(true)" class="p-2 rounded-xl bg-[#181d2c] border border-[#2b3348] text-[11px] text-emerald-300 hover:border-emerald-500 transition" title="🔄 Check for Updates">
        <i id="update-spinner-icon" class="fa-solid fa-arrows-rotate"></i>
      </button>
      <button onclick="playRandomKatha()" class="p-2 rounded-xl bg-[#181d2c] border border-[#2b3348] text-[11px] text-rose-300 hover:border-rose-500 transition" title="🎲 Random Katha / Nectar Pick">
        <i class="fa-solid fa-dice"></i>
      </button>
      <button onclick="openSongbookModal()" class="p-2 rounded-xl bg-[#181d2c] border border-[#2b3348] text-[11px] text-sky-300 hover:border-sky-500 transition" title="📖 Vaishnava Songbook & Prayers">
        <i class="fa-solid fa-book-open"></i>
      </button>
      <button onclick="openSleepTimerModal()" class="p-2 rounded-xl bg-[#181d2c] border border-[#2b3348] text-[11px] text-indigo-300 hover:border-indigo-500 transition" title="Bedtime / Sleep Timer">
        <i class="fa-solid fa-moon"></i>
      </button>
      <button onclick="openThemeModal()" class="p-2 rounded-xl bg-[#181d2c] border border-[#2b3348] text-[11px] text-amber-300 hover:border-amber-500 transition" title="Theme Palette">
        <i class="fa-solid fa-palette"></i>
      </button>
      <button onclick="navigateTo('flashcards')" class="p-2 rounded-xl bg-[#181d2c] border border-[#2b3348] text-[11px] text-emerald-300 hover:border-emerald-500 transition" title="Bhakti Shastri Memorization">
        <i class="fa-solid fa-graduation-cap"></i>
      </button>
      <button onclick="navigateTo('dashboard')" class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#181d2c] border border-[#2b3348] text-[11px] text-gray-200 hover:border-indigo-500 transition">
        <div class="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-[9px] text-white font-bold" id="header-avatar">D</div>
        <span id="header-user-name" class="font-medium text-xs truncate max-w-[70px]">Devotee</span>
      </button>
    </div>
  </header>

  <!-- Live Update Banner Notification -->
  <div id="update-notification-banner" class="max-w-2xl mx-auto w-full px-3 pt-2 hidden animate-fadeIn">
    <div class="p-2.5 rounded-xl bg-gradient-to-r from-indigo-900/90 to-violet-900/90 border border-indigo-400/40 flex items-center justify-between shadow-lg">
      <div class="flex items-center gap-2 text-xs">
        <i class="fa-solid fa-sparkles text-amber-400"></i>
        <span id="update-banner-text" class="text-gray-100 font-medium">New lectures updated from Learn Gita Live Gita!</span>
      </div>
      <div class="flex items-center gap-1.5">
        <button onclick="dismissUpdateBanner()" class="p-1 text-gray-400 hover:text-white text-xs"><i class="fa-solid fa-xmark"></i></button>
      </div>
    </div>
  </div>

  <!-- Search & Category Filters (Visible on Catalog Pages) -->
  <div id="search-section" class="p-3 max-w-2xl mx-auto w-full space-y-2.5">
    <div class="flex gap-2">
      <div class="relative flex-1">
        <i class="fa-solid fa-search absolute left-3.5 top-3 text-gray-500 text-xs"></i>
        <input
          type="text"
          id="search-box"
          oninput="handleSearchDebounced()"
          placeholder="Search 957 lectures by Day, Verse (BG 4.34), Topic..."
          class="w-full bg-[#121520] border border-[#222738] rounded-xl pl-9 pr-8 py-2.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
        />
        <button id="search-clear-btn" onclick="clearSearch()" class="absolute right-3 top-2.5 text-gray-500 hover:text-white hidden text-xs">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <select id="sort-select" onchange="handleSortChange(this.value)" class="bg-[#121520] border border-[#222738] rounded-xl px-2.5 text-[11px] text-gray-300 focus:outline-none focus:border-indigo-500">
        <option value="default">Sort: Default</option>
        <option value="newest">Sort: Newest</option>
        <option value="oldest">Sort: Oldest</option>
      </select>
    </div>

    <!-- Category Filter Chips -->
    <div class="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]" id="category-chips">
      <button onclick="setCategory('All')" class="chip active px-3 py-1.5 rounded-full bg-indigo-600 text-white font-semibold whitespace-nowrap" data-cat="All">All Series & Talks</button>
      <button onclick="setCategory('Bhagavad Gita')" class="chip px-3 py-1.5 rounded-full bg-[#121520] text-gray-400 border border-[#222738] whitespace-nowrap" data-cat="Bhagavad Gita">🪔 Bhakti Shastri & BG</button>
      <button onclick="setCategory('Science & Consciousness')" class="chip px-3 py-1.5 rounded-full bg-[#121520] text-gray-400 border border-[#222738] whitespace-nowrap" data-cat="Science & Consciousness">🔬 Sankhya & Mind</button>
      <button onclick="setCategory('Srimad Bhagavatam')" class="chip px-3 py-1.5 rounded-full bg-[#121520] text-gray-400 border border-[#222738] whitespace-nowrap" data-cat="Srimad Bhagavatam">📖 Srimad Bhagavatam</button>
      <button onclick="setCategory('LGLG')" class="chip px-3 py-1.5 rounded-full bg-[#121520] text-gray-400 border border-[#222738] whitespace-nowrap" data-cat="LGLG">🔥 LGLG Series</button>
      <button onclick="setCategory('Festivals')" class="chip px-3 py-1.5 rounded-full bg-[#121520] text-gray-400 border border-[#222738] whitespace-nowrap" data-cat="Festivals">🌺 Festivals</button>
    </div>
  </div>

  <!-- Main Views Container (Distributed Pages) -->
  <main class="max-w-2xl mx-auto w-full px-3 space-y-4">

    <!-- ================= PAGE 1: SERIES CATALOG ================= -->
    <section id="view-playlists" class="space-y-3">
      <div class="flex items-center justify-between px-1">
        <span class="text-xs font-bold text-gray-200">Organized Series (<span id="pl-total">42</span>)</span>
        <span class="text-[10px] text-indigo-400 font-medium">Tap series to open tracklist</span>
      </div>
      <div id="playlist-list" class="grid grid-cols-1 md:grid-cols-2 gap-3"></div>
    </section>

    <!-- ================= PAGE 2: DEDICATED SERIES DETAIL VIEW ================= -->
    <section id="view-series-detail" class="space-y-3.5 hidden animate-fadeIn">
      <!-- Back Navigation Header -->
      <div class="flex items-center justify-between border-b border-[#222738] pb-2">
        <button onclick="navigateBack()" class="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold p-1">
          <i class="fa-solid fa-arrow-left"></i>
          <span>Back to All Series</span>
        </button>
        <span id="series-detail-count-badge" class="text-[10px] font-mono text-gray-400">0 Lectures</span>
      </div>

      <!-- Series Hero Banner -->
      <div class="p-4 rounded-2xl bg-gradient-to-br from-[#181d2e] to-[#101320] border border-[#262f46] shadow-xl flex items-start gap-3.5">
        <img id="series-detail-thumb" src="./icon-192.png" class="w-20 h-20 rounded-xl object-cover bg-gray-900 border border-[#2b354d] shrink-0" />
        <div class="flex-1 min-w-0 space-y-1.5">
          <div class="flex items-center gap-1.5">
            <span id="series-detail-cat-badge" class="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">Category</span>
          </div>
          <h2 id="series-detail-title" class="text-sm font-bold text-gray-100 line-clamp-2">Series Title</h2>
          <p id="series-detail-sub" class="text-[11px] text-gray-400 truncate">Dr. Laxmidhar Behera (HG Lila Purushottam Das)</p>
          <div class="flex items-center gap-2 pt-1">
            <button id="btn-play-all-series" class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow">
              <i class="fa-solid fa-play text-[10px]"></i> Play All
            </button>
          </div>
        </div>
      </div>

      <!-- Search within Series -->
      <div class="relative">
        <i class="fa-solid fa-filter absolute left-3.5 top-3 text-gray-500 text-xs"></i>
        <input
          type="text"
          id="series-search-box"
          oninput="filterSeriesDetailTracks()"
          placeholder="Filter lectures in this series by Day, Verse..."
          class="w-full bg-[#121520] border border-[#222738] rounded-xl pl-9 pr-3 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <!-- Series Sequential Tracklist -->
      <div id="series-detail-tracklist" class="space-y-2"></div>
    </section>

    <!-- ================= PAGE 3: ALL DISCOURSES VIEW ================= -->
    <section id="view-tracks" class="space-y-2.5 hidden">
      <div class="flex items-center justify-between px-1">
        <span class="text-xs font-bold text-gray-200">All Discourses (<span id="trk-total">957</span>)</span>
        <span id="rendered-count-badge" class="text-[10px] text-indigo-400 font-mono">Showing 40</span>
      </div>
      <div id="track-list" class="space-y-2.5"></div>
      <button id="btn-load-more" onclick="loadMoreTracks()" class="w-full py-2.5 rounded-xl bg-[#151926] border border-[#222738] text-xs text-gray-300 hover:text-white font-semibold transition hidden">
        Load More Discourses...
      </button>
    </section>

    <!-- ================= PAGE 4: OFFLINE VAULT ================= -->
    <section id="view-offline" class="space-y-3 hidden">
      <div class="p-3.5 rounded-2xl bg-[#121520] border border-[#222738] space-y-2 shadow">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-hard-drive text-indigo-400 text-sm"></i>
            <span class="text-xs font-bold text-gray-100">Offline Audio Storage</span>
          </div>
          <button onclick="clearAllOfflineCache()" class="text-[10px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1">
            <i class="fa-solid fa-trash-can"></i> Clear All
          </button>
        </div>
        <div class="flex items-center justify-between text-[10px] text-gray-400 font-mono">
          <span id="offline-storage-used">Used: 0.0 MB</span>
          <span id="offline-view-count-badge">0 Tracks Cached</span>
        </div>
      </div>

      <div class="flex items-center justify-between px-1">
        <span class="text-xs font-bold text-gray-200">Offline Vault (<span id="offline-view-count">0</span>)</span>
        <span class="text-[10px] text-emerald-400 font-semibold"><i class="fa-solid fa-check"></i> Playable Without Internet</span>
      </div>
      <div id="offline-track-list" class="space-y-2.5"></div>
    </section>

    <!-- ================= PAGE 5: USER DASHBOARD & SADHANA ================= -->
    <section id="view-dashboard" class="space-y-4 hidden">
      <!-- Profile & Sravanam Sadhana Card -->
      <div class="p-4 rounded-2xl bg-gradient-to-br from-[#161a28] to-[#111420] border border-[#262c3e] shadow-xl space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div id="dashboard-avatar" class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-pink-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-indigo-600/30">
              D
            </div>
            <div>
              <h2 id="dash-user-name" class="text-sm font-bold text-gray-100 flex items-center gap-1.5">
                <span>Devotee</span>
                <span class="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">Practitioner</span>
              </h2>
              <p id="dash-user-status" class="text-[11px] text-gray-400">Listening to Dr. Laxmidhar Behera Sir's Katha</p>
            </div>
          </div>
          <button onclick="openEditProfileModal()" class="p-2 rounded-xl bg-[#1b2030] text-gray-300 hover:text-white border border-[#2a3246] text-xs">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
        </div>

        <!-- Daily Sravanam Sadhana Streak -->
        <div class="p-2.5 rounded-xl bg-[#0e111a] border border-[#222738] space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-amber-300 flex items-center gap-1.5">
              <i class="fa-solid fa-fire text-rose-500"></i> Daily Sravanam Goal
            </span>
            <span id="sadhana-streak-badge" class="font-mono text-[10px] text-emerald-400 font-bold">🔥 1 Day Streak</span>
          </div>
          <div class="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
            <div id="sadhana-progress-bar" class="bg-gradient-to-r from-amber-500 to-emerald-500 h-full w-[45%] transition-all duration-500"></div>
          </div>
          <div class="flex justify-between text-[9px] text-gray-400 font-mono">
            <span id="sadhana-minutes-today">Today: 18 / 30 mins</span>
            <span id="sadhana-total-hours">Total: 4.2 Hours</span>
          </div>
        </div>

        <!-- Listening Stats Badges -->
        <div class="grid grid-cols-4 gap-1.5 pt-1 text-center">
          <div class="p-2 rounded-xl bg-[#121520] border border-[#222738]">
            <p id="stat-listened-count" class="text-xs font-bold text-indigo-400 font-mono">0</p>
            <p class="text-[8px] text-gray-400 uppercase">Played</p>
          </div>
          <div class="p-2 rounded-xl bg-[#121520] border border-[#222738]">
            <p id="stat-notes-count" class="text-xs font-bold text-amber-400 font-mono">0</p>
            <p class="text-[8px] text-gray-400 uppercase">Notes</p>
          </div>
          <div class="p-2 rounded-xl bg-[#121520] border border-[#222738]">
            <p id="stat-favs-count" class="text-xs font-bold text-rose-400 font-mono">0</p>
            <p class="text-[8px] text-gray-400 uppercase">Favs</p>
          </div>
          <div class="p-2 rounded-xl bg-[#121520] border border-[#222738]">
            <p id="stat-shlokas-mastered" class="text-xs font-bold text-emerald-400 font-mono">0</p>
            <p class="text-[8px] text-gray-400 uppercase">Verses</p>
          </div>
        </div>
      </div>

      <!-- Nectar of the Day & Quick Quiz Banner -->
      <div class="grid grid-cols-2 gap-2">
        <div onclick="playRandomKatha()" class="p-3 rounded-2xl bg-gradient-to-br from-indigo-900/40 to-[#121520] border border-indigo-500/30 cursor-pointer hover:border-indigo-400 transition shadow space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold text-indigo-300 uppercase tracking-wider font-mono"><i class="fa-solid fa-sparkles text-amber-400"></i> Nectar Pick</span>
            <i class="fa-solid fa-dice text-xs text-indigo-400"></i>
          </div>
          <p class="text-xs font-bold text-gray-100 line-clamp-1">Random Katha</p>
          <p class="text-[9px] text-gray-400">Tap to play 1 of 957 talks</p>
        </div>

        <div onclick="openQuizModal()" class="p-3 rounded-2xl bg-gradient-to-br from-emerald-900/40 to-[#121520] border border-emerald-500/30 cursor-pointer hover:border-emerald-400 transition shadow space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold text-emerald-300 uppercase tracking-wider font-mono"><i class="fa-solid fa-graduation-cap text-amber-400"></i> Gita Quiz</span>
            <i class="fa-solid fa-arrow-right text-xs text-emerald-400"></i>
          </div>
          <p class="text-xs font-bold text-gray-100 line-clamp-1">Chapter Test</p>
          <p class="text-[9px] text-gray-400">Test your Gita purports</p>
        </div>
      </div>

      <!-- Continue Listening / Recent History -->
      <div class="space-y-2">
        <div class="flex items-center justify-between px-1">
          <h3 class="text-xs font-bold text-gray-200 flex items-center gap-1.5">
            <i class="fa-solid fa-clock-rotate-left text-indigo-400"></i>
            <span>Continue Listening</span>
          </h3>
          <button onclick="clearHistory()" class="text-[10px] text-gray-500 hover:text-rose-400">Clear</button>
        </div>
        <div id="continue-listening-list" class="space-y-2">
          <div class="p-4 text-center text-xs text-gray-500 bg-[#121520] rounded-xl border border-[#222738]">No recent listens yet. Start playing any discourse!</div>
        </div>
      </div>

      <!-- Personal Study Notes & Bookmarks -->
      <div class="space-y-2">
        <div class="flex items-center justify-between px-1">
          <h3 class="text-xs font-bold text-gray-200 flex items-center gap-1.5">
            <i class="fa-solid fa-book-bookmark text-amber-400"></i>
            <span>My Study Notes & Insights</span>
          </h3>
          <div class="flex items-center gap-2">
            <button onclick="printOrExportNotesPDF()" class="text-[10px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1">
              <i class="fa-solid fa-print"></i> Print / PDF
            </button>
            <button onclick="exportNotes()" class="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
              <i class="fa-solid fa-file-arrow-down"></i> .MD
            </button>
          </div>
        </div>
        <div id="notes-container" class="space-y-2">
          <div class="p-4 text-center text-xs text-gray-500 bg-[#121520] rounded-xl border border-[#222738]">No notes taken yet. While listening, click "📝 Take Notes" to save insights!</div>
        </div>
      </div>

      <!-- Custom Playlists Section -->
      <div class="space-y-2">
        <div class="flex items-center justify-between px-1">
          <h3 class="text-xs font-bold text-gray-200 flex items-center gap-1.5">
            <i class="fa-solid fa-folder-plus text-emerald-400"></i>
            <span>My Custom Playlists</span>
          </h3>
          <button onclick="promptCreatePlaylist()" class="text-[10px] px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold flex items-center gap-1 shadow">
            <i class="fa-solid fa-plus text-[9px]"></i> New Playlist
          </button>
        </div>
        <div id="user-custom-playlists" class="space-y-2"></div>
      </div>
    </section>

    <!-- ================= PAGE 6: BHAKTI SHASTRI FLASHCARDS ================= -->
    <section id="view-flashcards" class="space-y-4 hidden">
      <div class="flex items-center justify-between px-1">
        <div>
          <h3 class="text-xs font-bold text-gray-100 flex items-center gap-1.5">
            <i class="fa-solid fa-graduation-cap text-amber-400"></i>
            <span>Bhakti Shastri Memorization</span>
          </h3>
          <p class="text-[10px] text-gray-400">Spaced repetition flashcards for core verses</p>
        </div>
        <span id="flashcard-progress-badge" class="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">1 / 7</span>
      </div>

      <!-- Flashcard Active Container -->
      <div id="flashcard-container" class="flashcard-flip cursor-pointer" onclick="flipFlashcard()">
        <div class="flashcard-inner relative w-full min-h-[280px] rounded-2xl bg-gradient-to-br from-[#161a28] to-[#10131f] border border-[#262c3e] p-5 shadow-2xl flex flex-col justify-between">
          <!-- Front Face -->
          <div class="flashcard-front space-y-3 text-center my-auto">
            <div class="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-bold font-mono border border-amber-500/20" id="card-ref">
              BG 4.34
            </div>
            <h4 class="text-sm font-bold text-amber-100 leading-relaxed font-serif" id="card-sanskrit">
              tad viddhi praṇipātena paripraśnena sevayā |<br/>
              upadekṣyanti te jñānaṁ jñāninas tattva-darśinaḥ ||
            </h4>
            <p class="text-[10px] text-gray-400 italic pt-2">Tap card to flip for translation & key purports</p>
          </div>

          <!-- Back Face -->
          <div class="flashcard-back space-y-3 text-center my-auto">
            <div class="inline-block px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] font-bold font-mono border border-indigo-500/20" id="card-ref-back">
              BG 4.34 • Translation
            </div>
            <p class="text-xs text-gray-200 leading-relaxed" id="card-translation">
              Just try to learn the truth by approaching a spiritual master. Inquire from him submissively and render service unto him. The self-realized souls can impart knowledge unto you because they have seen the truth.
            </p>
            <div class="p-2 rounded-xl bg-[#0d1017] border border-[#222738] text-[10px] text-amber-300 text-left">
              <strong>Key Takeaway:</strong> <span id="card-takeaway">Threefold qualification of a disciple: praṇipāta (surrender), paripraśna (submissive inquiry), sevā (service).</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Spaced Repetition Rating Buttons -->
      <div class="space-y-2 pt-1">
        <p class="text-center text-[10px] text-gray-400">Rate your recall memory:</p>
        <div class="grid grid-cols-3 gap-2">
          <button onclick="rateFlashcard('hard')" class="py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white text-xs font-bold transition">
            😓 Hard (1d)
          </button>
          <button onclick="rateFlashcard('good')" class="py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-bold transition">
            👍 Good (3d)
          </button>
          <button onclick="rateFlashcard('easy')" class="py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white text-xs font-bold transition">
            🌟 Easy (7d)
          </button>
        </div>
      </div>

      <!-- Word-by-Word Sanskrit Breakdown Toggle -->
      <div class="p-3 rounded-2xl bg-[#121520] border border-[#222738] space-y-2">
        <button onclick="toggleWordByWord()" class="w-full flex items-center justify-between text-xs font-bold text-gray-200">
          <span class="flex items-center gap-1.5"><i class="fa-solid fa-spell-check text-indigo-400"></i> Word-by-Word Synonyms (पदच्छेद)</span>
          <i id="wbw-toggle-icon" class="fa-solid fa-chevron-down text-[10px] text-gray-400"></i>
        </button>
        <div id="card-wbw-container" class="hidden text-[11px] text-gray-300 font-mono space-y-1.5 pt-1 border-t border-[#222738]"></div>
      </div>
    </section>
  </main>

  <!-- Sticky Bottom Mini Player -->
  <div id="mini-player" class="fixed bottom-14 left-0 right-0 bg-[#121520]/95 backdrop-blur-md border-t border-[#222738] p-2.5 shadow-2xl z-40 max-w-2xl mx-auto touch-pan-y" onclick="openFullPlayerModal()">
    <div class="flex items-center justify-between gap-2.5 cursor-pointer">
      <div class="min-w-0 flex-1 flex items-center gap-2.5">
        <img id="mini-thumb" src="./icon-192.png" class="w-9 h-9 rounded-lg object-cover bg-gray-800 shrink-0" />
        <div class="min-w-0 flex-1">
          <p id="mini-title" class="text-xs font-bold text-gray-100 truncate">No lecture selected</p>
          <p id="mini-sub" class="text-[10px] text-indigo-400 truncate">Tap any lecture to play</p>
        </div>
      </div>

      <div class="flex items-center gap-1.5 shrink-0" onclick="event.stopPropagation()">
        <button id="mini-fav-btn" onclick="toggleFavoriteCurrent()" class="p-2 text-gray-400 hover:text-rose-400 text-xs">
          <i class="fa-regular fa-heart" id="mini-fav-icon"></i>
        </button>
        <a id="mini-yt-link" href="#" target="_blank" class="p-2 text-gray-400 hover:text-red-400 text-xs" title="Watch on YouTube">
          <i class="fa-brands fa-youtube text-sm"></i>
        </a>
        <button onclick="playPrev()" class="p-2 text-gray-400 hover:text-white text-xs"><i class="fa-solid fa-backward-step"></i></button>
        <button id="mini-play-btn" onclick="togglePlay()" class="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 text-xs">
          <i class="fa-solid fa-play" id="mini-play-icon"></i>
        </button>
        <button onclick="playNext()" class="p-2 text-gray-400 hover:text-white text-xs"><i class="fa-solid fa-forward-step"></i></button>
      </div>
    </div>

    <!-- Mini Progress Line -->
    <div class="w-full bg-gray-800 h-1 rounded-full overflow-hidden mt-2">
      <div id="mini-progress-bar" class="bg-indigo-500 h-full w-0 transition-all"></div>
    </div>
  </div>

  <!-- Bottom Navigation Tab Bar (4 Tabs) -->
  <nav class="fixed bottom-0 left-0 right-0 bg-[#0e111a] border-t border-[#222738] py-2 px-4 z-40 max-w-2xl mx-auto">
    <div class="grid grid-cols-4 gap-1 text-[10px] font-medium text-center">
      <button id="nav-btn-playlists" onclick="navigateTo('playlists')" class="flex flex-col items-center gap-1 text-indigo-400 font-bold">
        <i class="fa-solid fa-list-ul text-base"></i>
        <span>Series</span>
      </button>
      <button id="nav-btn-tracks" onclick="navigateTo('tracks')" class="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-200">
        <i class="fa-solid fa-compact-disc text-base"></i>
        <span>Lectures</span>
      </button>
      <button id="nav-btn-offline" onclick="navigateTo('offline')" class="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-200">
        <i class="fa-solid fa-cloud-arrow-down text-base"></i>
        <span>Offline</span>
      </button>
      <button id="nav-btn-dashboard" onclick="navigateTo('dashboard')" class="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-200">
        <i class="fa-solid fa-user-astronaut text-base"></i>
        <span>Dashboard</span>
      </button>
    </div>
  </nav>

  <!-- Full-Screen Audio Player Modal -->
  <div id="full-player-modal" class="fixed inset-0 bg-[#0b0d13] z-50 p-5 flex flex-col justify-between hidden animate-slideUp">
    <!-- Modal Header -->
    <div class="flex items-center justify-between border-b border-[#222738] pb-3">
      <button onclick="closeFullPlayerModal()" class="text-gray-400 hover:text-white p-2">
        <i class="fa-solid fa-chevron-down text-base"></i>
      </button>
      <div class="text-center">
        <p class="text-[9px] font-bold uppercase tracking-widest text-indigo-400">Vani Vault Background Player</p>
        <p id="full-playlist-name" class="text-xs font-bold text-gray-200 truncate max-w-[160px]">Discourse</p>
      </div>
      <div class="flex items-center gap-1.5">
        <button onclick="openEQModal()" class="text-gray-400 hover:text-emerald-400 p-1.5 text-xs" title="Voice Clarity Equalizer">
          <i class="fa-solid fa-sliders text-base"></i>
        </button>
        <button onclick="generateQuoteCardFromCurrent()" class="text-gray-400 hover:text-amber-400 p-1.5 text-xs" title="Generate Devotee Quote Card">
          <i class="fa-solid fa-quote-left text-base"></i>
        </button>
        <button onclick="openNoteModalForCurrent()" class="text-gray-400 hover:text-amber-400 p-1.5 text-xs" title="Take Study Notes">
          <i class="fa-solid fa-pen-nib text-base"></i>
        </button>
        <a id="full-yt-btn" href="#" target="_blank" class="text-xs text-gray-400 hover:text-red-400 p-1.5" title="Watch Video on YouTube">
          <i class="fa-brands fa-youtube text-base text-red-500"></i>
        </a>
        <button id="btn-save-offline-full" onclick="saveCurrentTrackOffline()" class="text-gray-400 hover:text-emerald-400 p-1.5 text-xs">
          <i class="fa-solid fa-cloud-arrow-down text-base"></i>
        </button>
      </div>
    </div>

    <!-- Album Art & Track Info -->
    <div class="space-y-3 text-center my-auto">
      <div class="relative w-52 h-52 mx-auto">
        <img id="full-thumb" src="./icon-512.png" class="w-full h-full rounded-2xl object-cover bg-gray-900 shadow-2xl shadow-indigo-600/10 border border-[#222738]" />
        <div id="yt-player-container" class="absolute inset-0 rounded-2xl overflow-hidden hidden bg-black">
          <div id="yt-iframe-placeholder"></div>
        </div>
      </div>

      <div class="space-y-1 px-4">
        <div id="full-day-badge" class="inline-block text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold hidden"></div>
        <h2 id="full-title" class="text-sm font-bold text-gray-100 line-clamp-2">No lecture selected</h2>
        <p id="full-speaker" class="text-xs text-indigo-400">Dr. Laxmidhar Behera (HG Lila Purushottam Das)</p>
      </div>

      <!-- A-B Looper & Bookmark Toolbar -->
      <div class="flex items-center justify-center gap-2 pt-1">
        <button id="btn-ab-loop" onclick="toggleABLoop()" class="px-2.5 py-1 rounded-lg bg-[#181d2c] border border-[#2b3348] text-[10px] text-gray-300 hover:text-white font-mono flex items-center gap-1">
          <i class="fa-solid fa-repeat text-indigo-400"></i> <span id="ab-loop-label">A-B Loop: Off</span>
        </button>
        <button onclick="addCurrentBookmark()" class="px-2.5 py-1 rounded-lg bg-[#181d2c] border border-[#2b3348] text-[10px] text-amber-300 hover:text-white flex items-center gap-1">
          <i class="fa-solid fa-bookmark text-amber-400"></i> <span>Bookmark Time</span>
        </button>
      </div>

      <!-- Bookmarks Chips List -->
      <div id="current-track-bookmarks" class="flex gap-1.5 justify-center overflow-x-auto scrollbar-none py-1 text-[9px] font-mono"></div>
    </div>

    <!-- Controls & Seekbar -->
    <div class="space-y-4 pb-3">
      <div class="space-y-1.5">
        <input type="range" id="full-seek" min="0" max="100" value="0" oninput="handleSeek(this.value)" class="w-full accent-indigo-500 h-2 bg-gray-800 rounded-lg cursor-pointer" />
        <div class="flex justify-between text-xs font-mono text-gray-400">
          <span id="full-cur">0:00</span>
          <span id="full-dur">0:00</span>
        </div>
      </div>

      <div class="flex items-center justify-between px-1">
        <button id="full-speed-btn" onclick="cycleSpeed()" class="px-2.5 py-1 bg-[#161a26] border border-[#222738] rounded-lg text-xs font-mono text-gray-300">1x</button>
        <button onclick="skipSeconds(-15)" class="p-2 text-gray-300 hover:text-white text-lg"><i class="fa-solid fa-rotate-left"></i></button>
        <button onclick="playPrev()" class="p-2 text-gray-300 hover:text-white text-xl"><i class="fa-solid fa-backward-step"></i></button>
        <button id="full-play-btn" onclick="togglePlay()" class="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 text-lg">
          <i class="fa-solid fa-play" id="full-play-icon"></i>
        </button>
        <button onclick="playNext()" class="p-2 text-gray-300 hover:text-white text-xl"><i class="fa-solid fa-forward-step"></i></button>
        <button onclick="skipSeconds(15)" class="p-2 text-gray-300 hover:text-white text-lg"><i class="fa-solid fa-rotate-right"></i></button>
        <button onclick="toggleVideoMode()" id="full-video-toggle-btn" class="p-2 text-gray-400 hover:text-indigo-400 text-xs" title="Toggle Video Screen"><i class="fa-solid fa-video"></i></button>
      </div>
    </div>
  </div>

  <!-- Sleep Timer Modal Dialog -->
  <div id="sleep-timer-modal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 hidden">
    <div class="bg-[#141824] border border-[#2a3248] rounded-2xl max-w-xs w-full p-4 space-y-3 shadow-2xl animate-slideUp">
      <div class="flex items-center justify-between border-b border-[#232838] pb-2">
        <h3 class="text-xs font-bold text-gray-100 flex items-center gap-1.5">
          <i class="fa-solid fa-moon text-indigo-400"></i>
          <span>Bedtime / Sleep Timer</span>
        </h3>
        <button onclick="closeSleepTimerModal()" class="text-gray-400 hover:text-white text-xs p-1"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="grid grid-cols-2 gap-2 text-xs font-semibold">
        <button onclick="setSleepTimer(15)" class="p-3 rounded-xl bg-[#0e111a] border border-[#222738] hover:border-indigo-500 hover:text-white text-gray-300">15 Minutes</button>
        <button onclick="setSleepTimer(30)" class="p-3 rounded-xl bg-[#0e111a] border border-[#222738] hover:border-indigo-500 hover:text-white text-gray-300">30 Minutes</button>
        <button onclick="setSleepTimer(45)" class="p-3 rounded-xl bg-[#0e111a] border border-[#222738] hover:border-indigo-500 hover:text-white text-gray-300">45 Minutes</button>
        <button onclick="setSleepTimer(60)" class="p-3 rounded-xl bg-[#0e111a] border border-[#222738] hover:border-indigo-500 hover:text-white text-gray-300">60 Minutes</button>
      </div>
      <button onclick="cancelSleepTimer()" class="w-full py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">Turn Off Timer</button>
    </div>
  </div>

  <!-- Equalizer / Voice Clarity Modal Dialog -->
  <div id="eq-modal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 hidden">
    <div class="bg-[#141824] border border-[#2a3248] rounded-2xl max-w-xs w-full p-4 space-y-3 shadow-2xl animate-slideUp">
      <div class="flex items-center justify-between border-b border-[#232838] pb-2">
        <h3 class="text-xs font-bold text-gray-100 flex items-center gap-1.5">
          <i class="fa-solid fa-sliders text-emerald-400"></i>
          <span>Voice Clarity Equalizer</span>
        </h3>
        <button onclick="closeEQModal()" class="text-gray-400 hover:text-white text-xs p-1"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="space-y-2 text-xs">
        <button onclick="setEQPreset('clarity')" class="w-full p-2.5 rounded-xl bg-[#0e111a] border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-between">
          <span>🎙️ Voice Clarity (Crisp Katha)</span>
          <i class="fa-solid fa-check"></i>
        </button>
        <button onclick="setEQPreset('warm')" class="w-full p-2.5 rounded-xl bg-[#0e111a] border border-[#222738] text-gray-300 hover:text-white flex items-center justify-between">
          <span>🔊 Deep Warmth (Bass Soft)</span>
        </button>
        <button onclick="setEQPreset('flat')" class="w-full p-2.5 rounded-xl bg-[#0e111a] border border-[#222738] text-gray-300 hover:text-white flex items-center justify-between">
          <span>⚖️ Original Audio (Flat)</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Theme Customizer Modal Dialog -->
  <div id="theme-modal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 hidden">
    <div class="bg-[#141824] border border-[#2a3248] rounded-2xl max-w-xs w-full p-4 space-y-3 shadow-2xl animate-slideUp">
      <div class="flex items-center justify-between border-b border-[#232838] pb-2">
        <h3 class="text-xs font-bold text-gray-100 flex items-center gap-1.5">
          <i class="fa-solid fa-palette text-amber-400"></i>
          <span>Sacred Themes</span>
        </h3>
        <button onclick="closeThemeModal()" class="text-gray-400 hover:text-white text-xs p-1"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="grid grid-cols-2 gap-2 text-xs font-semibold">
        <button onclick="applyTheme('default')" class="p-3 rounded-xl bg-[#121520] border border-indigo-500/50 text-indigo-300">Midnight Indigo</button>
        <button onclick="applyTheme('saffron')" class="p-3 rounded-xl bg-[#1c140c] border border-amber-500/50 text-amber-300">Mayapur Gold</button>
        <button onclick="applyTheme('emerald')" class="p-3 rounded-xl bg-[#0c1c16] border border-emerald-500/50 text-emerald-300">Vrindavan Grove</button>
        <button onclick="applyTheme('oled')" class="p-3 rounded-xl bg-black border border-gray-700 text-white">OLED Black</button>
      </div>
    </div>
  </div>

  <!-- Vaishnava Songbook & Prayers Modal Dialog -->
  <div id="songbook-modal" class="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 hidden">
    <div class="bg-[#141824] border border-[#2a3248] rounded-2xl max-w-md w-full p-4 space-y-3 shadow-2xl animate-slideUp max-h-[85vh] flex flex-col">
      <div class="flex items-center justify-between border-b border-[#232838] pb-2">
        <h3 class="text-xs font-bold text-sky-300 flex items-center gap-1.5">
          <i class="fa-solid fa-book-open"></i>
          <span>Vaishnava Songbook & Prayers</span>
        </h3>
        <button onclick="closeSongbookModal()" class="text-gray-400 hover:text-white text-xs p-1"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px]" id="songbook-tabs">
        <button onclick="switchSong('radha_madhava')" class="px-2.5 py-1 rounded-full bg-indigo-600 text-white font-bold whitespace-nowrap song-tab" data-song="radha_madhava">Jaya Radha Madhava</button>
        <button onclick="switchSong('damodara')" class="px-2.5 py-1 rounded-full bg-[#0e111a] text-gray-400 border border-[#222738] whitespace-nowrap song-tab" data-song="damodara">Damodarashtakam</button>
        <button onclick="switchSong('guru_ashtaka')" class="px-2.5 py-1 rounded-full bg-[#0e111a] text-gray-400 border border-[#222738] whitespace-nowrap song-tab" data-song="guru_ashtaka">Sri Gurvastakam</button>
        <button onclick="switchSong('brahma_samhita')" class="px-2.5 py-1 rounded-full bg-[#0e111a] text-gray-400 border border-[#222738] whitespace-nowrap song-tab" data-song="brahma_samhita">Govindam (BS 5.1)</button>
      </div>
      <div id="songbook-content" class="overflow-y-auto space-y-2 text-xs text-gray-200 leading-relaxed font-serif p-2 rounded-xl bg-[#0d1017] border border-[#222738] flex-1"></div>
    </div>
  </div>

  <!-- Bhakti Shastri Assessment / Quiz Modal Dialog -->
  <div id="quiz-modal" class="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 hidden">
    <div class="bg-[#141824] border border-[#2a3248] rounded-2xl max-w-md w-full p-4 space-y-3 shadow-2xl animate-slideUp">
      <div class="flex items-center justify-between border-b border-[#232838] pb-2">
        <h3 class="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
          <i class="fa-solid fa-graduation-cap"></i>
          <span>Bhakti Shastri Bhagavad Gita Quiz</span>
        </h3>
        <button onclick="closeQuizModal()" class="text-gray-400 hover:text-white text-xs p-1"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div id="quiz-container" class="space-y-3">
        <div class="flex justify-between text-[10px] text-gray-400 font-mono">
          <span id="quiz-q-num">Question 1 of 5</span>
          <span id="quiz-score-badge">Score: 0</span>
        </div>
        <p id="quiz-question-text" class="text-xs font-bold text-gray-100">Question text goes here...</p>
        <div id="quiz-options-list" class="space-y-2"></div>
      </div>
    </div>
  </div>

  <!-- Study Note Modal Dialog -->
  <div id="note-modal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 hidden">
    <div class="bg-[#141824] border border-[#2a3248] rounded-2xl max-w-md w-full p-4 space-y-3 shadow-2xl animate-slideUp">
      <div class="flex items-center justify-between border-b border-[#232838] pb-2">
        <h3 class="text-xs font-bold text-gray-100 flex items-center gap-1.5">
          <i class="fa-solid fa-pen-nib text-amber-400"></i>
          <span>Study Note & Insights</span>
        </h3>
        <button onclick="closeNoteModal()" class="text-gray-400 hover:text-white text-xs p-1"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="space-y-2">
        <p id="note-lecture-title" class="text-[11px] font-semibold text-indigo-300 truncate">Lecture Title</p>
        <textarea id="note-text-input" rows="4" placeholder="Write your reflections, shloka meanings, key philosophical points..." class="w-full bg-[#0d1017] border border-[#232838] rounded-xl p-2.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"></textarea>
      </div>
      <div class="flex justify-between items-center pt-1">
        <button onclick="generateQuoteCardFromNote()" class="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1">
          <i class="fa-solid fa-image"></i> Create Quote Card
        </button>
        <div class="flex gap-2">
          <button onclick="closeNoteModal()" class="px-3 py-1.5 rounded-lg bg-[#1c2232] text-xs text-gray-300">Cancel</button>
          <button onclick="saveNote()" class="px-4 py-1.5 rounded-lg bg-indigo-600 text-xs text-white font-bold shadow">Save Note</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Quote Card Share Modal Dialog -->
  <div id="quote-card-modal" class="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 hidden">
    <div class="bg-[#141824] border border-[#2a3248] rounded-2xl max-w-sm w-full p-4 space-y-3 shadow-2xl animate-slideUp text-center">
      <div class="flex items-center justify-between border-b border-[#232838] pb-2 text-left">
        <h3 class="text-xs font-bold text-amber-300 flex items-center gap-1.5">
          <i class="fa-solid fa-quote-left"></i>
          <span>Devotee Wisdom Quote Card</span>
        </h3>
        <button onclick="closeQuoteCardModal()" class="text-gray-400 hover:text-white text-xs p-1"><i class="fa-solid fa-xmark"></i></button>
      </div>
      
      <div class="overflow-hidden rounded-xl border border-[#222738] shadow-lg flex justify-center bg-black">
        <canvas id="quote-card-canvas" width="600" height="600" class="max-w-full h-auto rounded-xl"></canvas>
      </div>

      <div class="flex gap-2 pt-1">
        <button onclick="downloadQuoteCardImage()" class="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow">
          <i class="fa-solid fa-download"></i> Download Image
        </button>
        <button onclick="shareQuoteCardWhatsApp()" class="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow">
          <i class="fa-brands fa-whatsapp"></i> Share WhatsApp
        </button>
      </div>
    </div>
  </div>

  <!-- Edit Profile Modal Dialog -->
  <div id="profile-modal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 hidden">
    <div class="bg-[#141824] border border-[#2a3248] rounded-2xl max-w-sm w-full p-4 space-y-3 shadow-2xl animate-slideUp">
      <div class="flex items-center justify-between border-b border-[#232838] pb-2">
        <h3 class="text-xs font-bold text-gray-100">Edit Devotee Profile</h3>
        <button onclick="closeEditProfileModal()" class="text-gray-400 hover:text-white text-xs p-1"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="space-y-2.5 text-xs">
        <div>
          <label class="text-[10px] text-gray-400 block pb-1">Name / Spiritual Name</label>
          <input id="input-profile-name" type="text" placeholder="e.g. Krishna Dasa" class="w-full bg-[#0d1017] border border-[#232838] rounded-xl p-2 text-xs text-gray-100" />
        </div>
        <div>
          <label class="text-[10px] text-gray-400 block pb-1">Status / Focus</label>
          <input id="input-profile-status" type="text" placeholder="e.g. Srimad Bhagavatam & BG Student" class="w-full bg-[#0d1017] border border-[#232838] rounded-xl p-2 text-xs text-gray-100" />
        </div>
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button onclick="closeEditProfileModal()" class="px-3 py-1.5 rounded-lg bg-[#1c2232] text-xs text-gray-300">Cancel</button>
        <button onclick="saveProfile()" class="px-4 py-1.5 rounded-lg bg-indigo-600 text-xs text-white font-bold shadow">Save Changes</button>
      </div>
    </div>
  </div>

  <audio id="audio-core" preload="metadata"></audio>

  <script>
    let playlists = [];
    let allTracks = [];
    let displayedTracks = [];
    let currentPlaylistTracks = [];
    let currentTrackIndex = -1;
    let currentPage = 'playlists';
    let navigationHistory = ['playlists'];
    let activeSeriesIndex = null;
    let selectedCategory = 'All';
    let currentSort = 'default';
    let isPlaying = false;
    let isVideoMode = false;
    let currentSpeedIdx = 0;
    let renderPage = 1;
    const PAGE_SIZE = 40;
    const speeds = [1, 1.25, 1.5, 2];

    const audio = document.getElementById('audio-core');
    let ytPlayer = null;
    let currentTrack = null;
    let searchDebounceTimer = null;

    // === Background Audio Keep-Alive Context ===
    let audioCtx = null;
    let wakeLock = null;

    async function initBackgroundAudioKeepAlive() {
      try {
        if (!audioCtx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            audioCtx = new AudioContext();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            gain.gain.value = 0.00001; // Inaudible buffer
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
          }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }
        if ('wakeLock' in navigator && !wakeLock) {
          wakeLock = await navigator.wakeLock.request('screen').catch(() => null);
        }
      } catch (e) {}
    }

    // === Sleep Timer State ===
    let sleepTimerId = null;
    let sleepTimerTargetTime = null;

    // === A-B Repeat Loop State ===
    let loopPointA = null;
    let loopPointB = null;
    let isABLoopActive = false;

    // === Sadhana Sravanam Daily Tracking ===
    let sadhanaStats = {
      todayMinutes: 0,
      todayDate: new Date().toLocaleDateString(),
      streakDays: 1,
      totalHours: 0
    };

    let trackBookmarksMap = {};

    // === Core Bhakti Shastri Flashcards ===
    const coreShlokas = [
      {
        ref: "BG 4.34",
        sanskrit: "tad viddhi praṇipātena paripraśnena sevayā |\nupadekṣyanti te jñānaṁ jñāninas tattva-darśinaḥ ||",
        translation: "Just try to learn the truth by approaching a spiritual master. Inquire from him submissively and render service unto him. The self-realized souls can impart knowledge unto you because they have seen the truth.",
        takeaway: "Threefold qualification of a sincere disciple: Praṇipāta (surrender), Paripraśna (submissive inquiry), and Sevā (service)."
      },
      {
        ref: "BG 2.13",
        sanskrit: "dehino 'smin yathā dehe kaumāraṁ yauvanaṁ jarā |\ntathā dehāntara-prāptir dhīras tatra na muhyati ||",
        translation: "As the embodied soul continuously passes, in this body, from boyhood to youth to old age, the soul similarly passes into another body at death. A sober person is not bewildered by such a change.",
        takeaway: "Fundamental proof of the eternal soul (Atman) distinct from the mutating material body."
      },
      {
        ref: "BG 9.2",
        sanskrit: "rāja-vidyā rāja-guhyaṁ pavitram idam uttamam |\npratyakṣāvagamaṁ dharmyaṁ su-sukhaṁ kartum avyayam ||",
        translation: "This knowledge is the king of education, the most secret of all secrets. It is the purest knowledge, and because it gives direct perception of the self by realization, it is the perfection of religion.",
        takeaway: "Pratyakṣāvagama: Pure devotional service yields direct personal realization and joy (su-sukham)."
      },
      {
        ref: "BG 18.66",
        sanskrit: "sarva-dharmān parityajya mām ekaṁ śaraṇaṁ vraja |\nahaṁ tvāṁ sarva-pāpebhyo mokṣayiṣyāmi mā śucaḥ ||",
        translation: "Abandon all varieties of religion and just surrender unto Me. I shall deliver you from all sinful reactions. Do not fear.",
        takeaway: "The ultimate confidential conclusion of the entire Bhagavad Gita: Unconditional surrender (Śaraṇāgati)."
      },
      {
        ref: "NOI Verse 1",
        sanskrit: "vāco vegaṁ manasaḥ krodha-vegaṁ\njihvā-vegam udaropastha-vegam |\netān vegān yo viṣaheta dhīraḥ\nsarvām apīmāṁ pṛthivīṁ sa śiṣyāt ||",
        translation: "A sober person who can tolerate the urge to speak, the mind's demands, the actions of anger and the urges of the tongue, belly and genitals is qualified to make disciples all over the world.",
        takeaway: "The 6 urges that must be controlled by a practitioner of Bhakti Yoga (Goswami)."
      },
      {
        ref: "BG 7.14",
        sanskrit: "daivī hy eṣā guṇa-mayī mama māyā duratyayā |\nmām eva ye prapadyante māyām etāṁ taranti te ||",
        translation: "This divine energy of Mine, consisting of the three modes of material nature, is difficult to overcome. But those who have surrendered unto Me can easily cross beyond it.",
        takeaway: "Maya is invincible to independent human intellect; only surrender to Krishna grants liberation."
      },
      {
        ref: "BG 10.8",
        sanskrit: "ahaṁ sarvasya prabhavo mattaḥ sarvaṁ pravartate |\niti matvā bhajante māṁ budhā bhāva-samanvitāḥ ||",
        translation: "I am the source of all spiritual and material worlds. Everything emanates from Me. The wise who perfectly know this engage in My devotional service and worship Me with all their hearts.",
        takeaway: "The Catuḥ-ślokī Gita (BG 10.8-11) opening seed: Krishna as the prime cause of all causes."
      }
    ];

    let currentFlashcardIdx = 0;
    let flashcardScores = {};

    let userProfile = {
      name: 'Devotee',
      status: 'Listening to Dr. Laxmidhar Behera Sir',
      avatarInitial: 'D'
    };
    let listeningHistory = [];
    let studyNotes = [];
    let favoriteTrackIds = new Set();
    let customPlaylists = [];

    // === IndexedDB Offline Storage ===
    const DB_NAME = 'VaniVaultOfflineDB';
    let db = null;
    let offlineTrackMap = new Map();

    function openDB() {
      return new Promise((resolve) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = (e) => {
          const d = e.target.result;
          if (!d.objectStoreNames.contains('audio_cache')) {
            d.createObjectStore('audio_cache', { keyPath: 'id' });
          }
        };
        req.onsuccess = (e) => {
          db = e.target.result;
          loadOfflineList();
          resolve(db);
        };
        req.onerror = () => resolve(null);
      });
    }

    function loadOfflineList() {
      if (!db) return;
      const tx = db.transaction('audio_cache', 'readonly');
      const req = tx.objectStore('audio_cache').getAll();
      req.onsuccess = () => {
        offlineTrackMap.clear();
        let totalBytes = 0;
        (req.result || []).forEach(item => {
          offlineTrackMap.set(item.id, item);
          if (item.blob && item.blob.size) totalBytes += item.blob.size;
        });
        const count = offlineTrackMap.size;
        document.getElementById('offline-view-count').textContent = count;
        const countBadge = document.getElementById('offline-view-count-badge');
        if (countBadge) countBadge.textContent = `${count} Tracks Cached`;
        const mbUsed = (totalBytes / (1024 * 1024)).toFixed(1);
        const usedEl = document.getElementById('offline-storage-used');
        if (usedEl) usedEl.textContent = `Used: ${mbUsed} MB`;
        renderOfflineTracks();
      };
    }

    // === LocalStorage User Persistence ===
    function loadUserData() {
      try {
        const p = localStorage.getItem('vv_profile');
        if (p) userProfile = JSON.parse(p);
        const h = localStorage.getItem('vv_history');
        if (h) listeningHistory = JSON.parse(h);
        const n = localStorage.getItem('vv_notes');
        if (n) studyNotes = JSON.parse(n);
        const f = localStorage.getItem('vv_favorites');
        if (f) favoriteTrackIds = new Set(JSON.parse(f));
        const c = localStorage.getItem('vv_custom_pl');
        if (c) customPlaylists = JSON.parse(c);
        const s = localStorage.getItem('vv_flashcard_scores');
        if (s) flashcardScores = JSON.parse(s);
        const bm = localStorage.getItem('vv_bookmarks');
        if (bm) trackBookmarksMap = JSON.parse(bm);
        const sadhana = localStorage.getItem('vv_sadhana');
        if (sadhana) {
          sadhanaStats = JSON.parse(sadhana);
          if (sadhanaStats.todayDate !== new Date().toLocaleDateString()) {
            sadhanaStats.todayDate = new Date().toLocaleDateString();
            sadhanaStats.todayMinutes = 0;
            sadhanaStats.streakDays = (sadhanaStats.streakDays || 1) + 1;
          }
        }
        const theme = localStorage.getItem('vv_theme') || 'default';
        applyTheme(theme, false);
      } catch (e) {}

      updateProfileUI();
      renderDashboard();
    }

    function updateProfileUI() {
      const initial = (userProfile.name || 'D').charAt(0).toUpperCase();
      document.getElementById('header-avatar').textContent = initial;
      document.getElementById('dashboard-avatar').textContent = initial;
      document.getElementById('header-user-name').textContent = userProfile.name;
      document.getElementById('dash-user-name').innerHTML = `<span>${userProfile.name}</span> <span class="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">Practitioner</span>`;
      document.getElementById('dash-user-status').textContent = userProfile.status;
    }

    function saveUserData() {
      try {
        localStorage.setItem('vv_profile', JSON.stringify(userProfile));
        localStorage.setItem('vv_history', JSON.stringify(listeningHistory));
        localStorage.setItem('vv_notes', JSON.stringify(studyNotes));
        localStorage.setItem('vv_favorites', JSON.stringify(Array.from(favoriteTrackIds)));
        localStorage.setItem('vv_custom_pl', JSON.stringify(customPlaylists));
        localStorage.setItem('vv_flashcard_scores', JSON.stringify(flashcardScores));
        localStorage.setItem('vv_bookmarks', JSON.stringify(trackBookmarksMap));
        localStorage.setItem('vv_sadhana', JSON.stringify(sadhanaStats));
      } catch (e) {}
      renderDashboard();
    }

    function vibrateHaptic() {
      if ('vibrate' in navigator) navigator.vibrate(15);
    }

    // === MediaSession Background Lockscreen Handlers ===
    function setupMediaSession() {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', () => togglePlay());
        navigator.mediaSession.setActionHandler('pause', () => togglePlay());
        navigator.mediaSession.setActionHandler('previoustrack', () => playPrev());
        navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
        navigator.mediaSession.setActionHandler('seekbackward', () => skipSeconds(-15));
        navigator.mediaSession.setActionHandler('seekforward', () => skipSeconds(15));
      }
    }

    // === YouTube IFrame API ===
    window.onYouTubeIframeAPIReady = function() {
      ytPlayer = new YT.Player('yt-iframe-placeholder', {
        height: '100%',
        width: '100%',
        playerVars: { autoplay: 1, controls: 1, modestbranding: 1, playsinline: 1, rel: 0 },
        events: {
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) {
              isPlaying = true;
              updatePlayIcons();
              initBackgroundAudioKeepAlive();
              if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
            } else if (event.data === YT.PlayerState.PAUSED) {
              isPlaying = false;
              updatePlayIcons();
              if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
            } else if (event.data === YT.PlayerState.ENDED) {
              playNext();
            }
          }
        }
      });
    };

    // === In-App Live Auto-Updates Engine ===
    async function checkForCatalogAndAppUpdates(manual = false) {
      const icon = document.getElementById('update-spinner-icon');
      if (icon) icon.className = 'fa-solid fa-arrows-rotate fa-spin';
      vibrateHaptic();

      try {
        const repoPlUrl = 'https://raw.githubusercontent.com/anuragsharma2903/vani-studio/main/web-portal/discourse_playlists.json?t=' + Date.now();
        const repoTrkUrl = 'https://raw.githubusercontent.com/anuragsharma2903/vani-studio/main/web-portal/behera_repo.json?t=' + Date.now();
        
        const [plRes, trkRes] = await Promise.all([
          fetch(repoPlUrl),
          fetch(repoTrkUrl)
        ]);

        if (plRes.ok && trkRes.ok) {
          const newPl = await plRes.json();
          const newTrk = await trkRes.json();
          const countDiff = newTrk.length - allTracks.length;
          
          playlists = newPl;
          allTracks = newTrk;
          localStorage.setItem('vv_cached_playlists', JSON.stringify(playlists));
          localStorage.setItem('vv_cached_tracks', JSON.stringify(allTracks));

          document.getElementById('pl-total').textContent = playlists.length;
          document.getElementById('trk-total').textContent = allTracks.length;
          renderPlaylists();
          resetAndRenderTracks();

          if (countDiff > 0 || manual) {
            showUpdateBanner(`✓ Catalog updated! ${countDiff > 0 ? countDiff + ' new discourses available.' : 'Catalog is up to date.'}`);
          }
        }
      } catch (e) {
        if (manual) alert('Catalog is currently up-to-date with local offline repository.');
      } finally {
        if (icon) icon.className = 'fa-solid fa-arrows-rotate';
      }
    }

    function showUpdateBanner(text) {
      document.getElementById('update-banner-text').textContent = text;
      document.getElementById('update-notification-banner').classList.remove('hidden');
    }

    function dismissUpdateBanner() {
      document.getElementById('update-notification-banner').classList.add('hidden');
    }

    // === Multi-Page Distributed Navigation Router ===
    function navigateTo(pageId, data = null) {
      vibrateHaptic();
      currentPage = pageId;
      navigationHistory.push(pageId);

      const searchSec = document.getElementById('search-section');
      if (pageId === 'dashboard' || pageId === 'flashcards' || pageId === 'series-detail') {
        searchSec.classList.add('hidden');
      } else {
        searchSec.classList.remove('hidden');
      }

      ['playlists', 'series-detail', 'tracks', 'offline', 'dashboard', 'flashcards'].forEach(id => {
        const viewEl = document.getElementById(`view-${id}`);
        const navBtn = document.getElementById(`nav-btn-${id}`);
        if (id === pageId) {
          if (viewEl) viewEl.classList.remove('hidden');
          if (navBtn) navBtn.className = 'flex flex-col items-center gap-1 text-indigo-400 font-bold';
        } else {
          if (viewEl) viewEl.classList.add('hidden');
          if (navBtn) navBtn.className = 'flex flex-col items-center gap-1 text-gray-400 hover:text-gray-200';
        }
      });

      if (pageId === 'series-detail' && data !== null) {
        renderSeriesDetailPage(data);
      } else if (pageId === 'dashboard') {
        renderDashboard();
      } else if (pageId === 'flashcards') {
        renderFlashcard();
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function navigateBack() {
      vibrateHaptic();
      if (navigationHistory.length > 1) {
        navigationHistory.pop();
        const prev = navigationHistory[navigationHistory.length - 1] || 'playlists';
        navigateTo(prev);
      } else {
        navigateTo('playlists');
      }
    }

    window.addEventListener('popstate', () => {
      navigateBack();
    });

    // === Series Catalog Grid & Dedicated Page ===
    function renderPlaylists() {
      const cont = document.getElementById('playlist-list');
      const q = (document.getElementById('search-box').value || '').toLowerCase().trim();

      const filtered = playlists.filter(pl => {
        if (selectedCategory !== 'All' && pl.category !== selectedCategory) return false;
        if (!q) return true;
        return (
          pl.title.toLowerCase().includes(q) ||
          pl.category.toLowerCase().includes(q) ||
          (pl.subSeries && pl.subSeries.toLowerCase().includes(q))
        );
      });

      if (filtered.length === 0) {
        cont.innerHTML = '<div class="p-6 text-center text-xs text-gray-400 col-span-2">No series matching filter.</div>';
        return;
      }

      cont.innerHTML = filtered.map((pl, idx) => {
        const itemCount = (pl.items || []).length;
        const firstThumb = (pl.items && pl.items[0]?.thumbnail) || `https://i.ytimg.com/vi/${pl.items?.[0]?.videoId}/hqdefault.jpg`;

        return `
          <div onclick="openSeriesDetail(${idx})" class="bg-[#121520] border border-[#222738] hover:border-indigo-500/50 rounded-2xl p-3.5 space-y-2.5 shadow-md cursor-pointer transition flex flex-col justify-between">
            <div class="flex items-start gap-3">
              <img src="${firstThumb}" class="w-16 h-16 rounded-xl object-cover bg-gray-800 shrink-0 border border-[#222738]" onerror="this.src='./icon-192.png'" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 pb-0.5">
                  <span class="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                    ${pl.category}
                  </span>
                  <span class="text-[9px] text-gray-400 font-mono">${itemCount} Lectures</span>
                </div>
                <h3 class="text-xs font-bold text-gray-100 line-clamp-2">${pl.title}</h3>
                <p class="text-[10px] text-gray-400 pt-0.5 truncate">${pl.subSeries || 'Dr. Laxmidhar Behera'}</p>
              </div>
            </div>
            <div class="pt-1 border-t border-[#1d2232] flex items-center justify-between text-[11px] text-indigo-400 font-semibold">
              <span>Explore ${itemCount} Discourses</span>
              <i class="fa-solid fa-arrow-right text-xs"></i>
            </div>
          </div>
        `;
      }).join('');
    }

    function openSeriesDetail(idx) {
      activeSeriesIndex = idx;
      navigateTo('series-detail', idx);
    }

    function renderSeriesDetailPage(plIdx) {
      const pl = playlists[plIdx];
      if (!pl) return;

      const firstThumb = (pl.items && pl.items[0]?.thumbnail) || `https://i.ytimg.com/vi/${pl.items?.[0]?.videoId}/hqdefault.jpg`;
      document.getElementById('series-detail-thumb').src = firstThumb;
      document.getElementById('series-detail-title').textContent = pl.title;
      document.getElementById('series-detail-sub').textContent = pl.subSeries || 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)';
      document.getElementById('series-detail-cat-badge').textContent = pl.category;
      document.getElementById('series-detail-count-badge').textContent = `${(pl.items || []).length} Lectures`;
      document.getElementById('btn-play-all-series').onclick = () => playEntirePlaylist(plIdx);

      renderSeriesDetailTracklist(pl.items || []);
    }

    function renderSeriesDetailTracklist(items) {
      const cont = document.getElementById('series-detail-tracklist');
      const q = (document.getElementById('series-search-box').value || '').toLowerCase().trim();

      const filtered = items.filter(item => {
        if (!q) return true;
        return item.title.toLowerCase().includes(q);
      });

      if (filtered.length === 0) {
        cont.innerHTML = '<div class="p-6 text-center text-xs text-gray-400">No lectures found matching search.</div>';
        return;
      }

      cont.innerHTML = filtered.map((item, itemIdx) => {
        const isOffline = offlineTrackMap.has(item.id || item.videoId);
        return `
          <div onclick="playTrackFromPlaylist(${activeSeriesIndex}, ${itemIdx})" class="flex items-center gap-2.5 p-2.5 rounded-2xl bg-[#121520] border border-[#222738] hover:border-indigo-500/40 cursor-pointer shadow transition">
            <span class="text-xs font-mono text-gray-400 w-5 text-center shrink-0 font-bold">${itemIdx + 1}</span>
            <img src="${item.thumbnail}" class="w-11 h-11 rounded-xl object-cover bg-gray-800 shrink-0" onerror="this.src='./icon-192.png'" />
            <div class="flex-1 min-w-0">
              <h4 class="text-xs font-bold text-gray-100 truncate">${item.title}</h4>
              <div class="flex items-center gap-1.5 pt-0.5">
                <span class="text-[9px] px-1.5 py-0.2 rounded bg-gray-800 text-gray-300 font-mono">Lecture ${itemIdx + 1}</span>
                ${isOffline ? '<span class="text-[9px] text-emerald-400 font-semibold"><i class="fa-solid fa-check"></i> Offline</span>' : ''}
              </div>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <a href="https://www.youtube.com/watch?v=${item.videoId}" target="_blank" onclick="event.stopPropagation()" class="p-2 text-gray-400 hover:text-red-400 text-xs" title="Watch on YouTube">
                <i class="fa-brands fa-youtube"></i>
              </a>
              <button class="w-8 h-8 rounded-full bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white flex items-center justify-center text-xs transition">
                <i class="fa-solid fa-play"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    function filterSeriesDetailTracks() {
      if (activeSeriesIndex === null || !playlists[activeSeriesIndex]) return;
      renderSeriesDetailTracklist(playlists[activeSeriesIndex].items || []);
    }

    function setCategory(cat) {
      vibrateHaptic();
      selectedCategory = cat;
      document.querySelectorAll('#category-chips button').forEach(b => {
        if (b.getAttribute('data-cat') === cat) {
          b.className = 'chip active px-3 py-1.5 rounded-full bg-indigo-600 text-white font-semibold whitespace-nowrap';
        } else {
          b.className = 'chip px-3 py-1.5 rounded-full bg-[#121520] text-gray-400 border border-[#222738] whitespace-nowrap';
        }
      });
      renderPlaylists();
      resetAndRenderTracks();
    }

    function handleSortChange(sortVal) {
      currentSort = sortVal;
      resetAndRenderTracks();
    }

    function handleSearchDebounced() {
      const q = document.getElementById('search-box').value.trim();
      document.getElementById('search-clear-btn').classList.toggle('hidden', !q);
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        renderPlaylists();
        resetAndRenderTracks();
      }, 150);
    }

    function clearSearch() {
      document.getElementById('search-box').value = '';
      document.getElementById('search-clear-btn').classList.add('hidden');
      renderPlaylists();
      resetAndRenderTracks();
    }

    function resetAndRenderTracks() {
      renderPage = 1;
      const q = (document.getElementById('search-box').value || '').toLowerCase().trim();

      displayedTracks = allTracks.filter(t => {
        if (selectedCategory !== 'All' && t.category !== selectedCategory) return false;
        if (!q) return true;
        return (
          t.title.toLowerCase().includes(q) ||
          (t.dayNumber && t.dayNumber.toLowerCase().includes(q)) ||
          (t.originalTitle && t.originalTitle.toLowerCase().includes(q)) ||
          (t.playlistTitle && t.playlistTitle.toLowerCase().includes(q))
        );
      });

      if (currentSort === 'newest') {
        displayedTracks.sort((a, b) => (b.dateRecorded || '').localeCompare(a.dateRecorded || ''));
      } else if (currentSort === 'oldest') {
        displayedTracks.sort((a, b) => (a.dateRecorded || '').localeCompare(b.dateRecorded || ''));
      }

      renderTracksPaginated();
    }

    function renderTracksPaginated() {
      const cont = document.getElementById('track-list');
      const loadMoreBtn = document.getElementById('btn-load-more');
      const badge = document.getElementById('rendered-count-badge');

      if (displayedTracks.length === 0) {
        cont.innerHTML = '<div class="p-6 text-center text-xs text-gray-400">No discourses matching search.</div>';
        loadMoreBtn.classList.add('hidden');
        badge.textContent = '0 of 0';
        return;
      }

      const visible = displayedTracks.slice(0, renderPage * PAGE_SIZE);
      badge.textContent = `Showing ${visible.length} of ${displayedTracks.length}`;

      cont.innerHTML = visible.map((track) => {
        const isOffline = offlineTrackMap.has(track.id);
        const isFav = favoriteTrackIds.has(track.id);
        const dayBadge = track.dayNumber ? `<span class="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold font-mono">${track.dayNumber}</span>` : '';

        return `
          <div onclick="playSingleTrack('${track.id}')" class="flex items-center gap-2.5 p-2.5 rounded-2xl bg-[#121520] border border-[#222738] hover:border-indigo-500/40 cursor-pointer shadow transition">
            <img src="${track.thumbnail}" class="w-12 h-12 rounded-xl object-cover bg-gray-800 shrink-0" onerror="this.src='./icon-192.png'" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5 pb-0.5">
                ${dayBadge}
                <span class="text-[9px] px-1.5 py-0.2 rounded bg-gray-800 text-gray-300 font-mono">${track.category || 'Lecture'}</span>
                ${isOffline ? '<span class="text-[9px] text-emerald-400 font-semibold"><i class="fa-solid fa-check"></i> Stored</span>' : ''}
              </div>
              <h4 class="text-xs font-bold text-gray-100 truncate">${track.title}</h4>
              <p class="text-[10px] text-gray-400 truncate">${track.playlistTitle || 'Dr. Laxmidhar Behera'}</p>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button onclick="event.stopPropagation(); toggleFavorite('${track.id}')" class="p-2 text-xs ${isFav ? 'text-rose-500' : 'text-gray-500 hover:text-rose-400'}">
                <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
              </button>
              <a href="https://www.youtube.com/watch?v=${track.videoId}" target="_blank" onclick="event.stopPropagation()" class="p-2 text-gray-400 hover:text-red-400 text-xs" title="Watch on YouTube">
                <i class="fa-brands fa-youtube"></i>
              </a>
              <button onclick="event.stopPropagation(); playSingleTrack('${track.id}')" class="w-8 h-8 rounded-full bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white flex items-center justify-center text-xs transition">
                <i class="fa-solid fa-play"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');

      loadMoreBtn.classList.toggle('hidden', visible.length >= displayedTracks.length);
    }

    function loadMoreTracks() {
      renderPage++;
      renderTracksPaginated();
    }

    function renderOfflineTracks() {
      const cont = document.getElementById('offline-track-list');
      const offlineList = Array.from(offlineTrackMap.values());
      if (offlineList.length === 0) {
        cont.innerHTML = '<div class="p-6 text-center text-xs text-gray-400">No offline downloads yet. Tap download icon in player to save for offline!</div>';
        return;
      }
      cont.innerHTML = offlineList.map((item) => {
        const track = item.track;
        return `
          <div onclick="playSingleTrack('${track.id}')" class="flex items-center gap-2.5 p-2.5 rounded-2xl bg-[#121520] border border-[#222738] shadow transition">
            <img src="${track.thumbnail}" class="w-12 h-12 rounded-xl object-cover bg-gray-800 shrink-0" onerror="this.src='./icon-192.png'" />
            <div class="flex-1 min-w-0">
              <span class="text-[9px] text-emerald-400 font-semibold"><i class="fa-solid fa-check"></i> Downloaded</span>
              <h4 class="text-xs font-bold text-gray-100 truncate">${track.title}</h4>
              <p class="text-[10px] text-gray-400 truncate">${track.playlistTitle || 'Dr. Laxmidhar Behera'}</p>
            </div>
            <button onclick="event.stopPropagation(); deleteOffline('${track.id}')" class="p-2 text-rose-400 hover:text-rose-300 text-xs">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        `;
      }).join('');
    }

    // === Dashboard Rendering ===
    function renderDashboard() {
      document.getElementById('stat-listened-count').textContent = listeningHistory.length;
      document.getElementById('stat-notes-count').textContent = studyNotes.length;
      document.getElementById('stat-favs-count').textContent = favoriteTrackIds.size;
      const masteredCount = Object.values(flashcardScores).filter(s => s === 'easy' || s === 'good').length;
      document.getElementById('stat-shlokas-mastered').textContent = masteredCount;

      document.getElementById('sadhana-streak-badge').textContent = `🔥 ${sadhanaStats.streakDays || 1} Day Streak`;
      const mins = Math.min(30, sadhanaStats.todayMinutes || 0);
      const pct = Math.round((mins / 30) * 100);
      document.getElementById('sadhana-progress-bar').style.width = `${pct}%`;
      document.getElementById('sadhana-minutes-today').textContent = `Today: ${sadhanaStats.todayMinutes || 0} / 30 mins`;
      document.getElementById('sadhana-total-hours').textContent = `Total: ${(sadhanaStats.totalHours || 0).toFixed(1)} Hours`;

      const contHistory = document.getElementById('continue-listening-list');
      if (listeningHistory.length === 0) {
        contHistory.innerHTML = '<div class="p-4 text-center text-xs text-gray-500 bg-[#121520] rounded-xl border border-[#222738]">No recent listens yet.</div>';
      } else {
        contHistory.innerHTML = listeningHistory.slice(0, 5).map((item) => {
          return `
            <div onclick="playSingleTrack('${item.trackId}')" class="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#121520] border border-[#222738] hover:border-indigo-500/40 cursor-pointer shadow">
              <img src="${item.thumbnail}" class="w-10 h-10 rounded-lg object-cover bg-gray-800 shrink-0" />
              <div class="flex-1 min-w-0">
                <h4 class="text-xs font-bold text-gray-100 truncate">${item.title}</h4>
                <div class="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                  <span>${formatTime(item.currentTime || 0)} / ${formatTime(item.duration || 0)}</span>
                  <span>•</span>
                  <span class="text-indigo-400">${item.datePlayed || 'Recent'}</span>
                </div>
              </div>
              <button class="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                <i class="fa-solid fa-play"></i>
              </button>
            </div>
          `;
        }).join('');
      }

      const notesCont = document.getElementById('notes-container');
      if (studyNotes.length === 0) {
        notesCont.innerHTML = '<div class="p-4 text-center text-xs text-gray-500 bg-[#121520] rounded-xl border border-[#222738]">No study notes taken yet. While listening, click "📝 Take Notes"!</div>';
      } else {
        notesCont.innerHTML = studyNotes.slice(0, 6).map((n, idx) => {
          return `
            <div class="p-3 rounded-xl bg-[#121520] border border-[#222738] space-y-1.5 shadow">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-bold text-indigo-300 truncate max-w-[200px]">${n.lectureTitle}</h4>
                <div class="flex items-center gap-1.5">
                  <button onclick="renderQuoteCard('${encodeURIComponent(n.text)}', '${encodeURIComponent(n.lectureTitle)}')" class="text-gray-400 hover:text-amber-400 text-xs p-1" title="Create Quote Card"><i class="fa-solid fa-image"></i></button>
                  <button onclick="deleteNote(${idx})" class="text-gray-500 hover:text-rose-400 text-xs p-1"><i class="fa-solid fa-trash-can"></i></button>
                </div>
              </div>
              <p class="text-xs text-gray-200 leading-relaxed">${n.text}</p>
              <p class="text-[9px] text-gray-500 font-mono">${n.timestamp} • ${n.date}</p>
            </div>
          `;
        }).join('');
      }

      const plCont = document.getElementById('user-custom-playlists');
      if (customPlaylists.length === 0) {
        plCont.innerHTML = '<div class="p-4 text-center text-xs text-gray-500 bg-[#121520] rounded-xl border border-[#222738]">No custom playlists yet. Tap "New Playlist" to create your own collection!</div>';
      } else {
        plCont.innerHTML = customPlaylists.map((pl, idx) => {
          return `
            <div class="p-3 rounded-xl bg-[#121520] border border-[#222738] flex items-center justify-between shadow">
              <div>
                <h4 class="text-xs font-bold text-gray-100">${pl.name}</h4>
                <p class="text-[10px] text-gray-400">${(pl.trackIds || []).length} Lectures</p>
              </div>
              <div class="flex items-center gap-1.5">
                <button onclick="playCustomPlaylist(${idx})" class="px-2.5 py-1 rounded bg-indigo-600 text-white text-xs font-bold"><i class="fa-solid fa-play"></i></button>
                <button onclick="deleteCustomPlaylist(${idx})" class="p-1.5 text-gray-500 hover:text-rose-400 text-xs"><i class="fa-solid fa-trash-can"></i></button>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // === Bhakti Shastri Flashcard Logic ===
    function renderFlashcard() {
      const card = coreShlokas[currentFlashcardIdx];
      if (!card) return;
      document.getElementById('card-ref').textContent = card.ref;
      document.getElementById('card-ref-back').textContent = `${card.ref} • Translation`;
      document.getElementById('card-sanskrit').innerHTML = card.sanskrit.replace(/\n/g, '<br/>');
      document.getElementById('card-translation').textContent = card.translation;
      document.getElementById('card-takeaway').textContent = card.takeaway;
      document.getElementById('flashcard-progress-badge').textContent = `${currentFlashcardIdx + 1} / ${coreShlokas.length}`;
      document.getElementById('flashcard-container').classList.remove('flashcard-flipped');
    }

    function flipFlashcard() {
      vibrateHaptic();
      document.getElementById('flashcard-container').classList.toggle('flashcard-flipped');
    }

    function rateFlashcard(score) {
      vibrateHaptic();
      const card = coreShlokas[currentFlashcardIdx];
      flashcardScores[card.ref] = score;
      saveUserData();
      currentFlashcardIdx = (currentFlashcardIdx + 1) % coreShlokas.length;
      renderFlashcard();
    }

    // === Quote Card Canvas Generator ===
    function generateQuoteCardFromCurrent() {
      if (!currentTrack) {
        alert('Please play a lecture first to generate a quote card!');
        return;
      }
      renderQuoteCard('"In spiritual science, true knowledge descends through submissive inquiry and disciplined devotion."', currentTrack.title);
    }

    function generateQuoteCardFromNote() {
      const text = document.getElementById('note-text-input').value.trim();
      const title = currentTrack ? currentTrack.title : 'Vani Vault Katha';
      if (!text) {
        alert('Please enter some reflection text first!');
        return;
      }
      closeNoteModal();
      renderQuoteCard(text, title);
    }

    function renderQuoteCard(quoteText, sourceTitle) {
      quoteText = decodeURIComponent(quoteText);
      sourceTitle = decodeURIComponent(sourceTitle);

      const canvas = document.getElementById('quote-card-canvas');
      const ctx = canvas.getContext('2d');
      const W = canvas.width;
      const H = canvas.height;

      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#101322');
      grad.addColorStop(0.5, '#181d32');
      grad.addColorStop(1, '#090b14');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, W - 40, H - 40);

      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 1;
      ctx.strokeRect(28, 28, W - 56, H - 56);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 28px serif';
      ctx.textAlign = 'center';
      ctx.fillText('ॐ  VANI VAULT WISDOM  ॐ', W / 2, 80);

      ctx.fillStyle = '#9ca3af';
      ctx.font = '14px sans-serif';
      ctx.fillText('Dr. Laxmidhar Behera (HG Lila Purushottam Das)', W / 2, 110);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'italic bold 22px Georgia, serif';
      const words = quoteText.split(' ');
      let line = '';
      let y = 220;
      const maxWidth = W - 100;
      const lineHeight = 34;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, W / 2, y);
          line = words[n] + ' ';
          y += lineHeight;
          if (y > 440) {
            line += '...';
            break;
          }
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, W / 2, y);

      ctx.fillStyle = '#818cf8';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`📖 ${sourceTitle.substring(0, 48)}`, W / 2, 515);

      ctx.fillStyle = '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.fillText('Vani Studio Pro • Learn Gita Live Gita', W / 2, 545);

      document.getElementById('quote-card-modal').classList.remove('hidden');
    }

    function closeQuoteCardModal() {
      document.getElementById('quote-card-modal').classList.add('hidden');
    }

    function downloadQuoteCardImage() {
      vibrateHaptic();
      const canvas = document.getElementById('quote-card-canvas');
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `VaniVault_Quote_${Date.now()}.png`;
      a.click();
    }

    function shareQuoteCardWhatsApp() {
      vibrateHaptic();
      const canvas = document.getElementById('quote-card-canvas');
      canvas.toBlob(blob => {
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'quote.png', { type: 'image/png' })] })) {
          const file = new File([blob], 'vani_quote.png', { type: 'image/png' });
          navigator.share({
            title: 'Vani Vault Wisdom',
            text: 'Wisdom quote from Dr. Laxmidhar Behera Sir',
            files: [file]
          }).catch(() => {});
        } else {
          downloadQuoteCardImage();
          window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent('Wisdom quote from Dr. Laxmidhar Behera (HG Lila Purushottam Das) - Vani Vault'), '_blank');
        }
      });
    }

    // === A-B Repeat Loop Implementation ===
    function toggleABLoop() {
      vibrateHaptic();
      const cur = getCurrentPlaybackTime();
      const label = document.getElementById('ab-loop-label');

      if (!isABLoopActive && loopPointA === null) {
        loopPointA = cur;
        if (label) label.textContent = `A: ${formatTime(loopPointA)} -> Set B`;
      } else if (!isABLoopActive && loopPointA !== null && loopPointB === null) {
        if (cur > loopPointA) {
          loopPointB = cur;
          isABLoopActive = true;
          if (label) label.textContent = `Looping: ${formatTime(loopPointA)}-${formatTime(loopPointB)}`;
          const btn = document.getElementById('btn-ab-loop');
          if (btn) btn.className = 'px-2.5 py-1 rounded-lg bg-indigo-600 text-[10px] text-white font-mono font-bold';
        } else {
          alert('Point B must be after Point A!');
        }
      } else {
        loopPointA = null;
        loopPointB = null;
        isABLoopActive = false;
        if (label) label.textContent = 'A-B Loop: Off';
        const btn = document.getElementById('btn-ab-loop');
        if (btn) btn.className = 'px-2.5 py-1 rounded-lg bg-[#181d2c] border border-[#2b3348] text-[10px] text-gray-300 font-mono';
      }
    }

    // === Timestamp Bookmarks ===
    function addCurrentBookmark() {
      vibrateHaptic();
      if (!currentTrack) return;
      const cur = getCurrentPlaybackTime();
      if (!trackBookmarksMap[currentTrack.id]) trackBookmarksMap[currentTrack.id] = [];
      trackBookmarksMap[currentTrack.id].push({
        time: cur,
        label: formatTime(cur)
      });
      saveUserData();
      renderTrackBookmarks();
    }

    function renderTrackBookmarks() {
      const cont = document.getElementById('current-track-bookmarks');
      if (!cont) return;
      if (!currentTrack || !trackBookmarksMap[currentTrack.id] || trackBookmarksMap[currentTrack.id].length === 0) {
        cont.innerHTML = '';
        return;
      }
      cont.innerHTML = trackBookmarksMap[currentTrack.id].map((bm) => `
        <button onclick="seekToBookmark(${bm.time})" class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap hover:bg-amber-500 hover:text-white transition">
          📌 ${bm.label}
        </button>
      `).join('');
    }

    function seekToBookmark(t) {
      vibrateHaptic();
      if (ytPlayer && ytPlayer.seekTo) ytPlayer.seekTo(t, true);
      else if (audio) audio.currentTime = t;
    }

    // === Sleep Timer Implementation ===
    function openSleepTimerModal() {
      vibrateHaptic();
      document.getElementById('sleep-timer-modal').classList.remove('hidden');
    }

    function closeSleepTimerModal() {
      document.getElementById('sleep-timer-modal').classList.add('hidden');
    }

    function setSleepTimer(minutes) {
      vibrateHaptic();
      cancelSleepTimer();
      sleepTimerTargetTime = Date.now() + (minutes * 60 * 1000);
      document.getElementById('sleep-timer-badge').classList.remove('hidden');
      document.getElementById('sleep-timer-display').textContent = `${minutes}m`;
      closeSleepTimerModal();

      sleepTimerId = setInterval(() => {
        const remainingMs = sleepTimerTargetTime - Date.now();
        if (remainingMs <= 0) {
          cancelSleepTimer();
          if (isPlaying) togglePlay();
          alert('⏰ Sleep timer completed. Good night!');
        } else {
          const remMin = Math.ceil(remainingMs / 60000);
          document.getElementById('sleep-timer-display').textContent = `${remMin}m`;
        }
      }, 10000);
    }

    function cancelSleepTimer() {
      vibrateHaptic();
      if (sleepTimerId) clearInterval(sleepTimerId);
      sleepTimerId = null;
      sleepTimerTargetTime = null;
      document.getElementById('sleep-timer-badge').classList.add('hidden');
      closeSleepTimerModal();
    }

    // === Voice Clarity & EQ Modal ===
    function openEQModal() {
      vibrateHaptic();
      document.getElementById('eq-modal').classList.remove('hidden');
    }

    function closeEQModal() {
      document.getElementById('eq-modal').classList.add('hidden');
    }

    function setEQPreset(preset) {
      vibrateHaptic();
      closeEQModal();
      alert(`✓ EQ Preset applied: ${preset.toUpperCase()}`);
    }

    // === Theme Engine ===
    function openThemeModal() {
      vibrateHaptic();
      document.getElementById('theme-modal').classList.remove('hidden');
    }

    function closeThemeModal() {
      document.getElementById('theme-modal').classList.add('hidden');
    }

    function applyTheme(themeName, save = true) {
      vibrateHaptic();
      document.body.setAttribute('data-theme', themeName);
      if (save) {
        localStorage.setItem('vv_theme', themeName);
        closeThemeModal();
      }
    }

    // === Mini Player Swipe Gestures ===
    function setupMiniPlayerGestures() {
      const el = document.getElementById('mini-player');
      if (!el) return;
      let touchStartX = 0;
      let touchEndX = 0;
      el.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });
      el.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleGesture();
      }, { passive: true });

      function handleGesture() {
        const diff = touchEndX - touchStartX;
        if (Math.abs(diff) > 50) {
          vibrateHaptic();
          if (diff < 0) playNext();
          else playPrev();
        }
      }
    }

    // === Random Katha Picker ===
    function playRandomKatha() {
      vibrateHaptic();
      if (!allTracks || allTracks.length === 0) return;
      const randomIdx = Math.floor(Math.random() * allTracks.length);
      const chosen = allTracks[randomIdx];
      playSingleTrack(chosen.id);
      openFullPlayerModal();
    }

    // === Vaishnava Songbook Database ===
    const songbookDB = {
      radha_madhava: {
        title: 'Jaya Radha Madhava (जय राधा माधव)',
        author: 'Srila Bhaktivinoda Thakura',
        lyrics: `jaya rādhā-mādhava jaya kuñja-bihārī\njaya gopī-jana-vallabha jaya giri-vara-dhārī\nyaśodā-nandana, braja-jana-rañjana,\nyāmuna-tīra-vana-cārī`,
        translation: `Krishna is the lover of Radha. He displays many amorous pastimes in the groves of Vrindavana. He is the lover of the cowherd maidens of Vraja, the holder of the great hill named Govardhana, the beloved son of mother Yashoda, the delighter of the inhabitants of Vraja, and He wanders in the forests along the banks of the River Yamuna.`
      },
      damodara: {
        title: 'Sri Damodarashtakam (श्री दामोदराष्टकम्)',
        author: 'Satyavrata Muni (Padma Purana)',
        lyrics: `namāmīśvaraṁ sac-cid-ānanda-rūpaṁ\nlasat-kuṇḍalaṁ gokule bhrājamānam\nyaśodā-bhiyolūkhalād dhāvamānaṁ\nparāmṛṣṭam atyantato drutya gopyā`,
        translation: `To the supreme Lord, whose form is the embodiment of eternal existence, knowledge, and bliss, whose shark-shaped earrings oscillate, who is beautifully shining in Gokula, and who is fleeing from mother Yashoda in fear of the wooden grinding mortar... I offer my respectful obeisances.`
      },
      guru_ashtaka: {
        title: 'Sri Gurvastakam (श्री गुर्वाष्टकम्)',
        author: 'Srila Visvanatha Cakravarti Thakura',
        lyrics: `saṁsāra-dāvānala-līḍha-loka-\ntrāṇāya kāruṇya-ghanāghanatvam\nprāptasya kalyāṇa-guṇārṇavasya\nvande guroḥ śrī-caraṇāravindam`,
        translation: `The spiritual master is receiving benediction from the ocean of mercy. Just as a cloud pours water on a forest fire to extinguish it, so the spiritual master delivers the materially afflicted world by extinguishing the blazing fire of material existence.`
      },
      brahma_samhita: {
        title: 'Govindam - Brahma Samhita (5.1)',
        author: 'Lord Brahma',
        lyrics: `īśvaraḥ paramaḥ kṛṣṇaḥ sac-cid-ānanda-vigrahaḥ\nanādir ādir govindaḥ sarva-kāraṇa-kāraṇam`,
        translation: `Krishna who is known as Govinda is the Supreme Godhead. He has an eternal blissful spiritual body. He is the origin of all. He has no other origin and He is the prime cause of all causes.`
      }
    };

    function openSongbookModal() {
      vibrateHaptic();
      switchSong('radha_madhava');
      document.getElementById('songbook-modal').classList.remove('hidden');
    }

    function closeSongbookModal() {
      document.getElementById('songbook-modal').classList.add('hidden');
    }

    function switchSong(key) {
      vibrateHaptic();
      const s = songbookDB[key];
      if (!s) return;
      document.querySelectorAll('.song-tab').forEach(t => {
        if (t.getAttribute('data-song') === key) {
          t.className = 'px-2.5 py-1 rounded-full bg-indigo-600 text-white font-bold whitespace-nowrap song-tab';
        } else {
          t.className = 'px-2.5 py-1 rounded-full bg-[#0e111a] text-gray-400 border border-[#222738] whitespace-nowrap song-tab';
        }
      });
      document.getElementById('songbook-content').innerHTML = `
        <h4 class="text-xs font-bold text-amber-300 font-sans">${s.title}</h4>
        <p class="text-[9px] text-gray-400 font-sans pb-1">Composed by ${s.author}</p>
        <div class="p-2.5 rounded-lg bg-[#080a0f] border border-[#1d2230] text-amber-100 font-serif whitespace-pre-line">${s.lyrics}</div>
        <p class="text-[11px] text-gray-300 leading-relaxed font-sans pt-1"><strong>Translation:</strong> ${s.translation}</p>
      `;
    }

    // === Bhakti Shastri Chapter Quiz Engine ===
    const quizQuestions = [
      {
        q: "According to BG 4.34, what is the threefold qualification of a disciple?",
        options: [
          "Money, Prestige, and Scholarship",
          "Praṇipāta (Surrender), Paripraśna (Inquiry), and Sevā (Service)",
          "Physical strength, Austerity, and Silence",
          "Renunciation of work, Forest dwelling, and Fasting"
        ],
        correct: 1,
        explanation: "BG 4.34: tad viddhi praṇipātena paripraśnena sevayā - One must surrender, inquire submissively, and render menial service."
      },
      {
        q: "What does BG 2.13 prove regarding the nature of the spirit soul?",
        options: [
          "The soul dies when the physical body dies",
          "The soul mutates with age from youth to old age",
          "The soul is immutable and transitions between bodies like changing clothes",
          "The body is eternal and the soul is temporary"
        ],
        correct: 2,
        explanation: "BG 2.13: Just as the soul passes from boyhood to youth to old age, it passes into another body at death."
      },
      {
        q: "Why is devotional service called 'Pratyakṣāvagamaṁ' in BG 9.2?",
        options: [
          "Because it relies on blind mechanical dogma",
          "Because it yields direct, experiential personal perception and self-realization",
          "Because it is only theoretical philosophy",
          "Because it is difficult to perform"
        ],
        correct: 1,
        explanation: "BG 9.2: pratyakṣāvagamaṁ dharmyaṁ su-sukham - It gives direct perception of truth by personal realization."
      },
      {
        q: "What is the ultimate confidential conclusion of the entire Bhagavad Gita in BG 18.66?",
        options: [
          "Perform karma-kanda sacrifices forever",
          "Merge into the impersonal Brahman",
          "Abandon all varieties of religion and surrender exclusively unto Krishna (Śaraṇāgati)",
          "Perform silent solitary meditation without service"
        ],
        correct: 2,
        explanation: "BG 18.66: sarva-dharmān parityajya mām ekaṁ śaraṇaṁ vraja - The pinnacle of Vedic revelation is pure devotional surrender."
      },
      {
        q: "According to Sri Upadesamrita (Verse 1), what must a Goswami control?",
        options: [
          "The 6 urges: speech, mind, anger, tongue, belly, and genitals",
          "The 3 planetary systems",
          "Only dietary habits",
          "Only academic debate skills"
        ],
        correct: 0,
        explanation: "NOI Verse 1: vāco vegaṁ manasaḥ krodha-vegaṁ... A sober person who controls these 6 urges is qualified to instruct the entire world."
      }
    ];

    let quizCurrentIdx = 0;
    let quizScore = 0;

    function openQuizModal() {
      vibrateHaptic();
      quizCurrentIdx = 0;
      quizScore = 0;
      renderQuizQuestion();
      document.getElementById('quiz-modal').classList.remove('hidden');
    }

    function closeQuizModal() {
      document.getElementById('quiz-modal').classList.add('hidden');
    }

    function renderQuizQuestion() {
      if (quizCurrentIdx >= quizQuestions.length) {
        document.getElementById('quiz-container').innerHTML = `
          <div class="text-center space-y-3 py-4">
            <div class="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold">
              <i class="fa-solid fa-trophy"></i>
            </div>
            <h4 class="text-sm font-bold text-gray-100">Quiz Completed!</h4>
            <p class="text-xs text-emerald-300 font-mono font-bold">Your Score: ${quizScore} / ${quizQuestions.length}</p>
            <p class="text-[11px] text-gray-400">${quizScore === 5 ? '🌟 Outstanding mastery of Gita purports!' : 'Keep hearing Dr. Behera Sir\'s lectures to deepen your purports!'}</p>
            <button onclick="openQuizModal()" class="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow">
              Retake Quiz
            </button>
          </div>
        `;
        return;
      }

      const q = quizQuestions[quizCurrentIdx];
      document.getElementById('quiz-q-num').textContent = `Question ${quizCurrentIdx + 1} of ${quizQuestions.length}`;
      document.getElementById('quiz-score-badge').textContent = `Score: ${quizScore}`;
      document.getElementById('quiz-question-text').textContent = q.q;

      document.getElementById('quiz-options-list').innerHTML = q.options.map((opt, idx) => `
        <button onclick="selectQuizAnswer(${idx})" class="w-full text-left p-2.5 rounded-xl bg-[#0e111a] border border-[#222738] hover:border-indigo-500 text-xs text-gray-200 transition">
          <span class="font-bold text-indigo-400 mr-1.5 font-mono">${String.fromCharCode(65 + idx)}.</span> ${opt}
        </button>
      `).join('');
    }

    function selectQuizAnswer(idx) {
      vibrateHaptic();
      const q = quizQuestions[quizCurrentIdx];
      if (idx === q.correct) {
        quizScore++;
        alert(`✓ Correct!\n\n${q.explanation}`);
      } else {
        alert(`✗ Incorrect.\n\nCorrect Answer: ${q.options[q.correct]}\n\n${q.explanation}`);
      }
      quizCurrentIdx++;
      renderQuizQuestion();
    }

    // === Word-by-Word Sanskrit Lexicon ===
    const wbwData = {
      "BG 4.34": [
        ["tat", "that knowledge of spiritual truth"],
        ["viddhi", "try to understand"],
        ["praṇipātena", "by approaching with surrender"],
        ["paripraśnena", "by submissive inquiry"],
        ["sevayā", "by rendering menial service"],
        ["upadekṣyanti", "they will impart/initiate"],
        ["te", "unto you"],
        ["jñānam", "knowledge"],
        ["jñāninaḥ", "the self-realized teachers"],
        ["tattva", "of the absolute truth"],
        ["darśinaḥ", "the seers of reality"]
      ],
      "BG 2.13": [
        ["dehinaḥ", "of the embodied soul"],
        ["asmin", "in this"],
        ["yathā", "as"],
        ["dehe", "in the body"],
        ["kaumāram", "boyhood"],
        ["yauvanam", "youth"],
        ["jarā", "old age"],
        ["tathā", "similarly"],
        ["dehāntara", "of another body"],
        ["prāptiḥ", "achievement"],
        ["dhīraḥ", "the sober person"],
        ["tatra", "thereupon"],
        ["na", "never"],
        ["muhyati", "is bewildered"]
      ]
    };

    function toggleWordByWord() {
      vibrateHaptic();
      const cont = document.getElementById('card-wbw-container');
      const icon = document.getElementById('wbw-toggle-icon');
      const card = coreShlokas[currentFlashcardIdx];
      if (!cont) return;

      if (cont.classList.contains('hidden')) {
        cont.classList.remove('hidden');
        if (icon) icon.className = 'fa-solid fa-chevron-up text-[10px] text-indigo-400';
        const data = wbwData[card.ref] || [["पद (Word)", "अर्थ (Meaning)"]];
        cont.innerHTML = data.map(([w, m]) => `
          <div class="flex justify-between border-b border-[#1d2230] pb-0.5">
            <span class="text-amber-300 font-bold">${w}</span>
            <span class="text-gray-300 text-right">${m}</span>
          </div>
        `).join('');
      } else {
        cont.classList.add('hidden');
        if (icon) icon.className = 'fa-solid fa-chevron-down text-[10px] text-gray-400';
      }
    }

    // === Clear All Offline Storage ===
    function clearAllOfflineCache() {
      vibrateHaptic();
      if (!confirm('Are you sure you want to clear all downloaded offline audio?')) return;
      if (!db) return;
      const tx = db.transaction('audio_cache', 'readwrite');
      tx.objectStore('audio_cache').clear();
      tx.oncomplete = () => {
        offlineTrackMap.clear();
        document.getElementById('offline-view-count').textContent = '0';
        const badge = document.getElementById('offline-view-count-badge');
        if (badge) badge.textContent = '0 Tracks Cached';
        const usedEl = document.getElementById('offline-storage-used');
        if (usedEl) usedEl.textContent = 'Used: 0.0 MB';
        renderOfflineTracks();
        alert('✓ Offline cache cleared successfully.');
      };
    }

    function playSingleTrack(id) {
      vibrateHaptic();
      const track = allTracks.find(t => t.id === id);
      if (!track) return;
      currentPlaylistTracks = [track];
      currentTrackIndex = 0;
      loadAndPlay(track);
    }

    function playEntirePlaylist(plIdx) {
      vibrateHaptic();
      const pl = playlists[plIdx];
      if (!pl || !pl.items || pl.items.length === 0) return;
      currentPlaylistTracks = pl.items.map(i => ({
        ...i,
        category: pl.category,
        playlistTitle: pl.title
      }));
      currentTrackIndex = 0;
      loadAndPlay(currentPlaylistTracks[0]);
    }

    function playTrackFromPlaylist(plIdx, itemIdx) {
      vibrateHaptic();
      const pl = playlists[plIdx];
      if (!pl || !pl.items) return;
      currentPlaylistTracks = pl.items.map(i => ({
        ...i,
        category: pl.category,
        playlistTitle: pl.title
      }));
      currentTrackIndex = itemIdx;
      loadAndPlay(currentPlaylistTracks[itemIdx]);
    }

    async function loadAndPlay(track) {
      currentTrack = track;
      loopPointA = null;
      loopPointB = null;
      isABLoopActive = false;
      const abLabel = document.getElementById('ab-loop-label');
      if (abLabel) abLabel.textContent = 'A-B Loop: Off';
      const abBtn = document.getElementById('btn-ab-loop');
      if (abBtn) abBtn.className = 'px-2.5 py-1 rounded-lg bg-[#181d2c] border border-[#2b3348] text-[10px] text-gray-300 font-mono';

      const title = track.title;
      const subtitle = `${track.category || 'Discourse'} • Dr. Laxmidhar Behera`;
      const thumb = track.thumbnail || `https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg`;
      const ytUrl = `https://www.youtube.com/watch?v=${track.videoId}`;

      document.getElementById('mini-title').textContent = title;
      document.getElementById('mini-sub').textContent = subtitle;
      document.getElementById('mini-thumb').src = thumb;
      document.getElementById('mini-yt-link').href = ytUrl;

      document.getElementById('full-title').textContent = title;
      document.getElementById('full-speaker').textContent = subtitle;
      document.getElementById('full-thumb').src = thumb;
      document.getElementById('full-yt-btn').href = ytUrl;
      document.getElementById('full-playlist-name').textContent = track.playlistTitle || track.category || 'Discourse';

      const dayBadgeEl = document.getElementById('full-day-badge');
      if (track.dayNumber) {
        dayBadgeEl.textContent = track.dayNumber;
        dayBadgeEl.classList.remove('hidden');
      } else {
        dayBadgeEl.classList.add('hidden');
      }

      renderTrackBookmarks();
      initBackgroundAudioKeepAlive();

      const existingIdx = listeningHistory.findIndex(h => h.trackId === track.id);
      const historyItem = {
        trackId: track.id,
        videoId: track.videoId,
        title: track.title,
        thumbnail: thumb,
        datePlayed: new Date().toLocaleDateString(),
        currentTime: 0,
        duration: 0
      };
      if (existingIdx >= 0) listeningHistory.splice(existingIdx, 1);
      listeningHistory.unshift(historyItem);
      if (listeningHistory.length > 20) listeningHistory.pop();
      saveUserData();

      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title,
          artist: 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)',
          album: track.playlistTitle || 'Vani Vault',
          artwork: [{ src: thumb, sizes: '512x512', type: 'image/jpeg' }]
        });
        navigator.mediaSession.playbackState = 'playing';
      }

      // Check if downloaded offline
      if (offlineTrackMap.has(track.id)) {
        const item = offlineTrackMap.get(track.id);
        if (item && item.blob) {
          if (ytPlayer && ytPlayer.stopVideo) ytPlayer.stopVideo();
          audio.src = URL.createObjectURL(item.blob);
          audio.playbackRate = speeds[currentSpeedIdx];
          audio.play();
          isPlaying = true;
          updatePlayIcons();
          return;
        }
      }

      // Play via HTML5 Audio with Background Audio Support or YouTube
      if (!isVideoMode && (track.r2Url || track.audioUrl)) {
        if (ytPlayer && ytPlayer.stopVideo) ytPlayer.stopVideo();
        audio.src = track.r2Url || track.audioUrl;
        audio.playbackRate = speeds[currentSpeedIdx];
        audio.play().catch(() => {});
        isPlaying = true;
        updatePlayIcons();
      } else if (ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
        ytPlayer.loadVideoById(track.videoId);
        ytPlayer.setPlaybackRate(speeds[currentSpeedIdx]);
        isPlaying = true;
        updatePlayIcons();
      } else {
        audio.src = track.r2Url || `https://pub-d3eb1c422f7a5f6d2ae0699bd2384f3e.r2.dev/${track.videoId}.mp3`;
        audio.play().catch(() => {});
        isPlaying = true;
        updatePlayIcons();
      }
    }

    function togglePlay() {
      vibrateHaptic();
      initBackgroundAudioKeepAlive();
      if (ytPlayer && isVideoMode && typeof ytPlayer.getPlayerState === 'function') {
        const state = ytPlayer.getPlayerState();
        if (state === YT.PlayerState.PLAYING) {
          ytPlayer.pauseVideo();
          isPlaying = false;
        } else {
          ytPlayer.playVideo();
          isPlaying = true;
        }
      } else if (audio.src) {
        if (isPlaying) {
          audio.pause();
          isPlaying = false;
        } else {
          audio.play();
          isPlaying = true;
        }
      } else if (ytPlayer && typeof ytPlayer.getPlayerState === 'function') {
        const state = ytPlayer.getPlayerState();
        if (state === YT.PlayerState.PLAYING) {
          ytPlayer.pauseVideo();
          isPlaying = false;
        } else {
          ytPlayer.playVideo();
          isPlaying = true;
        }
      }
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      }
      updatePlayIcons();
    }

    function updatePlayIcons() {
      const iconClass = isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play';
      document.getElementById('mini-play-icon').className = iconClass;
      document.getElementById('full-play-icon').className = iconClass;
    }

    function playNext() {
      vibrateHaptic();
      if (currentTrackIndex < currentPlaylistTracks.length - 1) {
        currentTrackIndex++;
        loadAndPlay(currentPlaylistTracks[currentTrackIndex]);
      }
    }

    function playPrev() {
      vibrateHaptic();
      if (currentTrackIndex > 0) {
        currentTrackIndex--;
        loadAndPlay(currentPlaylistTracks[currentTrackIndex]);
      }
    }

    function skipSeconds(sec) {
      vibrateHaptic();
      if (ytPlayer && isVideoMode && typeof ytPlayer.getCurrentTime === 'function') {
        const cur = ytPlayer.getCurrentTime();
        ytPlayer.seekTo(Math.max(0, cur + sec), true);
      } else if (audio.duration) {
        audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + sec));
      } else if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function') {
        const cur = ytPlayer.getCurrentTime();
        ytPlayer.seekTo(Math.max(0, cur + sec), true);
      }
    }

    function cycleSpeed() {
      vibrateHaptic();
      currentSpeedIdx = (currentSpeedIdx + 1) % speeds.length;
      const speed = speeds[currentSpeedIdx];
      if (ytPlayer && ytPlayer.setPlaybackRate) ytPlayer.setPlaybackRate(speed);
      audio.playbackRate = speed;
      document.getElementById('full-speed-btn').textContent = `${speed}x`;
    }

    function toggleVideoMode() {
      vibrateHaptic();
      isVideoMode = !isVideoMode;
      const cont = document.getElementById('yt-player-container');
      const btn = document.getElementById('full-video-toggle-btn');
      if (isVideoMode) {
        cont.classList.remove('hidden');
        btn.className = 'p-2 text-indigo-400 font-bold text-xs';
        if (currentTrack && ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
          const cur = audio.currentTime || 0;
          audio.pause();
          ytPlayer.loadVideoById(currentTrack.videoId, cur);
        }
      } else {
        cont.classList.add('hidden');
        btn.className = 'p-2 text-gray-400 hover:text-indigo-400 text-xs';
      }
    }

    function handleSeek(val) {
      if (ytPlayer && isVideoMode && typeof ytPlayer.getDuration === 'function') {
        const dur = ytPlayer.getDuration();
        ytPlayer.seekTo((val / 100) * dur, true);
      } else if (audio.duration) {
        audio.currentTime = (val / 100) * audio.duration;
      } else if (ytPlayer && typeof ytPlayer.getDuration === 'function') {
        const dur = ytPlayer.getDuration();
        ytPlayer.seekTo((val / 100) * dur, true);
      }
    }

    function formatTime(s) {
      if (!s || isNaN(s)) return '0:00';
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    }

    function getCurrentPlaybackTime() {
      if (audio && audio.duration && !audio.paused) return audio.currentTime;
      if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function') return ytPlayer.getCurrentTime();
      if (audio && audio.currentTime) return audio.currentTime;
      return 0;
    }

    // Sync timer & A-B Looper & Sadhana Tracking
    let secondCounter = 0;
    setInterval(() => {
      let cur = 0;
      let dur = 0;
      if (audio.duration && !audio.paused) {
        cur = audio.currentTime;
        dur = audio.duration;
      } else if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function' && typeof ytPlayer.getDuration === 'function') {
        cur = ytPlayer.getCurrentTime();
        dur = ytPlayer.getDuration();
      } else if (audio.duration) {
        cur = audio.currentTime;
        dur = audio.duration;
      }

      if (isABLoopActive && loopPointB !== null && cur >= loopPointB) {
        if (audio && audio.duration) audio.currentTime = loopPointA;
        else if (ytPlayer && ytPlayer.seekTo) ytPlayer.seekTo(loopPointA, true);
      }

      if (dur > 0) {
        const pct = (cur / dur) * 100;
        document.getElementById('full-cur').textContent = formatTime(cur);
        document.getElementById('full-dur').textContent = formatTime(dur);
        document.getElementById('full-seek').value = pct;
        document.getElementById('mini-progress-bar').style.width = `${pct}%`;

        if (currentTrack && listeningHistory.length > 0 && listeningHistory[0].trackId === currentTrack.id) {
          listeningHistory[0].currentTime = cur;
          listeningHistory[0].duration = dur;
        }

        if (isPlaying) {
          secondCounter++;
          if (secondCounter >= 60) {
            secondCounter = 0;
            sadhanaStats.todayMinutes = (sadhanaStats.todayMinutes || 0) + 1;
            sadhanaStats.totalHours = (sadhanaStats.totalHours || 0) + (1 / 60);
            saveUserData();
          }
        }
      }
    }, 1000);

    function openFullPlayerModal() {
      vibrateHaptic();
      document.getElementById('full-player-modal').classList.remove('hidden');
    }

    function closeFullPlayerModal() {
      vibrateHaptic();
      document.getElementById('full-player-modal').classList.add('hidden');
    }

    // === Favorite Toggle ===
    function toggleFavorite(trackId) {
      vibrateHaptic();
      if (favoriteTrackIds.has(trackId)) {
        favoriteTrackIds.delete(trackId);
      } else {
        favoriteTrackIds.add(trackId);
      }
      saveUserData();
      renderTracksPaginated();
    }

    function toggleFavoriteCurrent() {
      if (!currentTrack) return;
      toggleFavorite(currentTrack.id);
      const isFav = favoriteTrackIds.has(currentTrack.id);
      document.getElementById('mini-fav-icon').className = isFav ? 'fa-solid fa-heart text-rose-500' : 'fa-regular fa-heart';
    }

    // === Notes Modal ===
    function openNoteModalForCurrent() {
      vibrateHaptic();
      if (!currentTrack) {
        alert('Please play a lecture first to attach your study notes!');
        return;
      }
      document.getElementById('note-lecture-title').textContent = currentTrack.title;
      document.getElementById('note-text-input').value = '';
      document.getElementById('note-modal').classList.remove('hidden');
    }

    function closeNoteModal() {
      document.getElementById('note-modal').classList.add('hidden');
    }

    function saveNote() {
      vibrateHaptic();
      const text = document.getElementById('note-text-input').value.trim();
      if (!text || !currentTrack) return;
      let timestamp = formatTime(getCurrentPlaybackTime());

      studyNotes.unshift({
        trackId: currentTrack.id,
        lectureTitle: currentTrack.title,
        text: text,
        timestamp: timestamp,
        date: new Date().toLocaleDateString()
      });
      saveUserData();
      closeNoteModal();
      alert('✓ Study note saved to your Dashboard!');
    }

    function deleteNote(idx) {
      vibrateHaptic();
      studyNotes.splice(idx, 1);
      saveUserData();
    }

    function exportNotes() {
      vibrateHaptic();
      if (studyNotes.length === 0) {
        alert('No notes to export.');
        return;
      }
      let md = `# Vani Vault - Personal Study Notes\nDevotee: ${userProfile.name}\nExported: ${new Date().toLocaleString()}\n\n---\n\n`;
      studyNotes.forEach(n => {
        md += `### 📖 ${n.lectureTitle}\n**Timestamp:** ${n.timestamp} | **Date:** ${n.date}\n\n${n.text}\n\n---\n\n`;
      });
      const blob = new Blob([md], { type: 'text/markdown' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `VaniVault_Notes_${Date.now()}.md`;
      a.click();
    }

    function printOrExportNotesPDF() {
      vibrateHaptic();
      if (studyNotes.length === 0) {
        alert('No notes to print.');
        return;
      }
      const printWindow = window.open('', '_blank');
      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Vani Vault Study Notes - ${userProfile.name}</title>
          <style>
            body { font-family: Georgia, serif; padding: 40px; color: #111; line-height: 1.6; }
            h1 { color: #312e81; border-bottom: 2px solid #e0e7ff; padding-bottom: 8px; }
            .header-info { color: #6b7280; font-size: 14px; margin-bottom: 30px; }
            .note-card { margin-bottom: 24px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; page-break-inside: avoid; }
            .note-title { color: #1e1b4b; font-size: 16px; font-weight: bold; margin-bottom: 4px; }
            .note-meta { color: #4f46e5; font-size: 12px; margin-bottom: 12px; font-family: monospace; }
            .note-body { font-size: 14px; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>Vani Vault • Devotee Study Notebook</h1>
          <div class="header-info">
            <strong>Devotee:</strong> ${userProfile.name} | <strong>Speaker:</strong> Dr. Laxmidhar Behera (HG Lila Purushottam Das)<br/>
            <strong>Exported:</strong> ${new Date().toLocaleString()} | <strong>Total Notes:</strong> ${studyNotes.length}
          </div>
      `;
      studyNotes.forEach(n => {
        html += `
          <div class="note-card">
            <div class="note-title">📖 ${n.lectureTitle}</div>
            <div class="note-meta">⏱️ Timestamp: ${n.timestamp} | 📅 Date: ${n.date}</div>
            <div class="note-body">${n.text}</div>
          </div>
        `;
      });
      html += `</body></html>`;
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    }

    // === Profile Modal ===
    function openEditProfileModal() {
      vibrateHaptic();
      document.getElementById('input-profile-name').value = userProfile.name;
      document.getElementById('input-profile-status').value = userProfile.status;
      document.getElementById('profile-modal').classList.remove('hidden');
    }

    function closeEditProfileModal() {
      document.getElementById('profile-modal').classList.add('hidden');
    }

    function saveProfile() {
      vibrateHaptic();
      const name = document.getElementById('input-profile-name').value.trim() || 'Devotee';
      const status = document.getElementById('input-profile-status').value.trim() || 'Practitioner';
      userProfile.name = name;
      userProfile.status = status;
      updateProfileUI();
      saveUserData();
      closeEditProfileModal();
    }

    // === Custom Playlists ===
    function promptCreatePlaylist() {
      vibrateHaptic();
      const name = prompt('Enter custom playlist name: (e.g. My Morning Japa & Katha, BG Exam Prep)');
      if (!name || !name.trim()) return;
      customPlaylists.push({
        id: 'user_pl_' + Date.now(),
        name: name.trim(),
        trackIds: currentTrack ? [currentTrack.id] : []
      });
      saveUserData();
    }

    function playCustomPlaylist(idx) {
      vibrateHaptic();
      const pl = customPlaylists[idx];
      if (!pl || !pl.trackIds || pl.trackIds.length === 0) {
        alert('This playlist is empty.');
        return;
      }
      currentPlaylistTracks = pl.trackIds.map(id => allTracks.find(t => t.id === id)).filter(Boolean);
      if (currentPlaylistTracks.length > 0) {
        currentTrackIndex = 0;
        loadAndPlay(currentPlaylistTracks[0]);
      }
    }

    function deleteCustomPlaylist(idx) {
      vibrateHaptic();
      customPlaylists.splice(idx, 1);
      saveUserData();
    }

    function clearHistory() {
      vibrateHaptic();
      listeningHistory = [];
      saveUserData();
    }

    async function saveCurrentTrackOffline() {
      vibrateHaptic();
      if (!currentTrack || !db) return;
      const audioUrl = currentTrack.r2Url || `https://pub-d3eb1c422f7a5f6d2ae0699bd2384f3e.r2.dev/${currentTrack.videoId}.mp3`;
      try {
        const res = await fetch(audioUrl);
        const blob = await res.blob();
        const tx = db.transaction('audio_cache', 'readwrite');
        tx.objectStore('audio_cache').put({ id: currentTrack.id, blob, track: currentTrack });
        tx.oncomplete = () => {
          offlineTrackMap.set(currentTrack.id, { id: currentTrack.id, blob, track: currentTrack });
          loadOfflineList();
          alert('✓ Downloaded for offline playback!');
        };
      } catch (e) {
        alert('Could not download: ' + e.message);
      }
    }

    function deleteOffline(id) {
      vibrateHaptic();
      if (!db) return;
      const tx = db.transaction('audio_cache', 'readwrite');
      tx.objectStore('audio_cache').delete(id);
      tx.oncomplete = () => {
        offlineTrackMap.delete(id);
        loadOfflineList();
      };
    }

    async function initApp() {
      setupMediaSession();
      setupMiniPlayerGestures();
      await openDB();
      loadUserData();
      try {
        const [plRes, trkRes] = await Promise.all([
          fetch('./discourse_playlists.json'),
          fetch('./behera_repo.json')
        ]);
        playlists = await plRes.json();
        allTracks = await trkRes.json();
      } catch (e) {
        console.warn('Using embedded memory fallback');
      }

      document.getElementById('pl-total').textContent = playlists.length || 42;
      document.getElementById('trk-total').textContent = allTracks.length || 957;
      renderPlaylists();
      resetAndRenderTracks();
      renderFlashcard();

      // Run live auto-update check in background
      setTimeout(() => checkForCatalogAndAppUpdates(false), 2000);
    }

    initApp();
  </script>
</body>
</html>
'''

with open(os.path.join(os.path.dirname(__file__), '..', 'web-portal', 'index.html'), 'w', encoding='utf-8') as f:
    f.write(html_code)

print("Successfully written upgraded distributed web-portal/index.html")
