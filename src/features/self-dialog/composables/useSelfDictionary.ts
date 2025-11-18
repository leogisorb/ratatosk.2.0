// useSelfDictionary.ts - Central data and language logic for Self Dialog

import {
  mainRegions,
  ernaehrungSubRegions,
  gefuehleSubRegions,
  kleidungSubRegions,
  hygieneSubRegions,
  bewegungSubRegions,
  getSubRegionsByMainRegion,
  generateConfirmationSentence,
  REGION_IDS,
  type IchRegion,
  type IchSubRegion
} from '../data/selfDialogData'

/**
 * Alle Sub-Regionen in einem Mapping für schnellen Zugriff
 */
export const subRegionMap: Record<string, readonly IchSubRegion[]> = {
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
export function getSubRegions(mainRegionId: string | null): readonly IchSubRegion[] {
  if (!mainRegionId) return []
  return getSubRegionsByMainRegion(mainRegionId) || []
}

/**
 * Helper: Titel für Sub-Region View generieren
 */
export function getSubRegionViewTitle(mainRegionId: string | null): string {
  if (!mainRegionId) {
    return 'Was möchten Sie machen?'
  }
  
  switch (mainRegionId) {
    case REGION_IDS.ERNAEHRUNG:
      return 'Was wollen Sie zu sich nehmen?'
    case REGION_IDS.GEFUEHLE:
      return 'Wie fühlen Sie sich?'
    case REGION_IDS.KLEIDUNG:
      return 'Was möchten Sie anziehen?'
    case REGION_IDS.HYGIENE:
      return 'Was möchten Sie machen?'
    case REGION_IDS.BEWEGUNG:
      return 'Was möchten Sie machen?'
    default:
      return 'Was möchten Sie machen?'
  }
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
  
  return generateConfirmationSentence(mainRegionId, subRegion)
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

export function useSelfDictionary() {
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

