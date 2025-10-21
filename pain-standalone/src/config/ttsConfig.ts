/**
 * TTS-Konfiguration für verschiedene Kategorien
 * Definiert die Satzbausteine für die Sprachausgabe in den Ich-Views
 */

export interface TTSCategoryConfig {
  /** Der Text, der über den Kacheln angezeigt wird */
  mainText: string
  /** Der Satzbaustein für die TTS-Ausgabe nach Item-Auswahl */
  ttsTemplate: string
  /** Zusätzliche Konfiguration für spezielle Kategorien */
  options?: {
    /** Verzögerung vor dem Start der automatischen Durchlauf-Logik in ms */
    autoStartDelay?: number
    /** Verzögerung zwischen den Kacheln in ms */
    cycleDelay?: number
    /** Pause nach TTS-Ende in ms */
    pauseAfterTTS?: number
  }
}

// Ernährung-Artikel-Mapping für korrekte Formulierungen
const nutritionArticles: Record<string, string> = {
  'Essen': 'etwas zu essen',
  'Trinken': 'etwas zu trinken',
  'süß': 'etwas Süßes',
  'herzhaft': 'etwas Herzhaftes',
  'scharf': 'etwas Scharfes',
  'kalt': 'etwas Kaltes',
  'warm': 'etwas Warmes',
  'lauwarm': 'etwas Lauwarmes',
  'trocken': 'etwas Trockenes',
  'nass': 'etwas Nasses',
  'breiig': 'etwas Breiiges',
  'Wasser': 'Wasser',
  'Saft': 'den Saft',
  'Milch': 'die Milch'
}

// Hygiene-Mapping für korrekte Formulierungen
const hygieneMapping: Record<string, string> = {
  'duschen': 'duschen',
  'baden': 'baden',
  'Zähneputzen': 'mir die Zähne putzen',
  'Haare waschen': 'mir die Haare waschen',
  'Rasieren': 'mich rasieren',
  'Deo': 'Deo benutzen',
  'Creme': 'mich eincremen',
  'Parfüm': 'Parfüm benutzen',
  'Toilette': 'auf die Toilette gehen',
  'Windel wechseln': 'meine Windel wechseln',
  'Medikamente': 'meine Medikamente nehmen'
}

// Bewegung-Mapping für korrekte Formulierungen
const movementMapping: Record<string, string> = {
  'Laufen': 'laufen',
  'Gehen': 'gehen',
  'Yoga': 'Yoga machen',
  'Tanzen': 'tanzen',
  'Sport': 'Sport machen',
  'Spazieren': 'spazieren gehen',
  'Schwimmen': 'schwimmen',
  'Radfahren': 'Rad fahren',
  'Physiotherapie': 'zur Physiotherapie gehen',
  'Massage': 'eine Massage bekommen',
  'Ruhe': 'mich ausruhen'
}

// Kleidungsartikel-Mapping für korrekte Artikel
const clothingArticles: Record<string, string> = {
  'Mütze': 'die Mütze',
  'Hut': 'den Hut',
  'Schal': 'den Schal',
  'Handschuhe': 'die Handschuhe',
  'T-Shirt': 'das T-Shirt',
  'Pullover': 'den Pullover',
  'Jacke': 'die Jacke',
  'Hose': 'die Hose',
  'Socken': 'die Socken',
  'Schuhe': 'die Schuhe',
  'Unterwäsche': 'die Unterwäsche'
}

export const ttsCategoryConfig: Record<string, TTSCategoryConfig> = {
  ernaehrung: {
    mainText: 'Was wollen Sie zu sich nehmen?',
    ttsTemplate: 'Ich möchte {item} zu mir nehmen.',
    options: {
      autoStartDelay: 1000,
      cycleDelay: 3000,
      pauseAfterTTS: 1000
    }
  },
  gefuehle: {
    mainText: 'Wie fühlen Sie sich?',
    ttsTemplate: 'Ich fühle mich {item}.',
    options: {
      autoStartDelay: 1000,
      cycleDelay: 3000,
      pauseAfterTTS: 1000
    }
  },
  kleidung: {
    mainText: 'Was möchten Sie anziehen?',
    ttsTemplate: 'Ich möchte {item} anziehen.',
    options: {
      autoStartDelay: 1000,
      cycleDelay: 3000,
      pauseAfterTTS: 1000
    }
  },
  hygiene: {
    mainText: 'Was möchten Sie für Ihre Hygiene tun?',
    ttsTemplate: 'Ich möchte {item}.',
    options: {
      autoStartDelay: 1000,
      cycleDelay: 3000,
      pauseAfterTTS: 1000
    }
  },
  bewegung: {
    mainText: 'Was möchten Sie machen?',
    ttsTemplate: 'Ich möchte {item}.',
    options: {
      autoStartDelay: 1000,
      cycleDelay: 3000,
      pauseAfterTTS: 1000
    }
  }
}

/**
 * Hilfsfunktion um TTS-Text zu generieren
 * @param category Die Kategorie (ernaehrung, gefuehle, etc.)
 * @param item Das ausgewählte Item
 * @returns Der generierte TTS-Text
 */
export function generateTTSText(category: string, item: string): string {
  const config = ttsCategoryConfig[category]
  if (!config) {
    console.warn(`TTS-Konfiguration für Kategorie '${category}' nicht gefunden`)
    return `${item} ausgewählt`
  }
  
  let processedItem = item
  
  // Spezielle Behandlung für Ernährung mit korrekten Formulierungen
  if (category === 'ernaehrung' && nutritionArticles[item]) {
    processedItem = nutritionArticles[item]
  }
  
  // Spezielle Behandlung für Hygiene mit korrekten Formulierungen
  if (category === 'hygiene' && hygieneMapping[item]) {
    processedItem = hygieneMapping[item]
  }
  
  // Spezielle Behandlung für Bewegung mit korrekten Formulierungen
  if (category === 'bewegung' && movementMapping[item]) {
    processedItem = movementMapping[item]
  }
  
  // Spezielle Behandlung für Kleidung mit Artikeln
  if (category === 'kleidung' && clothingArticles[item]) {
    processedItem = clothingArticles[item]
  }
  
  const result = config.ttsTemplate.replace('{item}', processedItem)
  console.log(`TTS-Konfiguration: category='${category}', item='${item}', processedItem='${processedItem}', template='${config.ttsTemplate}', result='${result}'`)
  return result
}

/**
 * Hilfsfunktion um den Haupttext für eine Kategorie zu erhalten
 * @param category Die Kategorie
 * @returns Der Haupttext oder ein Fallback
 */
export function getMainText(category: string): string {
  const config = ttsCategoryConfig[category]
  return config?.mainText || 'Wählen Sie ein Item aus.'
}

/**
 * Hilfsfunktion um die Pause nach TTS-Ende zu erhalten
 * @param category Die Kategorie
 * @returns Die Pause in ms oder Standardwert
 */
export function getPauseAfterTTS(category: string): number {
  const config = ttsCategoryConfig[category]
  return config?.options?.pauseAfterTTS || 1000
}

/**
 * Hilfsfunktion um die Auto-Start-Verzögerung zu erhalten
 * @param category Die Kategorie
 * @returns Die Verzögerung in ms oder Standardwert
 */
export function getAutoStartDelay(category: string): number {
  const config = ttsCategoryConfig[category]
  return config?.options?.autoStartDelay || 1000
}

/**
 * Hilfsfunktion um die Zyklus-Verzögerung zu erhalten
 * @param category Die Kategorie
 * @returns Die Verzögerung in ms oder Standardwert
 */
export function getCycleDelay(category: string): number {
  const config = ttsCategoryConfig[category]
  return config?.options?.cycleDelay || 3000
}
