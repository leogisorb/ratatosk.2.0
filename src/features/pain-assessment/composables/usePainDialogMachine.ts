// usePainDialogMachine.ts - Central State Machine for Pain Dialog
// ✅ MIT CANCELLATION TOKEN - Verhindert Race Conditions und laufende Promises nach Navigation

import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useTTSWithCancellation } from './useTTSWithCancellation'
import { useAutoMode, type AutoModeConfig } from '../../../shared/composables/useAutoMode'
import { usePainDictionary } from './usePainDictionary'
import { useSettingsStore } from '../../settings/stores/settings'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'
import { useDialogTimerTracking } from '../../../shared/composables/useDialogTimerTracking'

// ===== CONSTANTS =====
const TIMER_DELAYS = {
  AUTO_MODE_START: 3000,
  CONFIRMATION_RESET: 5000
} as const

export type PainDialogState = 'mainView' | 'subRegionView' | 'painScaleView' | 'confirmation'

export function usePainDialogMachine() {
  const router = useRouter()
  const dict = usePainDictionary()
  const settingsStore = useSettingsStore()

  // ===== CANCELLATION TOKEN =====
  const isCancelled = ref(false)
  
  const cancel = () => {
    console.log('PainDialog: Cancellation requested')
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

  // ✅ State
  const state = ref<PainDialogState>('mainView')
  const mainRegionId = ref<string | null>(null)
  const subRegionId = ref<string | null>(null)
  const painLevel = ref<number | null>(null)

  // Computed: Aktuelle Items basierend auf State
  const items = computed(() => {
    switch (state.value) {
      case 'mainView':
        return dict.mainRegions as unknown as any[]
      case 'subRegionView':
        return dict.getSubRegions(mainRegionId.value) as unknown as any[]
      case 'painScaleView':
        return dict.painLevels as unknown as any[]
      default:
        return [] as any[]
    }
  })

  // Computed: Aktueller Titel basierend auf State
  const title = computed(() => {
    switch (state.value) {
      case 'mainView':
        return 'Wo haben Sie Schmerzen?'
      case 'subRegionView':
        return dict.getSubRegionViewTitle(mainRegionId.value)
      case 'painScaleView':
        return 'Wie stark sind Ihre Schmerzen?'
      case 'confirmation':
        return 'Bestätigung'
      default:
        return ''
    }
  })

  // Computed: Confirmation Text
  const confirmationText = computed(() => {
    return dict.generateConfirmation(subRegionId.value, painLevel.value)
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
    dialogName: 'PainDialog'
  })

  // ===== HELPER: START AUTO MODE =====
  /**
   * Startet AutoMode nach Delay mit allen Checks
   * ✅ ATOMIC: Alle Checks erfolgen direkt vor autoMode.start()
   * ✅ WICHTIG: Setzt Index explizit auf 0, damit Karussell bei Index 0 startet
   */
  function scheduleAutoModeStart(expectedState: PainDialogState, delay: number = TIMER_DELAYS.AUTO_MODE_START) {
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
      console.log(`PainDialog: ${operation} cancelled`)
    } else {
      console.error(`PainDialog: ${operation} error:`, error)
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
      
      // ✅ Blockiere "zurueck" in mainView
      if (id === 'zurueck') return
      
      autoMode.stop()
      mainRegionId.value = id
      state.value = 'subRegionView'
      subRegionId.value = null
      painLevel.value = null

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
      
      if (id === 'zurueck') {
        autoMode.stop()
        mainRegionId.value = null
        state.value = 'mainView'
        subRegionId.value = null
        painLevel.value = null

        await tts.speak(title.value)
        scheduleAutoModeStart('mainView')
        return
      }

      autoMode.stop()
      subRegionId.value = id
      state.value = 'painScaleView'
      painLevel.value = null

      await tts.speak(title.value)
      scheduleAutoModeStart('painScaleView')
      
    } catch (error) {
      handleOperationError('selectSubRegion', error)
    }
  }

  /**
   * Schmerzlevel auswählen
   */
  async function selectPainLevel(level: number) {
    try {
      checkCancelled()
      
      autoMode.stop()
      painLevel.value = level
      state.value = 'confirmation'

      const textToSpeak = confirmationText.value || 'Ihre Angabe wurde gespeichert.'
      await tts.speak(textToSpeak)
      
      scheduleTimer(() => {
        checkCancelled()
        if (state.value === 'confirmation') {
          resetToMainView()
        }
      }, TIMER_DELAYS.CONFIRMATION_RESET)
      
    } catch (error) {
      handleOperationError('selectPainLevel', error)
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
      painLevel.value = null

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
    console.log('PainDialog: Cleaning up')
    
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
    console.log('PainDialog: goBack() - Cleanup und Navigation')
    
    cleanup() // Macht: isCancelled = true, cleanupTimers (autoMode.stop über onCleanup)
    
    // ✅ Globale Services stoppen (cleanup() stoppt nur lokale)
    simpleFlowController.stopTTS()
    simpleFlowController.stopAutoMode()
    simpleFlowController.setActiveView('')
    
    router.push('/app').catch((error) => {
      console.error('PainDialog: Navigation zu /app fehlgeschlagen:', error)
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
    if (currentItem.id === 'zurueck') {
      switch (state.value) {
        case 'subRegionView':
          selectSubRegion('zurueck')
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
        if (typeof currentItem.id === 'string') {
          selectMainRegion(currentItem.id)
        }
        break
      case 'subRegionView':
        if (typeof currentItem.id === 'string') {
          selectSubRegion(currentItem.id)
        }
        break
      case 'painScaleView': {
        const item = currentItem as any
        if ('level' in item && typeof item.level === 'number') {
          selectPainLevel(item.level)
        } else if ('id' in item && typeof item.id === 'number') {
          selectPainLevel(item.id)
        }
        break
      }
      default:
        break
    }
  }

  return {
    // State
    state,
    mainRegionId,
    subRegionId,
    painLevel,
    
    // Computed
    items,
    title,
    confirmationText,
    autoMode,
    
    // Actions
    selectMainRegion,
    selectSubRegion,
    selectPainLevel,
    resetToMainView,
    goBack,
    handleBlink,
    cleanup
  }
}

