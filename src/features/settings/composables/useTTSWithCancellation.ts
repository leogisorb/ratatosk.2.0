/**
 * TTS mit Cancellation Token Support
 * Ermöglicht das Abbrechen von TTS-Operationen durch externes Cancellation-Flag
 */
import { ref, computed } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'

export function useTTSWithCancellation(getCancelled: () => boolean) {
  const settingsStore = useSettingsStore()
  const isSpeaking = ref(false)
  
  const enabled = computed(() => settingsStore.settings.voiceEnabled ?? true)

  function speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // ✅ Prüfe vor Start ob cancelled
      if (getCancelled()) {
        reject(new Error('TTS cancelled before start'))
        return
      }

      // ✅ Kein Text oder TTS deaktiviert
      if (!enabled.value || !text.trim()) {
        setTimeout(() => resolve(), 500)
        return
      }

      const isMuted = simpleFlowController.getTTSMuted()
      const synth = window.speechSynthesis
      if (!synth) {
        setTimeout(() => resolve(), 500)
        return
      }

      synth.cancel()

      let resolved = false
      let timeoutId: number | null = null
      let pollInterval: number | null = null

      const finish = (cancelled = false) => {
        if (!resolved) {
          resolved = true
          isSpeaking.value = false
          
          if (timeoutId) clearTimeout(timeoutId)
          if (pollInterval) clearInterval(pollInterval)
          
          if (cancelled) {
            reject(new Error('TTS cancelled'))
          } else {
            resolve()
          }
        }
      }

      // ✅ Timeout mit Cancellation-Check
      timeoutId = window.setTimeout(() => {
        if (!resolved) {
          synth.cancel()
          finish(getCancelled())
        }
      }, 10000)

      const utterance = new SpeechSynthesisUtterance(text.trim())
      utterance.lang = 'de-DE'
      utterance.rate = 1.0
      utterance.volume = isMuted ? 0 : 1.0

      isSpeaking.value = true

      utterance.onstart = () => {
        // ✅ Prüfe während TTS ob cancelled
        if (getCancelled()) {
          synth.cancel()
          finish(true)
          return
        }
      }

      utterance.onend = () => {
        finish()
      }

      utterance.onerror = () => {
        finish(true)
      }

      // ✅ Polling für Cancellation während TTS läuft
      pollInterval = window.setInterval(() => {
        if (getCancelled() && !resolved) {
          synth.cancel()
          finish(true)
        }
      }, 100)

      synth.speak(utterance)
    })
  }

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

