/**
 * TTS mit Cancellation Token Support
 * Ermöglicht das Abbrechen von TTS-Operationen durch externes Cancellation-Flag
 * 
 * @deprecated Verwende stattdessen TTSService direkt. Diese Funktion wird für Rückwärtskompatibilität bereitgestellt.
 */
import { ref, computed } from 'vue'
import { useSettingsStore } from '../../features/settings/stores/settings'
import { simpleFlowController } from '../../core/application/SimpleFlowController'
import { TIMING } from '../constants/timing'
import { handleError, isAbortError } from '../utils/errorHandling'
import { ttsService } from '../services/TTSService'
import { timerManager } from '../utils/TimerManager'

export function useTTSWithCancellation(getCancelled: () => boolean) {
  const settingsStore = useSettingsStore()
  const isSpeaking = ref(false)
  
  const enabled = computed(() => settingsStore.settings.voiceEnabled ?? true)

  async function speak(text: string): Promise<void> {
      // Prüfen ob bereits abgebrochen wurde
      if (getCancelled()) {
      throw new Error('TTS cancelled before start')
      }

      // Kein Text oder TTS deaktiviert
      if (!enabled.value || !text.trim()) {
      await timerManager.delay(TIMING.TTS.EMPTY_TEXT_DELAY)
        return
      }

      // Prüfen ob TTS stumm geschaltet ist - dann sofort auflösen ohne TTS
      const isMuted = simpleFlowController.getTTSMuted()
      if (isMuted) {
        return
      }

    // Prüfe TTS-Verfügbarkeit
    if (!ttsService.isAvailable()) {
      await timerManager.delay(TIMING.TTS.EMPTY_TEXT_DELAY)
        return
      }

    // Erstelle AbortController für Cancellation
    const abortController = new AbortController()
    
    // Polling für Cancellation-Check
    const pollHandle = timerManager.setInterval(() => {
      if (getCancelled()) {
        abortController.abort()
        pollHandle.cancel()
      }
    }, 100)

    try {
      isSpeaking.value = true

      await ttsService.speak(text, {
        rate: 1.0,
        volume: 1.0
      }, {
        signal: abortController.signal,
        timeout: TIMING.TTS.DEFAULT_TIMEOUT,
        onStart: () => {
        // Prüfen ob während TTS abgebrochen wurde
        if (getCancelled()) {
            abortController.abort()
        }
        },
        onEnd: () => {
          isSpeaking.value = false
          pollHandle.cancel()
        },
        onError: (error) => {
          isSpeaking.value = false
          pollHandle.cancel()
          handleError('[TTS] Utterance error', error, { logLevel: 'warn' })
        }
      })
    } catch (error) {
      isSpeaking.value = false
      pollHandle.cancel()
      
      // AbortError ist kein echter Fehler
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('TTS cancelled')
        }
      
      throw error
    }
  }

  function cancel() {
    ttsService.cancel()
    isSpeaking.value = false
  }

  return { 
    isSpeaking: computed(() => isSpeaking.value),
    enabled,
    speak,
    cancel
  }
}

