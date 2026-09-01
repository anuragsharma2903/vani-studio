/**
 * Deep Exhaustive Playlist Harvester for Dr. Laxmidhar Behera & HG Lila Purushottam Das
 * Uses Google YouTube Data API v3 with multi-query pagination and title matching.
 */
const fs = require('fs')
const path = require('path')

const apiKey = 'AIzaSyB9slh-YGOLz3AZWt-NhCUPQ19X60awStw'
const appDataDir = path.join(__dirname, '..')

const SEARCH_QUERIES = [
  'Laxmidhar Behera',
  'Lila Purushottam Das',
  'Lila Purusottama Dasa',
  'Dr Laxmidhar Behera',
  'Prof Laxmidhar Behera',
  'Learn Gita Live Gita',
  'LGLG Thematic',
  'LGLG Hindi',
  'LGLG Srimad Bhagavatam',
  'LGLG Bhagavad Gita',
  'BhaktivedantaClub IIT Kanpur Lila Purushottam Das',
  'Bhaktivedanta Club IIT Kanpur Laxmidhar Behera',
  'Laxmidhar Behera Bhagavad Gita',
  'Laxmidhar Behera Consciousness',
  'Laxmidhar Behera IIT Mandi',
  'Lila Purushottam Das ISKCON',
  'Laxmidhar Behera Katha',
  'Laxmidhar Behera Janmashtami',
  'Laxmidhar Behera Upadesamrita',
  'Laxmidhar Behera Chaitanya',
  'Lila Purushottam Das Bhagavatam',
  'Lila Purushottam Das Gita'
]

function formatSeconds(secs) {
  if (isNaN(secs) || secs <= 0) return '0:00'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.floor(secs % 60)
  if (h > 0) {
    return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
  }
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

function matchesBeheraOrLila(text) {
  if (!text) return false
  const t = text.toLowerCase()
  return (
    t.includes('behera') ||
    t.includes('lila purushottam') ||
    t.includes('lila purusottama') ||
    t.includes('lila purushottam das') ||
    t.includes('lila purusottam das') ||
    t.includes('learn gita live gita') ||
    t.includes('lglg') ||
    t.includes('bhaktivedantaclub iit kanpur') ||
    t.includes('bhaktivedanta club iitk') ||
    t.includes('dr. laxmidhar') ||
    t.includes('prof. laxmidhar') ||
    t.includes('prof laxmidhar') ||
    t.includes('dr laxmidhar')
  )
}

function categorizePlaylist(title, desc) {
  const combined = `${title} ${desc || ''}`.toLowerCase()
  if (combined.includes('lglg') || combined.includes('learn gita live gita')) {
    return 'LGLG'
  }
  if (
    combined.includes('bhagavatam') ||
    combined.includes('bhagavat') ||
    combined.includes('srimad') ||
    /\bsb\b/.test(combined)
  ) {
    return 'Srimad Bhagavatam'
  }
  if (combined.includes('gita') || combined.includes('geeta') || /\bbg\b/.test(combined)) {
    return 'Bhagavad Gita'
  }
  if (
    combined.includes('caitanya') ||
    combined.includes('chaitanya') ||
    combined.includes('bhagavata') ||
    combined.includes('charitamrita')
  ) {
    return 'Chaitanya Charitamrita'
  }
  if (
    combined.includes('consciousness') ||
    combined.includes('quantum') ||
    combined.includes('science') ||
    combined.includes('iit') ||
    combined.includes('upadesamrita') ||
    combined.includes('instruction')
  ) {
    return 'Science & Consciousness'
  }
  if (
    combined.includes('janmashtami') ||
    combined.includes('balaram') ||
    combined.includes('kartik') ||
    combined.includes('damodar') ||
    combined.includes('festival') ||
    combined.includes('jayanti')
  ) {
    return 'Festivals'
  }
  if (
    combined.includes('q&a') ||
    combined.includes('q/a') ||
    combined.includes('question') ||
    combined.includes('seminar') ||
    combined.includes('retreat')
  ) {
    return 'Q&A & Seminars'
  }
  return 'LGLG'
}

async function searchPlaylistsForQuery(query) {
  const discovered = []
  let pageToken = ''
  let pageCount = 0

  while (pageCount < 2) {
    // Up to 2 pages per query (100 results per query)
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      query
    )}&type=playlist&maxResults=50&pageToken=${pageToken}&key=${apiKey}`

    try {
      const res = await fetch(url)
      const data = await res.json()
      if (data.error) {
        console.error('Search error for query:', query, data.error.message)
        break
      }

      for (const item of data.items || []) {
        const plId = item.id?.playlistId
        if (plId) {
          discovered.push({
            id: plId,
            title: item.snippet?.title || '',
            description: item.snippet?.description || '',
            channelTitle: item.snippet?.channelTitle || '',
            thumbnail:
              item.snippet?.thumbnails?.high?.url ||
              item.snippet?.thumbnails?.medium?.url ||
              `https://i.ytimg.com/vi/${plId}/hqdefault.jpg`
          })
        }
      }

      if (data.nextPageToken) {
        pageToken = data.nextPageToken
        pageCount++
      } else {
        break
      }
    } catch (e) {
      console.error('Network error querying:', query, e.message)
      break
    }
  }

  return discovered
}

async function fetchAllPlaylistItems(playlistId) {
  const items = []
  let pageToken = ''
  let pageCount = 0

  while (pageCount < 5) {
    // Up to 250 items per playlist
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&pageToken=${pageToken}&playlistId=${playlistId}&key=${apiKey}`
    try {
      const res = await fetch(url)
      const data = await res.json()
      if (data.error) break

      for (const item of data.items || []) {
        const snippet = item.snippet || {}
        const vidId = snippet.resourceId?.videoId || snippet.videoId || ''
        const title = snippet.title || ''

        if (vidId && title !== 'Private video' && title !== 'Deleted video') {
          items.push({
            id: `item_${playlistId}_${items.length}`,
            videoId: vidId,
            title: title,
            url: `https://www.youtube.com/watch?v=${vidId}`,
            thumbnail:
              snippet.thumbnails?.high?.url ||
              snippet.thumbnails?.medium?.url ||
              `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
            position: snippet.position !== undefined ? snippet.position + 1 : items.length + 1
          })
        }
      }

      if (data.nextPageToken) {
        pageToken = data.nextPageToken
        pageCount++
      } else {
        break
      }
    } catch (e) {
      break
    }
  }

  return items
}

async function runDeepSync() {
  console.log('====================================================')
  console.log('🔍 STARTING DEEP PLAYLIST HARVESTER (BEHERA / LILA PURUSHOTTAM)')
  console.log('====================================================\n')

  const uniquePlaylistsMap = new Map()

  for (const q of SEARCH_QUERIES) {
    process.stdout.write(`Querying: "${q}"... `)
    const found = await searchPlaylistsForQuery(q)
    console.log(`Found ${found.length} raw playlists.`)

    for (const pl of found) {
      if (!uniquePlaylistsMap.has(pl.id)) {
        uniquePlaylistsMap.set(pl.id, pl)
      }
    }
  }

  console.log(`\nTotal unique raw playlists discovered: ${uniquePlaylistsMap.size}`)
  console.log('Filtering strictly for Dr. Laxmidhar Behera & HG Lila Purushottam Das...\n')

  const verifiedPlaylists = []

  for (const [plId, pl] of uniquePlaylistsMap.entries()) {
    const titleMatch = matchesBeheraOrLila(pl.title)
    const descMatch = matchesBeheraOrLila(pl.description)
    const channelMatch = matchesBeheraOrLila(pl.channelTitle)

    // If playlist metadata matches
    if (titleMatch || descMatch || channelMatch) {
      process.stdout.write(`Fetching tracks for [${pl.title.substring(0, 45)}]... `)
      const items = await fetchAllPlaylistItems(plId)

      if (items.length > 0) {
        const category = categorizePlaylist(pl.title, pl.description)
        verifiedPlaylists.push({
          id: `pl_${plId}`,
          title: pl.title.replace(/&#39;/g, "'").replace(/&amp;/g, '&'),
          category: category,
          description: pl.description.substring(0, 300),
          url: `https://www.youtube.com/playlist?list=${plId}`,
          playlistId: plId,
          speaker: 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)',
          itemCount: items.length,
          items: items,
          createdAt: new Date().toISOString()
        })
        console.log(`✓ Added (${items.length} videos) [Category: ${category}]`)
      } else {
        console.log(`Skipped (0 accessible videos).`)
      }
    }
  }

  // Sort: LGLG first, then Srimad Bhagavatam, Bhagavad Gita, etc.
  const categoryOrder = [
    'LGLG',
    'Srimad Bhagavatam',
    'Bhagavad Gita',
    'Chaitanya Charitamrita',
    'Science & Consciousness',
    'Festivals',
    'Q&A & Seminars'
  ]

  verifiedPlaylists.sort((a, b) => {
    const catA = categoryOrder.indexOf(a.category)
    const catB = categoryOrder.indexOf(b.category)
    if (catA !== catB) return catA - catB
    return b.itemCount - a.itemCount
  })

  const totalVideos = verifiedPlaylists.reduce((acc, p) => acc + p.itemCount, 0)

  const catalogFile = path.join(appDataDir, 'discourse_playlists.json')
  fs.writeFileSync(catalogFile, JSON.stringify(verifiedPlaylists, null, 2), 'utf-8')

  console.log('\n====================================================')
  console.log(`🎉 DEEP HARVEST COMPLETE:`)
  console.log(`   - Verified Playlists: ${verifiedPlaylists.length}`)
  console.log(`   - Total Discourses / Video Links: ${totalVideos}`)
  console.log(`   - Saved to: discourse_playlists.json`)
  console.log('====================================================\n')
}

runDeepSync()
