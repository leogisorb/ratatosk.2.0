import { ref } from 'vue'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'

/**
 * Composable für Blinzelerkennung und User-Input-Handling
 * Kapselt die Event-basierte Blink-Detection-Logik
 */
export function useBlinkInput() {
  const faceRecognition = useFaceRecognition()
  const isIntroductionActive = ref(false)

  /**
   * Handler für Blink-Events
   * @param event Das Blink-Event
   * @param onUserInput Callback für User-Input
   */
  const handleBlink = (event: any, onUserInput: () => void) => {
    // Ignoriere Blinzeln während der Einführung
    if (isIntroductionActive.value) {
      console.log('👁️ Blink ignored during introduction phase')
      return
    }
    
    console.log('👁️ Blink detected in UnterhaltenView:', event.detail)
    onUserInput()
  }

  /**
   * Handler für Rechtsklick-Events
   * @param event Das Mouse-Event
   * @param onUserInput Callback für User-Input
   */
  const handleRightClick = (event: MouseEvent, onUserInput: () => void) => {
    // Ignoriere Rechtsklick während der Einführung
    if (isIntroductionActive.value) {
      console.log('Right click ignored during introduction phase')
      event.preventDefault()
      return
    }
    
    event.preventDefault()
    console.log('Right click detected')
    onUserInput()
  }

  /**
   * Initialisiert die Event-Listener für Blink- und Klick-Erkennung
   * @param onUserInput Callback für User-Input
   */
  const setupEventListeners = (onUserInput: () => void) => {
    // Event Listener für Rechtsklick (wie in HomeView)
    const rightClickHandler = (event: MouseEvent) => handleRightClick(event, onUserInput)
    document.addEventListener('contextmenu', rightClickHandler, { capture: true, passive: false })
    
    // Event Listener für Face Blinzel-Erkennung (wie in HomeView)
    const blinkHandler = (event: any) => handleBlink(event, onUserInput)
    window.addEventListener('faceBlinkDetected', blinkHandler)
    console.log('UnterhaltenView: Face Recognition Event Listener registriert')
    
    // Starte Face Recognition (wie in HomeView)
    if (!faceRecognition.isActive.value) {
      console.log('UnterhaltenView: Face Recognition nicht aktiv - starte sie')
      faceRecognition.start()
    } else {
      console.log('UnterhaltenView: Face Recognition bereits aktiv - verwende bestehende Instanz')
    }

    // Cleanup-Funktion zurückgeben
    return () => {
      document.removeEventListener('contextmenu', rightClickHandler, { capture: true })
      window.removeEventListener('faceBlinkDetected', blinkHandler)
    }
  }

  /**
   * Aktiviert den Einführungsschutz (Input wird ignoriert)
   */
  const startIntroduction = () => {
    isIntroductionActive.value = true
  }

  /**
   * Deaktiviert den Einführungsschutz (Input wird wieder erlaubt)
   */
  const endIntroduction = () => {
    isIntroductionActive.value = false
  }

  return {
    isIntroductionActive,
    handleBlink,
    handleRightClick,
    setupEventListeners,
    startIntroduction,
    endIntroduction
  }
}
