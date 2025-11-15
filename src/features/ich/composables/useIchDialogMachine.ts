// useIchDialogMachine.ts - Refactored Version
// ✅ Fixes: Memory Leaks, Race Conditions, Type Safety

import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { IchRegion, IchSubRegion } from '../data/ichDialogData'
import { useIchDictionary } from './useIchDictionary'
import { useTTS } from './useTTS'
import { useAutoMode } from '../../../shared/composables/useAutoMode'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'
import { debug } from '../../../shared/utils/debug'

// ==========================================
// CONSTANTS - No more magic numbers
// ==========================================
const DELAYS = {
  AUTO_MODE_START: 3000,
  CONFIRMATION_DISPLAY: 3000,
  STATE_TRANSITION: 100
} as const

const TTS_CONFIG = {
  TIMEOUT: 10000,
  FALLBACK_DELAY: 500
} as const

// ==========================================
// TYPES
// ==========================================
export type IchDialogState = 'mainView' | 'subRegionView' | 'confirmation'
export type IchDialogItem = IchRegion | IchSubRegion

interface TTSProvider {
  speak: (text: string) => Promise<void>
  cancel: () => void
  isSpeaking: boolean | { value: boolean }
}

interface AutoModeProvider {
  start: (skipTitle?: boolean) => void
  stop: () => void
  index: { value: number }
  running: { value: boolean }
}

interface IchDialogMachineDeps {
  tts?: TTSProvider
  autoMode?: AutoModeProvider
  createAutoMode?: (config: any) => AutoModeProvider
}

// ==========================================
// TIMER MANAGER - Centralized timer handling
// ==========================================
class TimerManager {
  private timers = new Set<number>()
  private isCleanedUp = false

  schedule(callback: () => void, delay: number): number {
    if (this.isCleanedUp) {
      debug.warn('TimerManager', 'Attempted to schedule after cleanup')
      return -1
    }

    const timerId = window.setTimeout(() => {
      this.timers.delete(timerId)
      if (!this.isCleanedUp) {
        callback()
      }
    }, delay)

    this.timers.add(timerId)
    return timerId
  }

  cancel(timerId: number): void {
    clearTimeout(timerId)
    this.timers.delete(timerId)
  }

  cleanup(): void {
    this.isCleanedUp = true
    this.timers.forEach(id => clearTimeout(id))
    this.timers.clear()
    debug.log('TimerManager', `Cleaned up ${this.timers.size} timers`)
  }

  get hasActiveTimers(): boolean {
    return this.timers.size > 0
  }
}

// ==========================================
// TRANSACTION MANAGER - Prevents race conditions
// ==========================================
class TransactionManager {
  private currentTransaction: symbol | null = null

  start(): symbol {
    const transaction = Symbol('transaction')
    this.currentTransaction = transaction
    debug.log('TransactionManager', 'Started new transaction')
    return transaction
  }

  isValid(transaction: symbol): boolean {
    return this.currentTransaction === transaction
  }

  cancel(): void {
    this.currentTransaction = null
    debug.log('TransactionManager', 'Cancelled current transaction')
  }
}

// ==========================================
// MAIN COMPOSABLE
// ==========================================
export function useIchDialogMachine(deps?: Partial<IchDialogMachineDeps>) {
  const router = useRouter()
  const dict = useIchDictionary()
  
  // Managers
  const timerManager = new TimerManager()
  const transactionManager = new TransactionManager()

  // State
  const state = ref<IchDialogState>('mainView')
  const mainRegionId = ref<string | null>(null)
  const subRegionId = ref<string | null>(null)

  // ✅ Computed items and title (reactive to state changes)
  const items = computed<IchDialogItem[]>(() => {
    switch (state.value) {
      case 'mainView':
        return [...dict.mainRegions] as IchDialogItem[]
      case 'subRegionView':
        return [...dict.getSubRegions(mainRegionId.value)] as IchDialogItem[]
      default:
        return []
    }
  })

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

  const confirmationText = computed(() => {
    const subRegions = dict.getSubRegions(mainRegionId.value)
    const subRegion = subRegions.find(r => r.id === subRegionId.value) || null
    return dict.generateConfirmation(mainRegionId.value, subRegion)
  })

  // ✅ TTS Provider (with proper type handling)
  const ttsInstance = deps?.tts ?? (() => {
    const tts = useTTS()
    return {
      speak: tts.speak,
      cancel: tts.cancel,
      get isSpeaking() {
        return typeof tts.isSpeaking === 'object' ? tts.isSpeaking.value : tts.isSpeaking
      }
    }
  })()

  const ttsProvider: TTSProvider = {
    speak: ttsInstance.speak,
    cancel: ttsInstance.cancel,
    get isSpeaking() {
      return typeof ttsInstance.isSpeaking === 'object' ? ttsInstance.isSpeaking.value : ttsInstance.isSpeaking
    }
  }

  // Normalize isSpeaking to always be a value
  const isSpeaking = computed(() => {
    const speaking = ttsProvider.isSpeaking
    return typeof speaking === 'object' ? speaking.value : speaking
  })

  // ✅ AutoMode Provider (reactive - getItems/getTitle always read current values)
  const autoModeProvider: AutoModeProvider = deps?.autoMode ?? useAutoMode({
    speak: ttsProvider.speak,
    getItems: () => {
      // ✅ Always return current items (reactive)
      return items.value.map(item => ({
        ...item,
        title: item.title,
        id: item.id
      }))
    },
    getTitle: () => title.value, // ✅ Always return current title (reactive)
    initialDelay: DELAYS.AUTO_MODE_START,
    cycleDelay: 3000,
    onCycle: (index: number) => {
      debug.log('IchDialog', 'AutoMode cycle', { index, itemCount: items.value.length })
    }
  })
  
  const autoMode: AutoModeProvider = autoModeProvider


  // ==========================================
  // PRIVATE HELPERS
  // ==========================================
  async function speakWithTransaction(
    transaction: symbol,
    text: string
  ): Promise<boolean> {
    if (!transactionManager.isValid(transaction)) {
      debug.log('IchDialog', 'Transaction cancelled before TTS')
      return false
    }

    try {
      await ttsProvider.speak(text)
      
      if (!transactionManager.isValid(transaction)) {
        debug.log('IchDialog', 'Transaction cancelled after TTS')
        return false
      }
      
      return true
    } catch (error) {
      debug.error('IchDialog', 'TTS error', { text, error })
      return transactionManager.isValid(transaction)
    }
  }

  function startAutoModeWithDelay(transaction: symbol, skipTitle = true): void {
    timerManager.schedule(() => {
      if (!transactionManager.isValid(transaction)) {
        debug.log('IchDialog', 'AutoMode start cancelled - invalid transaction')
        return
      }

      if (items.value.length === 0) {
        debug.warn('IchDialog', 'No items available for AutoMode')
        return
      }

      autoMode.start(skipTitle)
    }, DELAYS.AUTO_MODE_START)
  }

  // ==========================================
  // PUBLIC ACTIONS
  // ==========================================
  async function selectMainRegion(id: string): Promise<void> {
    debug.log('IchDialog', 'selectMainRegion', { id })

    if (id === dict.ID_BACK) {
      goBack()
      return
    }

    // Start new transaction
    const transaction = transactionManager.start()
    
    // Stop current auto mode
    autoMode.stop()

    // Update state
    mainRegionId.value = id
    state.value = 'subRegionView'
    subRegionId.value = null

    // Speak title
    const success = await speakWithTransaction(transaction, title.value)
    if (!success) return

    // Start auto mode after delay
    startAutoModeWithDelay(transaction, true)
  }

  async function selectSubRegion(id: string): Promise<void> {
    debug.log('IchDialog', 'selectSubRegion', { id })

    if (id === dict.ID_BACK) {
      await goBackToMainView()
      return
    }

    // Start new transaction
    const transaction = transactionManager.start()

    // Stop current auto mode
    autoMode.stop()

    // Update state
    subRegionId.value = id
    state.value = 'confirmation'

    // Speak confirmation
    const success = await speakWithTransaction(transaction, confirmationText.value)
    if (!success) return

    // Return to main view after delay
    timerManager.schedule(() => {
      if (transactionManager.isValid(transaction)) {
        resetToMainView()
      }
    }, DELAYS.CONFIRMATION_DISPLAY)
  }

  async function goBackToMainView(): Promise<void> {
    debug.log('IchDialog', 'goBackToMainView')

    // Start new transaction
    const transaction = transactionManager.start()

    // Stop current auto mode
    autoMode.stop()

    // Update state
    state.value = 'mainView'
    mainRegionId.value = null
    subRegionId.value = null

    // Speak title
    const success = await speakWithTransaction(transaction, title.value)
    if (!success) return

    // Start auto mode after delay
    startAutoModeWithDelay(transaction, true)
  }

  async function resetToMainView(): Promise<void> {
    debug.log('IchDialog', 'resetToMainView')

    // Start new transaction
    const transaction = transactionManager.start()

    // Stop current auto mode
    autoMode.stop()

    // Update state
    state.value = 'mainView'
    mainRegionId.value = null
    subRegionId.value = null

    // Speak title
    const success = await speakWithTransaction(transaction, title.value)
    if (!success) return

    // Start auto mode after delay
    startAutoModeWithDelay(transaction, true)
  }

  function goBack(): void {
    debug.log('IchDialog', 'goBack - Navigating to /app')

    // Cancel all transactions
    transactionManager.cancel()

    // Cleanup everything
    cleanup()

    // Stop all TTS
    ttsProvider.cancel()
    simpleFlowController.stopTTS()
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

    // Stop auto mode
    simpleFlowController.stopAutoMode()
    simpleFlowController.setActiveView('')

    // Navigate
    router.push('/app').catch(error => {
      debug.error('IchDialog', 'Navigation failed', { error })
    })
  }

  function handleBlink(): void {
    const currentItems = items.value
    const currentIndex = autoMode.index.value

    debug.log('IchDialog', 'handleBlink', {
      state: state.value,
      currentIndex,
      itemsCount: currentItems.length
    })

    // Validate index
    if (currentIndex < 0 || currentIndex >= currentItems.length) {
      debug.warn('IchDialog', 'Invalid index', { currentIndex, itemsCount: currentItems.length })
      return
    }

    const currentItem = currentItems[currentIndex]
    if (!currentItem) {
      debug.warn('IchDialog', 'No item found', { currentIndex })
      return
    }

    // Handle back button
    if (currentItem.id === dict.ID_BACK) {
      debug.log('IchDialog', 'Back button detected')
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

    // Handle selection based on state
    switch (state.value) {
      case 'mainView':
        selectMainRegion(currentItem.id)
        break
      case 'subRegionView':
        selectSubRegion(currentItem.id)
        break
      default:
        debug.warn('IchDialog', 'Blink in unknown state', { state: state.value })
        break
    }
  }

  function goToIndex(index: number): void {
    const currentItems = items.value
    if (index >= 0 && index < currentItems.length) {
      autoMode.stop()
      autoMode.index.value = index
      
      timerManager.schedule(() => {
        autoMode.start(true)
      }, DELAYS.STATE_TRANSITION)
    }
  }

  function cleanup(): void {
    debug.log('IchDialog', 'Cleanup started')
    
    // Cancel all transactions
    transactionManager.cancel()
    
    // Clear all timers
    timerManager.cleanup()
    
    // Stop auto mode
    autoMode.stop()
    
    debug.log('IchDialog', 'Cleanup completed')
  }

  // ==========================================
  // LIFECYCLE WATCHERS
  // ==========================================
  watch(() => state.value, (newState, oldState) => {
    if (oldState !== undefined) {
      debug.log('IchDialog', 'State changed', {
        from: oldState,
        to: newState,
        itemsCount: items.value.length
      })
    }
  })

  // ==========================================
  // RETURN PUBLIC API
  // ==========================================
  return {
    // State (read-only)
    state: computed(() => state.value),
    mainRegionId: computed(() => mainRegionId.value),
    subRegionId: computed(() => subRegionId.value),
    
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
    goToIndex,
    cleanup,
    
    // Debugging
    _debug: {
      timers: computed(() => timerManager.hasActiveTimers),
      state: computed(() => state.value),
      isSpeaking: isSpeaking
    }
  }
}

// ✅ Keine Default-Implementierungen mehr nötig
// TTS und AutoMode werden jetzt mit lazy imports direkt in useIchDialogMachine() erstellt
// Das verhindert Circular Dependencies und stellt sicher, dass getItems/getTitle
// immer die aktuellen Werte aus den computed properties lesen