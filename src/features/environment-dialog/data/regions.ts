/**
 * Umgebung Regions - Haupt-Regionen
 */

export interface UmgebungRegion {
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

// Hauptregionen (Umgebung)
export const mainRegions: UmgebungRegion[] = [
  {
    id: ID_BETT,
    title: 'BETT',
    icon: '/ratatosk.2.0/images/bett.svg'
  },
  {
    id: ID_ZIMMER,
    title: 'ZIMMER',
    icon: '/ratatosk.2.0/images/zimmer.svg'
  },
  {
    id: ID_GEGENSTAENDE,
    title: 'GEGENSTÄNDE',
    icon: '/ratatosk.2.0/images/gegenstaende.svg'
  },
  {
    id: ID_BACK,
    title: 'ZURÜCK',
    icon: '/ratatosk.2.0/images/zurueck.svg'
  }
]

