// settingsGrammar.ts - Grammatik-Regeln für Settings-Dialog

/**
 * Generiert den Titel für die Options-View basierend auf der Kategorie
 */
export function getOptionsViewTitle(categoryId: string | null): string {
  if (!categoryId) {
    return 'Welche Einstellung möchten Sie ändern?'
  }
  
  switch (categoryId) {
    case 'leuchtdauer':
      return 'ANZEIGE-INTERVALL'
    case 'blinzeldauer':
      return 'EMPFINDLICHKEIT'
    case 'farbmodus':
      return 'FARBMODUS'
    case 'kamera':
      return 'KAMERA'
    case 'kamerapositionen':
      return 'KAMERA-POSITIONEN'
    case 'impressum':
      return 'IMPRESSUM'
    default:
      return 'Einstellungen'
  }
}

/**
 * Generiert den Bestätigungstext basierend auf Kategorie und Option
 */
export function generateConfirmationText(
  categoryTitle: string,
  optionTitle: string
): string {
  return `${categoryTitle} - ${optionTitle}`
}

