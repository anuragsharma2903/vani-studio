import { DiscourseMetadata } from './types'

export interface ParsedDiscourseInfo {
  title: string
  titleHindi?: string
  speaker: string
  scripture?: string
  canto?: string
  chapter?: string
  verse?: string
  philosophyTopic?: string
  festival?: string
  location?: string
  dateRecorded?: string
  language: string
  suggestedFolderPath: string
  metadata: DiscourseMetadata
}

const FAMOUS_SHLOKAS: Array<{
  pattern: RegExp
  scripture: string
  canto?: string
  chapter?: string
  verse: string
  topic: string
}> = [
  {
    pattern: /tad\s*viddhi\s*pranipat/i,
    scripture: 'Bhagavad Gita',
    chapter: '4',
    verse: 'BG 4.34',
    topic: 'Approaching a Spiritual Master'
  },
  {
    pattern: /sarva[- ]*dharman\s*parityaj/i,
    scripture: 'Bhagavad Gita',
    chapter: '18',
    verse: 'BG 18.66',
    topic: 'Total Surrender to Krishna'
  },
  {
    pattern: /dehino\s*['’]?smin\s*yatha\s*dehe/i,
    scripture: 'Bhagavad Gita',
    chapter: '2',
    verse: 'BG 2.13',
    topic: 'Transmigration of the Soul'
  },
  {
    pattern: /karmany\s*evadhikaraste/i,
    scripture: 'Bhagavad Gita',
    chapter: '2',
    verse: 'BG 2.47',
    topic: 'Karma Yoga'
  },
  {
    pattern: /janmady\s*asya\s*yata/i,
    scripture: 'Srimad Bhagavatam',
    canto: '1',
    chapter: '1',
    verse: 'SB 1.1.1',
    topic: 'The Absolute Truth'
  },
  {
    pattern: /dharmah\s*projjhita\s*kaitavo/i,
    scripture: 'Srimad Bhagavatam',
    canto: '1',
    chapter: '1',
    verse: 'SB 1.1.2',
    topic: 'Pure Religion'
  },
  {
    pattern: /sa\s*vai\s*pumsam\s*paro\s*dharmo/i,
    scripture: 'Srimad Bhagavatam',
    canto: '1',
    chapter: '2',
    verse: 'SB 1.2.6',
    topic: 'Supreme Dharma'
  },
  {
    pattern: /krsnas\s*tu\s*bhagavan\s*svayam/i,
    scripture: 'Srimad Bhagavatam',
    canto: '1',
    chapter: '3',
    verse: 'SB 1.3.28',
    topic: 'Krishna is the Supreme Personality of Godhead'
  },
  {
    pattern: /jivera\s*svarupa\s*haya/i,
    scripture: 'Chaitanya Charitamrita',
    canto: 'Madhya',
    chapter: '20',
    verse: 'CC Madhya 20.108',
    topic: 'Constitutional Position of the Soul'
  },
  {
    pattern: /ceto[- ]*darpana[- ]*marjanam/i,
    scripture: 'Sri Siksastakam',
    verse: 'Siksastakam 1',
    topic: 'Cleansing the Mirror of the Mind'
  }
]

const MONTH_NAMES: Record<string, string> = {
  jan: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  aug: '08',
  sep: '09',
  oct: '10',
  nov: '11',
  dec: '12'
}

export function parseDiscourseFromTitle(
  rawTitle: string,
  rawDescription?: string,
  rawUploader?: string
): ParsedDiscourseInfo {
  let title = rawTitle.trim()
  const desc = rawDescription || ''
  const combined = `${title} ${desc}`

  // 1. Standardize Speaker to Dr. Laxmidhar Behera (HG Lila Purushottam Das)
  let speaker = 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)'
  if (/lila\s*purushottam|lila\s*purusottama/i.test(combined)) {
    speaker = 'HG Lila Purushottam Das (Dr. Laxmidhar Behera)'
  } else if (/laxmidhar\s*behera|dr\.?\s*behera/i.test(combined)) {
    speaker = 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)'
  } else if (rawUploader && !/youtube|channel/i.test(rawUploader)) {
    speaker = rawUploader.trim()
  }

  let scripture: string | undefined = undefined
  let canto: string | undefined = undefined
  let chapter: string | undefined = undefined
  let verse: string | undefined = undefined
  let philosophyTopic: string | undefined = undefined
  let festival: string | undefined = undefined
  let location: string | undefined = undefined
  let dateRecorded: string | undefined = undefined
  let language = 'Hindi'
  let titleHindi: string | undefined = undefined

  // 2. Natural Date Extraction (Handles 27th Dec 2020, 11th Apr 2021, 2026-08-31, 15.08.2026, 03/03/24)
  const textDateMatch = combined.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(202\d)\b/i
  )
  if (textDateMatch) {
    const day = textDateMatch[1].padStart(2, '0')
    const month = MONTH_NAMES[textDateMatch[2].substring(0, 3).toLowerCase()] || '01'
    const year = textDateMatch[3]
    dateRecorded = `${year}-${month}-${day}`
  }

  if (!dateRecorded) {
    const isoDateMatch = combined.match(/\b(202\d[-/.]\d{1,2}[-/.]\d{1,2})\b/)
    if (isoDateMatch) {
      dateRecorded = isoDateMatch[1].replace(/[/.]/g, '-')
    }
  }

  if (!dateRecorded) {
    const dmyMatch = combined.match(/\b(\d{1,2})[-./](\d{1,2})[-./](202\d|\d{2})\b/)
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0')
      const month = dmyMatch[2].padStart(2, '0')
      const rawYear = dmyMatch[3]
      const year = rawYear.length === 2 ? `20${rawYear}` : rawYear
      dateRecorded = `${year}-${month}-${day}`
    }
  }

  // 3. Match Famous Sanskrit Shlokas
  for (const shloka of FAMOUS_SHLOKAS) {
    if (shloka.pattern.test(combined)) {
      scripture = shloka.scripture
      canto = shloka.canto
      chapter = shloka.chapter
      verse = shloka.verse
      philosophyTopic = shloka.topic
      break
    }
  }

  // 4. Detect Specific Scriptures & Chapters
  // Srimad Bhagavatam
  if (!scripture) {
    const sbMatch = combined.match(
      /\b(?:SB|S\.B\.|Srimad\s*Bhagavatam|Shrimad\s*Bhagavatam)\s*(?:(?:Canto|C)\s*)?(\d{1,2})(?:[.:\s]+(?:(?:Chapter|Ch|CH)\s*)?(\d{1,2}))?(?:[.:\s]+(?:(?:Verse|V)\s*)?(\d{1,3}(?:-\d{1,3})?))?/i
    )
    if (sbMatch) {
      scripture = 'Srimad Bhagavatam'
      canto = sbMatch[1]
      chapter = sbMatch[2]
      if (canto && chapter && sbMatch[3]) {
        verse = `SB ${canto}.${chapter}.${sbMatch[3]}`
      } else if (canto && chapter) {
        verse = `SB ${canto}.${chapter}`
      } else if (canto) {
        verse = `SB Canto ${canto}`
      }
    }
  }

  // Sri Caitanya Bhagavata
  if (!scripture && /caitanya\s*bhagavata|chaitanya\s*bhagavata/i.test(combined)) {
    scripture = 'Sri Caitanya Bhagavata'
    const khandaMatch = combined.match(/\b(Adi|Madhya|Antya)[ -]*(?:khanda|khand)?\b/i)
    if (khandaMatch) {
      canto = `${khandaMatch[1]}-khanda`
    }
  }

  // Nectar of Instruction (Sri Upadesamrita)
  if (!scripture && /upadesamrita|nectar\s*of\s*instruction/i.test(combined)) {
    scripture = 'Sri Upadesamrita'
    philosophyTopic = 'Nectar of Instruction'
  }

  // Bhagavad Gita
  if (!scripture) {
    const bgMatch = combined.match(
      /\b(?:BG|B\.G\.|Bhagavad\s*Gita|Gita)\s*(?:(?:Chapter|Ch|CH)\s*)?(\d{1,2})(?:[.:\s]+(?:(?:Verse|V|Part)\s*)?(\d{1,3}(?:-\d{1,3})?))?/i
    )
    if (bgMatch) {
      scripture = 'Bhagavad Gita'
      chapter = bgMatch[1]
      verse = bgMatch[2] ? `BG ${bgMatch[1]}.${bgMatch[2]}` : `BG Chapter ${bgMatch[1]}`
    }
  }

  // 5. Detect Festivals (English & Hindi)
  const HINDI_FESTIVALS: Array<{ pattern: RegExp; name: string }> = [
    { pattern: /बलराम\s*जयंती/i, name: 'Balaram Jayanti' },
    { pattern: /(?:कृष्ण\s*)?जन्माष्टमी/i, name: 'Janmashtami' },
    { pattern: /राधाष्टमी/i, name: 'Radhashtami' },
    { pattern: /गौर\s*पूर्णिमा/i, name: 'Gaura Purnima' },
    { pattern: /नृसिंह\s*जयंती/i, name: 'Narasimha Jayanti' },
    { pattern: /राम\s*नवमी/i, name: 'Rama Navami' },
    { pattern: /गोवर्धन\s*पूजा/i, name: 'Govardhan Puja' },
    { pattern: /रथ\s*यात्रा/i, name: 'Ratha Yatra' },
    { pattern: /कार्तिक|दामोदर/i, name: 'Kartik Month' },
    { pattern: /गीता\s*जयंती/i, name: 'Gita Jayanti' },
    { pattern: /पुरुषोत्तम\s*मास|purushottam\s*maas/i, name: 'Purushottam Maas' }
  ]

  for (const hf of HINDI_FESTIVALS) {
    if (hf.pattern.test(combined)) {
      festival = hf.name
      break
    }
  }

  // 6. Detect Location
  const locationMatches = [
    'IIT Kanpur',
    'IIT Mandi',
    'Bhubaneswar',
    'Vrindavan',
    'Mayapur',
    'Puri',
    'Kalpakkam',
    'Anupuram',
    'Delhi',
    'Mumbai',
    'Kolkata',
    'ISKCON'
  ]
  for (const loc of locationMatches) {
    if (new RegExp(`\\b${loc}\\b`, 'i').test(combined)) {
      location = loc
      break
    }
  }

  // 7. Detect Devanagari Hindi Text
  const hindiMatches = title.match(/[\u0900-\u097F\s]+/g)
  if (hindiMatches) {
    const extracted = hindiMatches.join(' ').trim()
    if (extracted.length > 3) {
      titleHindi = extracted
    }
  }

  // 8. Clean Clutter from the Discourse Title
  let cleanTitle = title
    // Remove YouTube tags & clutter
    .replace(/#\w+/g, '')
    .replace(/\|\s*www\.[a-z0-9.-]+\s*/gi, '')
    .replace(/\|\s*Learn\s*Gita\s*Live\s*Gita\b/gi, '')
    .replace(/\|\s*BhaktivedantaClub\s*IIT\s*Kanpur\b/gi, '')
    .replace(/\|\s*Professor\s*,?\s*IITK?\b/gi, '')
    .replace(/\|\s*IIT\s*Kanpur\b/gi, '')
    .replace(/\|\s*Dr\.?\s*Lila\s*Purushottam\s*Das\b/gi, '')
    .replace(/\|\s*Prof\.?\s*Laxmidhar\s*Behera\b/gi, '')
    .replace(/\|\s*Dr\.?\s*Laxmidhar\s*Behera\b/gi, '')
    .replace(/\|\s*Dr\.?\s*B\.?\s*K\.?\s*Behera\b/gi, '')
    .replace(/\|\s*\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s+\d{4}/g, '')
    .replace(/\s*\|\s*$/, '')
    .replace(/^\s*\|\s*/, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  if (!cleanTitle) cleanTitle = title

  // 9. Calculate Suggested Subfolder
  let suggestedFolderPath = 'Lectures'
  if (/\b(?:LGLG|Learn Gita Live Gita)\b/i.test(combined)) {
    suggestedFolderPath = chapter ? `LGLG Series/Chapter ${chapter}` : 'LGLG Series'
  } else if (scripture === 'Srimad Bhagavatam') {
    suggestedFolderPath = canto ? `Srimad Bhagavatam/Canto ${canto}` : 'Srimad Bhagavatam'
  } else if (scripture === 'Bhagavad Gita') {
    suggestedFolderPath = chapter ? `Bhagavad Gita/Chapter ${chapter}` : 'Bhagavad Gita'
  } else if (scripture === 'Sri Caitanya Bhagavata') {
    suggestedFolderPath = canto ? `Sri Caitanya Bhagavata/${canto}` : 'Sri Caitanya Bhagavata'
  } else if (scripture === 'Sri Upadesamrita') {
    suggestedFolderPath = 'Sri Upadesamrita'
  } else if (festival) {
    suggestedFolderPath = `Festivals/${festival}`
  } else if (/\b(?:Consciousness|Quantum|AI|Science)\b/i.test(combined)) {
    suggestedFolderPath = 'Science & Consciousness'
  } else if (/\b(?:Q&A|Question|QA\s*Session)\b/i.test(combined)) {
    suggestedFolderPath = 'Q&A'
  } else if (dateRecorded) {
    const year = dateRecorded.split('-')[0]
    suggestedFolderPath = `Lectures/${year}`
  }

  const metadata: DiscourseMetadata = {
    titleHindi,
    speaker,
    language,
    scripture,
    canto,
    chapter,
    verse,
    philosophyTopic,
    festival,
    location,
    dateRecorded,
    description: desc.substring(0, 500),
    tags: [
      scripture ? scripture.toLowerCase().replace(/\s+/g, '-') : 'discourse',
      canto ? `canto-${canto}` : '',
      festival ? festival.toLowerCase().replace(/\s+/g, '-') : '',
      philosophyTopic ? philosophyTopic.toLowerCase().replace(/\s+/g, '-') : '',
      'lila-purushottam-das',
      'laxmidhar-behera'
    ].filter(Boolean)
  }

  return {
    title: cleanTitle,
    titleHindi,
    speaker,
    scripture,
    canto,
    chapter,
    verse,
    philosophyTopic,
    festival,
    location,
    dateRecorded,
    language,
    suggestedFolderPath,
    metadata
  }
}
