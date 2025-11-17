// useEnvironmentDialogMachine.ts - Central State Machine for Environment Dialog
// ✅ MIT CANCELLATION TOKEN - Verhindert Race Conditions und laufende Promises nach Navigation

import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useTTSWithCancellation } from './useTTSWithCancellation'
import { useAutoMode, type AutoModeConfig } from '../../../shared/composables/useAutoMode'
import { useEnvironmentDictionary } from './useEnvironmentDictionary'
import { useSettingsStore } from '../../settings/stores/settings'
import type { UmgebungRegion, UmgebungSubRegion, UmgebungSubSubRegion } from '../data/environmentDialogData'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'
import { useDialogTimerTracking } from '../../../shared/composables/useDialogTimerTracking'

// ===== CONSTANTS =====
const TIMER_DELAYS = {
  AUTO_MODE_START: 3000,
  CONFIRMATION_RESET: 3000
} as const

export type UmgebungDialogState = 'mainView' | 'subRegionView' | 'subSubRegionView' | 'confirmation'

export function useEnvironmentDialogMachine() {
  const router = useRouter()
  const dict = useEnvironmentDictionary()
  const settingsStore = useSettingsStore()

  // ===== CANCELLATION TOKEN =====
  const isCancelled = ref(false)
  
  const cancel = () => {
    console.log('EnvironmentDialog: Cancellation requested')
    isCancelled.value = true
    cleanupTimers()
    window.speechSynthesis?.cancel()
  }
  
  const checkCancelled = () => {
    if (isCancelled.value) {
      throw new Error('Operation cancelled')
    }
  }

  // ✅ TTS mit Cancellation Support
  const tts = useTTSWithCancellation(() => isCancelled.value)

  // State
  const state = ref<UmgebungDialogState>('mainView')
  const mainRegionId = ref<string | null>(null)
  const subRegionId = ref<string | null>(null)
  const subSubRegionId = ref<string | null>(null)

  // Computed: Aktuelle Items basierend auf State
  const items = computed(() => {
    switch (state.value) {
      case 'mainView':
        return dict.mainRegions
      case 'subRegionView':
        return dict.getSubRegions(mainRegionId.value)
      case 'subSubRegionView':
        return dict.getSubSubRegions(subRegionId.value)
      default:
        return []
    }
  })

  // Computed: Aktueller Titel basierend auf State
  const title = computed(() => {
    switch (state.value) {
      case 'mainView':
        return 'Was möchten Sie an ihrer Umgebung verändern?'
      case 'subRegionView':
        return dict.getSubRegionViewTitle(mainRegionId.value)
      case 'subSubRegionView': {
        const subRegion = items.value.find((item: any) => item.id === subRegionId.value) as UmgebungSubRegion | undefined
        return dict.getSubSubRegionViewTitle(subRegion || null)
      }
      case 'confirmation':
        return 'Auswahl erfasst'
      default:
        return ''
    }
  })

  // Computed: Confirmation Text
  const confirmationText = computed(() => {
    const subRegions = dict.getSubRegions(mainRegionId.value)
    const subRegion = subRegions.find(r => r.id === subRegionId.value)
    const subSubRegions = dict.getSubSubRegions(subRegionId.value)
    const verb = subSubRegions.find(v => v.id === subSubRegionId.value)
    
    return dict.generateConfirmation(subRegion || null, verb || null)
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
    dialogName: 'UmgebungDialog'
  })

  // ===== HELPER: START AUTO MODE =====
  /**
   * Startet AutoMode nach Delay mit allen Checks
   * ✅ ATOMIC: Alle Checks erfolgen direkt vor autoMode.start()
   * ✅ WICHTIG: Setzt Index explizit auf 0, damit Karussell bei Index 0 startet
   */
  function scheduleAutoModeStart(expectedState: UmgebungDialogState, delay: number = TIMER_DELAYS.AUTO_MODE_START) {
    // ✅ Index explizit auf 0 setzen, damit Karussell bei Index 0 startet
    autoMode.index.value = 0
    
    scheduleTimer(async () => {
      checkCancelled()
      
      if (state.value === expectedState) {
        await nextTick()
        checkCancelled()
        
        // ✅ Check EINMAL, direkt vor Nutzung
        if (items.value.length > 0 && state.value === expectedState) {
          // ✅ Index nochmal auf 0 setzen, um sicherzustellen, dass Karussell bei 0 startet
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
      console.log(`EnvironmentDialog: ${operation} cancelled`)
    } else {
      console.error(`EnvironmentDialog: ${operation} error:`, error)
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
      subSubRegionId.value = null

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
        subSubRegionId.value = null

        await tts.speak(title.value)
        scheduleAutoModeStart('mainView')
        return
      }

      autoMode.stop()
      subRegionId.value = id
      state.value = 'subSubRegionView'
      subSubRegionId.value = null

      await tts.speak(title.value)
      scheduleAutoModeStart('subSubRegionView')
      
    } catch (error) {
      handleOperationError('selectSubRegion', error)
    }
  }

  /**
   * Sub-Sub-Region (Verb) auswählen
   */
  async function selectSubSubRegion(id: string) {
    try {
      checkCancelled()
      
      if (id === dict.ID_BACK) {
        autoMode.stop()
        state.value = 'subRegionView'
        subRegionId.value = null
        subSubRegionId.value = null

        await tts.speak(title.value)
        scheduleAutoModeStart('subRegionView')
        return
      }

      autoMode.stop()
      subSubRegionId.value = id
      state.value = 'confirmation'

      await tts.speak(confirmationText.value)
      
      scheduleTimer(() => {
        checkCancelled()
        if (state.value === 'confirmation') {
          resetToMainView()
        }
      }, TIMER_DELAYS.CONFIRMATION_RESET)
      
    } catch (error) {
      handleOperationError('selectSubSubRegion', error)
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
      subSubRegionId.value = null

      await tts.speak(title.value)
      scheduleAutoModeStart('mainView')
      
    } catch (error) {
      handleOperationError('resetToMainView', error)
    }
  }

  /**
   * Stoppt alle Timer und verhindert weitere AutoMode-Starts
   * ✅ MIT CANCELLATION TOKEN - setzt isCancelled = true
   * ✅ cleanupTimers() stoppt bereits autoMode durch onCleanup
   */
  function cleanup() {
    console.log('EnvironmentDialog: Cleaning up')
    
    // ✅ ZUERST: Cancellation Flag setzen
    isCancelled.value = true
    
    // ✅ DANN: Alle Ressourcen freigeben
    cleanupTimers() // Stoppt autoMode durch onCleanup
    tts.cancel() // TTS muss explizit gestoppt werden
  }

  /**
   * Zurück zur Haupt-App navigieren
   * ✅ cleanup() macht bereits alles nötige
   */
  function goBack() {
    console.log('UmgebungDialog: goBack() - Cleanup und Navigation')
    
    cleanup() // Macht: isCancelled = true, cleanupTimers (autoMode.stop über onCleanup)
    
    // ✅ Globale Services stoppen (cleanup() stoppt nur lokale)
    simpleFlowController.stopTTS()
    simpleFlowController.stopAutoMode()
    simpleFlowController.setActiveView('')
    
    router.push('/app').catch((error) => {
      console.error('UmgebungDialog: Navigation zu /app fehlgeschlagen:', error)
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
        case 'subSubRegionView':
          selectSubSubRegion(dict.ID_BACK)
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
      case 'subSubRegionView':
        selectSubSubRegion(currentItem.id)
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
    subSubRegionId,
    
    // Computed
    items,
    title,
    confirmationText,
    autoMode,
    
    // Actions
    selectMainRegion,
    selectSubRegion,
    selectSubSubRegion,
    resetToMainView,
    goBack,
    handleBlink,
    cleanup
  }
}

