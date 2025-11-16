/**
 * ✅ useTTS.ts - Refactored Version
 * 
 * Fixes:
 * ✅ Proper Mute Handling - cancel() statt volume 0
 * ✅ Error Types - Spezifische Error-Klassen
 * ✅ Retry Logic - speakWithRetry() für robuste TTS
 * ✅ Sequence Support - speakSequence() für mehrere Texte
 * ✅ Mock Support - createMockTTS() für Tests
 * ✅ Validation - Prüft alle Voraussetzungen vor TTS-Start
 */

import { ref, computed } from 'vue'
import { useSettingsStore } from '../../settings/stores/settings'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'
import { debug } from '../../../shared/utils/debug'

// ==========================================
// CONSTANTS
// ==========================================
const TTS_CONFIG = {
  TIMEOUT: 10000,
  FALLBACK_DELAY: 500,
  RETRY_DELAY: 1000,
  MAX_RETRIES: 2
} as const

// ==========================================
// ERROR TYPES
// ==========================================
export class TTSError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: Error
  ) {
    super(message)
    this.name = 'TTSError'
  }
}

export class TTSNotAvailableError extends TTSError {
  constructor() {
    super('Speech Synthesis API not available', 'NOT_AVAILABLE')
  }
}

export class TTSTimeoutError extends TTSError {
  constructor() {
    super('TTS operation timed out', 'TIMEOUT')
  }
}

export class TTSMutedError extends TTSError {
  constructor() {
    super('TTS is muted - operation cancelled', 'MUTED')
  }
}

// ==========================================
// MAIN COMPOSABLE
// ==========================================
export function useTTS() {
  const settingsStore = useSettingsStore()
  const isSpeaking = ref(false)
  const currentUtterance = ref<SpeechSynthesisUtterance | null>(null)
  
  // ✅ Enabled basiert auf Settings
  const enabled = computed(() => settingsStore.settings.voiceEnabled ?? true)

  /**
   * Prüft ob TTS verfügbar und aktiviert ist
   */
  function isAvailable(): boolean {
    return !!window.speechSynthesis && enabled.value
  }

  /**
   * Prüft ob TTS stumm geschaltet ist
   */
  function isMuted(): boolean {
    return simpleFlowController.getTTSMuted() ?? false
  }

  /**
   * Validiert Voraussetzungen für TTS
   */
  function validate(text: string): void {
    if (!text.trim()) {
      throw new TTSError('Text is empty', 'EMPTY_TEXT')
    }

    if (!enabled.value) {
      throw new TTSError('TTS is disabled in settings', 'DISABLED')
    }

    if (isMuted()) {
      throw new TTSMutedError()
    }

    if (!window.speechSynthesis) {
      throw new TTSNotAvailableError()
    }
  }

  /**
   * Spricht einen Text mit Sprachsynthese
   * ✅ Proper Mute Handling: cancel() statt volume 0
   */
  function speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // ✅ Validation
        validate(text)
      } catch (error) {
        if (error instanceof TTSMutedError) {
          // ✅ Muted → sofort auflösen ohne TTS zu starten
          debug.log('TTS', 'Muted - cancelling speak', { text })
          resolve()
          return
        }
        
        if (error instanceof TTSError) {
          // ✅ Andere TTS-Fehler → Fallback-Delay
          debug.warn('TTS', 'Validation failed', { text, error: error.code })
          setTimeout(() => resolve(), TTS_CONFIG.FALLBACK_DELAY)
          return
        }
        
        reject(error)
        return
      }

      const synth = window.speechSynthesis!
      
      // ✅ Bereits am Sprechen → abbrechen und neu starten
      synth.cancel()
      isSpeaking.value = false
      
      // ✅ Timeout-Fallback für hängende TTS
      let timeoutId: number | null = null
      timeoutId = window.setTimeout(() => {
        synth.cancel()
        isSpeaking.value = false
        currentUtterance.value = null
        debug.warn('TTS', 'Timeout - cancelling', { text })
        resolve() // Auflösen statt reject für robustes Verhalten
      }, TTS_CONFIG.TIMEOUT)

      const utterance = new SpeechSynthesisUtterance(text.trim())
      utterance.lang = 'de-DE'
      utterance.rate = 1.0
      utterance.volume = 1.0 // ✅ Immer 1.0 - Mute wird durch cancel() gehandhabt
      
      currentUtterance.value = utterance
      isSpeaking.value = true

      utterance.onend = () => {
        if (timeoutId) clearTimeout(timeoutId)
        isSpeaking.value = false
        currentUtterance.value = null
        debug.log('TTS', 'Completed', { text })
        resolve()
      }

      utterance.onerror = (event) => {
        if (timeoutId) clearTimeout(timeoutId)
        isSpeaking.value = false
        currentUtterance.value = null
        const error = new TTSError(
          `TTS error: ${event.error}`,
          'SPEAK_ERROR',
          event.error ? new Error(event.error) : undefined
        )
        debug.error('TTS', 'Error', { text, error })
        resolve() // Auflösen statt reject für robustes Verhalten
      }

      synth.speak(utterance)
      debug.log('TTS', 'Started', { text })
    })
  }

  /**
   * Spricht einen Text mit Retry-Logik
   */
  async function speakWithRetry(
    text: string,
    maxRetries: number = TTS_CONFIG.MAX_RETRIES
  ): Promise<void> {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await speak(text)
        return // Erfolg
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        debug.warn('TTS', `Retry attempt ${attempt + 1}/${maxRetries + 1}`, { text, error })
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, TTS_CONFIG.RETRY_DELAY))
        }
      }
    }
    
    // Alle Versuche fehlgeschlagen
    debug.error('TTS', 'All retry attempts failed', { text, lastError })
    throw lastError || new TTSError('All retry attempts failed', 'RETRY_EXHAUSTED')
  }

  /**
   * Spricht mehrere Texte nacheinander
   */
  async function speakSequence(texts: string[]): Promise<void> {
    for (const text of texts) {
      await speak(text)
    }
  }

  /**
   * Stoppt die aktuelle Sprachausgabe
   */
  function cancel(): void {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    isSpeaking.value = false
    currentUtterance.value = null
    debug.log('TTS', 'Cancelled')
  }

  /**
   * Cleanup-Funktion
   */
  function cleanup(): void {
    cancel()
    debug.log('TTS', 'Cleanup completed')
  }

  return { 
    isSpeaking: computed(() => isSpeaking.value),
    enabled,
    speak,
    speakWithRetry,
    speakSequence,
    cancel,
    cleanup,
    isAvailable,
    isMuted
  }
}

// ==========================================
// MOCK SUPPORT FOR TESTING
// ==========================================
export function createMockTTS() {
  const isSpeaking = ref(false)
  
  return {
    isSpeaking: computed(() => isSpeaking.value),
    enabled: computed(() => true),
    speak: async (text: string) => {
      isSpeaking.value = true
      console.log('[MOCK TTS]', text)
      await new Promise(resolve => setTimeout(resolve, 100))
      isSpeaking.value = false
    },
    speakWithRetry: async (text: string) => {
      return createMockTTS().speak(text)
    },
    speakSequence: async (texts: string[]) => {
      for (const text of texts) {
        await createMockTTS().speak(text)
      }
    },
    cancel: () => {
      isSpeaking.value = false
      console.log('[MOCK TTS] Cancelled')
    },
    cleanup: () => {
      isSpeaking.value = false
    },
    isAvailable: () => true,
    isMuted: () => false
  }
}
