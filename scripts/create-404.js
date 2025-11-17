import { copyFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

// Kopiere index.html zu 404.html für GitHub Pages SPA Routing
const distDir = join(process.cwd(), 'dist')
const indexHtml = join(distDir, 'index.html')
const notFoundHtml = join(distDir, '404.html')
const nojekyllFile = join(distDir, '.nojekyll')

try {
  copyFileSync(indexHtml, notFoundHtml)
  console.log('✅ Created 404.html for GitHub Pages SPA routing')
  
  // Stelle sicher, dass .nojekyll existiert (für GitHub Pages)
  if (!existsSync(nojekyllFile)) {
    writeFileSync(nojekyllFile, '')
    console.log('✅ Created .nojekyll for GitHub Pages')
  }
} catch (error) {
  console.error('❌ Failed to create 404.html or .nojekyll:', error)
  process.exit(1)
}

