/**
 * Sync Official LGLG & Lila Purushottam Das Playlists using Google YouTube Data API v3
 */
const fs = require('fs')
const path = require('path')

const apiKey = 'process.env.YOUTUBE_API_KEY || 'AIza_DEMO_KEY''
const appDataDir = path.join(__dirname, '..')

// 1. Update App Settings
const settingsFile = path.join(appDataDir, 'app_settings.json')
let settings = {}
if (fs.existsSync(settingsFile)) {
  try {
    settings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'))
  } catch (e) {}
}
settings.youtubeApiKey = apiKey
fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf-8')
console.log('✓ Saved YouTube API Key to app_settings.json')

// 2. Fetch all videos from real LGLG & Lila Purushottam Das playlists
const PLAYLIST_DEFS = [
  {
    id: 'PL4aUFSbEEz7J7c63LCS1QW6LC1k9rRVLP',
    title: 'LGLG - Thematic Bhagavad Gita Hindi Series',
    category: 'LGLG',
    description:
      'Learn Gita Live Gita (LGLG) thematic chapter-wise discourse series by Dr. Laxmidhar Behera (HG Lila Purushottam Das).',
    speaker: 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)'
  },
  {
    id: 'PL4aUFSbEEz7KLu51qErFhs75XD4P0HyXc',
    title: 'LGLG - Complete Bhagavad Gita Online Course',
    category: 'LGLG',
    description:
      'Comprehensive Bhagavad Gita online course by IITians and Dr. Laxmidhar Behera.',
    speaker: 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)'
  },
  {
    id: 'PL2MsSQ6rMtpvgLHQXsP5ILIpIfttkUGol',
    title: 'Morning Srimad Bhagavatam Discourse Series',
    category: 'Srimad Bhagavatam',
    description:
      'Daily morning Srimad Bhagavatam lectures by Dr. Lila Purushottam Das (Prof. Laxmidhar Behera).',
    speaker: 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)'
  },
  {
    id: 'PL2MsSQ6rMtps6lUzexpU2nm6hl5Yq8oSi',
    title: 'Daily Srimad Bhagavatam Classes (7:30 AM)',
    category: 'Srimad Bhagavatam',
    description: 'Systematic daily Srimad Bhagavatam discourses by Dr. Lila Purushottam Das.',
    speaker: 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)'
  },
  {
    id: 'PL2MsSQ6rMtptCsxzRr9GLEG9fBSIAh-QZ',
    title: 'Sri Caitanya Bhagavata - Complete Adi Khanda',
    category: 'Chaitanya Charitamrita',
    description: 'Complete Sri Caitanya Bhagavata discourse series by Dr. Lila Purushottam Das.',
    speaker: 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)'
  },
  {
    id: 'PL2MsSQ6rMtpsxiv6XAEe_59J_R8s5_Gdz',
    title: 'Nectar of Instruction (Sri Upadesamrita)',
    category: 'Science & Consciousness',
    description:
      'Deep verse-by-verse analysis of Srila Rupa Goswami Upadesamrita by Dr. Lila Purushottam Das.',
    speaker: 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)'
  },
  {
    id: 'PL2MsSQ6rMtps21x-tD4H6Hsl7VQ6dQ3Ny',
    title: 'Sri Krishna Janmashtami Special Pastimes Series',
    category: 'Festivals',
    description:
      'Deeper understanding of Lord Sri Krishna pastimes and divine appearance by Dr. Lila Purushottam Das.',
    speaker: 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)'
  },
  {
    id: 'PL2MsSQ6rMtpstNk1Tbs_RJgXNONqNEDZC',
    title: 'Kartik Month - Damodara Lila Evening Katha',
    category: 'Festivals',
    description:
      'Daily Damodara month special evening Krishna Katha by Dr. Lila Purushottam Das.',
    speaker: 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)'
  },
  {
    id: 'PL2MsSQ6rMtpuMkMDK4AIuH43YGG2OgcWx',
    title: 'Spiritual Questions & Answers Sessions',
    category: 'Q&A & Seminars',
    description:
      'Interactive philosophical Q&A sessions with youth, researchers, and devotees.',
    speaker: 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)'
  }
]

async function populatePlaylists() {
  const resultPlaylists = []

  for (const def of PLAYLIST_DEFS) {
    try {
      const url =
        'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=' +
        def.id +
        '&key=' +
        apiKey
      const res = await fetch(url)
      const data = await res.json()
      const items = (data.items || [])
        .map((item, idx) => {
          const snippet = item.snippet || {}
          const vidId = snippet.resourceId?.videoId || snippet.videoId || ''
          return {
            id: 'item_' + def.id + '_' + idx,
            videoId: vidId,
            title: snippet.title || 'Untitled Video',
            url: 'https://www.youtube.com/watch?v=' + vidId,
            thumbnail:
              snippet.thumbnails?.high?.url ||
              snippet.thumbnails?.medium?.url ||
              'https://i.ytimg.com/vi/' + vidId + '/hqdefault.jpg',
            position: snippet.position || idx + 1
          }
        })
        .filter((i) => i.videoId && i.title !== 'Private video' && i.title !== 'Deleted video')

      resultPlaylists.push({
        id: 'pl_' + def.id,
        title: def.title,
        category: def.category,
        description: def.description,
        url: 'https://www.youtube.com/playlist?list=' + def.id,
        playlistId: def.id,
        speaker: def.speaker,
        itemCount: items.length,
        items: items,
        createdAt: new Date().toISOString()
      })
      console.log('✓ Fetched playlist: ' + def.title + ' (' + items.length + ' videos)')
    } catch (e) {
      console.error('Error fetching playlist ' + def.id + ':', e)
    }
  }

  const catalogFile = path.join(appDataDir, 'discourse_playlists.json')
  fs.writeFileSync(catalogFile, JSON.stringify(resultPlaylists, null, 2), 'utf-8')
  console.log(
    '✓ Successfully wrote ' + resultPlaylists.length + ' rich playlists to discourse_playlists.json'
  )
}

populatePlaylists()
