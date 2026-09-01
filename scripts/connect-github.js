/**
 * Helper to connect local Git repository to a GitHub remote
 * Usage: node scripts/connect-github.js https://github.com/USERNAME/REPO_NAME.git
 */
const { execSync } = require('child_process')
const path = require('path')

const gitExe = 'C:\\Users\\Lalita\\.gemini\\antigravity\\bin\\git\\cmd\\git.exe'
const appDir = path.join(__dirname, '..')

function runGit(cmd) {
  try {
    const out = execSync(`"${gitExe}" ${cmd}`, { cwd: appDir }).toString()
    console.log(`[git ${cmd}]:\n${out.trim()}`)
    return out
  } catch (e) {
    console.error(`Error running git ${cmd}:`, e.stdout ? e.stdout.toString() : e.message)
    return null
  }
}

const remoteUrl = process.argv[2]

if (!remoteUrl) {
  console.log('----------------------------------------------------')
  console.log('👉 Please provide your GitHub repository URL.')
  console.log('Example: node scripts/connect-github.js https://github.com/YourUsername/vani-studio.git')
  console.log('----------------------------------------------------')
  process.exit(1)
}

// 1. Remove existing origin if any
try {
  runGit('remote remove origin')
} catch (e) {}

// 2. Add remote
runGit(`remote add origin ${remoteUrl}`)
console.log(`✓ Added remote origin: ${remoteUrl}`)

// 3. Push to main
console.log('Pushing to GitHub...')
const pushRes = runGit('push -u origin main')
if (pushRes !== null) {
  console.log('🎉 Successfully connected and pushed to GitHub!')
}
