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

// 1. Init if needed
runGit('init -b main')

// 2. Set author
runGit('config user.name "Vani Studio Dev"')
runGit('config user.email "dev@vanistudio.local"')

// 3. Add all files
runGit('add .')

// 4. Commit
runGit('commit -m "Initial release: Vani Studio Pro & Vani Vault for Dr. Laxmidhar Behera"')

// 5. Status
runGit('status -s')
