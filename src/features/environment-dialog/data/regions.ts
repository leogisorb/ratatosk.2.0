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
    icon: new URL('../../../assets/icons/bett.svg', import.meta.url).href
  },
  {
    id: ID_ZIMMER,
    title: 'ZIMMER',
    icon: new URL('../../../assets/icons/zimmer.svg', import.meta.url).href
  },
  {
    id: ID_GEGENSTAENDE,
    title: 'GEGENSTÄNDE',
    icon: new URL('../../../assets/icons/gegenstaende.svg', import.meta.url).href
  },
  {
    id: ID_BACK,
    title: 'ZURÜCK',
    icon: new URL('../../../assets/icons/zurueck.svg', import.meta.url).href
  }
]
