// useSettingsDictionary.ts - Zentrale Daten- und Sprachlogik für Settings-Dialog

import { settingsCategories, ID_BACK, type SettingsCategory } from '../data/categories'
import { getCategoryOptions, type SettingsOption } from '../data/options'
import { 
  getOptionsViewTitle as getOptionsViewTitleFromGrammar, 
  generateConfirmationText 
} from '../data/settingsGrammar'
import { useSettingsStore } from '../stores/settings'

/**
 * Helper: Optionen für eine Kategorie abrufen (mit aktueller Einstellung markiert)
 */
export function getOptions(categoryId: string | null): SettingsOption[] {
  if (!categoryId) return []
  
  const options = getCategoryOptions(categoryId)
  const settingsStore = useSettingsStore()
  
  // Markiere die aktuelle Einstellung als aktiv
  return options.map(option => {
    if (option.id === ID_BACK) return option
    
    const isCurrent = isCurrentSetting(categoryId, option.value, settingsStore)
    return {
      ...option,
      isCurrent
    }
  })
}

/**
 * Helper: Prüft ob eine Einstellung aktuell ist
 */
function isCurrentSetting(categoryId: string, value: any, settingsStore: ReturnType<typeof useSettingsStore>): boolean {
  switch (categoryId) {
    case 'leuchtdauer':
      return settingsStore.settings.leuchtdauer === value
    case 'blinzeldauer':
      return settingsStore.settings.blinzeldauer === value
    case 'farbmodus':
      return settingsStore.isDarkMode === value
    case 'kamera':
      return settingsStore.settings.kamera === (value ? 'back' : 'off')
    default:
      return false
  }
}

/**
 * Helper: Titel für eine Kategorie abrufen
 */
export function getCategoryTitle(categoryId: string | null): string {
  if (!categoryId) return ''
  const category = settingsCategories.find(c => c.id === categoryId)
  return category ? category.title : categoryId
}

/**
 * Helper: Titel für eine Option abrufen
 */
export function getOptionTitle(categoryId: string | null, optionId: string | null): string {
  if (!categoryId || !optionId) return ''
  const options = getOptions(categoryId)
  const option = options.find(o => o.id === optionId)
  return option ? option.title : optionId
}

/**
 * Helper: Aktuellen Wert einer Kategorie als Text abrufen
 */
export function getCurrentValue(categoryId: string | null): string {
  if (!categoryId) return ''
  
  const settingsStore = useSettingsStore()
  
  switch (categoryId) {
    case 'leuchtdauer':
      return `${settingsStore.settings.leuchtdauer} Sekunden`
    case 'blinzeldauer':
      return `${settingsStore.settings.blinzeldauer} Sekunden`
    case 'farbmodus':
      return settingsStore.isDarkMode ? 'Dunkel' : 'Hell'
    case 'kamera':
      return settingsStore.settings.kamera === 'back' ? 'Ein' : 'Aus'
    default:
      return ''
  }
}

/**
 * Helper: Titel für Options-View generieren
 */
export function getOptionsViewTitle(categoryId: string | null): string {
  return getOptionsViewTitleFromGrammar(categoryId)
}

/**
 * Helper: Confirmation Text generieren
 */
export function generateConfirmation(
  categoryId: string | null,
  optionId: string | null
): string {
  if (!categoryId || !optionId) {
    return 'Einstellung gespeichert'
  }
  
  const categoryTitle = getCategoryTitle(categoryId)
  const optionTitle = getOptionTitle(categoryId, optionId)
  
  return generateConfirmationText(categoryTitle, optionTitle)
}

/**
 * Helper: TTS-Text für Item abrufen (title für TTS)
 */
export function getTTSText(item: SettingsCategory | SettingsOption): string {
  return item.title
}

export function useSettingsDictionary() {
  return {
    settingsCategories,
    getOptions,
    getCategoryTitle,
    getOptionTitle,
    getCurrentValue,
    getOptionsViewTitle,
    generateConfirmation,
    getTTSText,
    ID_BACK
  }
}

