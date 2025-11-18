/**
 * Helper-Funktion für Asset-Imports
 * Verwendet new URL() für dynamische Imports, die von Vite verarbeitet werden
 */

/**
 * Konvertiert einen Icon-Pfad (z.B. 'icons/burger.svg') zu einer vollständigen URL
 * Verwendet in Vue-Komponenten, um Icons aus Data-Dateien zu laden
 */
export function getIconUrl(iconPath: string | undefined): string {
  if (!iconPath) return ''
  
  // Entferne führenden Slash falls vorhanden
  const cleanPath = iconPath.startsWith('/') ? iconPath.substring(1) : iconPath
  
  try {
    // Pfad sollte sein: 'icons/filename.svg' oder 'assets/icons/filename.svg'
    const assetPath = cleanPath.startsWith('assets/') ? cleanPath : `assets/${cleanPath}`
    return new URL(`../../${assetPath}`, import.meta.url).href
  } catch (error) {
    console.error('Failed to load icon:', iconPath, error)
    return ''
  }
}

export function getImageUrl(filename: string): string {
  return new URL(`../../assets/images/${filename}`, import.meta.url).href
}

export function getSoundUrl(filename: string): string {
  return new URL(`../../assets/sounds/${filename}`, import.meta.url).href
}
