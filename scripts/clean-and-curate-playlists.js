/**
 * Precision Filter & Curator for Dr. Laxmidhar Behera & HG Lila Purushottam Das Playlists
 */
const fs = require('fs')
const path = require('path')

const appDataDir = path.join(__dirname, '..')
const catalogFile = path.join(appDataDir, 'discourse_playlists.json')

if (!fs.existsSync(catalogFile)) {
  console.error('Catalog file not found')
  process.exit(1)
}

const raw = JSON.parse(fs.readFileSync(catalogFile, 'utf-8'))
console.log('Initial raw playlists count:', raw.length)

// Strict keywords that MUST be related to Behera Sir / Lila Purushottam Das / LGLG
const REQUIRED_TERMS = [
  'laxmidhar',
  'behera',
  'lila purushottam',
  'lila purusottama',
  'lglg',
  'learn gita live gita',
  'gitanushilanam',
  'bhaktivedantaclub iit kanpur',
  'upadesamrita',
  'nectar of instruction',
  'caitanya bhagavata',
  'sb 3rd canto',
  'srimad bhagavatam playlist | dr. lila',
  'daily 7:30-8:30 srimad bhagavatam class'
]

// Exclude unwanted noise
const JUNK_TERMS = [
  'saibhajan',
  'punjabi',
  'dosti',
  'movie',
  'suo',
  'mama',
  'falguni',
  'barsha',
  'pabitra',
  'bansi',
  'bunu',
  'rajashree',
  'khushbu',
  'sonu',
  'asha',
  'titel',
  'jmt',
  '6iii9',
  'kamala',
  'gaylari',
  'mx player',
  'jitu',
  'rudra tent',
  'audio track',
  'hk3m22',
  'ojikkk',
  'koujo',
  'sss',
  'ka',
  'my fav',
  'history',
  'bridge clues',
  '1241',
  'dipa',
  'puja',
  'kn gg',
  'hii',
  'ok',
  'madhab behera',
  'mathematics class videos from laxmidhar sir',
  'bhajan'
]


const cleanPlaylists = []

for (const pl of raw) {
  const title = (pl.title || '').toLowerCase()
  const desc = (pl.description || '').toLowerCase()
  const combined = `${title} ${desc}`

  // Check if junk (substring match)
  const isJunk = JUNK_TERMS.some((junk) => title.includes(junk))
  if (isJunk) continue


  // Check if matches genuine Behera Sir / Lila Purushottam Das / LGLG content
  const matches = REQUIRED_TERMS.some((term) => combined.includes(term))
  const hasBeheraVideos = (pl.items || []).some((item) => {
    const itTitle = (item.title || '').toLowerCase()
    return (
      itTitle.includes('behera') ||
      itTitle.includes('lila purushottam') ||
      itTitle.includes('lglg') ||
      itTitle.includes('learn gita live gita')
    )
  })

  if (matches || hasBeheraVideos) {
    // Standardize speaker and title
    pl.speaker = 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)'
    pl.title = pl.title.replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"')

    // Clean items
    pl.items = (pl.items || []).map((item) => ({
      ...item,
      title: (item.title || '').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    }))
    pl.itemCount = pl.items.length

    cleanPlaylists.push(pl)
  }
}

// Ensure proper sorting & deduplication by playlist ID
const uniqueMap = new Map()
for (const p of cleanPlaylists) {
  if (!uniqueMap.has(p.playlistId || p.id)) {
    uniqueMap.set(p.playlistId || p.id, p)
  }
}

const finalPlaylists = Array.from(uniqueMap.values())

const categoryOrder = [
  'LGLG',
  'Srimad Bhagavatam',
  'Bhagavad Gita',
  'Chaitanya Charitamrita',
  'Science & Consciousness',
  'Festivals',
  'Q&A & Seminars'
]

finalPlaylists.sort((a, b) => {
  const catA = categoryOrder.indexOf(a.category)
  const catB = categoryOrder.indexOf(b.category)
  if (catA !== catB) return catA - catB
  return b.itemCount - a.itemCount
})

fs.writeFileSync(catalogFile, JSON.stringify(finalPlaylists, null, 2), 'utf-8')

const totalVideos = finalPlaylists.reduce((acc, p) => acc + p.itemCount, 0)

console.log('\n====================================================')
console.log('✨ CLEAN & CURATED PLAYLISTS CATALOG')
console.log('====================================================')
finalPlaylists.forEach((p, idx) => {
  console.log(`${idx + 1}. [${p.category}] "${p.title}" - (${p.itemCount} videos)`)
})
console.log('====================================================')
console.log(`Total Curated Playlists: ${finalPlaylists.length}`)
console.log(`Total Curated Video Discourses: ${totalVideos}`)
console.log('====================================================\n')
