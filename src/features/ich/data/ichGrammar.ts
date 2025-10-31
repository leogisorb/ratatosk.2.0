// ichGrammar.ts - Grammatik-Regeln für Ich-Dialog

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
    case 'ernaehrung':
      return 'Was wollen Sie zu sich nehmen?'
    case 'gefuehle':
      return 'Wie fühlen Sie sich?'
    case 'kleidung':
      return 'Was möchten Sie anziehen?'
    case 'hygiene':
      return 'Was möchten Sie machen?'
    case 'bewegung':
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
    case 'ernaehrung':
      return `Ich möchte gerne ${subRegionTtsText} zu mir nehmen.`
    case 'gefuehle':
      return `Ich fühle mich ${subRegionTtsText}.`
    case 'kleidung':
      return `Ich möchte ${subRegionTtsText} anziehen.`
    case 'hygiene':
      return `Ich möchte ${subRegionTtsText}.`
    case 'bewegung':
      return `Ich möchte ${subRegionTtsText}.`
    default:
      return `Ich möchte ${subRegionTtsText}.`
  }
}

