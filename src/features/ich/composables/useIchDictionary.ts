// useIchDictionary.ts - Zentrale Daten- und Sprachlogik für Ich-Dialog

import {
  mainRegions,
  ernaehrungSubRegions,
  gefuehleSubRegions,
  kleidungSubRegions,
  hygieneSubRegions,
  bewegungSubRegions,
  getSubRegionsByMainRegion,
  type IchRegion,
  type IchSubRegion
} from '../data/ichDialogData'
import {
  getSubRegionViewTitle as getSubRegionViewTitleFromGrammar,
  generateConfirmationText
} from '../data/ichGrammar'

/**
 * Alle Sub-Regionen in einem Mapping für schnellen Zugriff
 */
export const subRegionMap: Record<string, IchSubRegion[]> = {
  'ernaehrung': ernaehrungSubRegions,
  'gefuehle': gefuehleSubRegions,
  'kleidung': kleidungSubRegions,
  'hygiene': hygieneSubRegions,
  'bewegung': bewegungSubRegions
}

/**
 * Alle Haupt-Regionen
 */
export { mainRegions }

/**
 * Helper: Sub-Regionen für eine Haupt-Region abrufen
 */
export function getSubRegions(mainRegionId: string | null): IchSubRegion[] {
  if (!mainRegionId) return []
  return getSubRegionsByMainRegion(mainRegionId) || []
}

/**
 * Helper: Titel für Sub-Region View generieren
 */
export function getSubRegionViewTitle(mainRegionId: string | null): string {
  return getSubRegionViewTitleFromGrammar(mainRegionId)
}

/**
 * Helper: Confirmation Text generieren
 */
export function generateConfirmation(
  mainRegionId: string | null,
  subRegion: IchSubRegion | null
): string {
  if (!mainRegionId || !subRegion) {
    return 'Auswahl erfasst'
  }
  
  const ttsText = subRegion.ttsText || subRegion.title
  return generateConfirmationText(mainRegionId, ttsText)
}

/**
 * Helper: TTS-Text für Item abrufen (ttsText falls vorhanden, sonst title)
 */
export function getTTSText(item: IchRegion | IchSubRegion): string {
  if ('ttsText' in item && item.ttsText) {
    return item.ttsText
  }
  return item.title
}

export function useIchDictionary() {
  return {
    mainRegions,
    subRegionMap,
    getSubRegions,
    getSubRegionViewTitle,
    generateConfirmation,
    getTTSText,
    ID_BACK: 'zurueck'
  }
}

