/**
 * Statisches Keyboard-Layout für die virtuelle Tastatur
 * Enthält alle Zeilen und Buchstaben in der korrekten Reihenfolge
 */

export interface KeyboardRow {
  letters: string[]
}

export const keyboardLayout: KeyboardRow[] = [
  { letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'] },
  { letters: ['L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V'] },
  { letters: ['W', 'X', 'Y', 'Z', 'Ä', 'Ö', 'Ü', 'ß', '.', ',', '?'] },
  { letters: ['SCH', 'CH', 'EI', 'IE', 'AU', 'EU', 'ÄU', 'PF', 'PH', 'CK', 'NK'] },
  { letters: ['JA', 'NEIN', 'ICH', 'DU', 'ES', 'IST', 'BIN'] },
  { letters: ['LEERZEICHEN', 'LÖSCHEN', 'ZURÜCK'] }
]

/**
 * Gibt den originalen Buchstaben zurück (nicht die TTS-Aussprache)
 * @param letter Der Buchstabe oder die Buchstabenkombination
 * @returns Der originale Buchstabe für die Anzeige
 */
export const getOriginalLetter = (letter: string): string => {
  // Für normale Buchstaben: Original zurückgeben
  if (letter.length === 1 && /[A-Z]/.test(letter)) {
    return letter // A, B, C, etc. bleiben A, B, C
  }
  
  // Für Sonderzeichen: Original zurückgeben
  const originalMap: Record<string, string> = {
    'ß': 'ß',
    'Ü': 'Ü',
    'Ä': 'Ä',
    'Ö': 'Ö',
    '?': '?',
    ',': ',',
    '.': '.',
    'LEERZEICHEN': ' ',
    'LÖSCHEN': '', // Wird separat behandelt
    'ZURÜCK': '', // Wird separat behandelt
    'SCH': 'sch',
    'CH': 'ch',
    'EI': 'ei',
    'IE': 'ie',
    'AU': 'au',
    'EU': 'eu',
    'ÄU': 'äu',
    'PF': 'pf',
    'PH': 'ph',
    'CK': 'ck',
    'NK': 'nk',
    'JA': 'ja',
    'NEIN': 'nein',
    'ICH': 'ich',
    'DU': 'du',
    'ES': 'es',
    'IST': 'ist',
    'BIN': 'bin'
  }
  
  return originalMap[letter] || letter
}
