#!/usr/bin/env node
/**
 * Script zum Ersetzen aller /ratatosk.2.0/ Pfade in TypeScript-Dateien
 * durch new URL() Aufrufe
 */

const fs = require('fs')
const path = require('path')

function replaceIconPath(content, relativePathToAssets) {
  // Ersetze '/ratatosk.2.0/filename.svg' durch new URL(...).href
  return content.replace(
    /icon:\s*['"]\/ratatosk\.2\.0\/([^'"]+)['"]/g,
    (match, filename) => {
      return `icon: new URL('${relativePathToAssets}${filename}', import.meta.url).href`
    }
  )
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  
  // Bestimme relativen Pfad zu assets/icons basierend auf Dateipfad
  const relativePath = path.relative(path.dirname(filePath), path.join(__dirname, '../src/assets/icons'))
    .replace(/\\/g, '/') // Windows-Pfade normalisieren
  
  // Wenn Datei in features/pain-assessment/data/, dann ../../../assets/icons/
  // Wenn Datei in features/environment-dialog/data/, dann ../../../assets/icons/
  // etc.
  let relativePathToAssets = '../../../assets/icons/'
  
  if (filePath.includes('features/pain-assessment/data/') || 
      filePath.includes('features/environment-dialog/data/') ||
      filePath.includes('features/settings/data/') ||
      filePath.includes('features/self-dialog/data/')) {
    relativePathToAssets = '../../../assets/icons/'
  }
  
  const newContent = replaceIconPath(content, relativePathToAssets)
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8')
    console.log(`✅ Updated: ${filePath}`)
    return true
  }
  return false
}

// Dateien die aktualisiert werden sollen
const filesToUpdate = [
  'src/features/pain-assessment/data/painAssessmentData.ts',
  'src/features/pain-assessment/data/regions.ts',
  'src/features/environment-dialog/data/regions.ts',
  'src/features/settings/data/categories.ts'
]

let updated = 0
filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, '..', file)
  if (fs.existsSync(filePath)) {
    if (processFile(filePath)) {
      updated++
    }
  } else {
    console.log(`⚠️  File not found: ${filePath}`)
  }
})

console.log(`\n✅ Updated ${updated} files`)

