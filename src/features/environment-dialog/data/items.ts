/**
 * Umgebung Items - Sub-Regionen (Gegenstände)
 */

import type { Gender } from './environmentGrammar'
import { ID_BACK } from './regions'

export interface UmgebungSubRegion {
  id: string
  title: string
  icon?: string
  emoji?: string
  ttsText?: string
  article?: string // der/die/das
  gender?: Gender // Centralized gender metadata
}

// Bett Sub-Regionen
export const bettSubRegions: UmgebungSubRegion[] = [
  {
    id: 'decke',
    title: 'Decke',
    emoji: '🛌',
    ttsText: 'die Decke',
    article: 'die',
    gender: 'f'
  },
  {
    id: 'kissen',
    title: 'Kissen',
    emoji: '🛏️',
    ttsText: 'das Kissen',
    article: 'das',
    gender: 'n'
  },
  {
    id: 'bettbezug',
    title: 'Bettbezug',
    emoji: '🧺',
    ttsText: 'den Bettbezug',
    article: 'der',
    gender: 'm'
  },
  {
    id: 'fernbedienung',
    title: 'Fernbedienung',
    emoji: '📱',
    ttsText: 'die Fernbedienung',
    article: 'die',
    gender: 'f'
  },
  {
    id: ID_BACK,
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
    ttsText: 'die Tür',
    article: 'die',
    gender: 'f'
  },
  {
    id: 'fenster',
    title: 'Fenster',
    emoji: '🪟',
    ttsText: 'das Fenster',
    article: 'das',
    gender: 'n'
  },
  {
    id: 'licht',
    title: 'Licht',
    emoji: '💡',
    ttsText: 'das Licht',
    article: 'das',
    gender: 'n'
  },
  {
    id: 'bett',
    title: 'Bett',
    emoji: '🛏️',
    ttsText: 'das Bett',
    article: 'das',
    gender: 'n'
  },
  {
    id: 'tisch',
    title: 'Tisch',
    emoji: '🪑',
    ttsText: 'den Tisch',
    article: 'der',
    gender: 'm'
  },
  {
    id: 'stuhl',
    title: 'Stuhl',
    emoji: '🪑',
    ttsText: 'den Stuhl',
    article: 'der',
    gender: 'm'
  },
  {
    id: 'fernseher',
    title: 'Fernseher',
    emoji: '📺',
    ttsText: 'den Fernseher',
    article: 'der',
    gender: 'm'
  },
  {
    id: 'vorhang',
    title: 'Vorhang',
    emoji: '🪟',
    ttsText: 'den Vorhang',
    article: 'der',
    gender: 'm'
  },
  {
    id: 'schrank',
    title: 'Schrank',
    emoji: '🗄️',
    ttsText: 'den Schrank',
    article: 'der',
    gender: 'm'
  },
  {
    id: ID_BACK,
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
    ttsText: 'das Handy',
    article: 'das',
    gender: 'n'
  },
  {
    id: 'glas',
    title: 'Glas',
    emoji: '🥛',
    ttsText: 'das Glas',
    article: 'das',
    gender: 'n'
  },
  {
    id: 'brille',
    title: 'Brille',
    emoji: '👓',
    ttsText: 'die Brille',
    article: 'die',
    gender: 'f'
  },
  {
    id: 'stift',
    title: 'Stift',
    emoji: '✏️',
    ttsText: 'den Stift',
    article: 'der',
    gender: 'm'
  },
  {
    id: 'papier',
    title: 'Papier',
    emoji: '📄',
    ttsText: 'das Papier',
    article: 'das',
    gender: 'n'
  },
  {
    id: 'lineal',
    title: 'Lineal',
    emoji: '📏',
    ttsText: 'das Lineal',
    article: 'das',
    gender: 'n'
  },
  {
    id: 'teller',
    title: 'Teller',
    emoji: '🍽️',
    ttsText: 'den Teller',
    article: 'der',
    gender: 'm'
  },
  {
    id: 'besteck',
    title: 'Besteck',
    emoji: '🍴',
    ttsText: 'das Besteck',
    article: 'das',
    gender: 'n'
  },
  {
    id: 'tisch',
    title: 'Tisch',
    emoji: '🪑',
    ttsText: 'den Tisch',
    article: 'der',
    gender: 'm'
  },
  {
    id: ID_BACK,
    title: 'zurück',
    emoji: '⬅️',
    ttsText: 'zurück'
  }
]

/**
 * Get sub-regions by main region ID
 */
export function getSubRegionsByMainRegion(mainRegionId: string): UmgebungSubRegion[] {
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

