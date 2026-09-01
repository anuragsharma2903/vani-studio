const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const targetDir = 'C:\\Users\\Lalita\\.gemini\\antigravity\\bin\\git'
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true })
}

const zipPath = path.join(targetDir, 'mingit.zip')

async function installMinGit() {
  console.log('Downloading MinGit portable (64-bit)...')
  const url =
    'https://github.com/git-for-windows/git/releases/download/v2.47.1.windows.1/MinGit-2.47.1-64-bit.zip'
  const res = await fetch(url)
  if (!res.ok) throw new Error('Download failed: ' + res.statusText)
  const buffer = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(zipPath, buffer)
  console.log('✓ Downloaded (' + (buffer.length / 1024 / 1024).toFixed(1) + ' MB). Extracting...')

  const psCmd = `powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${targetDir}' -Force"`
  execSync(psCmd, { stdio: 'inherit' })
  console.log('✓ Extracted MinGit successfully to:', targetDir)

  const gitExe = path.join(targetDir, 'cmd', 'git.exe')
  if (fs.existsSync(gitExe)) {
    const version = execSync(`"${gitExe}" --version`).toString()
    console.log('✓ Git verification:', version.trim())
  }
}

installMinGit().catch(console.error)
