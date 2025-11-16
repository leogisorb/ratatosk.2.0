// categories.ts - Settings Kategorien

// Icons from public folder
const leuchtdauerIcon = '/leuchtdauer.svg'
const blinzeldauerIcon = '/blinzeldauer.svg'
const farbmodusIcon = '/farbmodus.svg'
const kameraIcon = '/kamera.svg'
const kamerapositionIcon = '/kameraposition.svg'
const impressumIcon = '/impressum.svg'

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
    id: 'kamerapositionen',
    title: 'KAMERA-POSITIONEN',
    icon: kamerapositionIcon,
    category: 'settings'
  },
  {
    id: 'impressum',
    title: 'IMPRESSUM',
    icon: impressumIcon,
    category: 'settings'
  }
]

export const ID_BACK = 'zurueck'

