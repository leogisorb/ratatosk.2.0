/**
 * TTS mit Cancellation Token Support
 */
import { ref, computed } from 'vue'
import { useSettingsStore } from '../../settings/stores/settings'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'

export function useTTSWithCancellation(getCancelled: () => boolean) {
  const settingsStore = useSettingsStore()
  const isSpeaking = ref(false)

  const enabled = computed(() => settingsStore.settings.voiceEnabled ?? true)

  function speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Prüfen ob bereits abgebrochen wurde
      if (getCancelled()) {
        reject(new Error('TTS cancelled before start'))
        return
      }

      // Kein Text oder TTS deaktiviert
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

      const finish = (cancelled = false) => {
        if (!resolved) {
          resolved = true
          isSpeaking.value = false
          if (cancelled) {
            reject(new Error('TTS cancelled'))
          } else {
            resolve()
          }
        }
      }

      // Timeout mit Abbruch-Prüfung
      const timeoutId = setTimeout(() => {
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
        // Prüfen ob während TTS abgebrochen wurde
        if (getCancelled()) {
          synth.cancel()
          clearTimeout(timeoutId)
          finish(true)
        }
      }

      utterance.onend = () => {
        clearTimeout(timeoutId)
        finish()
      }

      utterance.onerror = () => {
        clearTimeout(timeoutId)
        finish(true)
      }

      // Regelmäßig prüfen ob TTS abgebrochen wurde
      const pollInterval = setInterval(() => {
        if (getCancelled() && !resolved) {
          synth.cancel()
          clearTimeout(timeoutId)
          clearInterval(pollInterval)
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

