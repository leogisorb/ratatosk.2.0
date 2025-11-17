/**
 * Umgebung Verbs - Sub-Sub-Regionen (Verben/Aktionen)
 */

import { ID_BACK } from './regions'

export interface UmgebungSubSubRegion {
  id: string
  title: string
  icon?: string
  emoji?: string
  ttsText?: string
}

/**
 * Get sub-sub-regions (verbs) by sub-region ID
 * Returns list of verbs/actions for a specific item
 */
export function getSubSubRegionsBySubRegion(subRegionId: string): UmgebungSubSubRegion[] {
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
        { id: ID_BACK, title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
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
        { id: ID_BACK, title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
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
        { id: ID_BACK, title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
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
        { id: ID_BACK, title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    // ZIMMER-KATEGORIE - Optimierte Verben
    case 'tuer':
      return [
        { id: 'oeffnen', title: 'öffnen', emoji: '🔓', ttsText: 'öffnen' },
        { id: 'schliessen', title: 'schließen', emoji: '🔒', ttsText: 'schließen' },
        { id: ID_BACK, title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    case 'fenster':
      return [
        { id: 'oeffnen', title: 'öffnen', emoji: '🔓', ttsText: 'öffnen' },
        { id: 'schliessen', title: 'schließen', emoji: '🔒', ttsText: 'schließen' },
        { id: ID_BACK, title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    case 'licht':
      return [
        { id: 'anmachen', title: 'anmachen', emoji: '🔛', ttsText: 'anmachen' },
        { id: 'ausmachen', title: 'ausmachen', emoji: '🔴', ttsText: 'ausmachen' },
        { id: ID_BACK, title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    case 'bett':
      return [
        { id: 'hinlegen', title: 'hinlegen', emoji: '🛏️', ttsText: 'hinlegen' },
        { id: 'liegen', title: 'liegen', emoji: '🛌', ttsText: 'liegen' },
        { id: ID_BACK, title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    case 'tisch':
      return [
        { id: 'hinsetzen', title: 'hinsetzen', emoji: '🪑', ttsText: 'hinsetzen' },
        { id: 'benutzen', title: 'benutzen', emoji: '👆', ttsText: 'benutzen' },
        { id: ID_BACK, title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    case 'stuhl':
      return [
        { id: 'hinsetzen', title: 'hinsetzen', emoji: '🪑', ttsText: 'hinsetzen' },
        { id: 'sitzen', title: 'sitzen', emoji: '🪑', ttsText: 'sitzen' },
        { id: 'benutzen', title: 'benutzen', emoji: '👆', ttsText: 'benutzen' },
        { id: ID_BACK, title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    case 'fernseher':
      return [
        { id: 'anmachen', title: 'anmachen', emoji: '🔛', ttsText: 'anmachen' },
        { id: 'ausmachen', title: 'ausmachen', emoji: '🔴', ttsText: 'ausmachen' },
        { id: 'sehen', title: 'sehen', emoji: '👁️', ttsText: 'sehen' },
        { id: 'benutzen', title: 'benutzen', emoji: '👆', ttsText: 'benutzen' },
        { id: ID_BACK, title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    case 'vorhang':
      return [
        { id: 'oeffnen', title: 'öffnen', emoji: '🔓', ttsText: 'öffnen' },
        { id: 'schliessen', title: 'schließen', emoji: '🔒', ttsText: 'schließen' },
        { id: ID_BACK, title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    case 'schrank':
      return [
        { id: 'oeffnen', title: 'öffnen', emoji: '🔓', ttsText: 'öffnen' },
        { id: 'schliessen', title: 'schließen', emoji: '🔒', ttsText: 'schließen' },
        { id: 'benutzen', title: 'benutzen', emoji: '👆', ttsText: 'benutzen' },
        { id: ID_BACK, title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
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
        { id: ID_BACK, title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
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
        { id: ID_BACK, title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
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
        { id: ID_BACK, title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
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
        { id: ID_BACK, title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
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
        { id: ID_BACK, title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
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
        { id: ID_BACK, title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
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
        { id: ID_BACK, title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
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
        { id: ID_BACK, title: 'zurück', emoji: '⬅️', ttsText: 'zurück' }
      ]
    
    default:
      return []
  }
}

