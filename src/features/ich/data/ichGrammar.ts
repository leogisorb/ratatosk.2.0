// ichGrammar.ts - Grammatik-Regeln für Ich-Dialog
// ✅ Verwendet REGION_IDS für Type Safety

import { REGION_IDS } from './ichDialogData'

/**
 * Generiert den Titel für die Sub-Region-View basierend auf der Haupt-Region
 * Die Texte basieren auf der Confirmation-Logik und sind konsistent formuliert
 */
export function getSubRegionViewTitle(mainRegionId: string | null): string {
  if (!mainRegionId) {
    return 'Was möchten Sie machen?'
  }
  
  // Spezifische Texte basierend auf der Confirmation-Logik
  // Die Fragen passen zu den Confirmation-Sätzen: "Ich möchte gerne X zu mir nehmen" → "Was wollen Sie zu sich nehmen?"
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
 * Generiert den Bestätigungstext basierend auf Haupt- und Sub-Region
 */
export function generateConfirmationText(
  mainRegionId: string | null,
  subRegionTtsText: string | null
): string {
  if (!mainRegionId || !subRegionTtsText) {
    return 'Auswahl erfasst'
  }
  
  switch (mainRegionId) {
    case REGION_IDS.ERNAEHRUNG:
      return `Ich möchte gerne ${subRegionTtsText} zu mir nehmen.`
    case REGION_IDS.GEFUEHLE:
      return `Ich fühle mich ${subRegionTtsText}.`
    case REGION_IDS.KLEIDUNG:
      return `Ich möchte ${subRegionTtsText} anziehen.`
    case REGION_IDS.HYGIENE:
      return `Ich möchte ${subRegionTtsText}.`
    case REGION_IDS.BEWEGUNG:
      return `Ich möchte ${subRegionTtsText}.`
    default:
      return `Ich möchte ${subRegionTtsText}.`
  }
}

