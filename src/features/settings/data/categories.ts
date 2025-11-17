// categories.ts - Settings Kategorien

// Icons from public/images folder - use BASE_URL to support base path
const baseUrl = import.meta.env.BASE_URL
const leuchtdauerIcon = `${baseUrl}images/leuchtdauer.svg`
const blinzeldauerIcon = `${baseUrl}images/blinzeldauer.svg`
const farbmodusIcon = `${baseUrl}images/farbmodus.svg`
const kameraIcon = `${baseUrl}images/kamera.svg`
const impressumIcon = `${baseUrl}images/impressum.svg`
const zurueckIcon = `${baseUrl}images/zurueck.svg`

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

