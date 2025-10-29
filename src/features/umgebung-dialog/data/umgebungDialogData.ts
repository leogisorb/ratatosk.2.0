// UmgebungDialogData - Daten für den Umgebung-Dialog
// Basierend auf umgebung-standalone Inhalten

export type Gender = 'm' | 'f' | 'n'

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
  article?: string // der/die/das
  gender?: Gender // Centralized gender metadata
}

export interface UmgebungSubSubRegion {
  id: string
  title: string
  icon?: string
  emoji?: string
  ttsText?: string
}

// Constants for IDs
export const ID_BACK = 'zurueck'
export const ID_BETT = 'bett'
export const ID_ZIMMER = 'zimmer'
export const ID_GEGENSTAENDE = 'gegenstaende'

// Grammar utility functions
export const getArticles = (gender?: Gender) => {
  if (gender === 'm') return { nom: 'der', acc: 'den', dat: 'dem' }
  if (gender === 'f') return { nom: 'die', acc: 'die', dat: 'der' }
  if (gender === 'n') return { nom: 'das', acc: 'das', dat: 'dem' }
  return { nom: '', acc: '', dat: '' }
}

export const buildConfirmationText = (subRegion: UmgebungSubRegion, verb: UmgebungSubSubRegion) => {
  const articles = getArticles(subRegion.gender)
  // Use accusative for direct object
  const article = articles.acc
  return `Bitte ${article} ${subRegion.title} ${verb.title}`.replace(/\s+/g, ' ')
}

// Hauptregionen (Umgebung)
export const mainRegions: UmgebungRegion[] = [
  {
    id: ID_BETT,
    title: 'BETT',
    icon: '/ratatosk.2.0/bett.svg'
  },
  {
    id: ID_ZIMMER,
    title: 'ZIMMER',
    icon: '/ratatosk.2.0/zimmer.svg'
  },
  {
    id: ID_GEGENSTAENDE,
    title: 'GEGENSTÄNDE',
    icon: '/ratatosk.2.0/gegenstaende.svg'
  },
  {
    id: ID_BACK,
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

// Alte Verb-Listen entfernt - jetzt individuell pro Gegenstand

// Helper functions
export const getSubRegionsByMainRegion = (mainRegionId: string): UmgebungSubRegion[] => {
  switch (mainRegionId) {
    case ID_BETT:
      return bettSubRegions
    case ID_ZIMMER:
      return zimmerSubRegions
    case ID_GEGENSTAENDE:
      return gegenstaendeSubRegions
    default:
      return []
  }
}

// Individuelle Verb-Listen für jeden Gegenstand
export const getSubSubRegionsBySubRegion = (subRegionId: string): UmgebungSubSubRegion[] => {
  switch (subRegionId) {
    // BETT-KATEGORIE - Optimierte Verben
    case 'decke':
      return [
        { id: 'wechseln', title: 'wechseln', emoji: '🔄', ttsText: 'wechseln' },
        { id: 'waschen', title: 'waschen', emoji: '🧽', ttsText: 'waschen' },
        { id: 'bringen', title: 'bringen', emoji: '📦', ttsText: 'bringen' },
        { id: 'anreichen', title: 'anreichen', emoji: '🤲', ttsText: 'anreichen' },
        { id: 'zurechtlegen', title: 'zurechtlegen', emoji: '📐', ttsText: 'zurechtlegen' },
        { id: 'aufdecken', title: 'aufdecken', emoji: '🔓', ttsText: 'aufdecken' },
        { id: 'zudecken', title: 'zudecken', emoji: '🛌', ttsText: 'zudecken' },
        { id: 'tauschen', title: 'tauschen', emoji: '🔄', ttsText: 'tauschen' },
        { id: 'bereitlegen', title: 'bereitlegen', emoji: '📋', ttsText: 'bereitlegen' },
        { id: 'reinigen', title: 'reinigen', emoji: '✨', ttsText: 'reinigen' },
        { id: 'zurueck', title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    case 'kissen':
      return [
        { id: 'wechseln', title: 'wechseln', emoji: '🔄', ttsText: 'wechseln' },
        { id: 'waschen', title: 'waschen', emoji: '🧽', ttsText: 'waschen' },
        { id: 'bringen', title: 'bringen', emoji: '📦', ttsText: 'bringen' },
        { id: 'anreichen', title: 'anreichen', emoji: '🤲', ttsText: 'anreichen' },
        { id: 'zurechtlegen', title: 'zurechtlegen', emoji: '📐', ttsText: 'zurechtlegen' },
        { id: 'tauschen', title: 'tauschen', emoji: '🔄', ttsText: 'tauschen' },
        { id: 'bereitlegen', title: 'bereitlegen', emoji: '📋', ttsText: 'bereitlegen' },
        { id: 'reinigen', title: 'reinigen', emoji: '✨', ttsText: 'reinigen' },
        { id: 'verwenden', title: 'verwenden', emoji: '🔧', ttsText: 'verwenden' },
        { id: 'zurueck', title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    case 'bettbezug':
      return [
        { id: 'wechseln', title: 'wechseln', emoji: '🔄', ttsText: 'wechseln' },
        { id: 'waschen', title: 'waschen', emoji: '🧽', ttsText: 'waschen' },
        { id: 'bringen', title: 'bringen', emoji: '📦', ttsText: 'bringen' },
        { id: 'anreichen', title: 'anreichen', emoji: '🤲', ttsText: 'anreichen' },
        { id: 'zurechtlegen', title: 'zurechtlegen', emoji: '📐', ttsText: 'zurechtlegen' },
        { id: 'tauschen', title: 'tauschen', emoji: '🔄', ttsText: 'tauschen' },
        { id: 'bereitlegen', title: 'bereitlegen', emoji: '📋', ttsText: 'bereitlegen' },
        { id: 'reinigen', title: 'reinigen', emoji: '✨', ttsText: 'reinigen' },
        { id: 'zurueck', title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    case 'fernbedienung':
      return [
        { id: 'bringen', title: 'bringen', emoji: '📦', ttsText: 'bringen' },
        { id: 'holen', title: 'holen', emoji: '🏃', ttsText: 'holen' },
        { id: 'benutzen', title: 'benutzen', emoji: '👆', ttsText: 'benutzen' },
        { id: 'einstellen', title: 'einstellen', emoji: '⚙️', ttsText: 'einstellen' },
        { id: 'anreichen', title: 'anreichen', emoji: '🤲', ttsText: 'anreichen' },
        { id: 'tauschen', title: 'tauschen', emoji: '🔄', ttsText: 'tauschen' },
        { id: 'bereitlegen', title: 'bereitlegen', emoji: '📋', ttsText: 'bereitlegen' },
        { id: 'reinigen', title: 'reinigen', emoji: '✨', ttsText: 'reinigen' },
        { id: 'verwenden', title: 'verwenden', emoji: '🔧', ttsText: 'verwenden' },
        { id: 'zurueck', title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    // ZIMMER-KATEGORIE - Optimierte Verben
    case 'tuer':
      return [
        { id: 'oeffnen', title: 'öffnen', emoji: '🔓', ttsText: 'öffnen' },
        { id: 'schliessen', title: 'schließen', emoji: '🔒', ttsText: 'schließen' },
        { id: 'zurueck', title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    case 'fenster':
      return [
        { id: 'oeffnen', title: 'öffnen', emoji: '🔓', ttsText: 'öffnen' },
        { id: 'schliessen', title: 'schließen', emoji: '🔒', ttsText: 'schließen' },
        { id: 'zurueck', title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    case 'licht':
      return [
        { id: 'anmachen', title: 'anmachen', emoji: '🔛', ttsText: 'anmachen' },
        { id: 'ausmachen', title: 'ausmachen', emoji: '🔴', ttsText: 'ausmachen' },
        { id: 'zurueck', title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    case 'bett':
      return [
        { id: 'hinlegen', title: 'hinlegen', emoji: '🛏️', ttsText: 'hinlegen' },
        { id: 'liegen', title: 'liegen', emoji: '🛌', ttsText: 'liegen' },
        { id: 'zurueck', title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    case 'tisch':
      return [
        { id: 'hinsetzen', title: 'hinsetzen', emoji: '🪑', ttsText: 'hinsetzen' },
        { id: 'benutzen', title: 'benutzen', emoji: '👆', ttsText: 'benutzen' },
        { id: 'zurueck', title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    case 'stuhl':
      return [
        { id: 'hinsetzen', title: 'hinsetzen', emoji: '🪑', ttsText: 'hinsetzen' },
        { id: 'sitzen', title: 'sitzen', emoji: '🪑', ttsText: 'sitzen' },
        { id: 'benutzen', title: 'benutzen', emoji: '👆', ttsText: 'benutzen' },
        { id: 'zurueck', title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    case 'fernseher':
      return [
        { id: 'anmachen', title: 'anmachen', emoji: '🔛', ttsText: 'anmachen' },
        { id: 'ausmachen', title: 'ausmachen', emoji: '🔴', ttsText: 'ausmachen' },
        { id: 'sehen', title: 'sehen', emoji: '👁️', ttsText: 'sehen' },
        { id: 'benutzen', title: 'benutzen', emoji: '👆', ttsText: 'benutzen' },
        { id: 'zurueck', title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    case 'vorhang':
      return [
        { id: 'oeffnen', title: 'öffnen', emoji: '🔓', ttsText: 'öffnen' },
        { id: 'schliessen', title: 'schließen', emoji: '🔒', ttsText: 'schließen' },
        { id: 'zurueck', title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    case 'schrank':
      return [
        { id: 'oeffnen', title: 'öffnen', emoji: '🔓', ttsText: 'öffnen' },
        { id: 'schliessen', title: 'schließen', emoji: '🔒', ttsText: 'schließen' },
        { id: 'benutzen', title: 'benutzen', emoji: '👆', ttsText: 'benutzen' },
        { id: 'zurueck', title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    // GEGENSTÄNDE-KATEGORIE - Optimierte Verben
    case 'handy':
      return [
        { id: 'benutzen', title: 'benutzen', emoji: '👆', ttsText: 'benutzen' },
        { id: 'halten', title: 'halten', emoji: '🤏', ttsText: 'halten' },
        { id: 'nehmen', title: 'nehmen', emoji: '✋', ttsText: 'nehmen' },
        { id: 'geben', title: 'geben', emoji: '🤲', ttsText: 'geben' },
        { id: 'aufheben', title: 'aufheben', emoji: '⬆️', ttsText: 'aufheben' },
        { id: 'weglegen', title: 'weglegen', emoji: '📦', ttsText: 'weglegen' },
        { id: 'finden', title: 'finden', emoji: '🔍', ttsText: 'finden' },
        { id: 'bringen', title: 'bringen', emoji: '📦', ttsText: 'bringen' },
        { id: 'zurueck', title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    case 'glas':
      return [
        { id: 'benutzen', title: 'benutzen', emoji: '👆', ttsText: 'benutzen' },
        { id: 'halten', title: 'halten', emoji: '🤏', ttsText: 'halten' },
        { id: 'nehmen', title: 'nehmen', emoji: '✋', ttsText: 'nehmen' },
        { id: 'geben', title: 'geben', emoji: '🤲', ttsText: 'geben' },
        { id: 'aufheben', title: 'aufheben', emoji: '⬆️', ttsText: 'aufheben' },
        { id: 'weglegen', title: 'weglegen', emoji: '📦', ttsText: 'weglegen' },
        { id: 'reinigen', title: 'reinigen', emoji: '🧼', ttsText: 'reinigen' },
        { id: 'finden', title: 'finden', emoji: '🔍', ttsText: 'finden' },
        { id: 'bringen', title: 'bringen', emoji: '📦', ttsText: 'bringen' },
        { id: 'zurueck', title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    case 'brille':
      return [
        { id: 'benutzen', title: 'benutzen', emoji: '👆', ttsText: 'benutzen' },
        { id: 'halten', title: 'halten', emoji: '🤏', ttsText: 'halten' },
        { id: 'nehmen', title: 'nehmen', emoji: '✋', ttsText: 'nehmen' },
        { id: 'geben', title: 'geben', emoji: '🤲', ttsText: 'geben' },
        { id: 'aufheben', title: 'aufheben', emoji: '⬆️', ttsText: 'aufheben' },
        { id: 'weglegen', title: 'weglegen', emoji: '📦', ttsText: 'weglegen' },
        { id: 'reinigen', title: 'reinigen', emoji: '🧼', ttsText: 'reinigen' },
        { id: 'finden', title: 'finden', emoji: '🔍', ttsText: 'finden' },
        { id: 'bringen', title: 'bringen', emoji: '📦', ttsText: 'bringen' },
        { id: 'zurueck', title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    case 'stift':
      return [
        { id: 'benutzen', title: 'benutzen', emoji: '👆', ttsText: 'benutzen' },
        { id: 'halten', title: 'halten', emoji: '🤏', ttsText: 'halten' },
        { id: 'nehmen', title: 'nehmen', emoji: '✋', ttsText: 'nehmen' },
        { id: 'geben', title: 'geben', emoji: '🤲', ttsText: 'geben' },
        { id: 'aufheben', title: 'aufheben', emoji: '⬆️', ttsText: 'aufheben' },
        { id: 'weglegen', title: 'weglegen', emoji: '📦', ttsText: 'weglegen' },
        { id: 'finden', title: 'finden', emoji: '🔍', ttsText: 'finden' },
        { id: 'bringen', title: 'bringen', emoji: '📦', ttsText: 'bringen' },
        { id: 'zurueck', title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    case 'papier':
      return [
        { id: 'benutzen', title: 'benutzen', emoji: '👆', ttsText: 'benutzen' },
        { id: 'halten', title: 'halten', emoji: '🤏', ttsText: 'halten' },
        { id: 'nehmen', title: 'nehmen', emoji: '✋', ttsText: 'nehmen' },
        { id: 'geben', title: 'geben', emoji: '🤲', ttsText: 'geben' },
        { id: 'aufheben', title: 'aufheben', emoji: '⬆️', ttsText: 'aufheben' },
        { id: 'weglegen', title: 'weglegen', emoji: '📦', ttsText: 'weglegen' },
        { id: 'finden', title: 'finden', emoji: '🔍', ttsText: 'finden' },
        { id: 'bringen', title: 'bringen', emoji: '📦', ttsText: 'bringen' },
        { id: 'zurueck', title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    case 'lineal':
      return [
        { id: 'benutzen', title: 'benutzen', emoji: '👆', ttsText: 'benutzen' },
        { id: 'halten', title: 'halten', emoji: '🤏', ttsText: 'halten' },
        { id: 'nehmen', title: 'nehmen', emoji: '✋', ttsText: 'nehmen' },
        { id: 'geben', title: 'geben', emoji: '🤲', ttsText: 'geben' },
        { id: 'aufheben', title: 'aufheben', emoji: '⬆️', ttsText: 'aufheben' },
        { id: 'weglegen', title: 'weglegen', emoji: '📦', ttsText: 'weglegen' },
        { id: 'finden', title: 'finden', emoji: '🔍', ttsText: 'finden' },
        { id: 'bringen', title: 'bringen', emoji: '📦', ttsText: 'bringen' },
        { id: 'zurueck', title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    case 'teller':
      return [
        { id: 'benutzen', title: 'benutzen', emoji: '👆', ttsText: 'benutzen' },
        { id: 'halten', title: 'halten', emoji: '🤏', ttsText: 'halten' },
        { id: 'nehmen', title: 'nehmen', emoji: '✋', ttsText: 'nehmen' },
        { id: 'geben', title: 'geben', emoji: '🤲', ttsText: 'geben' },
        { id: 'aufheben', title: 'aufheben', emoji: '⬆️', ttsText: 'aufheben' },
        { id: 'weglegen', title: 'weglegen', emoji: '📦', ttsText: 'weglegen' },
        { id: 'reinigen', title: 'reinigen', emoji: '🧼', ttsText: 'reinigen' },
        { id: 'finden', title: 'finden', emoji: '🔍', ttsText: 'finden' },
        { id: 'bringen', title: 'bringen', emoji: '📦', ttsText: 'bringen' },
        { id: 'zurueck', title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    case 'besteck':
      return [
        { id: 'benutzen', title: 'benutzen', emoji: '👆', ttsText: 'benutzen' },
        { id: 'halten', title: 'halten', emoji: '🤏', ttsText: 'halten' },
        { id: 'nehmen', title: 'nehmen', emoji: '✋', ttsText: 'nehmen' },
        { id: 'geben', title: 'geben', emoji: '🤲', ttsText: 'geben' },
        { id: 'aufheben', title: 'aufheben', emoji: '⬆️', ttsText: 'aufheben' },
        { id: 'weglegen', title: 'weglegen', emoji: '📦', ttsText: 'weglegen' },
        { id: 'reinigen', title: 'reinigen', emoji: '🧼', ttsText: 'reinigen' },
        { id: 'finden', title: 'finden', emoji: '🔍', ttsText: 'finden' },
        { id: 'bringen', title: 'bringen', emoji: '📦', ttsText: 'bringen' },
        { id: 'zurueck', title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    case 'tisch':
      return [
        { id: 'benutzen', title: 'benutzen', emoji: '👆', ttsText: 'benutzen' },
        { id: 'zurueck', title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    default:
      return []
  }
}
