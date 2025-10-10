/**
 * UnterhaltenView JavaScript Logic
 * Virtuelle Tastatur für Kommunikation
 */

import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'
import { useKeyboardDesignStore } from '../stores/keyboardDesign'

// Export function to be called from Vue component
export function useUnterhaltenViewLogic() {
  // Router
  const router = useRouter()

  // Stores
  const settingsStore = useSettingsStore()
  const keyboardDesignStore = useKeyboardDesignStore()

  // Face Recognition
  const faceRecognition = useFaceRecognition()

  // Safari-Erkennung
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

  // State - Robuster und weniger sensibel
  const closedFrames = ref(0)
  const eyesClosed = ref(false)
  const blinkThreshold = computed(() => Math.ceil(settingsStore.settings.blinkSensitivity * 10)) // Konvertiere Sekunden zu Frames (10 FPS)
  const lastBlinkTime = ref(0)
  const blinkCooldown = computed(() => settingsStore.settings.blinkSensitivity * 1000)

  // Keyboard State
  const isKeyboardActive = ref(false)
  const keyboardInterval = ref(null)
  const selectedText = ref('')
  // TTS removed

  // Erweiterte Tastatur mit Silben und Sonderzeichen
  const keyboardLayout = [
    ['Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O', 'P', 'Ü'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ö', 'Ä'],
    ['Y', 'X', 'C', 'V', 'B', 'N', 'M', 'ß', '1', '2', '3'],
    ['SCH', 'CH', 'EI', 'AU', 'EU', 'IE', 'ÄU', 'PF', 'PH', 'CK', 'NK'],
    ['JA', 'NEIN', 'ICH', 'DU', 'WO', 'IST', 'BIN'],
    ['LEERZEICHEN', 'LÖSCHEN','ZURÜCK'], // Leerzeichen und Löschen-Button
  ]

  // Navigation State
  const currentRowIndex = ref(0)
  const currentLetterIndex = ref(0)
  const currentStage = ref('rows') // 'rows' | 'letters'
  const letterPassCount = ref(0)

  // TTS removed

  // Blink Detection
  const handleBlink = () => {
    const now = Date.now()
    if (now - lastBlinkTime.value < blinkCooldown.value) {
      return // Zu schnell nach letztem Blink
    }
    
    lastBlinkTime.value = now
    console.log('Blink detected!')
    
    if (isKeyboardActive.value) {
      selectCurrentElement()
    }
  }

  // Keyboard Functions
  const startKeyboard = () => {
    console.log('startKeyboard called, isKeyboardActive:', isKeyboardActive.value)
    
    if (isKeyboardActive.value) {
      console.log('Keyboard already active, returning')
      return
    }
    
    isKeyboardActive.value = true
    currentStage.value = 'rows'
    currentRowIndex.value = 0
    currentLetterIndex.value = 0
    letterPassCount.value = 0
    
    console.log('Keyboard started successfully')
    console.log('Tastatur gestartet - TTS removed')
  }

  const stopKeyboard = () => {
    if (!isKeyboardActive.value) return
    
    isKeyboardActive.value = false
    if (keyboardInterval.value) {
      clearTimeout(keyboardInterval.value)
      keyboardInterval.value = null
    }
    
    console.log('Keyboard stopped')
    console.log('Tastatur gestoppt - TTS removed')
  }

  // TTS functions removed

  // Navigation Functions
  const isCurrentRow = (rowIndex: number) => {
    return currentStage.value === 'rows' && currentRowIndex.value === rowIndex
  }

  const isCurrentLetter = (letter: string, rowIndex: number) => {
    return currentStage.value === 'letters' && 
           currentRowIndex.value === rowIndex && 
           keyboardLayout[rowIndex][currentLetterIndex.value] === letter
  }

  const selectCurrentElement = () => {
    if (currentStage.value === 'rows') {
      // Zeile auswählen - wechsle zu Buchstaben-Modus
      currentStage.value = 'letters'
      currentLetterIndex.value = 0
      console.log(`Selected row ${currentRowIndex.value}, switching to letters mode`)
      console.log('Buchstaben-Modus aktiviert - TTS removed')
      
      // Reset Zähler für neue Zeilen-Auswahl
      letterPassCount.value = 0
    } else {
      // Buchstabe auswählen
      const currentRow = keyboardLayout[currentRowIndex.value]
      const currentLetter = currentRow[currentLetterIndex.value]
      
      if (currentLetter === 'ZURÜCK') {
        // Zurück-Navigation - sofort zurück
        console.log('Zurück-Button selected - going back immediately')
        stopKeyboard()
        router.push('/app')
        return
      } else if (currentLetter === 'LÖSCHEN') {
        // Text löschen
        console.log('Löschen-Button selected - clearing text')
        selectedText.value = ''
        console.log('Text gelöscht - TTS removed')
      } else if (currentLetter === 'LEERZEICHEN') {
        selectedText.value += ' '
        console.log('Leerzeichen hinzugefügt - TTS removed')
      } else {
        selectedText.value += currentLetter
        console.log(`${currentLetter} hinzugefügt - TTS removed`)
      }
      
      console.log('Selected letter:', currentLetter, 'Text:', selectedText.value)
      
      // Reset Zähler und gehe zurück zu Zeilen-Modus
      letterPassCount.value = 0
      currentStage.value = 'rows'
      currentLetterIndex.value = 0
    }
  }

  // speakSelectedText removed

  // Test Funktion
  const testFunction = () => {
    console.log('Test button clicked!')
    console.log('Test Button funktioniert - TTS removed')
    selectedText.value += 'TEST '
  }

  // Keyboard Auto-Navigation
  const startKeyboardNavigation = () => {
    console.log('startKeyboardNavigation called, isKeyboardActive:', isKeyboardActive.value)
    
    if (!isKeyboardActive.value) {
      console.log('Keyboard not active, stopping navigation')
      return
    }
    
    // Sofortiger Start ohne setTimeout
    const navigate = () => {
      console.log('Auto-navigation step, currentStage:', currentStage.value, 'currentRowIndex:', currentRowIndex.value)
      
      if (currentStage.value === 'rows') {
        currentRowIndex.value = (currentRowIndex.value + 1) % keyboardLayout.length
        console.log('Moving to row:', currentRowIndex.value)
        speakCurrentRow()
      } else {
        const currentRow = keyboardLayout[currentRowIndex.value]
        currentLetterIndex.value = (currentLetterIndex.value + 1) % currentRow.length
        console.log('Moving to letter:', currentLetterIndex.value, 'in row:', currentRowIndex.value)
        speakCurrentLetter()
      }
      
      // Nächster Schritt nach 2 Sekunden
      keyboardInterval.value = window.setTimeout(navigate, 2000) as any
    }
    
    // Starte sofort
    navigate()
  }

  // Event Listeners
  onMounted(() => {
    console.log('Component mounted, starting keyboard...')
    
    // Starte Tastatur sofort
    setTimeout(() => {
      console.log('Starting keyboard...')
      startKeyboard()
    }, 500)
    
    // Starte Auto-Navigation nach kurzer Verzögerung
    setTimeout(() => {
      console.log('Starting navigation...')
      startKeyboardNavigation()
    }, 1000)
    
    // Rechtsklick für manuelle Auswahl
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      console.log('Right click detected')
      if (isKeyboardActive.value) {
        selectCurrentElement()
      }
    })
  })

  onUnmounted(() => {
    stopKeyboard()
  })

  // Return all values for Vue component
  return {
    // State
    closedFrames,
    eyesClosed,
    blinkThreshold,
    lastBlinkTime,
    blinkCooldown,
    isKeyboardActive,
    keyboardInterval,
    selectedText,
    // isTTSEnabled removed
    keyboardLayout,
    currentRowIndex,
    currentLetterIndex,
    currentStage,
    letterPassCount,
    
    // Functions
    // TTS functions removed
    handleBlink,
    startKeyboard,
    stopKeyboard,
    isCurrentRow,
    isCurrentLetter,
    selectCurrentElement,
    // speakSelectedText removed
    testFunction,
    startKeyboardNavigation,
    
    // Stores
    settingsStore,
    keyboardDesignStore,
    faceRecognition
  }
}