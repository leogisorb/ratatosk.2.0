import { ref } from 'vue'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'

/**
 * Composable für Text-to-Speech (TTS) Funktionalität
 * Enthält alle Sprachsynthese-Funktionen mit Callback-Unterstützung
 */
export function useSpeech() {
  const isTTSActive = ref(false)

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
      
      // ✅ Prüfe ob TTS stumm geschaltet ist → Volume 0 setzen
      const isMuted = simpleFlowController.getTTSMuted()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'de-DE'
      utterance.rate = 0.8
      utterance.pitch = 1.0
      utterance.volume = isMuted ? 0 : 0.8  // ✅ Volume basierend auf Mute-Status

      utterance.onstart = () => {
        console.log('TTS: Started speaking')
        isTTSActive.value = true
        if (onStart) onStart()
      }

      utterance.onend = () => {
        console.log('TTS: Finished speaking')
        isTTSActive.value = false
        if (onEnd) onEnd()
        resolve() // Promise erfüllt, wenn TTS fertig ist
      }

      utterance.onerror = (e) => {
        console.error('TTS Error:', e)
        isTTSActive.value = false
        reject(e)
      }

      speechSynthesis.speak(utterance)
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

  return { 
    isTTSActive, 
    speakText, 
    delay 
  }
}
