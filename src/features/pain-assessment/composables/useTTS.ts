/**
 * ✅ MODUL 1 — useTTS() (bulletproof Speech-System)
 * 
 * Ziele:
 * ✅ Kein Deadlock mehr
 * ✅ Kein Doppel-Speak
 * ✅ Keine Race Conditions
 * ✅ Utterance wird sauber vorbereitet
 * ✅ Events sauber abgehört
 */

import { ref, computed } from 'vue'
import { useSettingsStore } from '../../settings/stores/settings'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'

export function useTTS() {
  const settingsStore = useSettingsStore()
  const isSpeaking = ref(false)
  
  // ✅ Enabled basiert auf Settings
  const enabled = computed(() => settingsStore.settings.voiceEnabled ?? true)

  /**
   * Spricht einen Text mit Sprachsynthese
   * @param text Der zu sprechende Text
   * @returns Promise, das aufgelöst wird, wenn TTS fertig ist
   */
  function speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      // ✅ Prüfe ob TTS global aktiviert ist (userInteracted)
      const globalUserInteracted = simpleFlowController.getState().userInteracted
      if (!globalUserInteracted) {
        console.log('useTTS: TTS nicht aktiviert (userInteracted = false) - aktiviere jetzt')
        simpleFlowController.setUserInteracted(true)
      }
      
      // ✅ Kein Text oder TTS deaktiviert → sofort auflösen
      if (!enabled.value || !text.trim()) {
        console.log('useTTS: TTS deaktiviert oder leerer Text - enabled:', enabled.value, 'text:', text.trim())
        setTimeout(() => resolve(), 500) // Kurze Wartezeit für Timing-Konsistenz
        return
      }
      
      console.log('useTTS: Spreche Text:', text.trim(), 'enabled:', enabled.value, 'userInteracted:', globalUserInteracted)

      // ✅ Prüfe ob TTS stumm geschaltet ist → Volume 0 setzen
      const isMuted = simpleFlowController.getTTSMuted()
      if (isMuted) {
        console.log('useTTS: TTS is muted - setting volume to 0')
      }

      // ✅ Kein SpeechSynthesis verfügbar → sofort auflösen
      const synth = window.speechSynthesis
      if (!synth) {
        setTimeout(() => resolve(), 500)
        return
      }

      // ✅ Bereits am Sprechen → abbrechen und neu starten
      synth.cancel()
      
      // ✅ Timeout-Fallback für hängende TTS (10 Sekunden)
      let timeoutId: number | null = null
      timeoutId = window.setTimeout(() => {
        synth.cancel()
        isSpeaking.value = false
        resolve()
      }, 10000)

      const utterance = new SpeechSynthesisUtterance(text.trim())
      utterance.lang = 'de-DE'
      utterance.rate = 1.0
      utterance.volume = isMuted ? 0 : 1.0  // ✅ Volume basierend auf Mute-Status

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

