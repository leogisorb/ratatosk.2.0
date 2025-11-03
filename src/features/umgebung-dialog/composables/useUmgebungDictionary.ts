// useUmgebungDictionary.ts - Zentrale Daten- und Sprachlogik für Umgebungs-Dialog

import {
  mainRegions,
  bettSubRegions,
  zimmerSubRegions,
  gegenstaendeSubRegions,
  getSubRegionsByMainRegion,
  getSubSubRegionsBySubRegion,
  buildConfirmationText,
  getArticles,
  type UmgebungRegion,
  type UmgebungSubRegion,
  type UmgebungSubSubRegion,
  ID_BACK,
  ID_BETT,
  ID_ZIMMER,
  ID_GEGENSTAENDE
} from '../data/umgebungDialogData'

/**
 * Alle Sub-Regionen in einem Mapping für schnellen Zugriff
 */
export const subRegionMap: Record<string, UmgebungSubRegion[]> = {
  [ID_BETT]: bettSubRegions,
  [ID_ZIMMER]: zimmerSubRegions,
  [ID_GEGENSTAENDE]: gegenstaendeSubRegions
}

/**
 * Alle Haupt-Regionen
 */
export { mainRegions }

/**
 * Helper: Sub-Regionen für eine Haupt-Region abrufen
 */
export function getSubRegions(mainRegionId: string | null): UmgebungSubRegion[] {
  if (!mainRegionId) return []
  return getSubRegionsByMainRegion(mainRegionId) || []
}

/**
 * Helper: Sub-Sub-Regionen (Verben) für eine Sub-Region abrufen
 */
export function getSubSubRegions(subRegionId: string | null): UmgebungSubSubRegion[] {
  if (!subRegionId) return []
  return getSubSubRegionsBySubRegion(subRegionId) || []
}

/**
 * Helper: Titel für Sub-Region View generieren
 */
export function getSubRegionViewTitle(mainRegionId: string | null): string {
  if (!mainRegionId) return 'Wählen Sie eine Option aus'
  
  switch (mainRegionId) {
    case ID_BETT:
      return 'Wählen Sie einen Bett-Bereich aus'
    case ID_ZIMMER:
      return 'Wählen Sie einen Zimmer-Bereich aus'
    case ID_GEGENSTAENDE:
      return 'Wählen Sie einen Gegenstand aus'
    default:
      return 'Wählen Sie eine Option aus'
  }
}

/**
 * Helper: Titel für Sub-Sub-Region View generieren
 */
export function getSubSubRegionViewTitle(subRegion: UmgebungSubRegion | null): string {
  if (!subRegion) return 'Was soll gemacht werden?'
  
  const articles = getArticles(subRegion.gender)
  const article = articles.dat // Dativ für "mit"
  
  return `Was soll mit ${article} ${subRegion.title} gemacht werden?`
}

/**
 * Helper: Confirmation Text generieren
 */
export function generateConfirmation(
  subRegion: UmgebungSubRegion | null,
  verb: UmgebungSubSubRegion | null
): string {
  if (!subRegion || !verb) {
    return 'Auswahl erfasst'
  }
  
  return buildConfirmationText(subRegion, verb)
}

/**
 * Helper: TTS-Text für Item abrufen (mit Artikel falls vorhanden)
 */
export function getTTSText(item: UmgebungRegion | UmgebungSubRegion | UmgebungSubSubRegion): string {
  if ('ttsText' in item && item.ttsText) {
    return item.ttsText
  }
  return item.title
}

export function useUmgebungDictionary() {
  return {
    mainRegions,
    subRegionMap,
    getSubRegions,
    getSubSubRegions,
    getSubRegionViewTitle,
    getSubSubRegionViewTitle,
    generateConfirmation,
    getTTSText,
    ID_BACK,
    ID_BETT,
    ID_ZIMMER,
    ID_GEGENSTAENDE
  }
}

