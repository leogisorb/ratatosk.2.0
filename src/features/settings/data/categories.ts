// categories.ts - Settings Kategorien

// Import icons
import leuchtdauerIcon from '@/assets/leuchtdauer.svg'
import blinzeldauerIcon from '@/assets/blinzeldauer.svg'
import farbmodusIcon from '@/assets/farbmodus.svg'
import kameraIcon from '@/assets/kamera.svg'
import kamerapositionIcon from '@/assets/kameraposition.svg'
import impressumIcon from '@/assets/impressum.svg'

export interface SettingsCategory {
  id: string
  title: string
  icon: string
  category: 'settings'
}

export const settingsCategories: SettingsCategory[] = [
  {
    id: 'leuchtdauer',
    title: 'LEUCHTDAUER',
    icon: leuchtdauerIcon,
    category: 'settings'
  },
  {
    id: 'blinzeldauer',
    title: 'BLINZELDAUER',
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
    title: 'KAMERAPOSITIONEN',
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

