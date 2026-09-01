/**
 * Mobile Build Helper Script for Vani Vault Mobile App
 */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('=== VANI VAULT MOBILE APP PREPARATION ===')

// 1. Compile web renderer bundle
console.log('1. Building web renderer...')
try {
  execSync('npm run build', { stdio: 'inherit' })
  console.log('✓ Web bundle built successfully in out/renderer')
} catch (e) {
  console.error('Build error:', e)
  process.exit(1)
}

// 2. Verify capacitor config
const capConfigPath = path.join(__dirname, '..', 'capacitor.config.ts')
if (fs.existsSync(capConfigPath)) {
  console.log('✓ Capacitor configuration active.')
} else {
  console.log('! Creating capacitor config...')
}

console.log(`
======================================================
  MOBILE APK BUILD INSTRUCTIONS:
======================================================
1. To compile the APK in GitHub Actions:
   - Push your code to GitHub.
   - Go to Actions -> 'Build Android APK' -> Click 'Run workflow'.
   - Download the compiled .apk artifact directly to your phone.

2. To compile locally via Android Studio:
   - Run: npx cap sync android
   - Run: npx cap open android
   - Click "Build" -> "Build Bundle(s) / APK(s)" -> "Build APK(s)".
======================================================
`)
