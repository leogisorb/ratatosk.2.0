// Ich Dialog Data - Refactored Version
// ✅ Fixed Emojis - Alle Emojis als Unicode-Escape-Sequenzen für Encoding-Sicherheit
// ✅ Readonly Types - as const für unveränderliche Daten
// ✅ Typed Constants - REGION_IDS und SUB_REGION_TYPES als Konstanten
// ✅ Better Organization - Klare Struktur mit Kommentaren

export interface IchRegion {
  readonly id: string
  readonly title: string
  readonly icon?: string
  readonly emoji?: string
}

export interface IchSubRegion extends IchRegion {
  readonly type: string
  readonly ttsText?: string
}

// ==========================================
// CONSTANTS - Typed Region IDs
// ==========================================
export const REGION_IDS = {
  ERNAEHRUNG: 'ernaehrung',
  GEFUEHLE: 'gefuehle',
  KLEIDUNG: 'kleidung',
  HYGIENE: 'hygiene',
  BEWEGUNG: 'bewegung',
  ZURUECK: 'zurueck'
} as const

export const SUB_REGION_TYPES = {
  KATEGORIE: 'kategorie',
  GESCHMACK: 'geschmack',
  TEMPERATUR: 'temperatur',
  KONSISTENZ: 'konsistenz',
  GETRAENK: 'getraenk',
  GRUNDGEFUEHL: 'grundgefuehl',
  KOERPERGEFUEHL: 'koerpergefuehl',
  SOZIALGEFUEHL: 'sozialgefuehl',
  OBERBEKLEIDUNG: 'oberbekleidung',
  KLEIDUNG: 'kleidung',
  ACCESSOIRES: 'accessoires',
  KOERPERPFLEGE: 'koerperpflege',
  GESICHTSPFLEGE: 'gesichtspflege',
  TOILETTE: 'toilette',
  GRUNDBEWEGUNG: 'grundbewegung',
  AKTIVITAET: 'aktivitaet',
  ENTSPANNUNG: 'entspannung',
  NAVIGATION: 'navigation'
} as const

// ==========================================
// MAIN REGIONS
// ==========================================
export const mainRegions: readonly IchRegion[] = [
  {
    id: REGION_IDS.ERNAEHRUNG,
    title: 'ERNÄHRUNG',
    icon: '/ratatosk.2.0/burger.svg'
  },
  {
    id: REGION_IDS.GEFUEHLE,
    title: 'GEFÜHLE',
    icon: '/ratatosk.2.0/face-smile-upside-down 1.svg'
  },
  {
    id: REGION_IDS.KLEIDUNG,
    title: 'KLEIDUNG',
    icon: '/ratatosk.2.0/clothes.svg'
  },
  {
    id: REGION_IDS.HYGIENE,
    title: 'HYGIENE',
    icon: '/ratatosk.2.0/bath.svg'
  },
  {
    id: REGION_IDS.BEWEGUNG,
    title: 'BEWEGUNG',
    icon: '/ratatosk.2.0/barefoot 1.svg'
  },
  {
    id: REGION_IDS.ZURUECK,
    title: 'ZURÜCK',
    icon: '/ratatosk.2.0/zurueck.svg'
  }
] as const

// ==========================================
// SUB REGIONS - ERNÄHRUNG
// ==========================================
export const ernaehrungSubRegions: readonly IchSubRegion[] = [
  // Hauptkategorien
  { id: 'essen', title: 'Essen', type: SUB_REGION_TYPES.KATEGORIE, emoji: '\u{1F37D}\u{FE0F}', ttsText: 'etwas zu essen' }, // 🍽️
  { id: 'trinken', title: 'Trinken', type: SUB_REGION_TYPES.KATEGORIE, emoji: '\u{1F964}', ttsText: 'etwas zu trinken' }, // 🥤
  
  // Geschmacksrichtungen
  { id: 'suess', title: 'süß', type: SUB_REGION_TYPES.GESCHMACK, emoji: '\u{1F370}', ttsText: 'etwas Süßes' }, // 🍰
  { id: 'herzhaft', title: 'herzhaft', type: SUB_REGION_TYPES.GESCHMACK, emoji: '\u{1F354}', ttsText: 'etwas Herzhaftes' }, // 🍔
  { id: 'scharf', title: 'scharf', type: SUB_REGION_TYPES.GESCHMACK, emoji: '\u{1F336}\u{FE0F}', ttsText: 'etwas Scharfes' }, // 🌶️
  
  // Temperaturen
  { id: 'kalt', title: 'kalt', type: SUB_REGION_TYPES.TEMPERATUR, emoji: '\u{2744}\u{FE0F}', ttsText: 'etwas Kaltes' }, // ❄️
  { id: 'warm', title: 'warm', type: SUB_REGION_TYPES.TEMPERATUR, emoji: '\u{1F525}', ttsText: 'etwas Warmes' }, // 🔥
  { id: 'lauwarm', title: 'lauwarm', type: SUB_REGION_TYPES.TEMPERATUR, emoji: '\u{1F321}\u{FE0F}', ttsText: 'etwas Lauwarmes' }, // 🌡️
  
  // Konsistenzen
  { id: 'trocken', title: 'trocken', type: SUB_REGION_TYPES.KONSISTENZ, emoji: '\u{1F36A}', ttsText: 'etwas Trockenes' }, // 🍪
  { id: 'nass', title: 'nass', type: SUB_REGION_TYPES.KONSISTENZ, emoji: '\u{1F4A6}', ttsText: 'etwas Nasses' }, // 💦
  { id: 'breiig', title: 'breiig', type: SUB_REGION_TYPES.KONSISTENZ, emoji: '\u{1F963}', ttsText: 'etwas Breiiges' }, // 🥣
  
  // Getränke
  { id: 'wasser', title: 'Wasser', type: SUB_REGION_TYPES.GETRAENK, emoji: '\u{1F4A7}', ttsText: 'Wasser' }, // 💧
  { id: 'saft', title: 'Saft', type: SUB_REGION_TYPES.GETRAENK, emoji: '\u{1F9C3}', ttsText: 'den Saft' }, // 🧃
  { id: 'milch', title: 'Milch', type: SUB_REGION_TYPES.GETRAENK, emoji: '\u{1F95B}', ttsText: 'die Milch' }, // 🥛
  
  // Navigation
  { id: REGION_IDS.ZURUECK, title: 'zurück', type: SUB_REGION_TYPES.NAVIGATION, emoji: '\u{2B05}\u{FE0F}', ttsText: 'zurück' } // ⬅️
] as const

// ==========================================
// SUB REGIONS - GEFÜHLE
// ==========================================
export const gefuehleSubRegions: readonly IchSubRegion[] = [
  // Grundgefühle
  { id: 'gluecklich', title: 'glücklich', type: SUB_REGION_TYPES.GRUNDGEFUEHL, emoji: '\u{1F60A}', ttsText: 'glücklich' }, // 😊
  { id: 'traurig', title: 'traurig', type: SUB_REGION_TYPES.GRUNDGEFUEHL, emoji: '\u{1F622}', ttsText: 'traurig' }, // 😢
  { id: 'wuetend', title: 'wütend', type: SUB_REGION_TYPES.GRUNDGEFUEHL, emoji: '\u{1F620}', ttsText: 'wütend' }, // 😠
  { id: 'aengstlich', title: 'ängstlich', type: SUB_REGION_TYPES.GRUNDGEFUEHL, emoji: '\u{1F630}', ttsText: 'ängstlich' }, // 😰
  
  // Körpergefühle
  { id: 'muede', title: 'müde', type: SUB_REGION_TYPES.KOERPERGEFUEHL, emoji: '\u{1F634}', ttsText: 'müde' }, // 😴
  { id: 'energisch', title: 'energisch', type: SUB_REGION_TYPES.KOERPERGEFUEHL, emoji: '\u{26A1}', ttsText: 'energisch' }, // ⚡
  { id: 'entspannt', title: 'entspannt', type: SUB_REGION_TYPES.KOERPERGEFUEHL, emoji: '\u{1F60C}', ttsText: 'entspannt' }, // 😌
  { id: 'angespannt', title: 'angespannt', type: SUB_REGION_TYPES.KOERPERGEFUEHL, emoji: '\u{1F62C}', ttsText: 'angespannt' }, // 😬
  
  // Soziale Gefühle
  { id: 'einsam', title: 'einsam', type: SUB_REGION_TYPES.SOZIALGEFUEHL, emoji: '\u{1F614}', ttsText: 'einsam' }, // 😔
  { id: 'geliebt', title: 'geliebt', type: SUB_REGION_TYPES.SOZIALGEFUEHL, emoji: '\u{1F495}', ttsText: 'geliebt' }, // 💕
  { id: 'stolz', title: 'stolz', type: SUB_REGION_TYPES.SOZIALGEFUEHL, emoji: '\u{1F60E}', ttsText: 'stolz' }, // 😎
  { id: 'schaem', title: 'Scham', type: SUB_REGION_TYPES.SOZIALGEFUEHL, emoji: '\u{1F633}', ttsText: 'scham' }, // 😳
  
  // Navigation
  { id: REGION_IDS.ZURUECK, title: 'zurück', type: SUB_REGION_TYPES.NAVIGATION, emoji: '\u{2B05}\u{FE0F}', ttsText: 'zurück' } // ⬅️
] as const

// ==========================================
// SUB REGIONS - KLEIDUNG
// ==========================================
export const kleidungSubRegions: readonly IchSubRegion[] = [
  // Oberbekleidung
  { id: 'muetze', title: 'Mütze', type: SUB_REGION_TYPES.OBERBEKLEIDUNG, emoji: '\u{1F9E2}', ttsText: 'die Mütze' }, // 🧢
  { id: 'ohrstoepsel', title: 'Ohrstöpsel', type: SUB_REGION_TYPES.OBERBEKLEIDUNG, emoji: '\u{1F3A7}', ttsText: 'die Ohrstöpsel' }, // 🎧
  { id: 'schaal', title: 'Schal', type: SUB_REGION_TYPES.OBERBEKLEIDUNG, emoji: '\u{1F9E3}', ttsText: 'den Schal' }, // 🧣
  { id: 'hemd', title: 'Hemd', type: SUB_REGION_TYPES.OBERBEKLEIDUNG, emoji: '\u{1F454}', ttsText: 'das Hemd' }, // 👔
  
  // Kleidung
  { id: 'tshirt', title: 'T-Shirt', type: SUB_REGION_TYPES.KLEIDUNG, emoji: '\u{1F455}', ttsText: 'das T-Shirt' }, // 👕
  { id: 'pullover', title: 'Pullover', type: SUB_REGION_TYPES.KLEIDUNG, emoji: '\u{1F455}', ttsText: 'den Pullover' }, // 👕
  { id: 'jacke', title: 'Jacke', type: SUB_REGION_TYPES.KLEIDUNG, emoji: '\u{1F9E5}', ttsText: 'die Jacke' }, // 🧥
  { id: 'hose', title: 'Hose', type: SUB_REGION_TYPES.KLEIDUNG, emoji: '\u{1F456}', ttsText: 'die Hose' }, // 👖
  
  // Schuhe und Accessoires
  { id: 'socken', title: 'Socken', type: SUB_REGION_TYPES.ACCESSOIRES, emoji: '\u{1F9E6}', ttsText: 'die Socken' }, // 🧦
  { id: 'schuhe', title: 'Schuhe', type: SUB_REGION_TYPES.ACCESSOIRES, emoji: '\u{1F45F}', ttsText: 'die Schuhe' }, // 👟
  { id: 'unterwaesche', title: 'Unterwäsche', type: SUB_REGION_TYPES.ACCESSOIRES, emoji: '\u{1FA72}', ttsText: 'die Unterwäsche' }, // 🩲
  
  // Navigation
  { id: REGION_IDS.ZURUECK, title: 'zurück', type: SUB_REGION_TYPES.NAVIGATION, emoji: '\u{2B05}\u{FE0F}', ttsText: 'zurück' } // ⬅️
] as const

// ==========================================
// SUB REGIONS - HYGIENE
// ==========================================
export const hygieneSubRegions: readonly IchSubRegion[] = [
  // Körperpflege
  { id: 'duschen', title: 'Duschen', type: SUB_REGION_TYPES.KOERPERPFLEGE, emoji: '\u{1F6BF}', ttsText: 'duschen' }, // 🚿
  { id: 'bad', title: 'Bad', type: SUB_REGION_TYPES.KOERPERPFLEGE, emoji: '\u{1F6C1}', ttsText: 'baden' }, // 🛁
  { id: 'haare', title: 'Haare waschen', type: SUB_REGION_TYPES.KOERPERPFLEGE, emoji: '\u{1F487}', ttsText: 'mir die Haare waschen' }, // 💇
  { id: 'zaehne', title: 'Zähne putzen', type: SUB_REGION_TYPES.KOERPERPFLEGE, emoji: '\u{1F9B7}', ttsText: 'mir die Zähne putzen' }, // 🦷
  
  // Gesichtspflege
  { id: 'gesicht', title: 'Gesicht waschen', type: SUB_REGION_TYPES.GESICHTSPFLEGE, emoji: '\u{1F9FC}', ttsText: 'mir das Gesicht waschen' }, // 🧼
  { id: 'rasieren', title: 'Rasieren', type: SUB_REGION_TYPES.GESICHTSPFLEGE, emoji: '\u{1FA92}', ttsText: 'mich rasieren' }, // 🪒
  { id: 'creme', title: 'Creme auftragen', type: SUB_REGION_TYPES.GESICHTSPFLEGE, emoji: '\u{1F9F4}', ttsText: 'mich eincremen' }, // 🧴
  
  // Toilette
  { id: 'toilette', title: 'Toilette', type: SUB_REGION_TYPES.TOILETTE, emoji: '\u{1F6BD}', ttsText: 'auf die Toilette gehen' }, // 🚽
  { id: 'haende', title: 'Hände waschen', type: SUB_REGION_TYPES.TOILETTE, emoji: '\u{1F9FD}', ttsText: 'mir die Hände waschen' }, // 🧽
  
  // Navigation
  { id: REGION_IDS.ZURUECK, title: 'zurück', type: SUB_REGION_TYPES.NAVIGATION, emoji: '\u{2B05}\u{FE0F}', ttsText: 'zurück' } // ⬅️
] as const

// ==========================================
// SUB REGIONS - BEWEGUNG
// ==========================================
export const bewegungSubRegions: readonly IchSubRegion[] = [
  // Grundbewegungen
  { id: 'gehen', title: 'Gehen', type: SUB_REGION_TYPES.GRUNDBEWEGUNG, emoji: '\u{1F6B6}', ttsText: 'gehen' }, // 🚶
  { id: 'laufen', title: 'Laufen', type: SUB_REGION_TYPES.GRUNDBEWEGUNG, emoji: '\u{1F3C3}', ttsText: 'laufen' }, // 🏃
  { id: 'stehen', title: 'Stehen', type: SUB_REGION_TYPES.GRUNDBEWEGUNG, emoji: '\u{1F9CD}', ttsText: 'aufstehen' }, // 🧍
  { id: 'sitzen', title: 'Sitzen', type: SUB_REGION_TYPES.GRUNDBEWEGUNG, emoji: '\u{1FA91}', ttsText: 'sitzen' }, // 🪑
  
  // Aktivitäten
  { id: 'sport', title: 'Sport', type: SUB_REGION_TYPES.AKTIVITAET, emoji: '\u{1F3C3}\u{200D}\u{2642}\u{FE0F}', ttsText: 'Sport machen' }, // 🏃‍♂️
  { id: 'spazieren', title: 'Spazieren', type: SUB_REGION_TYPES.AKTIVITAET, emoji: '\u{1F6B6}\u{200D}\u{2640}\u{FE0F}', ttsText: 'spazieren' }, // 🚶‍♀️
  { id: 'tanzen', title: 'Tanzen', type: SUB_REGION_TYPES.AKTIVITAET, emoji: '\u{1F483}', ttsText: 'tanzen' }, // 💃
  { id: 'yoga', title: 'Yoga', type: SUB_REGION_TYPES.AKTIVITAET, emoji: '\u{1F9D8}', ttsText: 'Yoga machen' }, // 🧘
  
  // Entspannung
  { id: 'dehnen', title: 'Dehnen', type: SUB_REGION_TYPES.ENTSPANNUNG, emoji: '\u{1F938}', ttsText: 'dehnen' }, // 🤸
  { id: 'massage', title: 'Massage', type: SUB_REGION_TYPES.ENTSPANNUNG, emoji: '\u{1F486}', ttsText: 'massieren' }, // 💆
  { id: 'meditieren', title: 'Meditieren', type: SUB_REGION_TYPES.ENTSPANNUNG, emoji: '\u{1F9D8}\u{200D}\u{2640}\u{FE0F}', ttsText: 'meditieren' }, // 🧘‍♀️
  
  // Navigation
  { id: REGION_IDS.ZURUECK, title: 'zurück', type: SUB_REGION_TYPES.NAVIGATION, emoji: '\u{2B05}\u{FE0F}', ttsText: 'zurück' } // ⬅️
] as const

// ==========================================
// HELPER FUNCTIONS
// ==========================================
export function getSubRegionsByMainRegion(mainRegionId: string): readonly IchSubRegion[] {
  switch (mainRegionId) {
    case REGION_IDS.ERNAEHRUNG:
      return ernaehrungSubRegions
    case REGION_IDS.GEFUEHLE:
      return gefuehleSubRegions
    case REGION_IDS.KLEIDUNG:
      return kleidungSubRegions
    case REGION_IDS.HYGIENE:
      return hygieneSubRegions
    case REGION_IDS.BEWEGUNG:
      return bewegungSubRegions
    default:
      return []
  }
}

export function getMainRegionTitle(mainRegionId: string | null): string {
  if (!mainRegionId) return ''
  const region = mainRegions.find(r => r.id === mainRegionId)
  return region ? region.title : ''
}

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
    case REGION_IDS.ERNAEHRUNG:
      return `Ich möchte gerne ${subRegion.ttsText} zu mir nehmen.`
    case REGION_IDS.GEFUEHLE:
      return `Ich fühle mich ${subRegion.ttsText}.`
    case REGION_IDS.KLEIDUNG:
      return `Ich möchte ${subRegion.ttsText} anziehen.`
    case REGION_IDS.HYGIENE:
      return `Ich möchte ${subRegion.ttsText}.`
    case REGION_IDS.BEWEGUNG:
      return `Ich möchte ${subRegion.ttsText}.`
    default:
      return `Ich möchte ${subRegion.ttsText}.`
  }
}
