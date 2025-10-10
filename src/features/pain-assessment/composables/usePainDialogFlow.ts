import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '../../settings/stores/settings'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'

// Zustände der Schmerzen-Dialog-Maschine
export type PainDialogState = 'mainView' | 'subRegionView' | 'painScaleView' | 'confirmation'

// Haupt-Körperregionen (mit korrekten Icons aus SchmerzView)
export const mainRegions = [
  { id: 'kopf', title: 'Kopf', icon: 'head.png' },
  { id: 'beine', title: 'Beine', icon: 'leg.png' },
  { id: 'arme', title: 'Arme', icon: 'elbow-2.png' },
  { id: 'torso', title: 'Torso', icon: 'living.png' }
]

// Unterregionen für Kopf (aus KopfSchmerzView)
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
  { id: 'speiseroehre', title: 'Speiseröhre', icon: 'speiseröhre.svg' }
]

// Unterregionen für Beine (aus BeineSchmerzView - vollständig)
export const beineSubRegions = [
  // Zeile 1: Oberschenkel, Knie, Unterschenkel, Knöchel
  { id: 'oberschenkel', title: 'Oberschenkel', icon: 'OBERSCHENKEL.svg' },
  { id: 'knie', title: 'Knie', icon: 'KNIE.svg' },
  { id: 'unterschenkel', title: 'Unterschenkel', icon: 'UNTERSCHENKEL.svg' },
  { id: 'knoechel', title: 'Knöchel', icon: 'KNÖCHEL.svg' },
  
  // Zeile 2: Fuß, Zehen, Hüfte, Wade
  { id: 'fuss', title: 'Fuß', icon: 'FUSBALLEN.svg' },
  { id: 'zehen', title: 'Zehen', icon: 'ZEHEN.svg' },
  { id: 'huefte', title: 'Hüfte', icon: 'hüfte.svg' },
  { id: 'wade', title: 'Wade', icon: 'UNTERSCHENKEL.svg' },
  
  // Zeile 3: Leiste, Gesäß, Sprunggelenk
  { id: 'leiste', title: 'Leiste', icon: 'hüfte.svg' },
  { id: 'gesaess', title: 'Gesäß', icon: 'hüfte.svg' },
  { id: 'sprunggelenk', title: 'Sprunggelenk', icon: 'KNÖCHEL.svg' }
]

// Unterregionen für Arme (aus ArmeSchmerzView - vollständig)
export const armeSubRegions = [
  // Zeile 1: Oberarm, Unterarm, Ellenbogen, Handgelenk
  { id: 'oberarm', title: 'Oberarm', icon: 'oberarm.svg' },
  { id: 'unterarm', title: 'Unterarm', icon: 'unterarm.svg' },
  { id: 'ellenbogen', title: 'Ellenbogen', icon: 'schulter.svg' },
  { id: 'handgelenk', title: 'Handgelenk', icon: 'handgelenk.svg' },
  
  // Zeile 2: Hand, Finger, Schulter, Daumen
  { id: 'hand', title: 'Hand', icon: 'handfläche.svg' },
  { id: 'finger', title: 'Finger', icon: 'finger.svg' },
  { id: 'schulter', title: 'Schulter', icon: 'schulter.svg' },
  { id: 'daumen', title: 'Daumen', icon: 'finger.svg' },
  
  // Zeile 3: Achsel, Handrücken, Handfläche
  { id: 'achsel', title: 'Achsel', icon: 'achsel.svg' },
  { id: 'handruecken', title: 'Handrücken', icon: 'handrücken.svg' },
  { id: 'handflaeche', title: 'Handfläche', icon: 'handfläche.svg' }
]

// Unterregionen für Torso (vollständig mit korrekten Icons)
export const torsoSubRegions = [
  // Zeile 1: Brust, Rücken, Schulterblatt, Wirbelsäule
  { id: 'brust', title: 'Brust', icon: 'brust.svg' },
  { id: 'ruecken', title: 'Rücken', icon: 'schulterblätter.svg' },
  { id: 'schulterblatt', title: 'Schulterblatt', icon: 'schulterblätter.svg' },
  { id: 'wirbelsaeule', title: 'Wirbelsäule', icon: 'wirbelsaule.svg' },
  
  // Zeile 2: Bauch, Lunge, Herz, Magen
  { id: 'bauch', title: 'Bauch', icon: 'magen.svg' },
  { id: 'lunge', title: 'Lunge', icon: 'lunge.svg' },
  { id: 'herz', title: 'Herz', icon: 'anatomisches-herz.svg' },
  { id: 'magen', title: 'Magen', icon: 'magen.svg' },
  
  // Zeile 3: Leber, Niere, Blase, Zurück
  { id: 'leber', title: 'Leber', icon: 'magen.svg' },
  { id: 'niere', title: 'Niere', icon: 'magen.svg' },
  { id: 'blase', title: 'Blase', icon: 'blase.svg' },
  { id: 'zurueck', title: 'zurück', icon: 'zurueck.svg' }
]

// Schmerzstufen mit numerischen und verbalen Labels
export const painLevels = [
  { id: 1, title: 'Eins', description: 'kein Schmerz', level: 1 },
  { id: 2, title: 'Zwei', description: 'sehr leicht', level: 2 },
  { id: 3, title: 'Drei', description: 'leicht', level: 3 },
  { id: 4, title: 'Vier', description: 'leicht bis mäßig', level: 4 },
  { id: 5, title: 'Fünf', description: 'mäßig', level: 5 },
  { id: 6, title: 'Sechs', description: 'mäßig bis stark', level: 6 },
  { id: 7, title: 'Sieben', description: 'stark', level: 7 },
  { id: 8, title: 'Acht', description: 'sehr stark', level: 8 },
  { id: 9, title: 'Neun', description: 'extrem stark', level: 9 },
  { id: 10, title: 'Zehn', description: 'unerträglich', level: 10 }
]

export function usePainDialogFlow() {
  const settingsStore = useSettingsStore()
  const faceRecognition = useFaceRecognition()

  // Zustand der Dialog-Maschine
  const currentState = ref<PainDialogState>('mainView')
  const currentTileIndex = ref(0)
  const selectedMainRegion = ref<string | null>(null)
  const selectedSubRegion = ref<string | null>(null)
  const selectedPainLevel = ref<number | null>(null)

  // TTS removed

  // Aktuelle Items basierend auf Zustand
  const currentItems = computed(() => {
    switch (currentState.value) {
      case 'mainView':
        return mainRegions
      case 'subRegionView':
        if (selectedMainRegion.value === 'kopf') return kopfSubRegions
        if (selectedMainRegion.value === 'beine') return beineSubRegions
        if (selectedMainRegion.value === 'arme') return armeSubRegions
        if (selectedMainRegion.value === 'torso') return torsoSubRegions
        return []
      case 'painScaleView':
        return painLevels
      default:
        return []
    }
  })

  // Aktueller Titel basierend auf Zustand
  const currentTitle = computed(() => {
    switch (currentState.value) {
      case 'mainView':
        return 'Wo haben Sie Schmerzen?'
      case 'subRegionView':
        const region = mainRegions.find(r => r.id === selectedMainRegion.value)
        return region ? `Wählen Sie einen ${region.title}bereich aus.` : 'Wählen Sie einen Bereich aus.'
      case 'painScaleView':
        return 'Wie stark sind Ihre Schmerzen?'
      case 'confirmation':
        return 'Bestätigung'
      default:
        return ''
    }
  })

  // Aktuelles Item
  const currentItem = computed(() => {
    return currentItems.value[currentTileIndex.value] || null
  })

  // Bestätigungstext
  const confirmationText = computed(() => {
    if (!selectedSubRegion.value || !selectedPainLevel.value) return ''
    
    const subRegion = currentItems.value.find(item => item.id === selectedSubRegion.value)
    const painLevel = painLevels.find(level => level.level === selectedPainLevel.value)
    
    return `Der Patient hat ${subRegion?.title}schmerzen Level ${selectedPainLevel.value}, ${painLevel?.description}.`
  })

  // Type-safe getters für verschiedene Item-Typen
  const getItemId = (item: any) => item?.id || ''
  const getItemTitle = (item: any) => item?.title || ''
  const getItemDescription = (item: any) => item?.description || ''
  const getItemIcon = (item: any) => item?.icon || ''
  const getItemLevel = (item: any) => item?.level || null

  // TTS-Funktion
  const speakText = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!isTTSEnabled.value || isSpeaking.value) {
        resolve()
        return
      }

      const speechSynthesis = window.speechSynthesis
      if (!speechSynthesis) {
        resolve()
        return
      }

      speechSynthesis.cancel()
      isSpeaking.value = true

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'de-DE'
      utterance.rate = 1.0
      utterance.volume = 1.0

      utterance.onend = () => {
        isSpeaking.value = false
        resolve()
      }

      utterance.onerror = () => {
        isSpeaking.value = false
        resolve()
      }

      speechSynthesis.speak(utterance)
    })
  }

  // Auto-Modus starten
  const startAutoMode = async () => {
    if (currentItems.value.length === 0) return

    // Spreche zuerst den Titel
    await speakText(currentTitle.value)
    
    // Warte 3 Sekunden, dann starte das Durchlaufen
    setTimeout(async () => {
      const cycleTiles = async () => {
        if (currentState.value === 'confirmation') return
        
        const currentItem = currentItems.value[currentTileIndex.value]
        if (currentItem) {
          await speakText(getItemTitle(currentItem))
        }
        
        currentTileIndex.value = (currentTileIndex.value + 1) % currentItems.value.length
        
        setTimeout(cycleTiles, 3000)
      }
      
      await cycleTiles()
    }, 3000)
  }

  // Hauptregion auswählen
  const selectMainRegion = async (regionId: string) => {
    selectedMainRegion.value = regionId
    currentState.value = 'subRegionView'
    currentTileIndex.value = 0
    
    await speakText(currentTitle.value)
    setTimeout(startAutoMode, 3000)
  }

  // Unterregion auswählen
  const selectSubRegion = async (subRegionId: string) => {
    if (subRegionId === 'zurueck') {
      currentState.value = 'mainView'
      selectedMainRegion.value = null
      currentTileIndex.value = 0
      await speakText(currentTitle.value)
      setTimeout(startAutoMode, 3000)
      return
    }
    
    selectedSubRegion.value = subRegionId
    currentState.value = 'painScaleView'
    currentTileIndex.value = 0
    
    await speakText(currentTitle.value)
    setTimeout(startAutoMode, 3000)
  }

  // Schmerzlevel auswählen
  const selectPainLevel = async (level: number) => {
    selectedPainLevel.value = level
    currentState.value = 'confirmation'
    
    await speakText(confirmationText.value)
    
    // Nach 5 Sekunden zurück zum Start
    setTimeout(() => {
      currentState.value = 'mainView'
      selectedMainRegion.value = null
      selectedSubRegion.value = null
      selectedPainLevel.value = null
      currentTileIndex.value = 0
      
      speakText(currentTitle.value)
      setTimeout(startAutoMode, 3000)
    }, 5000)
  }

  // Blink-Handler
  const handleBlink = () => {
    if (currentState.value === 'mainView') {
      const region = mainRegions[currentTileIndex.value]
      if (region) selectMainRegion(region.id)
    } else if (currentState.value === 'subRegionView') {
      const subRegion = currentItems.value[currentTileIndex.value]
      if (subRegion) selectSubRegion(subRegion.id)
    } else if (currentState.value === 'painScaleView') {
      const painLevel = painLevels[currentTileIndex.value]
      if (painLevel) selectPainLevel(painLevel.level)
    }
  }

  // Rechte Maustaste als Blink-Ersatz
  const handleRightClick = (event: MouseEvent) => {
    event.preventDefault()
    handleBlink()
  }

  // Volume Toggle Handler
  const handleVolumeToggle = (event: CustomEvent) => {
    if (!event.detail.enabled) {
      window.speechSynthesis.cancel()
    }
  }

  // Lifecycle
  onMounted(() => {
    if (!faceRecognition.isActive.value) {
      faceRecognition.start()
    }
    
    startAutoMode()
    
    document.addEventListener('contextmenu', handleRightClick)
    window.addEventListener('volumeToggle', handleVolumeToggle as EventListener)
  })

  onUnmounted(() => {
    document.removeEventListener('contextmenu', handleRightClick)
    window.removeEventListener('volumeToggle', handleVolumeToggle as EventListener)
    
    if (faceRecognition.isActive.value) {
      faceRecognition.stop()
    }
  })

  return {
    // State
    currentState,
    currentTileIndex,
    selectedMainRegion,
    selectedSubRegion,
    selectedPainLevel,
    
    // Computed
    currentItems,
    currentTitle,
    currentItem,
    confirmationText,
    isTTSEnabled,
    
    // Getters
    getItemId,
    getItemTitle,
    getItemDescription,
    getItemIcon,
    getItemLevel,
    
    // Actions
    selectMainRegion,
    selectSubRegion,
    selectPainLevel,
    handleBlink,
    handleRightClick,
    speakText,
    startAutoMode
  }
}
