/**
 * Einfacher, funktionierender FlowController
 * Basiert auf der bewährten alten Architektur, aber zentralisiert
 */

export class SimpleFlowController {
  private static instance: SimpleFlowController | null = null
  private speechSynthesis: SpeechSynthesis
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private autoModeInterval: number | null = null
  private currentView: string | null = null
  private currentItems: any[] = []
  private currentIndex: number = 0
  private onCycleCallback: ((index: number, item: any) => void) | null = null
  private isAutoModeActive: boolean = false
  private userInteracted: boolean = false
  private isSpeaking: boolean = false
  private pendingCycle: boolean = false
  private currentCycleDelay: number = 3000
  private isTTSMuted: boolean = false
  private ttsQueue: string[] = []
  private isProcessingQueue: boolean = false
  private ttsEndListeners: (() => void)[] = []

  private constructor() {
    this.speechSynthesis = window.speechSynthesis
    this.setupVoiceHandling()
  }

  public static getInstance(): SimpleFlowController {
    if (!SimpleFlowController.instance) {
      SimpleFlowController.instance = new SimpleFlowController()
    }
    return SimpleFlowController.instance
  }

  /**
   * Setzt den aktiven View
   */
  public setActiveView(viewName: string): void {
    console.log('SimpleFlowController: Setting active view to:', viewName)
    
    // Stoppe alle laufenden Prozesse
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
   * Startet Auto-Mode für den aktuellen View
   */
  public startAutoMode(
    items: any[],
    onCycle: (currentIndex: number, currentItem: any) => void,
    initialDelay: number = 3000,
    cycleDelay: number = 3000
  ): boolean {
    if (this.autoModeInterval) {
      console.log('SimpleFlowController: Auto-mode already running')
      return false
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
      this.executeCycle(cycleDelay)
    }, initialDelay)

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
    
    // Starte Queue-Verarbeitung, falls nicht bereits aktiv
    if (!this.isProcessingQueue) {
      this.processQueue()
    }
  }

  /**
   * TTS-Queue verarbeiten
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.ttsQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true
    console.log('SimpleFlowController: Processing TTS queue, length:', this.ttsQueue.length)

    while (this.ttsQueue.length > 0) {
      const text = this.ttsQueue.shift()!
      console.log('SimpleFlowController: Processing queue item:', text)
      
      await this.performSpeak(text)
      
      // Warte bis TTS fertig ist
      while (this.isSpeaking) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // Pause zwischen TTS-Items um Browser-Abbrüche zu vermeiden
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    this.isProcessingQueue = false
    console.log('SimpleFlowController: TTS queue processing completed')
    
    // Triggere TTS-Ende-Listener wenn Queue komplett abgearbeitet ist
    if (this.ttsQueue.length === 0 && this.ttsEndListeners.length > 0) {
      this.triggerTTSEndListeners()
    }
  }

  /**
   * TTS ausführen
   */
  private async performSpeak(text: string): Promise<void> {
    console.log('SimpleFlowController: Speaking:', text)
    
    // Stoppe nur die aktuelle TTS, aber leere nicht die Queue
    this.stopTTSOnly()
    await new Promise(resolve => setTimeout(resolve, 200)) // 200ms Pause
    
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

    // Event-Handler
    this.currentUtterance.onend = () => {
      console.log('SimpleFlowController: Finished speaking:', text)
      this.isSpeaking = false
      
      // Wenn Auto-Mode wartet, starte nächsten Zyklus nach 1 Sekunde
      if (this.pendingCycle && this.isAutoModeActive) {
        this.pendingCycle = false
        console.log('SimpleFlowController: TTS finished, starting next cycle in 1 second...')
        setTimeout(() => {
          if (this.isAutoModeActive) {
            // Verwende den aktuellen cycleDelay
            this.autoModeInterval = window.setTimeout(() => {
              this.executeCycle(this.currentCycleDelay)
            }, 1000) // 1 Sekunde Pause nach TTS-Ende
          }
        }, 1000)
      }
      
      // Prüfe ob TTS-Queue leer ist und triggere Listener
      if (this.ttsQueue.length === 0 && this.ttsEndListeners.length > 0) {
        this.triggerTTSEndListeners()
      }
    }

    this.currentUtterance.onerror = (event) => {
      console.warn('SimpleFlowController: TTS error:', event.error, 'for text:', text)
      this.isSpeaking = false
      
      // Behandle verschiedene Fehlertypen
      switch (event.error) {
        case 'not-allowed':
          console.warn('SimpleFlowController: TTS not allowed - user interaction required')
          // Versuche User-Interaktion zu triggern
          this.requestUserInteraction()
          break
        case 'canceled':
          console.warn('SimpleFlowController: TTS canceled by browser')
          break
        case 'interrupted':
          console.warn('SimpleFlowController: TTS interrupted')
          break
        case 'audio-busy':
          console.warn('SimpleFlowController: Audio system busy')
          break
        case 'audio-hardware':
          console.warn('SimpleFlowController: Audio hardware error')
          break
        case 'network':
          console.warn('SimpleFlowController: Network error')
          break
        case 'synthesis-unavailable':
          console.warn('SimpleFlowController: Synthesis unavailable')
          break
        case 'synthesis-failed':
          console.warn('SimpleFlowController: Synthesis failed')
          break
        case 'language-unavailable':
          console.warn('SimpleFlowController: Language unavailable')
          break
        case 'voice-unavailable':
          console.warn('SimpleFlowController: Voice unavailable')
          break
        case 'text-too-long':
          console.warn('SimpleFlowController: Text too long')
          break
        case 'invalid-argument':
          console.warn('SimpleFlowController: Invalid argument')
          break
        default:
          console.warn('SimpleFlowController: Unknown TTS error:', event.error)
      }
      
      // Auch bei Fehlern prüfen ob TTS-Queue leer ist und Listener triggern
      if (this.ttsQueue.length === 0 && this.ttsEndListeners.length > 0) {
        this.triggerTTSEndListeners()
      }
    }

    // Starte TTS mit Fehlerbehandlung
    try {
      this.speechSynthesis.speak(this.currentUtterance)
      
      // Fallback: Wenn TTS nach 100ms nicht startet, markiere als fehlgeschlagen
      setTimeout(() => {
        if (this.isSpeaking && !this.speechSynthesis.speaking) {
          console.warn('SimpleFlowController: TTS failed to start, marking as failed')
          this.isSpeaking = false
        }
      }, 100)
      
    } catch (error) {
      console.warn('SimpleFlowController: TTS blocked by browser:', error)
      this.isSpeaking = false
    }
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
    this.isProcessingQueue = false
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
    
    // Fallback: Entferne Event Listener nach 10 Sekunden
    setTimeout(() => {
      document.removeEventListener('click', enableTTS)
      document.removeEventListener('touchstart', enableTTS)
      document.removeEventListener('keydown', enableTTS)
      window.removeEventListener('faceBlinkDetected', enableTTS)
    }, 10000)
  }

  /**
   * Schaltet TTS global stumm/an (durch sanftes Ausfaden)
   */
  public setTTSMuted(muted: boolean): void {
    this.isTTSMuted = muted
    console.log('SimpleFlowController: TTS muted set to:', muted)
    
    // Sanftes Ausfaden der aktuellen TTS
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
