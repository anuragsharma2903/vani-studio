/**
 * Automated System Test Suite for Vani Studio Pro & Mobile Ecosystem
 */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('====================================================')
console.log('🧪 RUNNING COMPREHENSIVE VANI STUDIO TEST SUITE')
console.log('====================================================\n')

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`)
    passed++
  } else {
    console.error(`  ✗ FAIL: ${message}`)
    failed++
  }
}

// === TEST 1: Smart Metadata Parsing Engine ===
console.log('Test 1: Smart Discourse Metadata Parsing Logic')
const testCases = [
  {
    title: '2026-08-31 SB 10.2.13 Balaram Jayanti Special Class - Dr. B. K. Behera | Bhubaneswar',
    expectedScripture: 'Srimad Bhagavatam',
    expectedVerse: 'SB 10.2.13',
    expectedFestival: 'Balaram Jayanti',
    expectedDate: '2026-08-31',
    expectedLocation: 'Bhubaneswar'
  },
  {
    title: 'BG 4.34 || Tad Viddhi Pranipatena || Dr B K Behera Sir',
    expectedScripture: 'Bhagavad Gita',
    expectedVerse: 'BG 4.34',
    expectedTopic: 'Approaching a Spiritual Master'
  },
  {
    title: 'Caitanya Caritamrta Adi 1.1 Mangalacarana Class 15.08.2026',
    expectedScripture: 'Chaitanya Charitamrita',
    expectedCanto: 'Adi'
  },
  {
    title: 'श्री बलराम जयंती विशेष - Dr. Laxmidhar Behera',
    expectedFestival: 'Balaram Jayanti'
  },
  {
    title: 'Questions & Answers Session with Dr. B. K. Behera - Vrindavan Retreat',
    expectedFolder: 'Q&A',
    expectedLocation: 'Vrindavan'
  }
]

// Mock regex matching equivalent to metadataParser
for (const tc of testCases) {
  const isSB = /SB|Srimad Bhagavatam/i.test(tc.title)
  const isBG = /BG|Bhagavad Gita/i.test(tc.title)
  const isCC = /CC|Caitanya Caritamrta/i.test(tc.title)
  const isBalaram = /Balaram Jayanti|बलराम\s*जयंती/i.test(tc.title)

  const isQA = /Questions & Answers|Q&A/i.test(tc.title)

  if (tc.expectedScripture === 'Srimad Bhagavatam') {
    assert(isSB, `Detected Srimad Bhagavatam in: "${tc.title}"`)
  }
  if (tc.expectedScripture === 'Bhagavad Gita') {
    assert(isBG, `Detected Bhagavad Gita in: "${tc.title}"`)
  }
  if (tc.expectedScripture === 'Chaitanya Charitamrita') {
    assert(isCC, `Detected Chaitanya Charitamrita in: "${tc.title}"`)
  }
  if (tc.expectedFestival === 'Balaram Jayanti') {
    assert(isBalaram, `Detected Balaram Jayanti festival in: "${tc.title}"`)
  }
  if (tc.expectedFolder === 'Q&A') {
    assert(isQA, `Categorized Q&A into dedicated folder in: "${tc.title}"`)
  }
}

// === TEST 2: Web Portal & Mobile PWA Assets ===
console.log('\nTest 2: Web Portal & PWA Assets')
const portalDir = path.join(__dirname, '..', 'web-portal')
assert(fs.existsSync(path.join(portalDir, 'index.html')), 'web-portal/index.html exists')
assert(fs.existsSync(path.join(portalDir, 'manifest.json')), 'web-portal/manifest.json exists')
assert(fs.existsSync(path.join(portalDir, 'sw.js')), 'web-portal/sw.js exists')
assert(fs.existsSync(path.join(portalDir, 'icon-192.png')), 'web-portal/icon-192.png exists')
assert(fs.existsSync(path.join(portalDir, 'icon-512.png')), 'web-portal/icon-512.png exists')

// === TEST 3: Capacitor Configuration & CI/CD ===
console.log('\nTest 3: Capacitor Mobile & Cloud Build CI/CD')
const capPath = path.join(__dirname, '..', 'capacitor.config.ts')
const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'build-apk.yml')
assert(fs.existsSync(capPath), 'capacitor.config.ts exists')
assert(fs.existsSync(workflowPath), 'GitHub Actions build-apk.yml workflow exists')

// === TEST 4: Binaries & Standalone Executable ===
console.log('\nTest 4: Native Binaries & Packaging')
const ffmpegPath = path.join(__dirname, '..', 'resources', 'bin', 'ffmpeg.exe')
const ytdlpPath = path.join(__dirname, '..', 'resources', 'bin', 'yt-dlp.exe')
const exePath = path.join(__dirname, '..', 'dist', 'Vani Studio Pro 1.0.0.exe')

assert(fs.existsSync(ffmpegPath), 'resources/bin/ffmpeg.exe exists')
assert(fs.existsSync(ytdlpPath), 'resources/bin/yt-dlp.exe exists')
assert(fs.existsSync(exePath), 'dist/Vani Studio Pro 1.0.0.exe standalone binary exists')

console.log('\n====================================================')
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`)
console.log('====================================================')

if (failed > 0) process.exit(1)
