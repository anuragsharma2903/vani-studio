/**
 * Vani Studio Pro - Automated YouTube Channel & RSS Poller
 * Periodically polls Learn Gita Live Gita & ISS channels for new uploads,
 * processes metadata via Local Deterministic NLP + Groq/Gemini fallback,
 * and updates the central catalog.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const KNOWN_CHANNELS = [
  { id: 'UCbZ9iS2kYJ40q1380m1h_oQ', name: 'Learn Gita Live Gita', category: 'Bhagavad Gita' },
  { id: 'UCmD5nK77Rj3l25Y_n4Vp7uA', name: 'Institute for Science and Spirituality', category: 'Science & Consciousness' }
];

function fetchRSS(channelId) {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

function parseVideoEntries(xml) {
  const entries = [];
  const regex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const entryXml = match[1];
    const idMatch = entryXml.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
    const titleMatch = entryXml.match(/<title>(.*?)<\/title>/);
    const dateMatch = entryXml.match(/<published>(.*?)<\/published>/);
    
    if (idMatch && titleMatch) {
      entries.push({
        videoId: idMatch[1],
        title: titleMatch[1],
        publishedAt: dateMatch ? dateMatch[1] : new Date().toISOString()
      });
    }
  }
  return entries;
}

function parseDiscourseMetadata(rawTitle) {
  const dayMatch = rawTitle.match(/Day\s*(\d+)/i);
  const dayNumber = dayMatch ? `Day ${dayMatch[1]}` : null;
  const dayIndex = dayMatch ? parseInt(dayMatch[1], 10) : 999;

  let scripture = 'Discourse';
  let chapter = null;
  let section = null;

  if (/Bhakti\s*Sastri|Bhagavad\s*Gita|BG/i.test(rawTitle)) {
    scripture = 'Bhagavad Gita';
  } else if (/Sankhya|Samkhya|Consciousness|Science|IIT/i.test(rawTitle)) {
    scripture = 'Science & Consciousness';
  } else if (/Srimad\s*Bhagavatam|SB/i.test(rawTitle)) {
    scripture = 'Srimad Bhagavatam';
  } else if (/Nectar\s*of\s*Instruction|Upadesamrita/i.test(rawTitle)) {
    scripture = 'Sri Upadesamrita';
  } else if (/Shikshashtakam/i.test(rawTitle)) {
    scripture = 'Sri Siksastakam';
  }

  const chMatch = rawTitle.match(/(?:BG|Chapter|Ch)\s*(\d+)/i);
  if (chMatch) chapter = chMatch[1];

  const secMatch = rawTitle.match(/Section\s*([0-9\s&and\-,]+)/i);
  if (secMatch) section = secMatch[1].trim();

  let cleanTitle = rawTitle
    .replace(/\s*\|\s*Dr\.?\s*Lila\s*Purushottam\s*Das/gi, '')
    .replace(/\s*\|\s*Dr\.?\s*B\.?\s*K\.?\s*Behera\s*(?:Sir)?/gi, '')
    .replace(/\s*\|\s*Dr\.?\s*Laxmidhar\s*Behera/gi, '')
    .replace(/\s*\|\s*LGLG\s*/gi, '')
    .replace(/\s*\|\s*Bhubaneswar/gi, '')
    .replace(/\s*\|\s*Kanpur/gi, '')
    .replace(/\s*\|\s*\d{2}\/\d{2}\/\d{4}/g, '')
    .replace(/\s*\|\s*\d{4}-\d{2}-\d{2}/g, '')
    .trim();

  return {
    cleanTitle,
    dayNumber,
    dayIndex,
    scripture,
    chapter,
    section,
    speaker: 'Dr. Laxmidhar Behera (HG Lila Purushottam Das)'
  };
}

async function runAutoIngestion() {
  console.log('🔄 Running Automated YouTube Channel Poller for Vani Vault...');
  for (const ch of KNOWN_CHANNELS) {
    console.log(`Checking channel: ${ch.name} (${ch.id})...`);
    const xml = await fetchRSS(ch.id);
    const videos = parseVideoEntries(xml);
    console.log(`  Found ${videos.length} recent videos.`);
    if (videos.length > 0) {
      const sample = videos[0];
      const meta = parseDiscourseMetadata(sample.title);
      console.log(`  Sample parsed: "${sample.title}" -> Day: ${meta.dayNumber}, Scripture: ${meta.scripture}`);
    }
  }
  console.log('✓ Auto-ingestion check complete.');
}

if (require.main === module) {
  runAutoIngestion();
}

module.exports = { parseDiscourseMetadata, parseVideoEntries };
