// options.ts - Settings Optionen

export interface SettingsOption {
  id: string
  title: string
  description?: string
  value: any
  emoji?: string
  icon?: string
  isCurrent?: boolean
}

export interface SettingsOptionsMap {
  [key: string]: SettingsOption[]
}

export const settingsOptions: SettingsOptionsMap = {
  leuchtdauer: [
    { id: 'schnell', title: 'Schnell', description: '1,5 Sekunden', value: 1.5, emoji: '⚡' },
    { id: 'normal', title: 'Normal', description: '2 Sekunden', value: 2, emoji: '⚡' },
    { id: 'langsam', title: 'Langsam', description: '3 Sekunden', value: 3, emoji: '🐌' },
    { id: 'sehr-langsam', title: 'Sehr langsam', description: '4 Sekunden', value: 4, emoji: '🐢' },
    { id: 'lang', title: 'Lang', description: '5 Sekunden', value: 5, emoji: '⏰' },
    { id: 'zurueck', title: 'Zurück', description: '', value: null, emoji: '↩️' }
  ],
  blinzeldauer: [
    { id: 'sehr-kurz', title: 'Sehr kurz', description: '0,3 Sekunden', value: 0.3, emoji: '⚡' },
    { id: 'kurz', title: 'Kurz', description: '0,5 Sekunden', value: 0.5, emoji: '💫' },
    { id: 'normal', title: 'Normal', description: '0,7 Sekunden', value: 0.7, emoji: '✨' },
    { id: 'lang', title: 'Lang', description: '0,9 Sekunden', value: 0.9, emoji: '🌟' },
    { id: 'zurueck', title: 'Zurück', description: '', value: null, emoji: '↩️' }
  ],
  farbmodus: [
    { id: 'hell', title: 'Hell', description: 'Heller Modus', value: false, emoji: '☀️' },
    { id: 'dunkel', title: 'Dunkel', description: 'Dunkler Modus', value: true, emoji: '🌙' },
    { id: 'zurueck', title: 'Zurück', description: '', value: null, emoji: '↩️' }
  ],
  kamera: [
    { id: 'ein', title: 'KAMERA EIN', description: 'Kamera aktivieren', value: true, emoji: '📹' },
    { id: 'aus', title: 'KAMERA AUS', description: 'Kamera deaktivieren', value: false, emoji: '📷' },
    { id: 'zurueck', title: 'Zurück', description: '', value: null, emoji: '↩️' }
  ],
  kamerapositionen: [
    { id: 'oben', title: 'Oben', description: 'Kamera oben positionieren', value: 'top', emoji: '⬆️' },
    { id: 'mitte', title: 'Mitte', description: 'Kamera mittig positionieren', value: 'center', emoji: '↔️' },
    { id: 'unten', title: 'Unten', description: 'Kamera unten positionieren', value: 'bottom', emoji: '⬇️' },
    { id: 'zurueck', title: 'Zurück', description: '', value: null, emoji: '↩️' }
  ],
  impressum: [
    { id: 'info', title: 'Informationen', description: 'App-Informationen anzeigen', value: 'info', emoji: 'ℹ️' },
    { id: 'version', title: 'Version', description: 'Version anzeigen', value: 'version', emoji: '📋' },
    { id: 'kontakt', title: 'Kontakt', description: 'Kontaktinformationen', value: 'contact', emoji: '📞' },
    { id: 'zurueck', title: 'Zurück', description: '', value: null, emoji: '↩️' }
  ]
}

/**
 * Helper: Optionen für eine Kategorie abrufen
 */
export function getCategoryOptions(categoryId: string): SettingsOption[] {
  return settingsOptions[categoryId] || []
}

