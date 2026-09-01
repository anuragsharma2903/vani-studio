const fs = require('fs')
const path = require('path')

const youtubeApiKey = 'process.env.YOUTUBE_API_KEY || 'AIza_DEMO_KEY''
const groqApiKey = 'process.env.GROQ_API_KEY || 'AIza_DEMO_KEY''
const hfToken = 'process.env.HUGGINGFACE_TOKEN || 'HF_DEMO_TOKEN''
const appDir = path.join(__dirname, '..')

// 1. Save keys to app_settings.json
const settingsFile = path.join(appDir, 'app_settings.json')
let settings = {}
if (fs.existsSync(settingsFile)) {
  try {
    settings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'))
  } catch (e) {}
}
settings.youtubeApiKey = youtubeApiKey
settings.groqApiKey = groqApiKey
settings.huggingFaceToken = hfToken
fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf-8')
console.log('✓ Saved Groq and HuggingFace API Keys into app_settings.json')

// 2. Playlists requested by User
const TARGET_PLAYLISTS = [
  {
    id: 'PLQUZT_iE6kHuxf-1O9R472Kaec1RyUnwZ',
    title: 'Bhakti Shastri - Bhagavad Gita Comprehensive Module',
    category: 'Bhagavad Gita',
    subSeries: 'Bhakti Shastri Degree'
  },
  {
    id: 'PL_ldO7h4tXyIs05T7Zylqr3r5Hbgv-Zxn',
    title: "Sir's Sankhya Philosophy Lecture Series",
    category: 'Science & Consciousness',
    subSeries: 'Sankhya Philosophy'
  },
  {
    id: 'PL4aUFSbEEz7J59wlTyajSeoooECjxW96f',
    title: 'Bhagavad Samkhya 2024 IIT Mandi Series',
    category: 'Science & Consciousness',
    subSeries: 'Sankhya Philosophy'
  },
  {
    id: 'PL4aUFSbEEz7KABtP9i_5ro47BjUdPSH2U',
    title: 'Bhakti Shastri - Nectar Of Instruction (Sri Upadesamrita)',
    category: 'Science & Consciousness',
    subSeries: 'Bhakti Shastri Degree'
  },
  {
    id: 'PL4aUFSbEEz7Id7tFotr_hZYLUIzrKARAc',
    title: 'Sri Shikshashtakam Special Masterclass Series',
    category: 'Chaitanya Charitamrita',
    subSeries: 'Siksastakam'
  }
]

// Day & Section Parser for Day X | Bhakti Sastri Class | BG Chapter X ...
function parseStructuredTitle(rawTitle) {
  let dayNumber = ''
  let scripture = ''
  let chapter = ''
  let section = ''
  let dateRecorded = ''
  let cleanTitle = rawTitle

  // Extract Day (e.g. Day 3, Day 4, Day 5)
  const dayMatch = rawTitle.match(/\bDay\s*(\d+)\b/i)
  if (dayMatch) {
    dayNumber = `Day ${dayMatch[1]}`
  }

  // Extract Date (e.g. 06/02/2022, 11/02/2022, 27/12/2020)
  const dateMatch = rawTitle.match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/)
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, '0')
    const month = dateMatch[2].padStart(2, '0')
    const year = dateMatch[3]
    dateRecorded = `${year}-${month}-${day}`
  }

  // Extract BG Chapter & Section
  const bgMatch = rawTitle.match(/\bBG\s*Chapter\s*(\d+)(?:[-–—\s]+([^|]+))?/i)
  if (bgMatch) {
    scripture = 'Bhagavad Gita'
    chapter = bgMatch[1]
    if (bgMatch[2]) {
      section = bgMatch[2].trim()
    }
  }

  // Clean title
  cleanTitle = rawTitle
    .replace(/\|\s*Dr\.?\s*Lila\s*Purushottam\s*Das\b/gi, '')
    .replace(/\|\s*Prof\.?\s*Laxmidhar\s*Behera\b/gi, '')
    .replace(/\|\s*Learn\s*Gita\s*Live\s*Gita\b/gi, '')
    .replace(/\|\s*\d{1,2}[./-]\d{1,2}[./-]\d{4}\s*\|?/g, '')
    .replace(/\s*\|\s*$/, '')
    .replace(/^\s*\|\s*/, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  return {
    dayNumber,
    scripture: scripture || 'Spiritual Discourse',
    chapter,
    section,
    dateRecorded,
    cleanTitle: cleanTitle || rawTitle
  }
}

async function fetchAndEnrichPlaylists() {
  console.log('\nFetching and structuring user requested playlists via YouTube API...')
  const ingestedPlaylists = []
  const flatTracks = []

  for (const pl of TARGET_PLAYLISTS) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${pl.id}&key=${youtubeApiKey}`
      const res = await fetch(url)
      const data = await res.json()

      const items = (data.items || [])
        .map((item, idx) => {
          const snippet = item.snippet || {}
          const vidId = snippet.resourceId?.videoId || snippet.videoId || ''
          const rawTitle = (snippet.title || '').replace(/&#39;/g, "'").replace(/&amp;/g, '&')

          const parsed = parseStructuredTitle(rawTitle)

          const track = {
            id: `track_${pl.id}_${idx}`,
            videoId: vidId,
            title: parsed.cleanTitle,
            originalTitle: rawTitle,
            dayNumber: parsed.dayNumber,
            scripture: parsed.scripture,
            chapter: parsed.chapter,
            section: parsed.section,
            dateRecorded: parsed.dateRecorded,
            speaker: 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)',
            playlistTitle: pl.title,
            subSeries: pl.subSeries,
            category: pl.category,
            youtubeUrl: `https://www.youtube.com/watch?v=${vidId}`,
            thumbnail:
              snippet.thumbnails?.high?.url ||
              snippet.thumbnails?.medium?.url ||
              `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
            position: snippet.position || idx + 1,
            downloadStatus: 'available_on_demand', // Selective user download
            r2Url: `https://pub-d3eb1c422f7a5f6d2ae0699bd2384f3e.r2.dev/${vidId}.mp3`
          }

          flatTracks.push(track)
          return track
        })
        .filter(
          (i) =>
            i.videoId &&
            i.originalTitle !== 'Private video' &&
            i.originalTitle !== 'Deleted video'
        )

      // Sort by Day or Position
      items.sort((a, b) => (a.position || 0) - (b.position || 0))

      ingestedPlaylists.push({
        id: `pl_${pl.id}`,
        title: pl.title,
        category: pl.category,
        subSeries: pl.subSeries,
        speaker: 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)',
        url: `https://www.youtube.com/playlist?list=${pl.id}`,
        itemCount: items.length,
        items: items
      })

      console.log(`✓ [${pl.subSeries}] "${pl.title}" (${items.length} lectures indexed)`)
    } catch (e) {
      console.warn(`Error fetching ${pl.title}:`, e.message)
    }
  }

  // Read existing discourse_playlists.json
  const plFile = path.join(appDir, 'discourse_playlists.json')
  let existingPlaylists = []
  if (fs.existsSync(plFile)) {
    try {
      existingPlaylists = JSON.parse(fs.readFileSync(plFile, 'utf-8'))
    } catch (e) {}
  }

  // Merge (replace or prepend user target playlists at the top)
  const targetIds = new Set(TARGET_PLAYLISTS.map((t) => t.id))
  const filteredExisting = existingPlaylists.filter(
    (p) => !targetIds.has(p.playlistId || p.id.replace('pl_', ''))
  )
  const mergedPlaylists = [...ingestedPlaylists, ...filteredExisting]

  fs.writeFileSync(plFile, JSON.stringify(mergedPlaylists, null, 2), 'utf-8')
  fs.writeFileSync(
    path.join(appDir, 'web-portal', 'discourse_playlists.json'),
    JSON.stringify(mergedPlaylists, null, 2),
    'utf-8'
  )

  // Merge flat tracks
  const trkFile = path.join(appDir, 'web-portal', 'behera_repo.json')
  let existingTracks = []
  if (fs.existsSync(trkFile)) {
    try {
      existingTracks = JSON.parse(fs.readFileSync(trkFile, 'utf-8'))
    } catch (e) {}
  }
  const mergedTracks = [
    ...flatTracks,
    ...existingTracks.filter((t) => !flatTracks.some((f) => f.videoId === t.videoId))
  ]
  fs.writeFileSync(trkFile, JSON.stringify(mergedTracks, null, 2), 'utf-8')

  console.log('\n====================================================')
  console.log(`🎉 USER PLAYLISTS INGESTED WITH DAY/DATE METADATA:`)
  console.log(`   - Bhakti Shastri BG: Indexed`)
  console.log(`   - Sankhya Lectures: Indexed`)
  console.log(`   - Nectar of Instruction: Indexed`)
  console.log(`   - Shikshashtakam: Indexed`)
  console.log(`   - Total Playlists in Catalog: ${mergedPlaylists.length}`)
  console.log(`   - Total Discourses in Catalog: ${mergedTracks.length}`)
  console.log('====================================================\n')
}

fetchAndEnrichPlaylists()
