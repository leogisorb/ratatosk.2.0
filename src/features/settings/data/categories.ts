// categories.ts - Settings Kategorien

// Icons from assets folder - use new URL() for Vite processing
const leuchtdauerIcon = new URL('../../../assets/icons/leuchtdauer.svg', import.meta.url).href
const blinzeldauerIcon = new URL('../../../assets/icons/blinzeldauer.svg', import.meta.url).href
const farbmodusIcon = new URL('../../../assets/icons/farbmodus.svg', import.meta.url).href
const kameraIcon = new URL('../../../assets/icons/kamera.svg', import.meta.url).href
const impressumIcon = new URL('../../../assets/icons/impressum.svg', import.meta.url).href
const zurueckIcon = new URL('../../../assets/icons/zurueck.svg', import.meta.url).href

export interface SettingsCategory {
  id: string
  title: string
  icon: string
  category: 'settings'
}

export const settingsCategories: SettingsCategory[] = [
  {
    id: 'leuchtdauer',
    title: 'ANZEIGE-INTERVALL',
    icon: leuchtdauerIcon,
    category: 'settings'
  },
  {
    id: 'blinzeldauer',
    title: 'EMPFINDLICHKEIT',
    icon: blinzeldauerIcon,
    category: 'settings'
  },
  {
    id: 'farbmodus',
    title: 'FARBMODUS',
    icon: farbmodusIcon,
    category: 'settings'
  },
  {
    id: 'kamera',
    title: 'KAMERA',
    icon: kameraIcon,
    category: 'settings'
  },
  {
    id: 'impressum',
    title: 'IMPRESSUM',
    icon: impressumIcon,
    category: 'settings'
  },
  {
    id: 'zurueck',
    title: 'ZURÜCK',
    icon: zurueckIcon,
    category: 'settings'
  }
]

export const ID_BACK = 'zurueck'
