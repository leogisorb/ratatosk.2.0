/**
 * TTSService - Zentrale TTS-Logik
 * Eliminiert Duplikate zwischen SimpleFlowController und useTTSWithCancellation
 */

import { timerManager } from '../utils/TimerManager'

export interface TTSConfig {
  lang?: string
  rate?: number
  pitch?: number
  volume?: number
  voice?: SpeechSynthesisVoice
}

export interface TTSOptions {
  signal?: AbortSignal
  timeout?: number
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
}

/**
 * TTS-Fehlermeldungen
 */
const TTS_ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'TTS not allowed - user interaction required',
  'canceled': 'TTS canceled by browser',
  'interrupted': 'TTS interrupted',
  'audio-busy': 'Audio system busy',
  'audio-hardware': 'Audio hardware error',
  'network': 'Network error',
  'synthesis-unavailable': 'Synthesis unavailable',
  'synthesis-failed': 'Synthesis failed',
  'language-unavailable': 'Language unavailable',
  'voice-unavailable': 'Voice unavailable',
  'text-too-long': 'Text too long',
  'invalid-argument': 'Invalid argument'
} as const

/**
 * TTSService - Zentrale TTS-Implementierung
 */
export class TTSService {
  private speechSynthesis: SpeechSynthesis
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private isSpeaking = false
  private defaultConfig: Required<Omit<TTSConfig, 'voice'>> & { voice?: SpeechSynthesisVoice } = {
    lang: 'de-DE',
    rate: 0.8,
    pitch: 1.0,
    volume: 0.8
  }

  constructor() {
    this.speechSynthesis = window.speechSynthesis
    this.setupVoiceHandling()
  }

  /**
   * Prüft ob TTS verfügbar ist
   */
  isAvailable(): boolean {
    return !!(this.speechSynthesis && 'speechSynthesis' in window)
  }

  /**
   * Prüft ob TTS gerade spricht
   */
  getIsSpeaking(): boolean {
    return this.isSpeaking
  }

  /**
   * Spricht Text mit Promise-basierter API
   */
  async speak(
    text: string,
    config: Partial<TTSConfig> = {},
    options: TTSOptions = {}
  ): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('TTS not available')
    }

    if (!text.trim()) {
      return
    }

    // Stoppe vorherige TTS
    this.cancel()

    // Warte kurz bevor neue TTS startet
    await timerManager.delay(200)

    return new Promise((resolve, reject) => {
      if (!this.speechSynthesis) {
        reject(new Error('Speech synthesis not available'))
        return
      }

      // Prüfe Abbruch-Signal
      if (options.signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'))
        return
      }

      // Markiere als sprechend
      this.isSpeaking = true

      // Erstelle Utterance
      this.currentUtterance = new SpeechSynthesisUtterance(text.trim())
      const finalConfig = { ...this.defaultConfig, ...config }
      this.currentUtterance.lang = finalConfig.lang
      this.currentUtterance.rate = finalConfig.rate
      this.currentUtterance.pitch = finalConfig.pitch
      this.currentUtterance.volume = finalConfig.volume

      // Wähle Stimme
      if (finalConfig.voice) {
        this.currentUtterance.voice = finalConfig.voice
      } else {
        const voices = this.speechSynthesis.getVoices()
        if (voices.length > 0) {
          const germanVoice =
            voices.find(voice => voice.lang.startsWith('de') && voice.name.includes('Anna')) ||
            voices.find(voice => voice.lang.startsWith('de'))
          if (germanVoice) {
            this.currentUtterance.voice = germanVoice
          }
        }
      }

      // Abbruch-Handler
      if (options.signal) {
        const abortHandler = () => {
          this.speechSynthesis.cancel()
          this.isSpeaking = false
          reject(new DOMException('Aborted', 'AbortError'))
        }
        options.signal.addEventListener('abort', abortHandler, { once: true })
      }

      // Timeout-Handler
      let timeoutHandle: ReturnType<typeof setTimeout> | null = null
      const timeout = options.timeout ?? 10000
      if (timeout > 0) {
        timeoutHandle = setTimeout(() => {
          if (this.isSpeaking && !this.speechSynthesis.speaking) {
            this.isSpeaking = false
            reject(new Error('TTS failed to start'))
          }
        }, 100)
      }

      // Event-Handler
      this.currentUtterance.onstart = () => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle)
          timeoutHandle = null
        }
        if (options.signal?.aborted) {
          this.speechSynthesis.cancel()
          this.isSpeaking = false
          reject(new DOMException('Aborted', 'AbortError'))
          return
        }
        options.onStart?.()
      }

      this.currentUtterance.onend = () => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle)
        }
        this.isSpeaking = false
        options.onEnd?.()
        resolve()
      }

      this.currentUtterance.onerror = (event) => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle)
        }
        this.isSpeaking = false

        // "canceled" ist kein echter Fehler
        if (event.error === 'canceled') {
          options.onEnd?.()
          resolve()
          return
        }

        // Echte Fehler behandeln
        const errorMessage = TTS_ERROR_MESSAGES[event.error] || `Unknown TTS error: ${event.error}`
        const error = new Error(errorMessage)
        options.onError?.(error)
        reject(error)
      }

      // Starte TTS
      try {
        this.speechSynthesis.speak(this.currentUtterance)
      } catch (error) {
        this.isSpeaking = false
        const err = error instanceof Error ? error : new Error('TTS blocked by browser')
        options.onError?.(err)
        reject(err)
      }
    })
  }

  /**
   * Bricht aktuelle TTS ab
   */
  cancel(): void {
    if (this.speechSynthesis.speaking) {
      this.speechSynthesis.cancel()
    }
    this.currentUtterance = null
    this.isSpeaking = false
  }

  /**
   * Setzt Standard-Konfiguration
   */
  setDefaultConfig(config: Partial<TTSConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config }
  }

  /**
   * Setup für Voice-Handling
   */
  private setupVoiceHandling(): void {
    if (this.speechSynthesis.getVoices().length === 0) {
      this.speechSynthesis.addEventListener('voiceschanged', () => {
        // Voices geladen
      })
    }
  }
}

/**
 * Globale TTSService-Instanz
 */
export const ttsService = new TTSService()

