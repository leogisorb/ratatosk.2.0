/**
 * UnterhaltenView JavaScript Logic
 * Virtuelle Tastatur für Kommunikation mit State-Machine
 */

import { ref, onMounted, onUnmounted, computed } from 'vue'

// TypeScript declaration for window property
declare global {
  interface Window {
    ttsIntroAbgespielt?: boolean
  }
}
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../settings/stores/settings'
import { useKeyboardDesignStore } from '../stores/keyboardDesign'
import { useVirtualKeyboardIntegration } from '../composables/useVirtualKeyboardIntegration'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'

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
    resetIntroStatus,
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
  onMounted(async () => {
    console.log('Component mounted, preparing virtual keyboard...')

    // Einführungstext (wird nur einmal pro Sitzung gesprochen)
    const introText = `Willkommen in der virtuellen Tastatur. 
    Blinzeln Sie eine Zeile Ihrer Wahl an. 
    Nachdem Sie eine Zeile ausgewählt haben, 
    laufen die Buchstaben dieser Zeile automatisch durch. 
    Blinzeln Sie erneut, um einen Buchstaben auszuwählen. 
    So können Sie Schritt für Schritt Wörter und Sätze bilden. 
    Die Tastatur läuft in einer Endlosschleife, 
    damit Sie jederzeit weiterschreiben können.`

    // Falls noch nicht abgespielt
    if (!window.ttsIntroAbgespielt) {
      console.log('Starting TTS introduction...')
      try {
        await new Promise<void>((resolve) => {
          const utterance = new SpeechSynthesisUtterance(introText)
          utterance.lang = 'de-DE'
          utterance.rate = 0.9 // etwas langsamer
          utterance.pitch = 1
          utterance.onend = () => {
            console.log('TTS introduction finished.')
            resolve()
          }
          speechSynthesis.cancel()
          speechSynthesis.speak(utterance)
        })

        // Markiere als abgespielt
        window.ttsIntroAbgespielt = true

        // Kleine Pause nach der Einführung
        await new Promise((r) => setTimeout(r, 1000))

        console.log('Starting virtual keyboard after TTS...')
        initializeVirtualKeyboard()
      } catch (error) {
        console.warn('TTS introduction failed, starting keyboard anyway.', error)
        initializeVirtualKeyboard()
      }
    } else {
      // Wenn bereits einmal abgespielt → direkt starten
      console.log('Intro already played — starting keyboard immediately.')
      setTimeout(() => {
        initializeVirtualKeyboard()
      }, 500)
    }

    // Rechtsklick für manuelle Auswahl
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      console.log('Right click detected')
      handleClick()
    })
  })

  onUnmounted(() => {
    console.log('Component unmounting, stopping all TTS and virtual keyboard...')
    
    // Stoppe alle laufenden TTS (beide Systeme)
    speechSynthesis.cancel()  // Direkte TTS-Implementierungen
    simpleFlowController.stopTTS()  // SimpleFlowController TTS
    
    // Stoppe virtuelle Tastatur
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
    resetIntroStatus,
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