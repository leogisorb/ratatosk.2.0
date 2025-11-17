// State Machine für den Self Dialog
// Verwendet Cancellation Token um Race Conditions zu vermeiden

import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useTTSWithCancellation } from './useTTSWithCancellation'
import { useAutoMode, type AutoModeConfig } from '../../../shared/composables/useAutoMode'
import { useSelfDictionary } from './useSelfDictionary'
import { useSettingsStore } from '../../settings/stores/settings'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'
import { useDialogTimerTracking } from '../../../shared/composables/useDialogTimerTracking'

// ===== CONSTANTS =====
const TIMER_DELAYS = {
  AUTO_MODE_START: 3000,
  CONFIRMATION_RESET: 3000
} as const

export type IchDialogState = 'mainView' | 'subRegionView' | 'confirmation'

export function useSelfDialogMachine() {
  const router = useRouter()
  const dict = useSelfDictionary()
  const settingsStore = useSettingsStore()

  // ===== CANCELLATION TOKEN =====
  const isCancelled = ref(false)
  
  const cancel = () => {
    console.log('SelfDialog: Cancellation requested')
    isCancelled.value = true
    cleanupTimers()
    window.speechSynthesis?.cancel()
  }
  
  const checkCancelled = () => {
    if (isCancelled.value) {
      throw new Error('Operation cancelled')
    }
  }

  // TTS mit Unterstützung für Abbruch
  const tts = useTTSWithCancellation(() => isCancelled.value)

  // State
  const state = ref<IchDialogState>('mainView')
  const mainRegionId = ref<string | null>(null)
  const subRegionId = ref<string | null>(null)

  // Computed: Aktuelle Items basierend auf State
  const items = computed(() => {
    switch (state.value) {
      case 'mainView':
        return [...dict.mainRegions]
      case 'subRegionView':
        return [...dict.getSubRegions(mainRegionId.value)]
      default:
        return []
    }
  })

  // Computed: Aktueller Titel basierend auf State
  const title = computed(() => {
    switch (state.value) {
      case 'mainView':
        return 'Was möchten Sie machen?'
      case 'subRegionView':
        return dict.getSubRegionViewTitle(mainRegionId.value)
      case 'confirmation':
        return 'Auswahl erfasst'
      default:
        return ''
    }
  })

  // Computed: Confirmation Text
  const confirmationText = computed(() => {
    const subRegions = dict.getSubRegions(mainRegionId.value)
    const subRegion = subRegions.find(r => r.id === subRegionId.value) || null
    return dict.generateConfirmation(mainRegionId.value, subRegion)
  })

  // AutoMode Configuration
  const autoModeConfig: AutoModeConfig = {
    speak: tts.speak,
    getItems: () => items.value,
    getTitle: () => title.value,
    initialDelay: settingsStore.settings.leuchtdauer * 1000,
    cycleDelay: settingsStore.settings.leuchtdauer * 1000
  }

  const autoMode = useAutoMode(autoModeConfig)
  
  // Timer-Tracking mit Cleanup-Logik
  const { scheduleTimer, cleanup: cleanupTimers } = useDialogTimerTracking({
    onCleanup: () => {
      autoMode.stop()
    },
    dialogName: 'SelfDialog'
  })

  // ===== HELPER: START AUTO MODE =====
  // Startet AutoMode nach einer Verzögerung
  // Wichtig: Setzt den Index auf 0, damit das Karussell bei 0 startet
  function scheduleAutoModeStart(expectedState: IchDialogState, delay: number = TIMER_DELAYS.AUTO_MODE_START) {
    // Index auf 0 setzen
    autoMode.index.value = 0
    
    scheduleTimer(async () => {
      checkCancelled()
      
      if (state.value === expectedState) {
        await nextTick()
        checkCancelled()
        
        // Nochmal prüfen ob alles passt
        if (items.value.length > 0 && state.value === expectedState) {
          // Index nochmal auf 0 setzen für Sicherheit
          autoMode.index.value = 0
          autoMode.start(true)
        }
      }
    }, delay)
  }

  /**
   * Error Handler für Operationen
   */
  function handleOperationError(operation: string, error: unknown) {
    if (error instanceof Error && error.message.includes('cancelled')) {
      console.log(`SelfDialog: ${operation} cancelled`)
    } else {
      console.error(`SelfDialog: ${operation} error:`, error)
      // TODO: User-Feedback hinzufügen bei kritischen Fehlern
    }
  }

  // ===== ACTIONS =====

  /**
   * Haupt-Region auswählen
   */
  async function selectMainRegion(id: string) {
    try {
      checkCancelled()
      
      if (id === dict.ID_BACK) {
        goBack()
        return
      }

      autoMode.stop()
      mainRegionId.value = id
      state.value = 'subRegionView'
      subRegionId.value = null

      await tts.speak(title.value)
      scheduleAutoModeStart('subRegionView')
      
    } catch (error) {
      handleOperationError('selectMainRegion', error)
    }
  }

  /**
   * Sub-Region auswählen
   */
  async function selectSubRegion(id: string) {
    try {
      checkCancelled()
      
      if (id === dict.ID_BACK) {
        autoMode.stop()
        state.value = 'mainView'
        mainRegionId.value = null
        subRegionId.value = null

        await tts.speak(title.value)
        scheduleAutoModeStart('mainView')
        return
      }

      autoMode.stop()
      subRegionId.value = id
      state.value = 'confirmation'

      await tts.speak(confirmationText.value)
      
      scheduleTimer(() => {
        checkCancelled()
        if (state.value === 'confirmation') {
          resetToMainView()
        }
      }, TIMER_DELAYS.CONFIRMATION_RESET)
      
    } catch (error) {
      handleOperationError('selectSubRegion', error)
    }
  }

  /**
   * Zurück zur Haupt-View
   */
  async function resetToMainView() {
    try {
      checkCancelled()
      
      autoMode.stop()
      
      state.value = 'mainView'
      mainRegionId.value = null
      subRegionId.value = null

      await tts.speak(title.value)
      scheduleAutoModeStart('mainView')
      
    } catch (error) {
      handleOperationError('resetToMainView', error)
    }
  }

  // Stoppt alle Timer und verhindert weitere AutoMode-Starts
  // Setzt das Cancellation Flag und räumt alle Ressourcen auf
  function cleanup() {
    console.log('SelfDialog: Cleaning up')
    
    // Erst das Cancellation Flag setzen
    isCancelled.value = true
    
    // Dann alle Ressourcen freigeben
    cleanupTimers() // Stoppt autoMode durch onCleanup
    tts.cancel() // TTS muss explizit gestoppt werden
  }

  // Zurück zur Haupt-App navigieren
  function goBack() {
    console.log('SelfDialog: goBack() - Cleanup und Navigation')
    
    cleanup() // Räumt lokale Ressourcen auf
    
    // Globale Services auch stoppen
    simpleFlowController.stopTTS()
    simpleFlowController.stopAutoMode()
    simpleFlowController.setActiveView('')
    
    router.push('/app').catch((error) => {
      console.error('SelfDialog: Navigation zu /app fehlgeschlagen:', error)
    })
  }

  /**
   * Blink-Handler: Wählt aktive Kachel aus
   */
  function handleBlink() {
    const currentItems = items.value
    const currentIndex = autoMode.index.value

    if (currentIndex < 0 || currentIndex >= currentItems.length) {
      return
    }

    const currentItem = currentItems[currentIndex]
    if (!currentItem) {
      return
    }

    // Handle "zurück" Button
    if (currentItem.id === dict.ID_BACK) {
      switch (state.value) {
        case 'subRegionView':
          selectSubRegion(dict.ID_BACK)
          break
        default:
          goBack()
          break
      }
      return
    }

    // Auswahl basierend auf State
    switch (state.value) {
      case 'mainView':
        selectMainRegion(currentItem.id)
        break
      case 'subRegionView':
        selectSubRegion(currentItem.id)
        break
      default:
        break
    }
  }

  return {
    // State
    state,
    mainRegionId,
    subRegionId,
    
    // Computed
    items,
    title,
    confirmationText,
    autoMode,
    
    // Actions
    selectMainRegion,
    selectSubRegion,
    resetToMainView,
    goBack,
    handleBlink,
    cleanup
  }
}
