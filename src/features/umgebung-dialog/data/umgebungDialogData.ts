// UmgebungDialogData - Daten für den Umgebung-Dialog
// Basierend auf umgebung-standalone Inhalten

export interface UmgebungRegion {
  id: string
  title: string
  icon?: string
  emoji?: string
  ttsText?: string
}

export interface UmgebungSubRegion {
  id: string
  title: string
  icon?: string
  emoji?: string
  ttsText?: string
}

export interface UmgebungSubSubRegion {
  id: string
  title: string
  icon?: string
  emoji?: string
  ttsText?: string
}

// Hauptregionen (Umgebung)
export const mainRegions: UmgebungRegion[] = [
  {
    id: 'bett',
    title: 'BETT',
    icon: '/ratatosk.2.0/bett.svg'
  },
  {
    id: 'zimmer',
    title: 'ZIMMER',
    icon: '/ratatosk.2.0/zimmer.svg'
  },
  {
    id: 'gegenstaende',
    title: 'GEGENSTÄNDE',
    icon: '/ratatosk.2.0/gegenstaende.svg'
  },
  {
    id: 'zurueck',
    title: 'ZURÜCK',
    icon: '/ratatosk.2.0/zurueck.svg'
  }
]

// Bett Sub-Regionen
export const bettSubRegions: UmgebungSubRegion[] = [
  {
    id: 'decke',
    title: 'Decke',
    emoji: '🛌',
    ttsText: 'Decke'
  },
  {
    id: 'kissen',
    title: 'Kissen',
    emoji: '🛏️',
    ttsText: 'Kissen'
  },
  {
    id: 'bettbezug',
    title: 'Bettbezug',
    emoji: '🧺',
    ttsText: 'Bettbezug'
  },
  {
    id: 'fernbedienung',
    title: 'Fernbedienung',
    emoji: '📺',
    ttsText: 'Fernbedienung'
  },
  {
    id: 'zurueck',
    title: 'zurück',
    emoji: '⬅️',
    ttsText: 'zurück'
  }
]

// Zimmer Sub-Regionen
export const zimmerSubRegions: UmgebungSubRegion[] = [
  {
    id: 'tuer',
    title: 'Tür',
    emoji: '🚪',
    ttsText: 'Tür'
  },
  {
    id: 'fenster',
    title: 'Fenster',
    emoji: '🪟',
    ttsText: 'Fenster'
  },
  {
    id: 'licht',
    title: 'Licht',
    emoji: '💡',
    ttsText: 'Licht'
  },
  {
    id: 'bett',
    title: 'Bett',
    emoji: '🛏️',
    ttsText: 'Bett'
  },
  {
    id: 'tisch',
    title: 'Tisch',
    emoji: '🪑',
    ttsText: 'Tisch'
  },
  {
    id: 'stuhl',
    title: 'Stuhl',
    emoji: '🪑',
    ttsText: 'Stuhl'
  },
  {
    id: 'fernseher',
    title: 'Fernseher',
    emoji: '📺',
    ttsText: 'Fernseher'
  },
  {
    id: 'vorhang',
    title: 'Vorhang',
    emoji: '🪟',
    ttsText: 'Vorhang'
  },
  {
    id: 'schrank',
    title: 'Schrank',
    emoji: '🚪',
    ttsText: 'Schrank'
  },
  {
    id: 'zurueck',
    title: 'zurück',
    emoji: '⬅️',
    ttsText: 'zurück'
  }
]

// Gegenstände Sub-Regionen
export const gegenstaendeSubRegions: UmgebungSubRegion[] = [
  {
    id: 'handy',
    title: 'Handy',
    emoji: '📱',
    ttsText: 'Handy'
  },
  {
    id: 'glas',
    title: 'Glas',
    emoji: '🥛',
    ttsText: 'Glas'
  },
  {
    id: 'brille',
    title: 'Brille',
    emoji: '👓',
    ttsText: 'Brille'
  },
  {
    id: 'stift',
    title: 'Stift',
    emoji: '✏️',
    ttsText: 'Stift'
  },
  {
    id: 'papier',
    title: 'Papier',
    emoji: '📄',
    ttsText: 'Papier'
  },
  {
    id: 'lineal',
    title: 'Lineal',
    emoji: '📏',
    ttsText: 'Lineal'
  },
  {
    id: 'teller',
    title: 'Teller',
    emoji: '🍽️',
    ttsText: 'Teller'
  },
  {
    id: 'besteck',
    title: 'Besteck',
    emoji: '🍴',
    ttsText: 'Besteck'
  },
  {
    id: 'tisch',
    title: 'Tisch',
    emoji: '🪑',
    ttsText: 'Tisch'
  },
  {
    id: 'zurueck',
    title: 'zurück',
    emoji: '⬅️',
    ttsText: 'zurück'
  }
]

// Bett-Verben Sub-Sub-Regionen
export const bettVerbenSubRegions: UmgebungSubSubRegion[] = [
  {
    id: 'wechseln',
    title: 'wechseln',
    emoji: '🔄',
    ttsText: 'wechseln'
  },
  {
    id: 'waschen',
    title: 'waschen',
    emoji: '🧽',
    ttsText: 'waschen'
  },
  {
    id: 'bringen',
    title: 'bringen',
    emoji: '📦',
    ttsText: 'bringen'
  },
  {
    id: 'holen',
    title: 'holen',
    emoji: '🏃',
    ttsText: 'holen'
  },
  {
    id: 'benutzen',
    title: 'benutzen',
    emoji: '👆',
    ttsText: 'benutzen'
  },
  {
    id: 'einstellen',
    title: 'einstellen',
    emoji: '⚙️',
    ttsText: 'einstellen'
  },
  {
    id: 'anreichen',
    title: 'anreichen',
    emoji: '🤲',
    ttsText: 'anreichen'
  },
  {
    id: 'auflegen',
    title: 'auflegen',
    emoji: '⬆️',
    ttsText: 'auflegen'
  },
  {
    id: 'zurechtlegen',
    title: 'zurechtlegen',
    emoji: '📐',
    ttsText: 'zurechtlegen'
  },
  {
    id: 'aufdecken',
    title: 'aufdecken',
    emoji: '🔓',
    ttsText: 'aufdecken'
  },
  {
    id: 'zudecken',
    title: 'zudecken',
    emoji: '🛌',
    ttsText: 'zudecken'
  },
  {
    id: 'tauschen',
    title: 'tauschen',
    emoji: '🔄',
    ttsText: 'tauschen'
  },
  {
    id: 'bereitlegen',
    title: 'bereitlegen',
    emoji: '📋',
    ttsText: 'bereitlegen'
  },
  {
    id: 'reinigen',
    title: 'reinigen',
    emoji: '✨',
    ttsText: 'reinigen'
  },
  {
    id: 'verwenden',
    title: 'verwenden',
    emoji: '🔧',
    ttsText: 'verwenden'
  },
  {
    id: 'zurueck',
    title: 'zurück',
    emoji: '⬅️',
    ttsText: 'zurück'
  }
]

// Zimmer-Verben Sub-Sub-Regionen
export const zimmerVerbenSubRegions: UmgebungSubSubRegion[] = [
  {
    id: 'oeffnen',
    title: 'öffnen',
    emoji: '🔓',
    ttsText: 'öffnen'
  },
  {
    id: 'schliessen',
    title: 'schließen',
    emoji: '🔒',
    ttsText: 'schließen'
  },
  {
    id: 'anmachen',
    title: 'anmachen',
    emoji: '🔛',
    ttsText: 'anmachen'
  },
  {
    id: 'ausmachen',
    title: 'ausmachen',
    emoji: '🔴',
    ttsText: 'ausmachen'
  },
  {
    id: 'aufstehen',
    title: 'aufstehen',
    emoji: '⬆️',
    ttsText: 'aufstehen'
  },
  {
    id: 'hinsetzen',
    title: 'hinsetzen',
    emoji: '🪑',
    ttsText: 'hinsetzen'
  },
  {
    id: 'hinlegen',
    title: 'hinlegen',
    emoji: '🛏️',
    ttsText: 'hinlegen'
  },
  {
    id: 'liegen',
    title: 'liegen',
    emoji: '🛌',
    ttsText: 'liegen'
  },
  {
    id: 'sitzen',
    title: 'sitzen',
    emoji: '🪑',
    ttsText: 'sitzen'
  },
  {
    id: 'sehen',
    title: 'sehen',
    emoji: '👁️',
    ttsText: 'sehen'
  },
  {
    id: 'benutzen',
    title: 'benutzen',
    emoji: '👆',
    ttsText: 'benutzen'
  },
  {
    id: 'zurueck',
    title: 'zurück',
    emoji: '⬅️',
    ttsText: 'zurück'
  }
]

// Gegenstände-Verben Sub-Sub-Regionen
export const gegenstaendeVerbenSubRegions: UmgebungSubSubRegion[] = [
  {
    id: 'benutzen',
    title: 'benutzen',
    emoji: '👆',
    ttsText: 'benutzen'
  },
  {
    id: 'halten',
    title: 'halten',
    emoji: '🤏',
    ttsText: 'halten'
  },
  {
    id: 'legen',
    title: 'legen',
    emoji: '📦',
    ttsText: 'legen'
  },
  {
    id: 'nehmen',
    title: 'nehmen',
    emoji: '✋',
    ttsText: 'nehmen'
  },
  {
    id: 'geben',
    title: 'geben',
    emoji: '🤲',
    ttsText: 'geben'
  },
  {
    id: 'aufheben',
    title: 'aufheben',
    emoji: '⬆️',
    ttsText: 'aufheben'
  },
  {
    id: 'reinigen',
    title: 'reinigen',
    emoji: '🧼',
    ttsText: 'reinigen'
  },
  {
    id: 'weglegen',
    title: 'weglegen',
    emoji: '📦',
    ttsText: 'weglegen'
  },
  {
    id: 'finden',
    title: 'finden',
    emoji: '🔍',
    ttsText: 'finden'
  },
  {
    id: 'bringen',
    title: 'bringen',
    emoji: '📦',
    ttsText: 'bringen'
  },
  {
    id: 'zurueck',
    title: 'zurück',
    emoji: '⬅️',
    ttsText: 'zurück'
  }
]

// Helper functions
export const getSubRegionsByMainRegion = (mainRegionId: string): UmgebungSubRegion[] => {
  switch (mainRegionId) {
    case 'bett':
      return bettSubRegions
    case 'zimmer':
      return zimmerSubRegions
    case 'gegenstaende':
      return gegenstaendeSubRegions
    default:
      return []
  }
}

export const getSubSubRegionsBySubRegion = (subRegionId: string): UmgebungSubSubRegion[] => {
  // Bett-Verben für alle Bett-Items
  if (['decke', 'kissen', 'bettbezug', 'fernbedienung'].includes(subRegionId)) {
    return bettVerbenSubRegions
  }
  
  // Zimmer-Verben für alle Zimmer-Items
  if (['tuer', 'fenster', 'licht', 'bett', 'tisch', 'stuhl', 'fernseher', 'vorhang', 'schrank'].includes(subRegionId)) {
    return zimmerVerbenSubRegions
  }
  
  // Gegenstände-Verben für alle Gegenstand-Items
  if (['handy', 'glas', 'brille', 'stift', 'papier', 'lineal', 'teller', 'besteck', 'tisch'].includes(subRegionId)) {
    return gegenstaendeVerbenSubRegions
  }
  
  return []
}
