// Centralized data for pain assessment system
// This eliminates duplicate declarations across multiple files

// Main body regions
export const mainRegions = [
  { id: 'kopf', title: 'Kopf', icon: 'kopf1.svg' },
  { id: 'beine', title: 'Beine', icon: 'bein1.svg' },
  { id: 'arme', title: 'Arme', icon: 'arm1.svg' },
  { id: 'torso', title: 'Torso', icon: 'torso1.svg' },
  { id: 'zurueck', title: 'Zurück', icon: 'zurueck.svg' }
]

// Sub-regions for Kopf
export const kopfSubRegions = [
  { id: 'stirn', title: 'Stirn', icon: 'stirn.svg' },
  { id: 'hinterkopf', title: 'Hinterkopf', icon: 'hinterkopf.svg' },
  { id: 'schlaefe', title: 'Schläfe', icon: 'schläfe.svg' },
  { id: 'nacken', title: 'Nacken', icon: 'nacken.svg' },
  { id: 'kiefer', title: 'Kiefer', icon: 'kiefer.svg' },
  { id: 'nebenhoehlen', title: 'Nebenhöhlen', icon: 'nebenhoehlen.svg' },
  { id: 'hals', title: 'Hals', icon: 'hals.svg' },
  { id: 'auge', title: 'Auge', icon: 'auge.svg' },
  { id: 'nase', title: 'Nase', icon: 'nase.svg' },
  { id: 'mund', title: 'Mund', icon: 'mund.svg' },
  { id: 'speiseroehre', title: 'Speiseröhre', icon: 'speiseröhre.svg' },
  { id: 'zurueck', title: 'Zurück', icon: 'back.svg' }
]

// Sub-regions for Beine
export const beineSubRegions = [
  { id: 'oberschenkel', title: 'Oberschenkel', icon: 'OBERSCHENKEL.svg' },
  { id: 'knie', title: 'Knie', icon: 'KNIE.svg' },
  { id: 'unterschenkel', title: 'Unterschenkel', icon: 'UNTERSCHENKEL.svg' },
  { id: 'knoechel', title: 'Knöchel', icon: 'KNÖCHEL.svg' },
  { id: 'fuss', title: 'Fuß', icon: 'FUSBALLEN.svg' },
  { id: 'zehen', title: 'Zehen', icon: 'ZEHEN.svg' },
  { id: 'huefte', title: 'Hüfte', icon: 'hüfte.svg' },
  { id: 'wade', title: 'Wade', icon: 'UNTERSCHENKEL.svg' },
  { id: 'leiste', title: 'Leiste', icon: 'hüfte.svg' },
  { id: 'gesaess', title: 'Gesäß', icon: 'hüfte.svg' },
  { id: 'sprunggelenk', title: 'Sprunggelenk', icon: 'KNÖCHEL.svg' },
  { id: 'zurueck', title: 'Zurück', icon: 'back.svg' }
]

// Sub-regions for Arme
export const armeSubRegions = [
  { id: 'oberarm', title: 'Oberarm', icon: 'oberarm.svg' },
  { id: 'unterarm', title: 'Unterarm', icon: 'unterarm.svg' },
  { id: 'ellenbogen', title: 'Ellenbogen', icon: 'ellebogen.svg' },
  { id: 'handgelenk', title: 'Handgelenk', icon: 'handgelenk.svg' },
  { id: 'hand', title: 'Hand', icon: 'handfläche.svg' },
  { id: 'finger', title: 'Finger', icon: 'finger.svg' },
  { id: 'schulter', title: 'Schulter', icon: 'schulter.svg' },
  { id: 'daumen', title: 'Daumen', icon: 'finger.svg' },
  { id: 'achsel', title: 'Achsel', icon: 'achsel.svg' },
  { id: 'handruecken', title: 'Handrücken', icon: 'handrücken.svg' },
  { id: 'handflaeche', title: 'Handfläche', icon: 'handfläche.svg' },
  { id: 'zurueck', title: 'Zurück', icon: 'back.svg' }
]

// Sub-regions for Torso
export const torsoSubRegions = [
  { id: 'brust', title: 'Brust', icon: 'brust.svg' },
  { id: 'ruecken', title: 'Rücken', icon: 'schulterblätter.svg' },
  { id: 'schulterblatt', title: 'Schulterblatt', icon: 'schulterblätter.svg' },
  { id: 'wirbelsaeule', title: 'Wirbelsäule', icon: 'wirbelsaule.svg' },
  { id: 'bauch', title: 'Bauch', icon: 'magen.svg' },
  { id: 'lunge', title: 'Lunge', icon: 'lunge.svg' },
  { id: 'herz', title: 'Herz', icon: 'anatomisches-herz.svg' },
  { id: 'magen', title: 'Magen', icon: 'magen.svg' },
  { id: 'leber', title: 'Leber', icon: 'magen.svg' },
  { id: 'niere', title: 'Niere', icon: 'magen.svg' },
  { id: 'blase', title: 'Blase', icon: 'blase.svg' },
  { id: 'zurueck', title: 'Zurück', icon: 'back.svg' }
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
