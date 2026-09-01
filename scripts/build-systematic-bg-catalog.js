/**
 * Systematically organize Bhagavad Gita playlists with deep title metadata.
 * Does NOT download audio files, only indexes and structures metadata for selective user download.
 */
const fs = require('fs')
const path = require('path')

const apiKey = 'process.env.YOUTUBE_API_KEY || 'AIza_DEMO_KEY''
const appDir = path.join(__dirname, '..')

const BG_COMPREHENSIVE_PLAYLISTS = [
  {
    id: 'PL4aUFSbEEz7LHCmuij1iLvwH41ZqtA4tN',
    title: 'Bhagavad Gita Online Course by IITians (Comprehensive)',
    category: 'Bhagavad Gita',
    subSeries: 'Foundation Course'
  },
  {
    id: 'PL4aUFSbEEz7J7c63LCS1QW6LC1k9rRVLP',
    title: 'LGLG - Thematic Bhagavad Gita Hindi Series',
    category: 'Bhagavad Gita',
    subSeries: 'Thematic Overview'
  },
  {
    id: 'PL4aUFSbEEz7Ib097FWw-7Boh-4DK7qI8h',
    title: 'Bhagavad Gita Chapter 1 - Observing the Armies (Arjuna Vishada Yoga)',
    chapter: '1',
    category: 'Bhagavad Gita',
    subSeries: 'Chapter-by-Chapter'
  },
  {
    id: 'PL4aUFSbEEz7I_4sjydlbmHRytYJsD1hbs',
    title: 'Bhagavad Gita Chapter 2 - Contents of the Gita Summarized (Sankhya Yoga)',
    chapter: '2',
    category: 'Bhagavad Gita',
    subSeries: 'Chapter-by-Chapter'
  },
  {
    id: 'PL4aUFSbEEz7IxKqQCBbDk9RqHkeVu-GWJ',
    title: 'Bhagavad Gita Chapter 3 - Karma Yoga (Path of Selfless Action)',
    chapter: '3',
    category: 'Bhagavad Gita',
    subSeries: 'Chapter-by-Chapter'
  },
  {
    id: 'PL4aUFSbEEz7Kj_4LTy6iOXNQaoY0-Hr-z',
    title: 'Bhagavad Gita Chapter 4 - Transcendental Knowledge (Jnana Karma Sannyasa)',
    chapter: '4',
    category: 'Bhagavad Gita',
    subSeries: 'Chapter-by-Chapter'
  },
  {
    id: 'PL4aUFSbEEz7K3m8Kle_7qdv-h7x3DP-1e',
    title: 'Bhagavad Gita Chapter 5 - Karma Yoga - Action in Krishna Consciousness',
    chapter: '5',
    category: 'Bhagavad Gita',
    subSeries: 'Chapter-by-Chapter'
  },
  {
    id: 'PL4aUFSbEEz7KgMLwFjpzx85Iq1f5BFUsb',
    title: 'Bhagavad Gita Chapter 6 - Dhyana Yoga (Mind & Meditation)',
    chapter: '6',
    category: 'Bhagavad Gita',
    subSeries: 'Chapter-by-Chapter'
  },
  {
    id: 'PL4aUFSbEEz7LvBTwj8FiFJgYl3dphrkXe',
    title: 'Bhagavad Gita Chapter 7 - Knowledge of the Absolute (Jnana Vijnana Yoga)',
    chapter: '7',
    category: 'Bhagavad Gita',
    subSeries: 'Chapter-by-Chapter'
  },
  {
    id: 'PL4aUFSbEEz7KJGljIuEwY9mObCIqbVML1',
    title: 'Bhagavad Gita Chapter 8 - Attaining the Supreme (Akshara Brahma Yoga)',
    chapter: '8',
    category: 'Bhagavad Gita',
    subSeries: 'Chapter-by-Chapter'
  },
  {
    id: 'PL4aUFSbEEz7Lrxcd3WbFn5GIHOvweA1hY',
    title: 'GITANUSHILANAM 2023 Preparatory Classes',
    category: 'Bhagavad Gita',
    subSeries: 'Gitanushilanam Intensive'
  },
  {
    id: 'PL4aUFSbEEz7IMi2Pmru0Wd9c6vLh_xbAj',
    title: 'GITANUSHILANAM 2022 Preparatory Classes',
    category: 'Bhagavad Gita',
    subSeries: 'Gitanushilanam Intensive'
  }
]

function cleanLectureTitle(rawTitle, defaultChapter) {
  let clean = rawTitle
    .replace(/#\w+/g, '')
    .replace(/\|\s*Learn\s*Gita\s*Live\s*Gita\b/gi, '')
    .replace(/\|\s*Prof\.?\s*Laxmidhar\s*Behera\b/gi, '')
    .replace(/\|\s*Dr\.?\s*Lila\s*Purushottam\s*Das\b/gi, '')
    .replace(/\|\s*Professor\s*,?\s*IITK?\b/gi, '')
    .replace(/\|\s*www\.[a-z0-9.-]+\s*/gi, '')
    .replace(/\s*\|\s*$/, '')
    .trim()

  const hindiMatch = rawTitle.match(/[\u0900-\u097F\s]+/g)
  const titleHindi = hindiMatch ? hindiMatch.join(' ').trim() : undefined

  return {
    cleanTitle: clean || rawTitle,
    titleHindi: titleHindi && titleHindi.length > 3 ? titleHindi : undefined
  }
}

async function buildSystematicBGCatalog() {
  console.log('Building systematic Bhagavad Gita catalog without downloading audio...')
  const structuredPlaylists = []
  const allBgTracks = []

  for (const plDef of BG_COMPREHENSIVE_PLAYLISTS) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${plDef.id}&key=${apiKey}`
      const res = await fetch(url)
      const data = await res.json()

      const items = (data.items || [])
        .map((item, idx) => {
          const snippet = item.snippet || {}
          const vidId = snippet.resourceId?.videoId || snippet.videoId || ''
          const rawTitle = snippet.title || 'Untitled Lecture'

          const { cleanTitle, titleHindi } = cleanLectureTitle(rawTitle, plDef.chapter)

          const trackObj = {
            id: `bg_${plDef.id}_${idx}`,
            videoId: vidId,
            title: cleanTitle,
            originalTitle: rawTitle,
            titleHindi: titleHindi,
            speaker: 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)',
            scripture: 'Bhagavad Gita',
            chapter: plDef.chapter || '',
            playlistTitle: plDef.title,
            subSeries: plDef.subSeries,
            category: 'Bhagavad Gita',
            url: `https://www.youtube.com/watch?v=${vidId}`,
            thumbnail:
              snippet.thumbnails?.high?.url ||
              snippet.thumbnails?.medium?.url ||
              `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
            position: snippet.position || idx + 1,
            downloadStatus: 'available_on_demand', // Not downloaded, user can selectively download
            r2Url: `https://pub-d3eb1c422f7a5f6d2ae0699bd2384f3e.r2.dev/${vidId}.mp3`
          }

          allBgTracks.push(trackObj)
          return trackObj
        })
        .filter(
          (i) =>
            i.videoId &&
            i.originalTitle !== 'Private video' &&
            i.originalTitle !== 'Deleted video'
        )

      structuredPlaylists.push({
        id: `pl_${plDef.id}`,
        title: plDef.title,
        chapter: plDef.chapter,
        category: plDef.category,
        subSeries: plDef.subSeries,
        speaker: 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)',
        url: `https://www.youtube.com/playlist?list=${plDef.id}`,
        itemCount: items.length,
        items: items
      })

      console.log(`✓ [${plDef.subSeries}] "${plDef.title}" (${items.length} lectures indexed)`)
    } catch (e) {
      console.warn(`Error fetching ${plDef.title}:`, e.message)
    }
  }

  // Save BG specific catalog
  fs.writeFileSync(
    path.join(appDir, 'bhagavad_gita_catalog.json'),
    JSON.stringify(structuredPlaylists, null, 2),
    'utf-8'
  )

  console.log('\n====================================================')
  console.log(`🎉 BHAGAVAD GITA COMPREHENSIVE CATALOG READY:`)
  console.log(`   - Playlists: ${structuredPlaylists.length}`)
  console.log(`   - Total Lectures Indexed: ${allBgTracks.length}`)
  console.log(`   - Download Status: On-demand (No bulk video downloading)`)
  console.log('====================================================\n')
}

buildSystematicBGCatalog()
