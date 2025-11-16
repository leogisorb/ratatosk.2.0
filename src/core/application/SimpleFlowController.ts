/**
 * Einfacher, funktionierender FlowController
 * Basiert auf der bewährten alten Architektur, aber zentralisiert
 */

// Named Constants für Magic Numbers
const TTS_CONFIG = {
  CHECK_INTERVAL_MS: 100,
  PAUSE_BETWEEN_ITEMS_MS: 500,
  RESTART_DELAY_MS: 200,
  FALLBACK_TIMEOUT_MS: 100,
  LOCK_POLL_INTERVAL_MS: 50
} as const

const AUTO_MODE_CONFIG = {
  CYCLE_POST_TTS_DELAY_MS: 1000,
  DEFAULT_INITIAL_DELAY_MS: 3000,
  DEFAULT_CYCLE_DELAY_MS: 3000
} as const

const STORAGE_CONFIG = {
  MUTE_STATE_KEY: 'ratatosk-tts-muted',
  USER_INTERACTION_TIMEOUT_MS: 10000
} as const

export class SimpleFlowController {
  // Singleton mit besserer Typsicherheit (Lazy Initialization ohne null)
  private static instance: SimpleFlowController
  
  // Error-Map statt Switch-Case für TTS Errors
  private readonly TTS_ERROR_MESSAGES: Record<string, string> = {
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
  }
  
  private speechSynthesis: SpeechSynthesis
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private autoModeInterval: number | null = null
  private currentView: string | null = null
  private currentItems: unknown[] = []
  private currentIndex: number = 0
  private onCycleCallback: ((index: number, item: unknown) => void) | null = null
  private isAutoModeActive: boolean = false
  private userInteracted: boolean = false
  private isSpeaking: boolean = false
  private pendingCycle: boolean = false
  private currentCycleDelay: number = 3000
  private isTTSMuted: boolean = false
  private ttsQueue: string[] = []
  private isProcessingQueue: boolean = false
  private ttsEndListeners: (() => void)[] = []
  
  // ✅ Async Queue statt Busy-Wait: Promise-basierte Queue
  // Jeder neue TTS-Request wird an die Queue angehängt
  private ttsQueuePromise: Promise<void> = Promise.resolve()

  private constructor() {
    this.speechSynthesis = window.speechSynthesis
    this.setupVoiceHandling()
    // ✅ Lade Mute-State aus localStorage beim Initialisieren
    this.loadMuteState()
  }

  public static getInstance(): SimpleFlowController {
    return this.instance ??= new SimpleFlowController()
  }

  /**
   * Setzt den aktiven View
   */
  public setActiveView(viewName: string): void {
    console.log('SimpleFlowController: Setting active view to:', viewName)
    
    // ✅ Stoppe alle laufenden Prozesse
    this.stopAutoMode()
    this.stopTTSOnly() // Nur TTS stoppen, Queue nicht leeren
    
    // Setze View sofort
    this.currentView = viewName
    console.log('SimpleFlowController: Active view set to:', viewName)
  }

  /**
   * Prüft, ob der angegebene View der aktive ist
   */
  public isActiveView(viewName: string): boolean {
    return this.currentView === viewName
  }

  /**
   * @deprecated Verwende stattdessen useAutoMode() aus shared/composables/useAutoMode.ts
   * Diese Methode wird nur noch für Rückwärtskompatibilität bereitgestellt.
   * Startet Auto-Mode für den aktuellen View
   */
  public startAutoMode(
    items: unknown[],
    onCycle: (currentIndex: number, currentItem: unknown) => void,
    initialDelay: number = 3000,
    cycleDelay: number = 3000
  ): boolean {
    console.warn('SimpleFlowController.startAutoMode() is deprecated. Use useAutoMode() from shared/composables/useAutoMode.ts instead.')
    
    // ✅ Stoppe zuerst alle laufenden Auto-Modes
    if (this.autoModeInterval || this.isAutoModeActive) {
      console.warn('SimpleFlowController: Auto-mode already running - stopping previous instance')
      this.stopAutoMode()
    }

    if (!this.currentView) {
      console.log('SimpleFlowController: No active view')
      return false
    }

    console.log('SimpleFlowController: Starting auto-mode with', items.length, 'items for view:', this.currentView)
    
    this.currentItems = items
    this.onCycleCallback = onCycle
    this.currentIndex = 0
    this.isAutoModeActive = true
    this.currentCycleDelay = cycleDelay

    // Starte Auto-Mode nach initialer Verzögerung
    setTimeout(() => {
      // ✅ Prüfe nochmal, ob Auto-Mode noch aktiv sein soll
      if (this.isAutoModeActive) {
        this.executeCycle(cycleDelay)
      }
    }, initialDelay || AUTO_MODE_CONFIG.DEFAULT_INITIAL_DELAY_MS)

    return true
  }

  /**
   * Stoppt Auto-Mode
   */
  public stopAutoMode(): void {
    if (this.autoModeInterval) {
      clearTimeout(this.autoModeInterval)
      this.autoModeInterval = null
    }
    this.isAutoModeActive = false
    this.pendingCycle = false
    console.log('SimpleFlowController: Auto-mode stopped')
  }

  /**
   * Führt einen Auto-Mode-Zyklus aus
   */
  private executeCycle(cycleDelay: number): void {
    // ✅ Prüfe ob Auto-Mode noch aktiv sein soll
    if (!this.isAutoModeActive || !this.onCycleCallback || this.currentItems.length === 0) {
      console.log('SimpleFlowController: Auto-mode cycle stopped - conditions not met')
      return
    }

    const currentItem = this.currentItems[this.currentIndex]
    if (!currentItem) {
      console.error('SimpleFlowController: Item not found at index:', this.currentIndex)
      this.currentIndex = 0 // Reset to beginning
      this.autoModeInterval = window.setTimeout(() => {
        this.executeCycle(cycleDelay)
      }, cycleDelay)
      return
    }

    console.log('SimpleFlowController: Auto-mode cycle:', currentItem.title || currentItem.text, 'at index:', this.currentIndex)
    
    // Führe Callback aus
    this.onCycleCallback(this.currentIndex, currentItem)
    
    // Nächster Index
    this.currentIndex = (this.currentIndex + 1) % this.currentItems.length
    
    // Warte auf TTS-Ende + 1 Sekunde, dann nächster Zyklus
    this.scheduleNextCycle(cycleDelay)
  }

  /**
   * Plant den nächsten Auto-Mode-Zyklus
   */
  private scheduleNextCycle(cycleDelay: number): void {
    if (this.isSpeaking) {
      // TTS läuft noch, warte auf Ende
      this.pendingCycle = true
      console.log('SimpleFlowController: TTS still speaking, waiting for completion...')
      return
    }

    // TTS ist fertig, plane nächsten Zyklus
    this.autoModeInterval = window.setTimeout(() => {
      this.executeCycle(cycleDelay)
    }, cycleDelay)
  }

  /**
   * TTS sprechen
   */
  public async speak(text: string): Promise<void> {
    if (!this.isTTSAvailable()) {
      console.log('SimpleFlowController: TTS not available:', text)
      return
    }

    if (!this.userInteracted) {
      console.log('SimpleFlowController: TTS not allowed yet - user must interact first:', text)
      return
    }

    if (this.isTTSMuted) {
      console.log('SimpleFlowController: TTS is muted, not speaking:', text)
      return
    }

    await this.queueAndSpeak(text)
  }

  /**
   * TTS sprechen (für virtuelle Tastatur - ohne userInteracted Check)
   */
  public async speakForVirtualKeyboard(text: string): Promise<void> {
    if (!this.isTTSAvailable()) {
      console.log('SimpleFlowController: TTS not available for virtual keyboard:', text)
      return
    }

    if (this.isTTSMuted) {
      console.log('SimpleFlowController: TTS is muted, not speaking:', text)
      return
    }

    await this.queueAndSpeak(text)
  }

  /**
   * TTS in Queue einreihen und verarbeiten
   * ✅ Fix: Async Queue statt Busy-Wait (Promise-basiert)
   * Verhindert Race Conditions durch sequentielle Promise-Kette
   */
  private async queueAndSpeak(text: string): Promise<void> {
    // Prüfe auf Duplikate in der Queue
    if (this.ttsQueue.includes(text)) {
      console.log('SimpleFlowController: Duplicate TTS text skipped:', text)
      return
    }
    
    // Füge Text zur Queue hinzu
    this.ttsQueue.push(text)
    console.log('SimpleFlowController: Added to TTS queue:', text, 'Queue length:', this.ttsQueue.length)
    
    // ✅ Async Queue: Jeder neue Request wird an die Promise-Kette angehängt
    // Dies verhindert Race Conditions, da alle Requests sequentiell verarbeitet werden
    this.ttsQueuePromise = this.ttsQueuePromise.then(async () => {
      // Verarbeite alle Items in der Queue sequentiell
      while (this.ttsQueue.length > 0) {
        // Warte bis vorherige TTS fertig ist
        while (this.isSpeaking) {
          await new Promise(resolve => setTimeout(resolve, TTS_CONFIG.CHECK_INTERVAL_MS))
        }
        
        // Verarbeite nächsten Queue-Item
        const text = this.ttsQueue.shift()!
        console.log('SimpleFlowController: Processing queue item:', text)
        await this.performSpeak(text)
        
        // Pause zwischen TTS-Items um Browser-Abbrüche zu vermeiden
        if (this.ttsQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, TTS_CONFIG.PAUSE_BETWEEN_ITEMS_MS))
        }
      }
      
      // Triggere TTS-Ende-Listener wenn Queue komplett abgearbeitet ist
      if (this.ttsQueue.length === 0 && this.ttsEndListeners.length > 0) {
        this.triggerTTSEndListeners()
      }
    }).catch(error => {
      console.error('SimpleFlowController: Error in TTS queue:', error)
    })
    
    return this.ttsQueuePromise
  }

  /**
   * @deprecated TTS-Queue wird jetzt über async Promise-Kette verwaltet
   * Diese Methode wird nicht mehr verwendet, bleibt für Rückwärtskompatibilität
   */
  private async processQueue(): Promise<void> {
    // Wird nicht mehr verwendet - Queue wird über queueAndSpeak() verwaltet
    console.warn('SimpleFlowController: processQueue() is deprecated, queue is managed via async Promise chain')
  }

  /**
   * TTS ausführen (Promise-basiert statt Callbacks)
   */
  private async performSpeak(text: string): Promise<void> {
    console.log('SimpleFlowController: Speaking:', text)
    
    // Stoppe nur die aktuelle TTS, aber leere nicht die Queue
    this.stopTTSOnly()
    await new Promise(resolve => setTimeout(resolve, TTS_CONFIG.RESTART_DELAY_MS))
    
    // Prüfe ob Speech Synthesis verfügbar ist
    if (!this.speechSynthesis) {
      console.warn('SimpleFlowController: Speech synthesis not available')
      this.isSpeaking = false
      return
    }

    // Prüfe Browser-Unterstützung
    if (!('speechSynthesis' in window)) {
      console.warn('SimpleFlowController: Speech synthesis not supported by browser')
      this.isSpeaking = false
      return
    }

    // Markiere als sprechend
    this.isSpeaking = true

    // Erstelle neue TTS
    this.currentUtterance = new SpeechSynthesisUtterance(text)
    this.currentUtterance.lang = 'de-DE'
    this.currentUtterance.rate = 0.8
    this.currentUtterance.pitch = 1.0
    this.currentUtterance.volume = this.isTTSMuted ? 0 : 0.8  // Lautstärke basierend auf Mute-Status

    // Wähle Stimme
    const voices = this.speechSynthesis.getVoices()
    if (voices.length > 0) {
      const germanVoice = voices.find(voice => 
        voice.lang.startsWith('de') && voice.name.includes('Anna')
      ) || voices.find(voice => voice.lang.startsWith('de'))

      if (germanVoice) {
        this.currentUtterance.voice = germanVoice
      }
    }

    // Promise-basiertes TTS statt Callbacks
    return new Promise((resolve, reject) => {
      if (!this.currentUtterance) {
        reject(new Error('Utterance not created'))
        return
      }

      // Event-Handler
      this.currentUtterance.onend = () => {
        console.log('SimpleFlowController: Finished speaking:', text)
        this.isSpeaking = false
        
        // ✅ Fix: Race Condition bei TTS + Auto-Mode
        // Atomare Prüfung und Update von pendingCycle
        const wasPending = this.pendingCycle
        const isAutoModeStillActive = this.isAutoModeActive
        
        if (wasPending && isAutoModeStillActive) {
          // Atomare Update: Setze pendingCycle auf false
          this.pendingCycle = false
          console.log('SimpleFlowController: TTS finished, starting next cycle...')
          
          // Starte nächsten Zyklus nach Delay
          setTimeout(() => {
            // Prüfe nochmal ob Auto-Mode noch aktiv (Race Condition Prevention)
            if (this.isAutoModeActive) {
              // Verwende den aktuellen cycleDelay
              this.autoModeInterval = window.setTimeout(() => {
                this.executeCycle(this.currentCycleDelay)
              }, AUTO_MODE_CONFIG.CYCLE_POST_TTS_DELAY_MS)
            }
          }, AUTO_MODE_CONFIG.CYCLE_POST_TTS_DELAY_MS)
        }
        
        // Prüfe ob TTS-Queue leer ist und triggere Listener
        if (this.ttsQueue.length === 0 && this.ttsEndListeners.length > 0) {
          this.triggerTTSEndListeners()
        }
        
        resolve()
      }

      this.currentUtterance.onerror = (event) => {
        const errorMessage = this.TTS_ERROR_MESSAGES[event.error] || `Unknown TTS error: ${event.error}`
        console.warn('SimpleFlowController:', errorMessage, 'for text:', text)
        this.isSpeaking = false
        
        // Spezielle Behandlung für not-allowed
        if (event.error === 'not-allowed') {
          this.requestUserInteraction()
        }
        
        // Auch bei Fehlern prüfen ob TTS-Queue leer ist und Listener triggern
        if (this.ttsQueue.length === 0 && this.ttsEndListeners.length > 0) {
          this.triggerTTSEndListeners()
        }
        
        reject(new Error(errorMessage))
      }

      // Starte TTS mit Fehlerbehandlung
      try {
        this.speechSynthesis.speak(this.currentUtterance)
        
        // Fallback: Wenn TTS nach Timeout nicht startet, markiere als fehlgeschlagen
        setTimeout(() => {
          if (this.isSpeaking && !this.speechSynthesis.speaking) {
            console.warn('SimpleFlowController: TTS failed to start, marking as failed')
            this.isSpeaking = false
            reject(new Error('TTS failed to start'))
          }
        }, TTS_CONFIG.FALLBACK_TIMEOUT_MS)
        
      } catch (error) {
        console.warn('SimpleFlowController: TTS blocked by browser:', error)
        this.isSpeaking = false
        reject(error instanceof Error ? error : new Error('TTS blocked by browser'))
      }
    })
  }

  /**
   * Stoppt TTS und leert die Queue (nur bei explizitem Stoppen)
   */
  public stopTTS(): void {
    if (this.speechSynthesis.speaking) {
      this.speechSynthesis.cancel()
      this.currentUtterance = null
      this.isSpeaking = false
      this.pendingCycle = false
      console.log('SimpleFlowController: TTS stopped')
    }
    
    // Leere auch die TTS-Queue nur bei explizitem Stoppen
    this.ttsQueue = []
    // Reset Promise-Kette für neue Queue
    this.ttsQueuePromise = Promise.resolve()
    console.log('SimpleFlowController: TTS queue cleared (explicit stop)')
    
    // Entferne alle Listener bei explizitem Stoppen
    this.clearTTSEndListeners()
  }

  /**
   * Stoppt TTS ohne Queue zu leeren (für sanfte Übergänge)
   */
  public stopTTSOnly(): void {
    if (this.speechSynthesis.speaking) {
      this.speechSynthesis.cancel()
      this.currentUtterance = null
      this.isSpeaking = false
      this.pendingCycle = false
      console.log('SimpleFlowController: TTS stopped (queue preserved)')
    }
  }

  /**
   * Setzt Benutzer-Interaktion
   */
  public setUserInteracted(interacted: boolean): void {
    this.userInteracted = interacted
    console.log('SimpleFlowController: User interaction set to:', interacted)
  }

  /**
   * Fordert Benutzer-Interaktion an (für TTS-Fehler)
   */
  private requestUserInteraction(): void {
    if (this.userInteracted) return
    
    console.log('SimpleFlowController: Requesting user interaction for TTS...')
    
    // Erstelle temporären Event Listener für User-Interaktion
    const enableTTS = () => {
      this.userInteracted = true
      console.log('SimpleFlowController: User interaction detected, TTS enabled')
      
      // Entferne Event Listener
      document.removeEventListener('click', enableTTS)
      document.removeEventListener('touchstart', enableTTS)
      document.removeEventListener('keydown', enableTTS)
      window.removeEventListener('faceBlinkDetected', enableTTS)
    }
    
    // Event Listener für User-Interaktion
    document.addEventListener('click', enableTTS, { once: true })
    document.addEventListener('touchstart', enableTTS, { once: true })
    document.addEventListener('keydown', enableTTS, { once: true })
    window.addEventListener('faceBlinkDetected', enableTTS, { once: true })
    
    // Fallback: Entferne Event Listener nach Timeout
    setTimeout(() => {
      document.removeEventListener('click', enableTTS)
      document.removeEventListener('touchstart', enableTTS)
      document.removeEventListener('keydown', enableTTS)
      window.removeEventListener('faceBlinkDetected', enableTTS)
    }, STORAGE_CONFIG.USER_INTERACTION_TIMEOUT_MS)
  }

  /**
   * Lädt Mute-State aus localStorage
   * Mit besserer Fehlerbehandlung für Safari Private Mode etc.
   */
  private loadMuteState(): void {
    try {
      const savedMuted = localStorage.getItem(STORAGE_CONFIG.MUTE_STATE_KEY)
      if (savedMuted !== null) {
        this.isTTSMuted = savedMuted === 'true'
        console.log('SimpleFlowController: Mute state loaded from localStorage:', this.isTTSMuted)
      } else {
        // Default: nicht stumm
        this.isTTSMuted = false
        console.log('SimpleFlowController: No saved mute state, using default (not muted)')
      }
    } catch (error) {
      // Safari Private Mode wirft DOMException
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('SimpleFlowController: localStorage quota exceeded')
      } else {
        console.error('SimpleFlowController: Failed to load mute state:', error)
      }
      this.isTTSMuted = false
    }
  }

  /**
   * Speichert Mute-State in localStorage
   * Mit besserer Fehlerbehandlung für Safari Private Mode etc.
   */
  private saveMuteState(): void {
    try {
      localStorage.setItem(STORAGE_CONFIG.MUTE_STATE_KEY, String(this.isTTSMuted))
      console.log('SimpleFlowController: Mute state saved to localStorage:', this.isTTSMuted)
    } catch (error) {
      // Safari Private Mode wirft DOMException
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('SimpleFlowController: localStorage quota exceeded')
      } else {
        console.error('SimpleFlowController: Failed to save mute state:', error)
      }
    }
  }

  /**
   * Schaltet TTS global stumm/an (durch sanftes Ausfaden)
   * ✅ NUR vom Header-Button aufrufbar - Views dürfen dies NICHT tun!
   */
  public setTTSMuted(muted: boolean): void {
    this.isTTSMuted = muted
    console.log('SimpleFlowController: TTS muted set to:', muted)
    
    // ✅ Speichere Mute-State persistent
    this.saveMuteState()
    
    // ✅ Wenn stumm geschaltet wird: Stoppe alle laufenden TTS (auch außerhalb SimpleFlowController)
    if (muted) {
      // Stoppe SimpleFlowController TTS
      this.stopTTSOnly()
      
      // ✅ Stoppe auch alle anderen TTS (von useTTS Composables und direkten Aufrufen)
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
        console.log('SimpleFlowController: All TTS cancelled (muted)')
      }
    }
    
    // Sanftes Ausfaden der aktuellen TTS (falls noch aktiv)
    if (this.currentUtterance) {
      this.fadeVolume(muted ? 0 : 0.8)
    }
  }

  /**
   * Sanftes Ausfaden der Lautstärke
   */
  private fadeVolume(targetVolume: number): void {
    if (!this.currentUtterance) return
    
    const currentVolume = this.currentUtterance.volume
    const volumeStep = (targetVolume - currentVolume) / 20 // 20 Schritte für sanftes Fading
    const fadeInterval = 50 // 50ms pro Schritt = 1 Sekunde total
    
    let step = 0
    const fadeIntervalId = setInterval(() => {
      step++
      const newVolume = currentVolume + (volumeStep * step)
      
      if (this.currentUtterance) {
        this.currentUtterance.volume = Math.max(0, Math.min(1, newVolume))
      }
      
      if (step >= 20 || !this.currentUtterance) {
        clearInterval(fadeIntervalId)
        if (this.currentUtterance) {
          this.currentUtterance.volume = targetVolume
        }
        console.log('SimpleFlowController: Volume fade completed to:', targetVolume)
      }
    }, fadeInterval)
  }

  /**
   * Gibt zurück, ob TTS stumm geschaltet ist
   */
  public getTTSMuted(): boolean {
    return this.isTTSMuted
  }

  /**
   * Setup für Voice-Handling
   */
  private setupVoiceHandling(): void {
    if (this.speechSynthesis.getVoices().length === 0) {
      this.speechSynthesis.addEventListener('voiceschanged', () => {
        console.log('SimpleFlowController: Voices loaded')
      })
    }
  }

  /**
   * Prüft TTS-Verfügbarkeit
   */
  public isTTSAvailable(): boolean {
    return !!(this.speechSynthesis && 'speechSynthesis' in window)
  }

  /**
   * Prüft ob TTS bereit ist (User-Interaktion + nicht stumm)
   */
  public isTTSReady(): boolean {
    return this.isTTSAvailable() && this.userInteracted && !this.isTTSMuted
  }

  /**
   * Registriert einen Listener für TTS-Ende
   */
  public onTTSEnd(callback: () => void): void {
    this.ttsEndListeners.push(callback)
    console.log('SimpleFlowController: TTS end listener registered, total listeners:', this.ttsEndListeners.length)
  }

  /**
   * Entfernt alle TTS-Ende-Listener
   */
  public clearTTSEndListeners(): void {
    this.ttsEndListeners = []
    console.log('SimpleFlowController: All TTS end listeners cleared')
  }

  /**
   * Triggert alle TTS-Ende-Listener
   */
  private triggerTTSEndListeners(): void {
    console.log('SimpleFlowController: Triggering TTS end listeners, count:', this.ttsEndListeners.length)
    this.ttsEndListeners.forEach((listener, index) => {
      try {
        console.log(`SimpleFlowController: Executing TTS end listener ${index + 1}`)
        listener()
      } catch (error) {
        console.warn('SimpleFlowController: Error in TTS end listener:', error)
      }
    })
    // Leere die Listener nach dem Ausführen
    this.ttsEndListeners = []
    console.log('SimpleFlowController: TTS end listeners executed and cleared')
  }

  /**
   * Gibt den aktuellen Zustand zurück
   */
  public getState() {
    return {
      currentView: this.currentView,
      isAutoModeActive: this.isAutoModeActive,
      currentIndex: this.currentIndex,
      userInteracted: this.userInteracted,
      isSpeaking: this.isSpeaking,
      pendingCycle: this.pendingCycle,
      isTTSMuted: this.isTTSMuted,
      isTTSAvailable: this.isTTSAvailable(),
      isTTSReady: this.isTTSReady()
    }
  }
}

export const simpleFlowController = SimpleFlowController.getInstance()
