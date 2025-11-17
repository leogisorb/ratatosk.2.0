import { readdirSync, statSync, mkdirSync, renameSync } from 'fs'
import { join } from 'path'

const distDir = join(process.cwd(), 'dist')
const imagesDir = join(distDir, 'images')

// Erstelle images Ordner falls nicht vorhanden
try {
  mkdirSync(imagesDir, { recursive: true })
  console.log('✅ Created images directory')
} catch (error) {
  if (error.code !== 'EEXIST') {
    console.error('❌ Failed to create images directory:', error)
    process.exit(1)
  }
}

// Dateien, die NICHT verschoben werden sollen (bleiben im Root)
const keepInRoot = [
  'index.html',
  'index.php',
  '404.html',
  'favicon.ico',
  'favicon.svg',
  '.htaccess',
  '.nojekyll'
]

// Dateierweiterungen, die verschoben werden sollen
const imageExtensions = ['.svg', '.png', '.ico', '.jpg', '.jpeg', '.gif', '.webp', '.wav']

try {
  const files = readdirSync(distDir)
  let movedCount = 0

  for (const file of files) {
    // Überspringe Dateien, die im Root bleiben sollen
    if (keepInRoot.includes(file)) {
      continue
    }

    // Überspringe Verzeichnisse (assets, images, etc.)
    const filePath = join(distDir, file)
    if (statSync(filePath).isDirectory()) {
      continue
    }

    // Prüfe ob es eine Bild-/Audio-Datei ist
    const isImageFile = imageExtensions.some(ext => file.toLowerCase().endsWith(ext))
    
    if (isImageFile) {
      const sourcePath = join(distDir, file)
      const targetPath = join(imagesDir, file)
      
      try {
        renameSync(sourcePath, targetPath)
        movedCount++
        console.log(`✅ Moved ${file} → images/${file}`)
      } catch (error) {
        console.error(`❌ Failed to move ${file}:`, error.message)
      }
    }
  }

  console.log(`\n✅ Successfully organized ${movedCount} image files into images/ directory`)
} catch (error) {
  console.error('❌ Failed to organize images:', error)
  process.exit(1)
}

