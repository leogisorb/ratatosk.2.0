/**
 * Composable für die virtuelle Tastatur
 * Integration in Vue-Komponenten
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { VirtualKeyboardController, VIRTUAL_KEYBOARD_CONFIG } from '../../../config/virtualKeyboardConfig'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'

export function useVirtualKeyboard() {
  // Refs für Vue-Reaktivität
  const currentText = ref(VIRTUAL_KEYBOARD_CONFIG.ui.defaultText)
  const activeRowIndex = ref(0)
  const activeLetterIndex = ref(0)
  const isRowScanning = ref(false)
  const isLetterScanning = ref(false)
  const isTTSActive = ref(false)

  // Controller-Instanz
  let keyboardController: VirtualKeyboardController | null = null

  // Face Recognition für Blinzelsteuerung
  const faceRecognition = useFaceRecognition()

  /**
   * Initialisiert die virtuelle Tastatur
   */
  const initializeKeyboard = async () => {
    console.log('VirtualKeyboard: Initializing')
    
    // Controller erstellen
    keyboardController = new VirtualKeyboardController(simpleFlowController)
    
    // Blinzelsteuerung aktivieren
    faceRecognition.start()
    
    // Event-Listener für Blinzelsteuerung
    faceRecognition.onBlink(() => {
      handleUserInput()
    })
    
    // Keyboard starten
    await keyboardController.start()
    updateUIState()
  }

  /**
   * Stoppt die virtuelle Tastatur
   */
  const stopKeyboard = () => {
    console.log('VirtualKeyboard: Stopping')
    
    if (keyboardController) {
      keyboardController.stop()
      keyboardController = null
    }
    
    faceRecognition.stop()
  }

  /**
   * Behandelt Benutzereingabe (Blinzeln oder Klick)
   */
  const handleUserInput = async () => {
    if (!keyboardController) return
    
    console.log('VirtualKeyboard: Handling user input')
    await keyboardController.handleUserInput()
    updateUIState()
  }

  /**
   * Aktualisiert den UI-Zustand basierend auf dem Controller
   */
  const updateUIState = () => {
    if (!keyboardController) return
    
    const state = keyboardController.getState()
    
    currentText.value = state.currentText
    activeRowIndex.value = state.currentRow
    activeLetterIndex.value = state.currentLetter
    isRowScanning.value = state.isRowScanning
    isLetterScanning.value = state.isLetterScanning
  }

  /**
   * Manueller Klick-Handler (für Maus/Touch-Eingabe)
   */
  const handleClick = async () => {
    await handleUserInput()
  }

  /**
   * Text zurücksetzen
   */
  const clearText = () => {
    currentText.value = VIRTUAL_KEYBOARD_CONFIG.ui.defaultText
    if (keyboardController) {
      // Controller-Text zurücksetzen (falls entsprechende Methode existiert)
      console.log('VirtualKeyboard: Text cleared')
    }
  }

  /**
   * Aktuellen Text vorlesen
   */
  const readCurrentText = async () => {
    if (currentText.value !== VIRTUAL_KEYBOARD_CONFIG.ui.defaultText) {
      isTTSActive.value = true
      await simpleFlowController.speak(`Aktueller Text: ${currentText.value}`)
      isTTSActive.value = false
    }
  }

  /**
   * Lifecycle-Hooks
   */
  onMounted(() => {
    // Keyboard wird manuell gestartet, nicht automatisch
    console.log('VirtualKeyboard: Composable mounted')
  })

  onUnmounted(() => {
    stopKeyboard()
  })

  return {
    // State
    currentText,
    activeRowIndex,
    activeLetterIndex,
    isRowScanning,
    isLetterScanning,
    isTTSActive,
    
    // Keyboard-Layout
    keyboardRows: VIRTUAL_KEYBOARD_CONFIG.keyboard,
    
    // Methods
    initializeKeyboard,
    stopKeyboard,
    handleClick,
    clearText,
    readCurrentText,
    
    // Face Recognition
    faceRecognition
  }
}
