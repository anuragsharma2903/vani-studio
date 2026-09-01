const fs = require('fs')
const path = require('path')

const filesToFix = [
  'src/main/modules/audioRepo.ts',
  'src/main/modules/beheraRepo.ts',
  'src/main/modules/channelWatcher.ts',
  'src/main/modules/cloudflareR2.ts',
  'src/main/modules/queueManager.ts',
  'src/renderer/src/modules/audio/components/AudioWaveformTrimmer.tsx',
  'src/renderer/src/modules/audio/components/BatchQueueDownloader.tsx',
  'src/renderer/src/modules/behera/BeheraRepoModule.tsx',
  'src/renderer/src/modules/index.ts',
  'scripts/test-suite.js'
]

const basePath = path.join(__dirname, '..')

filesToFix.forEach((rel) => {
  const full = path.join(basePath, rel)
  if (fs.existsSync(full)) {
    let content = fs.readFileSync(full, 'utf-8')
    content = content
      .replace(/'Dr\. B\. K\. Behera Sir'/g, "'Dr. Laxmidhar Behera (HG Lila Purushottam Das)'")
      .replace(/'Dr\. B\. K\. Behera'/g, "'Dr. Laxmidhar Behera (HG Lila Purushottam Das)'")
      .replace(/"Dr\. B\. K\. Behera"/g, '"Dr. Laxmidhar Behera (HG Lila Purushottam Das)"')
      .replace(/"Dr\. Behera Sir's/g, "\"Dr. Laxmidhar Behera's")
      .replace(/Dr\. Behera Sir's/g, "Dr. Laxmidhar Behera's")
      .replace(/Dr\. Behera Sir’s/g, 'Dr. Laxmidhar Behera’s')
      .replace(/Dr\. Behera Sir/g, 'Dr. Laxmidhar Behera')
    fs.writeFileSync(full, content, 'utf-8')
    console.log('✓ Updated:', rel)
  }
})
