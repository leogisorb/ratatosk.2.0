/**
 * Integration der virtuellen Tastatur in bestehende Views
 * Ersetzt bestehende Tastatur-Logik mit State-Machine
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { VirtualKeyboardStateMachine, VirtualKeyboardState, VirtualKeyboardEvent } from '../../../config/virtualKeyboardStateMachine'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'

export function useVirtualKeyboardIntegration() {
  // Refs für Vue-Reaktivität
  const currentText = ref("Noch kein Text…")
  const currentState = ref<VirtualKeyboardState>(VirtualKeyboardState.IDLE)
  const activeRowIndex = ref(0)
  const activeLetterIndex = ref(0)
  const isTTSActive = ref(false)
  const showCurrentText = ref(false)

  // State-Machine
  let stateMachine: VirtualKeyboardStateMachine | null = null

  // Face Recognition
  const faceRecognition = useFaceRecognition()

  // Tastatur-Layout (neue alphabetische Reihenfolge)
  const keyboardLayout = [
    // Buchstaben von A–Z (inkl. ß und Umlaute)
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'],
    ['L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V'],
    ['W', 'X', 'Y', 'Z', 'Ä', 'Ö', 'Ü', 'ß', '.', ',', '?'],
    // Häufige Silben und Lautkombinationen
    ['SCH', 'CH', 'EI', 'IE', 'AU', 'EU', 'ÄU', 'PF', 'PH', 'CK', 'NK'],
    // Kurze Wörter
    ['JA', 'NEIN', 'ICH', 'DU', 'ES', 'IST', 'BIN'],
    // Steuerung
    ['LEERZEICHEN', 'LÖSCHEN', 'ZURÜCK']
  ]

  // Computed Properties
  const currentRowLetters = computed(() => {
    return keyboardLayout[activeRowIndex.value] || []
  })

  const isRowActive = computed(() => {
    return currentState.value === VirtualKeyboardState.ROW_SCANNING
  })

  const isLetterActive = computed(() => {
    return currentState.value === VirtualKeyboardState.LETTER_SCANNING
  })

  const isRowSelected = computed(() => {
    return currentState.value === VirtualKeyboardState.ROW_SELECTED
  })

  const isLetterSelected = computed(() => {
    return currentState.value === VirtualKeyboardState.LETTER_SELECTED
  })

  /**
   * State-Change Callback für die State-Machine
   */
  const onStateChange = (state: VirtualKeyboardState, context: any) => {
    console.log('VirtualKeyboard: State changed to', state)
    console.log('VirtualKeyboard: Context:', context)
    
    currentState.value = state
    currentText.value = context.currentText
    activeRowIndex.value = context.currentRow
    activeLetterIndex.value = context.currentLetter
    isTTSActive.value = context.isTTSActive
    showCurrentText.value = context.currentText !== "Noch kein Text…"
    
    console.log('VirtualKeyboard: Updated state - row:', activeRowIndex.value, 'letter:', activeLetterIndex.value)
  }

  /**
   * Initialisiert die virtuelle Tastatur
   */
  const initializeVirtualKeyboard = async () => {
    console.log('VirtualKeyboard: Initializing virtual keyboard integration')
    console.log('VirtualKeyboard: SimpleFlowController available:', !!simpleFlowController)
    
    // State-Machine erstellen
    stateMachine = new VirtualKeyboardStateMachine(simpleFlowController, onStateChange)
    console.log('VirtualKeyboard: State machine created:', !!stateMachine)
    
    // Face Recognition für Blinzelsteuerung (vorerst deaktiviert)
    // faceRecognition.start()
    console.log('VirtualKeyboard: Face Recognition temporarily disabled - using right-click only')
    
    // State-Machine starten
    console.log('VirtualKeyboard: Starting state machine...')
    stateMachine.start()
    console.log('VirtualKeyboard: State machine started')
  }

  /**
   * Stoppt die virtuelle Tastatur
   */
  const stopVirtualKeyboard = () => {
    console.log('VirtualKeyboard: Stopping virtual keyboard integration')
    
    if (stateMachine) {
      stateMachine.stop()
      stateMachine = null
    }
    
    faceRecognition.stop()
  }

  /**
   * Behandelt Benutzereingabe (Blinzeln oder Klick)
   */
  const handleUserInput = () => {
    if (!stateMachine) return
    
    console.log('VirtualKeyboard: User input detected')
    stateMachine.handleUserInput()
  }

  /**
   * Manueller Klick-Handler (für Maus/Touch-Eingabe)
   */
  const handleClick = () => {
    handleUserInput()
  }

  /**
   * Text zurücksetzen
   */
  const clearText = () => {
    currentText.value = "Noch kein Text…"
    showCurrentText.value = false
    // State-Machine zurücksetzen
    if (stateMachine) {
      stateMachine.stop()
      stateMachine.start()
    }
  }

  /**
   * Aktuellen Text vorlesen
   */
  const readCurrentText = async () => {
    if (currentText.value !== "Noch kein Text…") {
      isTTSActive.value = true
      await simpleFlowController.speak(`Ihr aktueller Text: ${currentText.value}`)
      isTTSActive.value = false
    }
  }

  /**
   * Hilfsfunktion: Prüft ob eine Zeile aktiv ist
   */
  const isRowHighlighted = (rowIndex: number): boolean => {
    return isRowActive.value && activeRowIndex.value === rowIndex
  }

  /**
   * Hilfsfunktion: Prüft ob ein Buchstabe aktiv ist
   */
  const isLetterHighlighted = (rowIndex: number, letterIndex: number): boolean => {
    return isLetterActive.value && 
           activeRowIndex.value === rowIndex && 
           activeLetterIndex.value === letterIndex
  }

  /**
   * Hilfsfunktion: Prüft ob eine Zeile ausgewählt ist
   */
  const isRowSelectedState = (rowIndex: number): boolean => {
    return isRowSelected.value && activeRowIndex.value === rowIndex
  }

  /**
   * CSS-Klassen für UI-Hervorhebung
   */
  const getRowClass = (rowIndex: number): string => {
    const isHighlighted = isRowHighlighted(rowIndex)
    const isSelected = isRowSelectedState(rowIndex)
    console.log(`getRowClass(${rowIndex}): highlighted=${isHighlighted}, selected=${isSelected}`)
    
    if (isHighlighted) {
      return 'row-active' // Orangefarbener Rahmen
    }
    if (isSelected) {
      return 'row-selected' // Zeile ausgewählt
    }
    return 'row-inactive'
  }

  const getLetterClass = (rowIndex: number, letterIndex: number): string => {
    const isHighlighted = isLetterHighlighted(rowIndex, letterIndex)
    console.log(`getLetterClass(${rowIndex}, ${letterIndex}): highlighted=${isHighlighted}`)
    
    if (isHighlighted) {
      return 'letter-active' // Leuchtender Rahmen
    }
    return 'letter-inactive'
  }

  const getTTSIndicatorClass = (): string => {
    return isTTSActive.value ? 'tts-active' : 'tts-inactive'
  }

  /**
   * Lifecycle-Hooks
   */
  onMounted(() => {
    console.log('VirtualKeyboard: Integration mounted')
  })

  onUnmounted(() => {
    stopVirtualKeyboard()
  })

  return {
    // State
    currentText,
    currentState,
    activeRowIndex,
    activeLetterIndex,
    isTTSActive,
    showCurrentText,
    
    // Computed
    currentRowLetters,
    isRowActive,
    isLetterActive,
    isRowSelected,
    isLetterSelected,
    
    // Layout
    keyboardLayout,
    
    // Methods
    initializeVirtualKeyboard,
    stopVirtualKeyboard,
    handleClick,
    clearText,
    readCurrentText,
    
    // UI-Helpers
    isRowHighlighted,
    isLetterHighlighted,
    isRowSelectedState,
    getRowClass,
    getLetterClass,
    getTTSIndicatorClass,
    
    // Face Recognition
    faceRecognition
  }
}
