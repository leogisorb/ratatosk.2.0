/**
 * UnterhaltenView JavaScript Logic
 * Virtuelle Tastatur für Kommunikation mit State-Machine
 */

import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../settings/stores/settings'
import { useKeyboardDesignStore } from '../stores/keyboardDesign'
import { useVirtualKeyboardIntegration } from '../composables/useVirtualKeyboardIntegration'

// Export function to be called from Vue component
export function useUnterhaltenViewLogic() {
  // Router
  const router = useRouter()

  // Stores
  const settingsStore = useSettingsStore()
  const keyboardDesignStore = useKeyboardDesignStore()

  // Virtuelle Tastatur Integration
  const {
    currentText,
    currentState,
    activeRowIndex,
    activeLetterIndex,
    isTTSActive,
    showCurrentText,
    keyboardLayout,
    isRowActive,
    isLetterActive,
    isRowSelected,
    isLetterSelected,
    initializeVirtualKeyboard,
    stopVirtualKeyboard,
    handleClick,
    clearText,
    readCurrentText,
    isRowHighlighted,
    isLetterHighlighted,
    isRowSelectedState,
    getRowClass,
    getLetterClass,
    getTTSIndicatorClass,
    faceRecognition
  } = useVirtualKeyboardIntegration()

  // Legacy compatibility - mapped to new system
  const selectedText = currentText
  const currentRowIndex = activeRowIndex
  const currentLetterIndex = activeLetterIndex
  const isKeyboardActive = computed(() => currentState.value !== 'idle')
  const currentStage = computed(() => {
    if (isRowActive.value) return 'rows'
    if (isLetterActive.value) return 'letters'
    return 'idle'
  })

  // Legacy functions for compatibility
  const handleBlink = () => {
    handleClick()
  }

  const startKeyboard = () => {
    initializeVirtualKeyboard()
  }

  const stopKeyboard = () => {
    stopVirtualKeyboard()
  }

  const isCurrentRow = (rowIndex: number) => {
    return isRowHighlighted(rowIndex)
  }

  const isCurrentLetter = (letter: string, rowIndex: number) => {
    return isLetterHighlighted(rowIndex, activeLetterIndex.value)
  }

  const selectCurrentElement = () => {
    handleClick()
  }

  const testFunction = () => {
    console.log('Test button clicked!')
    currentText.value += 'TEST '
  }

  const startKeyboardNavigation = () => {
    // Navigation wird automatisch von der State-Machine gesteuert
    console.log('Navigation is handled by State-Machine')
  }

  // Event Listeners
  onMounted(() => {
    console.log('Component mounted, starting virtual keyboard...')
    
    // Starte virtuelle Tastatur
    setTimeout(() => {
      console.log('Starting virtual keyboard...')
      initializeVirtualKeyboard()
    }, 500)
    
    // Rechtsklick für manuelle Auswahl
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      console.log('Right click detected')
      handleClick()
    })
  })

  onUnmounted(() => {
    stopVirtualKeyboard()
  })

  // Return all values for Vue component
  return {
    // State (Legacy compatibility)
    closedFrames: ref(0),
    eyesClosed: ref(false),
    blinkThreshold: computed(() => Math.ceil(settingsStore.settings.blinkSensitivity * 10)),
    lastBlinkTime: ref(0),
    blinkCooldown: computed(() => settingsStore.settings.blinkSensitivity * 1000),
    isKeyboardActive,
    keyboardInterval: ref(null),
    selectedText,
    keyboardLayout,
    currentRowIndex,
    currentLetterIndex,
    currentStage,
    letterPassCount: ref(0),
    
    // New virtual keyboard state
    currentText,
    currentState,
    activeRowIndex,
    activeLetterIndex,
    isTTSActive,
    showCurrentText,
    isRowActive,
    isLetterActive,
    isRowSelected,
    isLetterSelected,
    
    // Functions (Legacy compatibility)
    handleBlink,
    startKeyboard,
    stopKeyboard,
    isCurrentRow,
    isCurrentLetter,
    selectCurrentElement,
    testFunction,
    startKeyboardNavigation,
    
    // New virtual keyboard functions
    initializeVirtualKeyboard,
    stopVirtualKeyboard,
    handleClick,
    clearText,
    readCurrentText,
    isRowHighlighted,
    isLetterHighlighted,
    isRowSelectedState,
    getRowClass,
    getLetterClass,
    getTTSIndicatorClass,
    
    // Stores
    settingsStore,
    keyboardDesignStore,
    faceRecognition
  }
}