import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '../../settings/stores/settings'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { 
  mainRegions,
  kopfSubRegions, 
  beineSubRegions, 
  armeSubRegions, 
  torsoSubRegions,
  painLevels
} from '../data/painAssessmentData'
import { generatePainConfirmationText } from '../data/painAssessmentGrammar'

// Zustände der Schmerzen-Dialog-Maschine
export type PainDialogState = 'mainView' | 'subRegionView' | 'painScaleView' | 'confirmation'

// Exportiere für externe Nutzung
export { mainRegions, painLevels }

export function usePainDialogFlow() {
  const settingsStore = useSettingsStore()
  const faceRecognition = useFaceRecognition()

  // Zustand der Dialog-Maschine
  const currentState = ref<PainDialogState>('mainView')
  const currentTileIndex = ref(0)
  const selectedMainRegion = ref<string | null>(null)
  const selectedSubRegion = ref<string | null>(null)
  const selectedPainLevel = ref<number | null>(null)

  // ✅ FIX 1: isTTSEnabled und isSpeaking definieren
  const isTTSEnabled = computed(() => settingsStore.settings.voiceEnabled ?? true)
  const isSpeaking = ref(false)

  // Timer-Manager für Auto-Mode (verhindert Memory-Leaks)
  let autoModeTimer: number | null = null
  let cycleTimer: number | null = null
  
  // ✅ BUG A: AutoMode-Guard gegen mehrfache Starts
  let autoModeRunning = false
  
  // Referenz zu aktuellen Items für Race-Condition-Check
  let currentItemsSnapshot: any[] = []
  // ✅ BUG D: Gesprochener Index für handleBlink
  const spokenIndex = ref(0)

  // ✅ FIX 3: Timer-Manager Funktionen
  const clearAllTimers = () => {
    if (autoModeTimer) {
      clearTimeout(autoModeTimer)
      autoModeTimer = null
    }
    if (cycleTimer) {
      clearTimeout(cycleTimer)
      cycleTimer = null
    }
    // ✅ BUG A: Setze AutoMode-Flag zurück
    autoModeRunning = false
  }

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
        const region = mainRegions.find((r: any) => r.id === selectedMainRegion.value)
        if (!region) return 'Wählen Sie einen Bereich aus.'
        
        // ✅ Korrekte deutsche Grammatik für Singular/Plural
        // Singular: "im Kopf", "im Torso"
        // Plural: "an den Beinen", "an den Armen"
        const pluralRegions = ['beine', 'arme'] // Plural-Regionen
        const isPlural = pluralRegions.includes(region.id)
        
        if (isPlural) {
          // Plural-Form: "an den Beinen", "an den Armen"
          const pluralForm = region.id === 'beine' ? 'Beinen' : 'Armen'
          return `Wählen Sie einen Bereich an den ${pluralForm} aus.`
        } else {
          // Singular-Form: "im Kopf", "im Torso"
          return `Wählen Sie einen Bereich im ${region.title} aus.`
        }
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

  // ✅ Verbesserte Bestätigungstext mit vollständigem Grammatik-System
  const confirmationText = computed(() => {
    if (!selectedSubRegion.value || !selectedPainLevel.value) return ''
    
    // Suche in allen definierten Sub-Region-Arrays
    const allSubRegions = [
      ...kopfSubRegions,
      ...beineSubRegions,
      ...armeSubRegions,
      ...torsoSubRegions
    ]
    
    const subRegion = allSubRegions.find(item => item.id === selectedSubRegion.value)
    const painLevel = painLevels.find((level: any) => level.level === selectedPainLevel.value)
    
    if (!subRegion || !painLevel) return ''
    
    // Verwende das vollständige Grammatik-System für korrekte deutsche Grammatik
    return generatePainConfirmationText(
      selectedSubRegion.value,
      subRegion.title,
      selectedPainLevel.value,
      painLevel.description
    )
  })

  // Type-safe getters für verschiedene Item-Typen
  const getItemId = (item: any) => item?.id || ''
  const getItemTitle = (item: any) => item?.title || ''
  const getItemDescription = (item: any) => item?.description || ''
  const getItemIcon = (item: any) => item?.icon || ''
  const getItemLevel = (item: any) => item?.level || null

  // ✅ BUG B: Verbesserte TTS-Funktion mit Deadlock-Schutz
  const speakText = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      // ✅ BUG B: Auch bei deaktiviertem TTS kurz warten (für Timing-Konsistenz)
      if (!isTTSEnabled.value) {
        // Warte kurz, damit AutoMode-Timing konsistent bleibt
        setTimeout(() => resolve(), 500)
        return
      }

      if (isSpeaking.value) {
        resolve()
        return
      }

      const speechSynthesis = window.speechSynthesis
      if (!speechSynthesis) {
        setTimeout(() => resolve(), 500)
        return
      }

      speechSynthesis.cancel()
      isSpeaking.value = true

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'de-DE'
      utterance.rate = 1.0
      utterance.volume = 1.0

      // ✅ BUG B: Timeout-Fallback für hängende TTS
      const timeoutId = setTimeout(() => {
        speechSynthesis.cancel()
        isSpeaking.value = false
        resolve()
      }, 10000) // 10 Sekunden Timeout

      utterance.onend = () => {
        clearTimeout(timeoutId)
        isSpeaking.value = false
        resolve()
      }

      utterance.onerror = () => {
        clearTimeout(timeoutId)
        isSpeaking.value = false
        resolve()
      }

      speechSynthesis.speak(utterance)
    })
  }

  // ✅ BUG A: Refactored Auto-Modus mit Guard gegen mehrfache Starts
  const startAutoMode = async () => {
    // ✅ BUG A: Prüfe ob AutoMode bereits läuft
    if (autoModeRunning) {
      console.warn('AutoMode already running, ignoring duplicate start')
      return
    }
    
    // Stoppe alle laufenden Timer
    clearAllTimers()
    
    if (currentItems.value.length === 0) return

    // ✅ BUG A: Setze Flag
    autoModeRunning = true
    
    // ✅ BUG C: Speichere Snapshot der aktuellen Items und State
    currentItemsSnapshot = [...currentItems.value]
    const snapshotLength = currentItemsSnapshot.length
    const snapshotState = currentState.value

    // Spreche zuerst den Titel
    await speakText(currentTitle.value)
    
    // ✅ BUG C: Prüfe ob Items sich geändert haben (Vergleich über Länge und State)
    if (currentItems.value.length !== snapshotLength || 
        currentState.value !== snapshotState ||
        currentState.value === 'confirmation') {
      autoModeRunning = false
      return
    }
    
    // Warte 3 Sekunden, dann starte das Durchlaufen der Tiles
    autoModeTimer = window.setTimeout(() => {
      // ✅ BUG C: Prüfe nochmal vor Start
      if (currentItems.value.length !== snapshotLength || 
          currentState.value !== snapshotState ||
          currentState.value === 'confirmation') {
        autoModeRunning = false
        return
      }
      // Starte den ersten Zyklus
      scheduleNextCycle()
    }, 3000)
  }

  // ✅ BUG C & D: Verbesserter Cycle-Manager mit Race-Condition-Schutz
  const scheduleNextCycle = () => {
    // ✅ BUG C: Prüfe ob State geändert wurde oder Items sich geändert haben
    const snapshotLength = currentItemsSnapshot.length
    
    // Prüfe zuerst auf confirmation State (TypeScript-safe)
    if (currentState.value === 'confirmation' || 
        currentItems.value.length === 0 ||
        currentItems.value.length !== snapshotLength) {
      autoModeRunning = false
      return
    }
    
    // ✅ BUG D: Speichere gesprochenen Index
    spokenIndex.value = currentTileIndex.value
    
    // Spreche aktuelles Item
    const currentItem = currentItems.value[currentTileIndex.value]
    if (currentItem) {
      speakText(getItemTitle(currentItem)).then(() => {
        // ✅ BUG C: Prüfe ob Items sich während TTS geändert haben
        // Prüfe zuerst auf confirmation (TypeScript-safe)
        if (currentState.value === 'confirmation' ||
            currentItems.value.length !== snapshotLength || 
            currentItems.value.length === 0) {
          autoModeRunning = false
          return
        }
        
        // Wechsle zum nächsten Item
        currentTileIndex.value = (currentTileIndex.value + 1) % currentItems.value.length
        // ✅ BUG D: Aktualisiere auch spokenIndex
        spokenIndex.value = currentTileIndex.value
        
        // Plane nächsten Zyklus - aber nur wenn noch im richtigen State
        // (confirmation wurde bereits oben abgefangen, daher ist hier nur noch main/sub/pain möglich)
        if (currentItems.value.length === 0 ||
            currentItems.value.length !== snapshotLength) {
          autoModeRunning = false
        } else {
          // Nur wenn length und snapshot übereinstimmen → weiter mit Cycle
          cycleTimer = window.setTimeout(scheduleNextCycle, 3000)
        }
      })
    } else {
      autoModeRunning = false
    }
  }

  // Hauptregion auswählen
  const selectMainRegion = async (regionId: string) => {
    // ✅ BUG A & C: Stoppe alle Timer bevor State-Änderung
    clearAllTimers()
    
    selectedMainRegion.value = regionId
    currentState.value = 'subRegionView'
    currentTileIndex.value = 0
    spokenIndex.value = 0
    
    // ✅ BUG C: Aktualisiere Snapshot
    currentItemsSnapshot = []
    
    await speakText(currentTitle.value)
    
    // ✅ BUG C: Aktualisiere Snapshot nach State-Änderung
    currentItemsSnapshot = [...currentItems.value]
    
    // Starte Auto-Mode nach 3 Sekunden
    autoModeTimer = window.setTimeout(startAutoMode, 3000)
  }

  // Unterregion auswählen
  const selectSubRegion = async (subRegionId: string) => {
    // ✅ BUG A & C: Stoppe alle Timer bevor State-Änderung
    clearAllTimers()
    
    // ✅ BUG E: Robustes zurueck-Handling
    if (subRegionId === 'zurueck') {
      currentState.value = 'mainView'
      selectedMainRegion.value = null
      currentTileIndex.value = 0
      spokenIndex.value = 0
      // ✅ BUG C: Aktualisiere Snapshot
      currentItemsSnapshot = [...mainRegions]
      await speakText(currentTitle.value)
      autoModeTimer = window.setTimeout(startAutoMode, 3000)
      return
    }
    
    selectedSubRegion.value = subRegionId
    currentState.value = 'painScaleView'
    currentTileIndex.value = 0
    spokenIndex.value = 0
    
    // ✅ BUG C: Aktualisiere Snapshot
    currentItemsSnapshot = []
    
    await speakText(currentTitle.value)
    
    // ✅ BUG C: Aktualisiere Snapshot nach State-Änderung
    currentItemsSnapshot = [...currentItems.value]
    
    // Starte Auto-Mode nach 3 Sekunden
    autoModeTimer = window.setTimeout(startAutoMode, 3000)
  }

  // Schmerzlevel auswählen
  const selectPainLevel = async (level: number) => {
    // ✅ BUG A & C: Stoppe alle Timer bevor State-Änderung
    clearAllTimers()
    
    selectedPainLevel.value = level
    currentState.value = 'confirmation'
    
    // ✅ BUG F: Fallback wenn confirmationText leer ist
    const textToSpeak = confirmationText.value || 'Ihre Angabe wurde gespeichert.'
    await speakText(textToSpeak)
    
    // Nach 5 Sekunden zurück zum Start
    autoModeTimer = window.setTimeout(() => {
      clearAllTimers() // Cleare nochmal für Sicherheit
      
      currentState.value = 'mainView'
      selectedMainRegion.value = null
      selectedSubRegion.value = null
      selectedPainLevel.value = null
      currentTileIndex.value = 0
      spokenIndex.value = 0
      
      // ✅ BUG C: Aktualisiere Snapshot
      currentItemsSnapshot = [...mainRegions]
      
      speakText(currentTitle.value)
      autoModeTimer = window.setTimeout(startAutoMode, 3000)
    }, 5000)
  }

  // ✅ BUG D & E: Verbesserte Blink-Handler mit Race-Condition-Schutz und robustem zurueck-Handling
  const handleBlink = () => {
    const items = currentItems.value
    if (items.length === 0) return
    
    // ✅ BUG D: Verwende spokenIndex statt currentTileIndex (verhindert Race Condition)
    const indexToUse = spokenIndex.value >= 0 && spokenIndex.value < items.length 
      ? spokenIndex.value 
      : currentTileIndex.value
    
    const currentItem = items[indexToUse]
    if (!currentItem) return
    
    // ✅ BUG E: Robustes zurueck-Handling für alle States
    if (currentItem.id === 'zurueck') {
      // Zurück ist nur erlaubt, wenn nicht in mainView
      if (currentState.value === 'subRegionView') {
        selectSubRegion('zurueck')
      }
      // In mainView und painScaleView: zurueck wird ignoriert
      return
    }
    
    // ✅ Randfall: "zurueck" in mainView sollte nicht ausgewählt werden
    if (currentState.value === 'mainView') {
      if (typeof currentItem.id === 'string' && currentItem.id !== 'zurueck') {
        selectMainRegion(currentItem.id)
      }
    } else if (currentState.value === 'subRegionView') {
      // Sub regions haben id als string
      if (typeof currentItem.id === 'string') {
        selectSubRegion(currentItem.id)
      }
    } else if (currentState.value === 'painScaleView') {
      // Pain levels haben level property
      // ✅ Konsistent: verwende immer 'level', nicht 'id'
      if ('level' in currentItem && typeof currentItem.level === 'number') {
        selectPainLevel(currentItem.level)
      } else if ('id' in currentItem && typeof currentItem.id === 'number') {
        // Fallback: falls id als number verwendet wird
        selectPainLevel(currentItem.id)
      }
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
      isSpeaking.value = false
    }
  }

  // Lifecycle
  onMounted(() => {
    if (!faceRecognition.isActive.value) {
      faceRecognition.start()
    }
    
    // ✅ BUG C: Initialisiere Snapshot
    currentItemsSnapshot = [...mainRegions]
    
    startAutoMode()
    
    // ✅ Performance: Event-Listener mit Optionen
    document.addEventListener('contextmenu', handleRightClick, { passive: false })
    window.addEventListener('volumeToggle', handleVolumeToggle as EventListener)
  })

  onUnmounted(() => {
    // Stoppe alle Timer beim Unmount
    clearAllTimers()
    
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
    startAutoMode,
    
    // Timer-Manager (für externe Nutzung)
    clearAllTimers
  }
}
