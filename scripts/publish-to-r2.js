const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const fs = require('fs')
const path = require('path')

const config = {
  endpoint: 'https://d3eb1c422f7a5f6d2ae0699bd2384f3e.r2.cloudflarestorage.com',
  region: 'auto',
  credentials: {
    accessKeyId: '3c75c549764c2bc1c5b22e8e5b97e07d',
    secretAccessKey: '52fcd3fc2662b60935e66dddd2746c99848332e299b69642aa52c7311fbaa2b2'
  }
}

const BUCKET = 'behera-sir-audio'
const s3 = new S3Client(config)

async function uploadFile(localPath, r2Key) {
  const fileContent = fs.readFileSync(localPath)
  const isYaml = localPath.endsWith('.yml') || localPath.endsWith('.yaml')
  const contentType = isYaml ? 'text/yaml' : 'application/vnd.microsoft.portable-executable'

  console.log(`Uploading ${path.basename(localPath)} -> ${r2Key} (${(fileContent.length / (1024 * 1024)).toFixed(2)} MB)...`)

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: r2Key,
      Body: fileContent,
      ContentType: contentType
    })
  )
  console.log(`✓ Uploaded ${path.basename(localPath)} successfully!`)
}

async function main() {
  const distDir = path.join(__dirname, '..', 'dist')
  if (!fs.existsSync(distDir)) {
    console.error('Error: dist directory does not exist. Run build first.')
    process.exit(1)
  }

  const files = fs.readdirSync(distDir)
  const ymlFiles = files.filter((f) => f.endsWith('.yml'))
  const exeFiles = files.filter((f) => f.endsWith('.exe'))

  if (ymlFiles.length === 0 && exeFiles.length === 0) {
    console.error('No .yml or .exe build artifacts found in dist/.')
    process.exit(1)
  }

  for (const yml of ymlFiles) {
    await uploadFile(path.join(distDir, yml), `updates/${yml}`)
  }

  for (const exe of exeFiles) {
    await uploadFile(path.join(distDir, exe), `updates/${exe}`)
  }

  console.log('\n🎉 Successfully published latest update to Cloudflare R2 bucket!')
  console.log(`Update endpoint: ${config.endpoint}/${BUCKET}/updates/`)
}

main().catch((err) => {
  console.error('Publish failed:', err)
  process.exit(1)
})
