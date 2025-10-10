// Centralized data for pain assessment system
// This eliminates duplicate declarations across multiple files

// Main body regions
export const mainRegions = [
  { id: 'kopf', title: 'Kopf', icon: '/ratatosk.2.0/head.png' },
  { id: 'beine', title: 'Beine', icon: '/ratatosk.2.0/leg.png' },
  { id: 'arme', title: 'Arme', icon: '/ratatosk.2.0/elbow-2.png' },
  { id: 'torso', title: 'Torso', icon: '/ratatosk.2.0/living.png' }
]

// Sub-regions for Kopf
export const kopfSubRegions = [
  { id: 'stirn', title: 'Stirn', icon: '/ratatosk.2.0/stirn.svg' },
  { id: 'hinterkopf', title: 'Hinterkopf', icon: '/ratatosk.2.0/hinterkopf.svg' },
  { id: 'schlaefe', title: 'Schläfe', icon: '/ratatosk.2.0/schläfe.svg' },
  { id: 'nacken', title: 'Nacken', icon: '/ratatosk.2.0/nacken.svg' },
  { id: 'kiefer', title: 'Kiefer', icon: '/ratatosk.2.0/kiefer.svg' },
  { id: 'nebenhoehlen', title: 'Nebenhöhlen', icon: '/ratatosk.2.0/nebenhoehlen.svg' },
  { id: 'hals', title: 'Hals', icon: '/ratatosk.2.0/hals.svg' },
  { id: 'auge', title: 'Auge', icon: '/ratatosk.2.0/auge.svg' },
  { id: 'nase', title: 'Nase', icon: '/ratatosk.2.0/nase.svg' },
  { id: 'mund', title: 'Mund', icon: '/ratatosk.2.0/mund.svg' },
  { id: 'speiseroehre', title: 'Speiseröhre', icon: '/ratatosk.2.0/speiseröhre.svg' }
]

// Sub-regions for Beine
export const beineSubRegions = [
  { id: 'oberschenkel', title: 'Oberschenkel', icon: '/ratatosk.2.0/OBERSCHENKEL.svg' },
  { id: 'knie', title: 'Knie', icon: '/ratatosk.2.0/KNIE.svg' },
  { id: 'unterschenkel', title: 'Unterschenkel', icon: '/ratatosk.2.0/UNTERSCHENKEL.svg' },
  { id: 'knoechel', title: 'Knöchel', icon: '/ratatosk.2.0/KNÖCHEL.svg' },
  { id: 'fuss', title: 'Fuß', icon: '/ratatosk.2.0/FUSBALLEN.svg' },
  { id: 'zehen', title: 'Zehen', icon: '/ratatosk.2.0/ZEHEN.svg' },
  { id: 'huefte', title: 'Hüfte', icon: '/ratatosk.2.0/hüfte.svg' },
  { id: 'wade', title: 'Wade', icon: '/ratatosk.2.0/UNTERSCHENKEL.svg' },
  { id: 'leiste', title: 'Leiste', icon: '/ratatosk.2.0/hüfte.svg' },
  { id: 'gesaess', title: 'Gesäß', icon: '/ratatosk.2.0/hüfte.svg' },
  { id: 'sprunggelenk', title: 'Sprunggelenk', icon: '/ratatosk.2.0/KNÖCHEL.svg' }
]

// Sub-regions for Arme
export const armeSubRegions = [
  { id: 'oberarm', title: 'Oberarm', icon: '/ratatosk.2.0/oberarm.svg' },
  { id: 'unterarm', title: 'Unterarm', icon: '/ratatosk.2.0/unterarm.svg' },
  { id: 'ellenbogen', title: 'Ellenbogen', icon: '/ratatosk.2.0/ellebogen.svg' },
  { id: 'handgelenk', title: 'Handgelenk', icon: '/ratatosk.2.0/handgelenk.svg' },
  { id: 'hand', title: 'Hand', icon: '/ratatosk.2.0/handfläche.svg' },
  { id: 'finger', title: 'Finger', icon: '/ratatosk.2.0/finger.svg' },
  { id: 'schulter', title: 'Schulter', icon: '/ratatosk.2.0/schulter.svg' },
  { id: 'daumen', title: 'Daumen', icon: '/ratatosk.2.0/finger.svg' },
  { id: 'achsel', title: 'Achsel', icon: '/ratatosk.2.0/achsel.svg' },
  { id: 'handruecken', title: 'Handrücken', icon: '/ratatosk.2.0/handrücken.svg' },
  { id: 'handflaeche', title: 'Handfläche', icon: '/ratatosk.2.0/handfläche.svg' }
]

// Sub-regions for Torso
export const torsoSubRegions = [
  { id: 'brust', title: 'Brust', icon: '/ratatosk.2.0/brust.svg' },
  { id: 'ruecken', title: 'Rücken', icon: '/ratatosk.2.0/schulterblätter.svg' },
  { id: 'schulterblatt', title: 'Schulterblatt', icon: '/ratatosk.2.0/schulterblätter.svg' },
  { id: 'wirbelsaeule', title: 'Wirbelsäule', icon: '/ratatosk.2.0/wirbelsaule.svg' },
  { id: 'bauch', title: 'Bauch', icon: '/ratatosk.2.0/magen.svg' },
  { id: 'lunge', title: 'Lunge', icon: '/ratatosk.2.0/lunge.svg' },
  { id: 'herz', title: 'Herz', icon: '/ratatosk.2.0/anatomisches-herz.svg' },
  { id: 'magen', title: 'Magen', icon: '/ratatosk.2.0/magen.svg' },
  { id: 'leber', title: 'Leber', icon: '/ratatosk.2.0/magen.svg' },
  { id: 'niere', title: 'Niere', icon: '/ratatosk.2.0/magen.svg' },
  { id: 'blase', title: 'Blase', icon: '/ratatosk.2.0/blase.svg' }
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
