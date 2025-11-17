// categories.ts - Settings Kategorien

// Icons from public folder - use BASE_URL to support base path
const baseUrl = import.meta.env.BASE_URL
const leuchtdauerIcon = `${baseUrl}leuchtdauer.svg`
const blinzeldauerIcon = `${baseUrl}blinzeldauer.svg`
const farbmodusIcon = `${baseUrl}farbmodus.svg`
const kameraIcon = `${baseUrl}kamera.svg`
const impressumIcon = `${baseUrl}impressum.svg`
const zurueckIcon = `${baseUrl}zurueck.svg`

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

