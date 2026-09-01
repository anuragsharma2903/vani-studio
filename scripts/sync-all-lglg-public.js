/**
 * Sync all public LGLG and Learn Gita Live Gita playlists
 */
const fs = require('fs')
const path = require('path')

const apiKey = 'AIzaSyB9slh-YGOLz3AZWt-NhCUPQ19X60awStw'
const appDir = path.join(__dirname, '..')

const LGLG_PUBLIC_PLAYLISTS = [
  {
    id: 'PL4aUFSbEEz7J7c63LCS1QW6LC1k9rRVLP',
    title: 'LGLG - Thematic Bhagavad Gita Hindi Series',
    category: 'LGLG'
  },
  {
    id: 'PL4aUFSbEEz7Ib097FWw-7Boh-4DK7qI8h',
    title: 'LGLG Chapter 1 - Thematic Hindi',
    category: 'LGLG'
  },
  {
    id: 'PL4aUFSbEEz7I_4sjydlbmHRytYJsD1hbs',
    title: 'LGLG Chapter 2 - Thematic Hindi',
    category: 'LGLG'
  },
  {
    id: 'PL4aUFSbEEz7IxKqQCBbDk9RqHkeVu-GWJ',
    title: 'LGLG Chapter 3 - Thematic Hindi',
    category: 'LGLG'
  },
  {
    id: 'PL4aUFSbEEz7K3m8Kle_7qdv-h7x3DP-1e',
    title: 'LGLG Chapter 5 - Thematic Hindi',
    category: 'LGLG'
  },
  {
    id: 'PL4aUFSbEEz7KgMLwFjpzx85Iq1f5BFUsb',
    title: 'LGLG Chapter 6 - Thematic Hindi',
    category: 'LGLG'
  },
  {
    id: 'PL4aUFSbEEz7LvBTwj8FiFJgYl3dphrkXe',
    title: 'LGLG Chapter 7 - Thematic Hindi',
    category: 'LGLG'
  },
  {
    id: 'PL4aUFSbEEz7KJGljIuEwY9mObCIqbVML1',
    title: 'LGLG Chapter 8 - Thematic Hindi',
    category: 'LGLG'
  },
  {
    id: 'PL4aUFSbEEz7Lrxcd3WbFn5GIHOvweA1hY',
    title: 'GITANUSHILANAM 2023 Preparatory Classes',
    category: 'Bhagavad Gita'
  },
  {
    id: 'PL4aUFSbEEz7IMi2Pmru0Wd9c6vLh_xbAj',
    title: 'GITANUSHILANAM 2022 Preparatory Classes',
    category: 'Bhagavad Gita'
  },
  {
    id: 'PL4aUFSbEEz7K0Fzh6PAYC5xOD2FpZDZR9',
    title: 'LGLG Sunday Special Sessions',
    category: 'LGLG'
  },
  {
    id: 'PL4aUFSbEEz7Ji0uAekW3X2zlF4nuRjB37',
    title: 'LGLG Special Classes & Seminars',
    category: 'LGLG'
  },
  {
    id: 'PL4aUFSbEEz7JkUnPSVZqWHamumLeBycsW',
    title: 'SB 3rd Canto Chapter 3 - Lila Purushottam Das',
    category: 'Srimad Bhagavatam'
  },
  {
    id: 'PL4aUFSbEEz7LEFeNBXT3DqOLXw9EovjiC',
    title: 'SB 3rd Canto Chapter 4 - Lila Purushottam Das',
    category: 'Srimad Bhagavatam'
  },
  {
    id: 'PL4aUFSbEEz7JHHTizw6j2nm34MRNZ1qZM',
    title: 'SB 3rd Canto Chapter 5 - Lila Purushottam Das',
    category: 'Srimad Bhagavatam'
  },
  {
    id: 'PL4aUFSbEEz7LorbBKY1I-HcVlVYohP5vl',
    title: 'SB 3rd Canto Chapter 6 - Lila Purushottam Das',
    category: 'Srimad Bhagavatam'
  },
  {
    id: 'PL4aUFSbEEz7I4vPyEnHDI-pPAoch7dkQd',
    title: 'SB 3rd Canto Chapter 7 - Lila Purushottam Das',
    category: 'Srimad Bhagavatam'
  },
  {
    id: 'PL4aUFSbEEz7L8DM_dGO1U6iCGUPAeshXm',
    title: 'SB 3rd Canto Chapter 8 - Lila Purushottam Das',
    category: 'Srimad Bhagavatam'
  },
  {
    id: 'PL4aUFSbEEz7Is0iskLskDSmu6p5INGFOm',
    title: 'SB 3rd Canto Chapter 9 - Lila Purushottam Das',
    category: 'Srimad Bhagavatam'
  },
  {
    id: 'PL4aUFSbEEz7JjNG2KfcvmsuYZalyIrCRf',
    title: 'SB 3rd Canto Chapter 12 - Lila Purushottam Das',
    category: 'Srimad Bhagavatam'
  },
  {
    id: 'PL4aUFSbEEz7KVZkIkjukq6cn5Hu_UdJjB',
    title: 'SB 3rd Canto Chapter 13 - Lila Purushottam Das',
    category: 'Srimad Bhagavatam'
  },
  {
    id: 'PL4aUFSbEEz7IPu298NZl2mfV81QGNOb8V',
    title: 'SB 3rd Canto Chapter 14 - Lila Purushottam Das',
    category: 'Srimad Bhagavatam'
  },
  {
    id: 'PL4aUFSbEEz7LpaF9CUSkRONR88GEOmG_C',
    title: 'SB 3rd Canto Chapter 15 - Lila Purushottam Das',
    category: 'Srimad Bhagavatam'
  },
  {
    id: 'PL4aUFSbEEz7KdGs9M9BttdiTyNWs18V0-',
    title: 'SB 3rd Canto Chapter 16 - Lila Purushottam Das',
    category: 'Srimad Bhagavatam'
  },
  {
    id: 'PL4aUFSbEEz7JdwqNkajhC-Ckdml4swZYu',
    title: 'SB 3rd Canto Chapter 19 - Lila Purushottam Das',
    category: 'Srimad Bhagavatam'
  },
  {
    id: 'PL4aUFSbEEz7ILJxQ5nyWIO44X6OIwPYst',
    title: 'SB 3rd Canto Chapter 20 - Lila Purushottam Das',
    category: 'Srimad Bhagavatam'
  },
  {
    id: 'PL4aUFSbEEz7KBnK6vG-lM07m2prtXRHFO',
    title: 'SB 3rd Canto Chapter 21 - Lila Purushottam Das',
    category: 'Srimad Bhagavatam'
  },
  {
    id: 'PL4aUFSbEEz7KFOUtT0MwIjuotkVxxXLQu',
    title: 'SB 3rd Canto Chapter 22 - Lila Purushottam Das',
    category: 'Srimad Bhagavatam'
  },
  {
    id: 'PL4aUFSbEEz7IS6EfHbSYWJbXoPQTeyHLX',
    title: 'SB 3rd Canto Chapter 23 - Lila Purushottam Das',
    category: 'Srimad Bhagavatam'
  },
  {
    id: 'PL2MsSQ6rMtpvgLHQXsP5ILIpIfttkUGol',
    title: 'Morning Srimad Bhagavatam Discourse Series',
    category: 'Srimad Bhagavatam'
  },
  {
    id: 'PL2MsSQ6rMtps6lUzexpU2nm6hl5Yq8oSi',
    title: 'Daily 7:30-8:30 Srimad Bhagavatam Classes',
    category: 'Srimad Bhagavatam'
  },
  {
    id: 'PL2MsSQ6rMtptCsxzRr9GLEG9fBSIAh-QZ',
    title: 'Sri Caitanya Bhagavata - Complete Adi-khanda',
    category: 'Chaitanya Charitamrita'
  },
  {
    id: 'PL2MsSQ6rMtpsxiv6XAEe_59J_R8s5_Gdz',
    title: 'Nectar of Instruction (Sri Upadesamrita)',
    category: 'Science & Consciousness'
  },
  {
    id: 'PL2MsSQ6rMtps21x-tD4H6Hsl7VQ6dQ3Ny',
    title: 'Janmashtami 2020 Lecture Series - Krishna Pastimes',
    category: 'Festivals'
  },
  {
    id: 'PL2MsSQ6rMtpstNk1Tbs_RJgXNONqNEDZC',
    title: 'Kartik Month Damodar Maas Special Evening Katha',
    category: 'Festivals'
  },
  {
    id: 'PL2MsSQ6rMtpu-TPoTx2-Xok8LrOLXB5eW',
    title: 'Purushottam Maas Special Naam Yajna Session',
    category: 'LGLG'
  },
  {
    id: 'PL2MsSQ6rMtpuMkMDK4AIuH43YGG2OgcWx',
    title: 'Spiritual Questions & Answers Sessions',
    category: 'Q&A & Seminars'
  }
]

async function syncAllLGLGPlaylists() {
  console.log('Syncing all public LGLG playlists...')
  const finalPlaylists = []

  for (const pl of LGLG_PUBLIC_PLAYLISTS) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${pl.id}&key=${apiKey}`
      const res = await fetch(url)
      const data = await res.json()
      const items = (data.items || [])
        .map((item, idx) => {
          const snippet = item.snippet || {}
          const vidId = snippet.resourceId?.videoId || snippet.videoId || ''
          return {
            id: `item_${pl.id}_${idx}`,
            videoId: vidId,
            title: (snippet.title || '').replace(/&#39;/g, "'").replace(/&amp;/g, '&'),
            url: `https://www.youtube.com/watch?v=${vidId}`,
            thumbnail:
              snippet.thumbnails?.high?.url ||
              snippet.thumbnails?.medium?.url ||
              `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
            position: snippet.position || idx + 1
          }
        })
        .filter((i) => i.videoId && i.title !== 'Private video' && i.title !== 'Deleted video')

      if (items.length > 0) {
        finalPlaylists.push({
          id: `pl_${pl.id}`,
          title: pl.title,
          category: pl.category,
          description: `Official public discourse series by Dr. Laxmidhar Behera (HG Lila Purushottam Das).`,
          url: `https://www.youtube.com/playlist?list=${pl.id}`,
          playlistId: pl.id,
          speaker: 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)',
          itemCount: items.length,
          items: items,
          createdAt: new Date().toISOString()
        })
        console.log(`✓ [${pl.category}] "${pl.title}" (${items.length} videos)`)
      }
    } catch (e) {
      console.warn(`Failed fetching playlist ${pl.id}:`, e.message)
    }
  }

  // Save to root and web-portal
  fs.writeFileSync(
    path.join(appDir, 'discourse_playlists.json'),
    JSON.stringify(finalPlaylists, null, 2),
    'utf-8'
  )
  fs.writeFileSync(
    path.join(appDir, 'web-portal', 'discourse_playlists.json'),
    JSON.stringify(finalPlaylists, null, 2),
    'utf-8'
  )

  // Flatten tracks for behera_repo.json
  const tracks = []
  finalPlaylists.forEach((pl) => {
    ;(pl.items || []).forEach((item) => {
      tracks.push({
        id: item.id || `track_${item.videoId}`,
        title: item.title,
        speaker: 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)',
        playlistTitle: pl.title,
        category: pl.category,
        videoId: item.videoId,
        sourceUrl: item.url,
        thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
        r2Url: `https://pub-d3eb1c422f7a5f6d2ae0699bd2384f3e.r2.dev/${item.videoId}.mp3`,
        metadata: {
          scripture: pl.category,
          playlist: pl.title,
          speaker: 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)'
        }
      })
    })
  })

  fs.writeFileSync(
    path.join(appDir, 'web-portal', 'behera_repo.json'),
    JSON.stringify(tracks, null, 2),
    'utf-8'
  )

  console.log(`\n====================================================`)
  console.log(`🎉 PUBLIC LGLG PLAYLISTS SYNCED:`)
  console.log(`   - Total Playlists: ${finalPlaylists.length}`)
  console.log(`   - Total Discourses: ${tracks.length}`)
  console.log(`====================================================\n`)
}

syncAllLGLGPlaylists()
