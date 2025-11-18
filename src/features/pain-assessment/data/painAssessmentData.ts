// Centralized data for pain assessment system
// This eliminates duplicate declarations across multiple files

// Main body regions
export const mainRegions = [
  { id: 'kopf', title: 'Kopf', icon: new URL('../../../assets/icons/kopf1.svg', import.meta.url).href },
  { id: 'beine', title: 'Beine', icon: new URL('../../../assets/icons/bein1.svg', import.meta.url).href },
  { id: 'arme', title: 'Arme', icon: new URL('../../../assets/icons/arm1.svg', import.meta.url).href },
  { id: 'torso', title: 'Torso', icon: new URL('../../../assets/icons/torso1.svg', import.meta.url).href },
  { id: 'zurueck', title: 'Zurück', icon: new URL('../../../assets/icons/zurueck.svg', import.meta.url).href }
]

// Sub-regions for Kopf
export const kopfSubRegions = [
  { id: 'stirn', title: 'Stirn', icon: new URL('../../../assets/icons/stirn.svg', import.meta.url).href },
  { id: 'hinterkopf', title: 'Hinterkopf', icon: new URL('../../../assets/icons/hinterkopf.svg', import.meta.url).href },
  { id: 'schlaefe', title: 'Schläfe', icon: new URL('../../../assets/icons/schläfe.svg', import.meta.url).href },
  { id: 'nacken', title: 'Nacken', icon: new URL('../../../assets/icons/nacken.svg', import.meta.url).href },
  { id: 'kiefer', title: 'Kiefer', icon: new URL('../../../assets/icons/kiefer.svg', import.meta.url).href },
  { id: 'nebenhoehlen', title: 'Nebenhöhlen', icon: new URL('../../../assets/icons/nebenhoehlen.svg', import.meta.url).href },
  { id: 'hals', title: 'Hals', icon: new URL('../../../assets/icons/hals.svg', import.meta.url).href },
  { id: 'auge', title: 'Auge', icon: new URL('../../../assets/icons/auge.svg', import.meta.url).href },
  { id: 'nase', title: 'Nase', icon: new URL('../../../assets/icons/nase.svg', import.meta.url).href },
  { id: 'mund', title: 'Mund', icon: new URL('../../../assets/icons/mund.svg', import.meta.url).href },
  { id: 'speiseroehre', title: 'Speiseröhre', icon: new URL('../../../assets/icons/speiseröhre.svg', import.meta.url).href },
  { id: 'zurueck', title: 'Zurück', icon: new URL('../../../assets/icons/back.svg', import.meta.url).href }
]

// Sub-regions for Beine
export const beineSubRegions = [
  { id: 'oberschenkel', title: 'Oberschenkel', icon: new URL('../../../assets/icons/OBERSCHENKEL.svg', import.meta.url).href },
  { id: 'knie', title: 'Knie', icon: new URL('../../../assets/icons/KNIE.svg', import.meta.url).href },
  { id: 'unterschenkel', title: 'Unterschenkel', icon: new URL('../../../assets/icons/UNTERSCHENKEL.svg', import.meta.url).href },
  { id: 'knoechel', title: 'Knöchel', icon: new URL('../../../assets/icons/KNÖCHEL.svg', import.meta.url).href },
  { id: 'fuss', title: 'Fuß', icon: new URL('../../../assets/icons/FUSBALLEN.svg', import.meta.url).href },
  { id: 'zehen', title: 'Zehen', icon: new URL('../../../assets/icons/ZEHEN.svg', import.meta.url).href },
  { id: 'huefte', title: 'Hüfte', icon: new URL('../../../assets/icons/hüfte.svg', import.meta.url).href },
  { id: 'wade', title: 'Wade', icon: new URL('../../../assets/icons/UNTERSCHENKEL.svg', import.meta.url).href },
  { id: 'leiste', title: 'Leiste', icon: new URL('../../../assets/icons/hüfte.svg', import.meta.url).href },
  { id: 'gesaess', title: 'Gesäß', icon: new URL('../../../assets/icons/hüfte.svg', import.meta.url).href },
  { id: 'sprunggelenk', title: 'Sprunggelenk', icon: new URL('../../../assets/icons/KNÖCHEL.svg', import.meta.url).href },
  { id: 'zurueck', title: 'Zurück', icon: new URL('../../../assets/icons/back.svg', import.meta.url).href }
]

// Sub-regions for Arme
export const armeSubRegions = [
  { id: 'oberarm', title: 'Oberarm', icon: new URL('../../../assets/icons/oberarm.svg', import.meta.url).href },
  { id: 'unterarm', title: 'Unterarm', icon: new URL('../../../assets/icons/unterarm.svg', import.meta.url).href },
  { id: 'ellenbogen', title: 'Ellenbogen', icon: new URL('../../../assets/icons/ellebogen.svg', import.meta.url).href },
  { id: 'handgelenk', title: 'Handgelenk', icon: new URL('../../../assets/icons/handgelenk.svg', import.meta.url).href },
  { id: 'hand', title: 'Hand', icon: new URL('../../../assets/icons/handfläche.svg', import.meta.url).href },
  { id: 'finger', title: 'Finger', icon: new URL('../../../assets/icons/finger.svg', import.meta.url).href },
  { id: 'schulter', title: 'Schulter', icon: new URL('../../../assets/icons/schulter.svg', import.meta.url).href },
  { id: 'daumen', title: 'Daumen', icon: new URL('../../../assets/icons/finger.svg', import.meta.url).href },
  { id: 'achsel', title: 'Achsel', icon: new URL('../../../assets/icons/achsel.svg', import.meta.url).href },
  { id: 'handruecken', title: 'Handrücken', icon: new URL('../../../assets/icons/handrücken.svg', import.meta.url).href },
  { id: 'handflaeche', title: 'Handfläche', icon: new URL('../../../assets/icons/handfläche.svg', import.meta.url).href },
  { id: 'zurueck', title: 'Zurück', icon: new URL('../../../assets/icons/back.svg', import.meta.url).href }
]

// Sub-regions for Torso
export const torsoSubRegions = [
  { id: 'brust', title: 'Brust', icon: new URL('../../../assets/icons/brust.svg', import.meta.url).href },
  { id: 'ruecken', title: 'Rücken', icon: new URL('../../../assets/icons/schulterblätter.svg', import.meta.url).href },
  { id: 'schulterblatt', title: 'Schulterblatt', icon: new URL('../../../assets/icons/schulterblätter.svg', import.meta.url).href },
  { id: 'wirbelsaeule', title: 'Wirbelsäule', icon: new URL('../../../assets/icons/wirbelsaule.svg', import.meta.url).href },
  { id: 'bauch', title: 'Bauch', icon: new URL('../../../assets/icons/magen.svg', import.meta.url).href },
  { id: 'lunge', title: 'Lunge', icon: new URL('../../../assets/icons/lunge.svg', import.meta.url).href },
  { id: 'herz', title: 'Herz', icon: new URL('../../../assets/icons/anatomisches-herz.svg', import.meta.url).href },
  { id: 'magen', title: 'Magen', icon: new URL('../../../assets/icons/magen.svg', import.meta.url).href },
  { id: 'leber', title: 'Leber', icon: new URL('../../../assets/icons/magen.svg', import.meta.url).href },
  { id: 'niere', title: 'Niere', icon: new URL('../../../assets/icons/magen.svg', import.meta.url).href },
  { id: 'blase', title: 'Blase', icon: new URL('../../../assets/icons/blase.svg', import.meta.url).href },
  { id: 'zurueck', title: 'Zurück', icon: new URL('../../../assets/icons/back.svg', import.meta.url).href }
]

// Pain levels (1-10)
export const painLevels = [
  { id: 1, level: 1, title: 'Eins', description: 'kein Schmerz' },
  { id: 2, level: 2, title: 'Zwei', description: 'sehr leicht' },
  { id: 3, level: 3, title: 'Drei', description: 'leicht' },
  { id: 4, level: 4, title: 'Vier', description: 'leicht bis mäßig' },
  { id: 5, level: 5, title: 'Fünf', description: 'mäßig' },
  { id: 6, level: 6, title: 'Sechs', description: 'mäßig bis stark' },
  { id: 7, level: 7, title: 'Sieben', description: 'stark' },
  { id: 8, level: 8, title: 'Acht', description: 'sehr stark' },
  { id: 9, level: 9, title: 'Neun', description: 'extrem stark' },
  { id: 10, level: 10, title: 'Zehn', description: 'unerträglich' }
]

// Helper function to get all sub-regions
export const getAllSubRegions = () => [
  ...kopfSubRegions,
  ...beineSubRegions,
  ...armeSubRegions,
  ...torsoSubRegions
]

// Helper function to get sub-regions by main region
export const getSubRegionsByMainRegion = (mainRegionId: string) => {
  switch (mainRegionId) {
    case 'kopf':
      return kopfSubRegions
    case 'beine':
      return beineSubRegions
    case 'arme':
      return armeSubRegions
    case 'torso':
      return torsoSubRegions
    default:
      return []
  }
}

// Helper function to get pain description by level
export const getPainDescription = (level: number): string => {
  const painLevel = painLevels.find(p => p.level === level)
  return painLevel ? painLevel.description : ''
}
