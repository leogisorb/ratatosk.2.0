// TTS Composable für Sprachausgabe

import { ref, computed } from 'vue'
import { useSettingsStore } from '../../settings/stores/settings'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'

export function useTTS() {
  const settingsStore = useSettingsStore()
  const isSpeaking = ref(false)
  
  // Enabled basiert auf Settings
  const enabled = computed(() => settingsStore.settings.voiceEnabled ?? true)

  /**
   * Spricht einen Text mit Sprachsynthese
   * @param text Der zu sprechende Text
   * @returns Promise, das aufgelöst wird, wenn TTS fertig ist
   */
  function speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      // Kein Text oder TTS deaktiviert - sofort auflösen
      if (!enabled.value || !text.trim()) {
        setTimeout(() => resolve(), 500) // Kurze Wartezeit für Timing-Konsistenz
        return
      }

      // Prüfen ob TTS stumm geschaltet ist - dann Volume auf 0 setzen
      const isMuted = simpleFlowController.getTTSMuted()

      // Kein SpeechSynthesis verfügbar - sofort auflösen
      const synth = window.speechSynthesis
      if (!synth) {
        setTimeout(() => resolve(), 500)
        return
      }

      // Bereits am Sprechen - abbrechen und neu starten
      synth.cancel()
      
      // Timeout-Fallback für hängende TTS (10 Sekunden)
      let timeoutId: number | null = null
      timeoutId = window.setTimeout(() => {
        synth.cancel()
        isSpeaking.value = false
        resolve()
      }, 10000)

      const utterance = new SpeechSynthesisUtterance(text.trim())
      utterance.lang = 'de-DE'
      utterance.rate = 1.0
      utterance.volume = isMuted ? 0 : 1.0  // Volume basierend auf Mute-Status

      isSpeaking.value = true

      utterance.onend = () => {
        if (timeoutId) clearTimeout(timeoutId)
        isSpeaking.value = false
        resolve()
      }

      utterance.onerror = () => {
        if (timeoutId) clearTimeout(timeoutId)
        isSpeaking.value = false
        resolve()
      }

      synth.speak(utterance)
    })
  }

  /**
   * Stoppt die aktuelle Sprachausgabe
   */
  function cancel() {
    window.speechSynthesis?.cancel()
    isSpeaking.value = false
  }

  return { 
    isSpeaking: computed(() => isSpeaking.value),
    enabled,
    speak,
    cancel
  }
}

