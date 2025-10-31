// Ich Dialog Data - Basierend auf ich-standalone Inhalten

export interface IchRegion {
  id: string
  title: string
  icon?: string
  emoji?: string
}

export interface IchSubRegion extends IchRegion {
  type: string
  ttsText?: string
}

// Main Regions - Hauptkategorien aus ich-standalone
export const mainRegions: IchRegion[] = [
  {
    id: 'ernaehrung',
    title: 'ERNÄHRUNG',
    icon: '/ratatosk.2.0/burger.svg'
  },
  {
    id: 'gefuehle',
    title: 'GEFÜHLE',
    icon: '/ratatosk.2.0/face-smile-upside-down 1.svg'
  },
  {
    id: 'kleidung',
    title: 'KLEIDUNG',
    icon: '/ratatosk.2.0/clothes.svg'
  },
  {
    id: 'hygiene',
    title: 'HYGIENE',
    icon: '/ratatosk.2.0/bath.svg'
  },
  {
    id: 'bewegung',
    title: 'BEWEGUNG',
    icon: '/ratatosk.2.0/barefoot 1.svg'
  },
  {
    id: 'zurueck',
    title: 'ZURÜCK',
    icon: '/ratatosk.2.0/zurueck.svg'
  }
]

// Ernährung Sub-Regions - basierend auf ErnaehrungView.ts
export const ernaehrungSubRegions: IchSubRegion[] = [
  // Hauptkategorien
  { id: 'essen', title: 'Essen', type: 'kategorie', emoji: '🍽️', ttsText: 'etwas zu essen' },
  { id: 'trinken', title: 'Trinken', type: 'kategorie', emoji: '🥤', ttsText: 'etwas zu trinken' },
  
  // Geschmacksrichtungen
  { id: 'suess', title: 'süß', type: 'geschmack', emoji: '🍰', ttsText: 'etwas Süßes' },
  { id: 'herzhaft', title: 'herzhaft', type: 'geschmack', emoji: '🍔', ttsText: 'etwas Herzhaftes' },
  { id: 'scharf', title: 'scharf', type: 'geschmack', emoji: '🌶️', ttsText: 'etwas Scharfes' },
  
  // Temperaturen
  { id: 'kalt', title: 'kalt', type: 'temperatur', emoji: '❄️', ttsText: 'etwas Kaltes' },
  { id: 'warm', title: 'warm', type: 'temperatur', emoji: '🔥', ttsText: 'etwas Warmes' },
  { id: 'lauwarm', title: 'lauwarm', type: 'temperatur', emoji: '🌡️', ttsText: 'etwas Lauwarmes' },
  
  // Konsistenzen
  { id: 'trocken', title: 'trocken', type: 'konsistenz', emoji: '🍪', ttsText: 'etwas Trockenes' },
  { id: 'nass', title: 'nass', type: 'konsistenz', emoji: '💦', ttsText: 'etwas Nasses' },
  { id: 'breiig', title: 'breiig', type: 'konsistenz', emoji: '🥣', ttsText: 'etwas Breiiges' },
  
  // Getränke
  { id: 'wasser', title: 'Wasser', type: 'getraenk', emoji: '💧', ttsText: 'Wasser' },
  { id: 'saft', title: 'Saft', type: 'getraenk', emoji: '🧃', ttsText: 'den Saft' },
  { id: 'milch', title: 'Milch', type: 'getraenk', emoji: '🥛', ttsText: 'die Milch' },
  
  // Navigation
  { id: 'zurueck', title: 'zurück', type: 'navigation', emoji: '⬅️', ttsText: 'zurück' }
]

// Gefühle Sub-Regions - basierend auf GefuehleView.ts
export const gefuehleSubRegions: IchSubRegion[] = [
  // Grundgefühle
  { id: 'gluecklich', title: 'glücklich', type: 'grundgefuehl', emoji: '😊', ttsText: 'glücklich' },
  { id: 'traurig', title: 'traurig', type: 'grundgefuehl', emoji: '😢', ttsText: 'traurig' },
  { id: 'wuetend', title: 'wütend', type: 'grundgefuehl', emoji: '😠', ttsText: 'wütend' },
  { id: 'aengstlich', title: 'ängstlich', type: 'grundgefuehl', emoji: '😰', ttsText: 'ängstlich' },
  
  // Körpergefühle
  { id: 'muede', title: 'müde', type: 'koerpergefuehl', emoji: '😴', ttsText: 'müde' },
  { id: 'energisch', title: 'energisch', type: 'koerpergefuehl', emoji: '⚡', ttsText: 'energisch' },
  { id: 'entspannt', title: 'entspannt', type: 'koerpergefuehl', emoji: '😌', ttsText: 'entspannt' },
  { id: 'angespannt', title: 'angespannt', type: 'koerpergefuehl', emoji: '😬', ttsText: 'angespannt' },
  
  // Soziale Gefühle
  { id: 'einsam', title: 'einsam', type: 'sozialgefuehl', emoji: '😔', ttsText: 'einsam' },
  { id: 'geliebt', title: 'geliebt', type: 'sozialgefuehl', emoji: '💕', ttsText: 'geliebt' },
  { id: 'stolz', title: 'stolz', type: 'sozialgefuehl', emoji: '😎', ttsText: 'stolz' },
  { id: 'schaem', title: 'Scham', type: 'sozialgefuehl', emoji: '😳', ttsText: 'scham' },
  
  // Navigation
  { id: 'zurueck', title: 'zurück', type: 'navigation', emoji: '⬅️', ttsText: 'zurück' }
]

// Kleidung Sub-Regions - basierend auf KleidungView.ts
export const kleidungSubRegions: IchSubRegion[] = [
  // Oberbekleidung
  { id: 'muetze', title: 'Mütze', type: 'oberbekleidung', emoji: '🧢', ttsText: 'die Mütze' },
  { id: 'ohrstoepsel', title: 'Ohrstöpsel', type: 'oberbekleidung', emoji: '🎧', ttsText: 'die Ohrstöpsel' },
  { id: 'schaal', title: 'Schal', type: 'oberbekleidung', emoji: '🧣', ttsText: 'den Schal' },
  { id: 'hemd', title: 'Hemd', type: 'oberbekleidung', emoji: '👔', ttsText: 'das Hemd' },
  
  // Kleidung
  { id: 'tshirt', title: 'T-Shirt', type: 'kleidung', emoji: '👕', ttsText: 'das T-Shirt' },
  { id: 'pullover', title: 'Pullover', type: 'kleidung', emoji: '👕', ttsText: 'den Pullover' },
  { id: 'jacke', title: 'Jacke', type: 'kleidung', emoji: '🧥', ttsText: 'die Jacke' },
  { id: 'hose', title: 'Hose', type: 'kleidung', emoji: '👖', ttsText: 'die Hose' },
  
  // Schuhe und Accessoires
  { id: 'socken', title: 'Socken', type: 'accessoires', emoji: '🧦', ttsText: 'die Socken' },
  { id: 'schuhe', title: 'Schuhe', type: 'accessoires', emoji: '👟', ttsText: 'die Schuhe' },
  { id: 'unterwaesche', title: 'Unterwäsche', type: 'accessoires', emoji: '🩲', ttsText: 'die Unterwäsche' },
  
  // Navigation
  { id: 'zurueck', title: 'zurück', type: 'navigation', emoji: '⬅️', ttsText: 'zurück' }
]

// Hygiene Sub-Regions - basierend auf HygieneView.ts
export const hygieneSubRegions: IchSubRegion[] = [
  // Körperpflege
  { id: 'duschen', title: 'Duschen', type: 'koerperpflege', emoji: '🚿', ttsText: 'duschen' },
  { id: 'bad', title: 'Bad', type: 'koerperpflege', emoji: '🛁', ttsText: 'baden' },
  { id: 'haare', title: 'Haare waschen', type: 'koerperpflege', emoji: '💇', ttsText: 'mir die Haare waschen' },
  { id: 'zaehne', title: 'Zähne putzen', type: 'koerperpflege', emoji: '🦷', ttsText: 'mir die Zähne putzen' },
  
  // Gesichtspflege
  { id: 'gesicht', title: 'Gesicht waschen', type: 'gesichtspflege', emoji: '🧼', ttsText: 'mir das Gesicht waschen' },
  { id: 'rasieren', title: 'Rasieren', type: 'gesichtspflege', emoji: '🪒', ttsText: 'mich rasieren' },
  { id: 'creme', title: 'Creme auftragen', type: 'gesichtspflege', emoji: '🧴', ttsText: 'mich eincremen' },
  
  // Toilette
  { id: 'toilette', title: 'Toilette', type: 'toilette', emoji: '🚽', ttsText: 'auf die Toilette gehen' },
  { id: 'hände', title: 'Hände waschen', type: 'toilette', emoji: '🧽', ttsText: 'mir die Hände waschen' },
  
  // Navigation
  { id: 'zurueck', title: 'zurück', type: 'navigation', emoji: '⬅️', ttsText: 'zurück' }
]

// Bewegung Sub-Regions - basierend auf BewegungView.ts
export const bewegungSubRegions: IchSubRegion[] = [
  // Grundbewegungen
  { id: 'gehen', title: 'Gehen', type: 'grundbewegung', emoji: '🚶', ttsText: 'gehen' },
  { id: 'laufen', title: 'Laufen', type: 'grundbewegung', emoji: '🏃', ttsText: 'laufen' },
  { id: 'stehen', title: 'Stehen', type: 'grundbewegung', emoji: '🧍', ttsText: 'aufstehen' },
  { id: 'sitzen', title: 'Sitzen', type: 'grundbewegung', emoji: '🪑', ttsText: 'sitzen' },
  
  // Aktivitäten
  { id: 'sport', title: 'Sport', type: 'aktivitaet', emoji: '🏃‍♂️', ttsText: 'Sport machen' },
  { id: 'spazieren', title: 'Spazieren', type: 'aktivitaet', emoji: '🚶‍♀️', ttsText: 'spazieren' },
  { id: 'tanzen', title: 'Tanzen', type: 'aktivitaet', emoji: '💃', ttsText: 'tanzen' },
  { id: 'yoga', title: 'Yoga', type: 'aktivitaet', emoji: '🧘', ttsText: 'Yoga machen' },
  
  // Entspannung
  { id: 'dehnen', title: 'Dehnen', type: 'entspannung', emoji: '🤸', ttsText: 'dehnen' },
  { id: 'massage', title: 'Massage', type: 'entspannung', emoji: '💆', ttsText: 'massieren' },
  { id: 'meditieren', title: 'Meditieren', type: 'entspannung', emoji: '🧘‍♀️', ttsText: 'meditieren' },
  
  // Navigation
  { id: 'zurueck', title: 'zurück', type: 'navigation', emoji: '⬅️', ttsText: 'zurück' }
]

// Helper function to get sub-regions by main region
export function getSubRegionsByMainRegion(mainRegionId: string): IchSubRegion[] {
  switch (mainRegionId) {
    case 'ernaehrung':
      return ernaehrungSubRegions
    case 'gefuehle':
      return gefuehleSubRegions
    case 'kleidung':
      return kleidungSubRegions
    case 'hygiene':
      return hygieneSubRegions
    case 'bewegung':
      return bewegungSubRegions
    default:
      return []
  }
}

// Helper function to get main region title
export function getMainRegionTitle(mainRegionId: string | null): string {
  if (!mainRegionId) return ''
  const region = mainRegions.find(r => r.id === mainRegionId)
  return region ? region.title : ''
}

// Helper function to get sub region title
export function getSubRegionTitle(subRegionId: string | null): string {
  if (!subRegionId) return ''
  
  // Search through all sub-regions
  const allSubRegions = [
    ...ernaehrungSubRegions,
    ...gefuehleSubRegions,
    ...kleidungSubRegions,
    ...hygieneSubRegions,
    ...bewegungSubRegions
  ]
  
  const region = allSubRegions.find(r => r.id === subRegionId)
  return region ? region.title : ''
}

/**
 * Generates a confirmation sentence based on selected main and sub regions
 * @param mainRegionId The main region ID (ernaehrung, gefuehle, etc.)
 * @param subRegion The sub region object with ttsText
 * @returns The confirmation sentence
 */
export function generateConfirmationSentence(mainRegionId: string | null, subRegion: IchSubRegion | null): string {
  if (!mainRegionId || !subRegion || !subRegion.ttsText) {
    return ''
  }
  
  // Generate confirmation sentence based on main region
  switch (mainRegionId) {
    case 'ernaehrung':
      return `Ich möchte gerne ${subRegion.ttsText} zu mir nehmen.`
    case 'gefuehle':
      return `Ich fühle mich ${subRegion.ttsText}.`
    case 'kleidung':
      return `Ich möchte ${subRegion.ttsText} anziehen.`
    case 'hygiene':
      return `Ich möchte ${subRegion.ttsText}.`
    case 'bewegung':
      return `Ich möchte ${subRegion.ttsText}.`
    default:
      return `Ich möchte ${subRegion.ttsText}.`
  }
}
