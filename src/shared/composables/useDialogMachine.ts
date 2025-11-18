/**
 * Shared Dialog State Machine
 * Used by: SelfDialog, EnvironmentDialog, (future dialogs)
 * 
 * Provides:
 * - Cancellation token support
 * - Auto mode coordination
 * - Navigation handling
 * - Confirmation flow
 */

import { ref, computed, nextTick, type Ref, type ComputedRef } from 'vue'
import { useRouter, type Router } from 'vue-router'
import { useTTSWithCancellation } from './useTTSWithCancellation'
import { useAutoMode, type AutoModeConfig } from './useAutoMode'
import { useSettingsStore } from '../../features/settings/stores/settings'
import { simpleFlowController } from '../../core/application/SimpleFlowController'
import { useDialogTimerTracking } from './useDialogTimerTracking'
import { TIMING } from '../constants/timing'
import { handleError, isCancellationError } from '../utils/errorHandling'

// ===== CONSTANTS =====
const TIMER_DELAYS = {
  AUTO_MODE_START: TIMING.DIALOG.AUTO_MODE_START_DELAY,
  CONFIRMATION_RESET: TIMING.DIALOG.CONFIRMATION_RESET_DELAY
} as const

// ===== TYPES =====
export interface DialogConfig<TState extends string, TItem> {
  dialogName: string
  states: readonly TState[]
  
  // Data providers
  getItems: (state: TState, ...ids: (string | null)[]) => readonly TItem[]
  getTitle: (state: TState, ...ids: (string | null)[]) => string
  getConfirmationText: (...ids: (string | null)[]) => string
  
  // Navigation
  backButtonId: string
  homeRoute: string
  
  // State transitions
  getNextState: (currentState: TState, itemId: string) => TState | null
  shouldConfirm: (state: TState) => boolean
}

export interface DialogMachine<TState extends string, TItem> {
  // State
  state: Ref<TState>
  stateIds: Ref<(string | null)[]>
  
  // Computed
  items: ComputedRef<readonly TItem[]>
  title: ComputedRef<string>
  confirmationText: ComputedRef<string>
  autoMode: ReturnType<typeof useAutoMode>
  
  // Actions
  selectItem: (id: string) => Promise<void>
  resetToInitialState: () => Promise<void>
  goBack: () => void
  handleBlink: () => void
  cleanup: () => void
}

// ===== SHARED HELPERS =====
function handleOperationError(dialogName: string, operation: string, error: unknown) {
  handleError(`${dialogName}: ${operation}`, error, { logLevel: 'error' })
}

// ===== MAIN FACTORY =====
export function useDialogMachine<TState extends string, TItem>(
  config: DialogConfig<TState, TItem>
): DialogMachine<TState, TItem> {
  
  const router = useRouter()
  const settingsStore = useSettingsStore()
  
  // ===== CANCELLATION TOKEN =====
  const isCancelled = ref(false)
  
  const checkCancelled = () => {
    if (isCancelled.value) {
      throw new Error('Operation cancelled')
    }
  }
  
  // ===== TTS =====
  const tts = useTTSWithCancellation(() => isCancelled.value)
  
  // ===== STATE =====
  const state = ref(config.states[0]) as Ref<TState>
  const stateIds = ref<(string | null)[]>([])
  
  // ===== COMPUTED =====
  const items = computed(() => {
    return config.getItems(state.value, ...stateIds.value)
  })
  
  const title = computed(() => {
    return config.getTitle(state.value, ...stateIds.value)
  })
  
  const confirmationText = computed(() => {
    return config.getConfirmationText(...stateIds.value)
  })
  
  // ===== AUTO MODE =====
  const autoModeConfig: AutoModeConfig = {
    speak: tts.speak,
    getItems: () => [...items.value], // Convert readonly array to mutable array
    getTitle: () => title.value,
    initialDelay: settingsStore.settings.leuchtdauer * 1000,
    cycleDelay: settingsStore.settings.leuchtdauer * 1000
  }
  
  const autoMode = useAutoMode(autoModeConfig)
  
  // ===== TIMER TRACKING =====
  const { scheduleTimer, cleanup: cleanupTimers } = useDialogTimerTracking({
    onCleanup: () => autoMode.stop(),
    dialogName: config.dialogName
  })
  
  // ===== HELPERS =====
  function scheduleAutoModeStart(expectedState: TState, delay: number = TIMER_DELAYS.AUTO_MODE_START) {
    // Index sofort auf 0 setzen, damit UI nicht alten Wert zeigt
    autoMode.index.value = 0
    
    scheduleTimer(async () => {
      checkCancelled()
      
      if (state.value === expectedState) {
        await nextTick()
        checkCancelled()
        
        if (items.value.length > 0 && state.value === expectedState) {
          // Index nochmal sicherstellen (falls er zwischenzeitlich geändert wurde)
          autoMode.index.value = 0
          await nextTick() // UI Zeit geben, Index 0 anzuzeigen
          autoMode.start(true)
        }
      }
    }, delay)
  }
  
  async function resetToInitialState() {
    try {
      checkCancelled()
      
      autoMode.stop()
      state.value = config.states[0]
      stateIds.value = []
      
      // Wenn TTS muted ist, nicht warten
      const isTTSMuted = simpleFlowController.getTTSMuted()
      if (!isTTSMuted) {
        try {
          await tts.speak(title.value)
        } catch (error) {
          if (!isCancellationError(error)) {
            handleError(`${config.dialogName}: TTS error in resetToInitialState`, error, { logLevel: 'warn' })
          }
          // Continue even if TTS fails
        }
      }
      
      // Wenn TTS muted ist, kürzeren Delay verwenden
      const delay = isTTSMuted ? 500 : TIMER_DELAYS.AUTO_MODE_START
      scheduleAutoModeStart(state.value, delay)
      
    } catch (error) {
      handleOperationError(config.dialogName, 'resetToInitialState', error)
    }
  }
  
  // ===== ACTIONS =====
  async function selectItem(id: string) {
    try {
      checkCancelled()
      
      // Back button
      if (id === config.backButtonId) {
        const isInitialState = state.value === config.states[0]
        
        if (isInitialState) {
          goBack()
        } else {
          // Go to previous state
          await resetToInitialState()
        }
        return
      }
      
      autoMode.stop()
      
      // Get next state
      const nextState = config.getNextState(state.value, id)
      
      if (!nextState) {
        console.warn(`${config.dialogName}: No next state for ${state.value} + ${id}`)
        return
      }
      
      // Update state
      stateIds.value.push(id)
      state.value = nextState
      
      // Speak text with error handling
      // Bei Confirmation den confirmationText sprechen, sonst den title
      const isTTSMuted = simpleFlowController.getTTSMuted()
      if (!isTTSMuted) {
        try {
          const textToSpeak = config.shouldConfirm(nextState) ? confirmationText.value : title.value
          await tts.speak(textToSpeak)
        } catch (error) {
          if (!isCancellationError(error)) {
            handleError(`${config.dialogName}: TTS error in selectItem`, error, { logLevel: 'warn' })
          }
          // Continue even if TTS fails
        }
      }
      
      // Check if confirmation state
      if (config.shouldConfirm(nextState)) {
        // Confirmation - schedule reset
        scheduleTimer(() => {
          try {
            checkCancelled()
            if (config.shouldConfirm(state.value)) {
              resetToInitialState().catch(error => {
                handleError(`${config.dialogName}: resetToInitialState error`, error)
              })
            }
          } catch (error) {
            handleError(`${config.dialogName}: Confirmation timer error`, error)
          }
        }, TIMER_DELAYS.CONFIRMATION_RESET)
      } else {
        // Normal state - schedule auto mode
        // Wenn TTS muted ist, kürzeren Delay verwenden
        const delay = isTTSMuted ? 500 : TIMER_DELAYS.AUTO_MODE_START
        scheduleAutoModeStart(nextState, delay)
      }
      
    } catch (error) {
      handleOperationError(config.dialogName, 'selectItem', error)
    }
  }
  
  function cleanup() {
    console.log(`${config.dialogName}: Cleaning up`)
    isCancelled.value = true
    cleanupTimers()
    tts.cancel()
  }
  
  function goBack() {
    console.log(`${config.dialogName}: goBack() - Cleanup und Navigation`)
    
    cleanup()
    
    // Global services
    simpleFlowController.stopTTS()
    simpleFlowController.stopAutoMode()
    simpleFlowController.setActiveView('')
    
    router.push(config.homeRoute).catch((error) => {
      console.error(`${config.dialogName}: Navigation failed:`, error)
    })
  }
  
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
    
    // Extract ID from item
    const itemId = (currentItem as any).id
    if (!itemId) {
      return
    }
    
    selectItem(itemId)
  }
  
  return {
    // State
    state,
    stateIds,
    
    // Computed
    items,
    title,
    confirmationText,
    autoMode,
    
    // Actions
    selectItem,
    resetToInitialState,
    goBack,
    handleBlink,
    cleanup
  }
}

