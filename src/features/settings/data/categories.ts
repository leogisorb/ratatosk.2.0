// categories.ts - Settings Kategorien

// Icons from public folder - use absolute paths (treated as external resources by Vite)
const leuchtdauerIcon = '/ratatosk.2.0/leuchtdauer.svg'
const blinzeldauerIcon = '/ratatosk.2.0/blinzeldauer.svg'
const farbmodusIcon = '/ratatosk.2.0/farbmodus.svg'
const kameraIcon = '/ratatosk.2.0/kamera.svg'
const impressumIcon = '/ratatosk.2.0/impressum.svg'
const zurueckIcon = '/ratatosk.2.0/zurueck.svg'

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

