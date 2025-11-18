/**
 * Helper-Funktion für Asset-Imports
 * Verwendet new URL() für dynamische Imports, die von Vite verarbeitet werden
 */

// Helper für Data-Dateien (verwendet relativen Pfad von shared/utils/)
export function getIconUrl(filename: string): string {
  return new URL(`../../assets/icons/${filename}`, import.meta.url).href
}

export function getImageUrl(filename: string): string {
  return new URL(`../../assets/images/${filename}`, import.meta.url).href
}

export function getSoundUrl(filename: string): string {
  return new URL(`../../assets/sounds/${filename}`, import.meta.url).href
}

// Legacy-Funktionen für Kompatibilität
export function getAssetUrl(path: string): string {
  const cleanPath = path.replace(/^\/ratatosk\.2\.0\//, '').replace(/^\//, '')
  return new URL(`../../assets/icons/${cleanPath}`, import.meta.url).href
}

