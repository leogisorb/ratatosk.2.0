import { ref } from 'vue'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'

/**
 * Composable für Text-to-Speech (TTS) Funktionalität
 * Enthält alle Sprachsynthese-Funktionen mit Callback-Unterstützung
 * iOS Safari kompatibel
 */
export function useSpeech() {
  const isTTSActive = ref(false)
  const isTTSReady = ref(false)

  /**
   * Initialisiert TTS für iOS Safari
   * Muss durch User-Interaktion aufgerufen werden!
   */
  const initializeTTS = (): Promise<void> => {
    return new Promise((resolve) => {
      // iOS Safari benötigt eine "stille" Utterance in einem User-Event
      const utterance = new SpeechSynthesisUtterance('')
      utterance.volume = 0
      utterance.onend = () => {
        isTTSReady.value = true
        console.log('TTS: Initialized for iOS')
        resolve()
      }
      utterance.onerror = () => {
        isTTSReady.value = true // Auch bei Fehler als "ready" markieren
        console.log('TTS: Initialization attempted')
        resolve()
      }
      speechSynthesis.speak(utterance)
    })
  }

  /**
   * Asynchrone TTS-Funktion mit Start/End-Callbacks
   * @param text Der zu sprechende Text
   * @param onStart Callback beim TTS-Start
   * @param onEnd Callback beim TTS-Ende
   * @returns Promise das resolved wenn TTS fertig ist
   */
  const speakText = (text: string, onStart?: () => void, onEnd?: () => void): Promise<void> => {
    return new Promise((resolve, reject) => {
      console.log('TTS: Speaking:', text)
      
      // Prüfen ob TTS stumm geschaltet ist
      const isMuted = simpleFlowController.getTTSMuted()
      
      // iOS Safari: Cancel vorherige Utterances
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel()
      }
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'de-DE'
      utterance.rate = 0.8
      utterance.pitch = 1.0
      utterance.volume = isMuted ? 0 : 0.8

      utterance.onstart = () => {
        console.log('TTS: Started speaking')
        isTTSActive.value = true
        if (onStart) onStart()
      }

      utterance.onend = () => {
        console.log('TTS: Finished speaking')
        isTTSActive.value = false
        if (onEnd) onEnd()
        resolve()
      }

      utterance.onerror = (e) => {
        // "canceled" ist kein echter Fehler
        if (e.error === 'canceled') {
          console.log('TTS canceled')
          isTTSActive.value = false
          resolve()
          return
        }
        
        // Echte Fehler behandeln
        console.error('TTS Error:', e)
        isTTSActive.value = false
        reject(e)
      }

      // iOS Safari: Kurze Verzögerung vor speak()
      setTimeout(() => {
        speechSynthesis.speak(utterance)
      }, 100)
    })
  }

  /**
   * Utility-Funktion für asynchrone Verzögerungen
   * @param ms Millisekunden der Verzögerung
   * @returns Promise das nach der Verzögerung resolved
   */
  const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Stoppt alle laufenden TTS-Ausgaben
   */
  const stopTTS = () => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel()
    }
    isTTSActive.value = false
  }

  return { 
    isTTSActive,
    isTTSReady,
    initializeTTS,
    speakText, 
    delay,
    stopTTS
  }
}
