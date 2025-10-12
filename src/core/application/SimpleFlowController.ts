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
    this.stopAutoMode()
    this.stopTTS()
    this.currentView = viewName
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
    if (!this.userInteracted) {
      console.log('SimpleFlowController: TTS not allowed yet - user must interact first:', text)
      return
    }

    if (this.isTTSMuted) {
      console.log('SimpleFlowController: TTS is muted, not speaking:', text)
      return
    }

    await this.performSpeak(text)
  }

  /**
   * TTS sprechen (für virtuelle Tastatur - ohne userInteracted Check)
   */
  public async speakForVirtualKeyboard(text: string): Promise<void> {
    if (this.isTTSMuted) {
      console.log('SimpleFlowController: TTS is muted, not speaking:', text)
      return
    }

    await this.performSpeak(text)
  }

  /**
   * TTS ausführen
   */
  private async performSpeak(text: string): Promise<void> {

    console.log('SimpleFlowController: Speaking:', text)
    
    // Stoppe vorherige TTS
    this.stopTTS()
    
    // Prüfe ob Speech Synthesis verfügbar ist
    if (!this.speechSynthesis) {
      console.warn('SimpleFlowController: Speech synthesis not available')
      return
    }

    // Markiere als sprechend
    this.isSpeaking = true

    // Erstelle neue TTS
    this.currentUtterance = new SpeechSynthesisUtterance(text)
    this.currentUtterance.lang = 'de-DE'
    this.currentUtterance.rate = 0.8
    this.currentUtterance.pitch = 1.0
    this.currentUtterance.volume = 0.8

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
    }

    this.currentUtterance.onerror = (event) => {
      console.warn('SimpleFlowController: TTS error (browser restriction):', event.error)
      this.isSpeaking = false
      // Ignoriere Browser-Beschränkungen, das ist normal
    }

    // Starte TTS mit Fehlerbehandlung
    try {
      this.speechSynthesis.speak(this.currentUtterance)
    } catch (error) {
      console.warn('SimpleFlowController: TTS blocked by browser:', error)
      this.isSpeaking = false
    }
  }

  /**
   * Stoppt TTS
   */
  public stopTTS(): void {
    if (this.speechSynthesis.speaking) {
      this.speechSynthesis.cancel()
      this.currentUtterance = null
      this.isSpeaking = false
      this.pendingCycle = false
      console.log('SimpleFlowController: TTS stopped')
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
   * Schaltet TTS global stumm/an
   */
  public setTTSMuted(muted: boolean): void {
    this.isTTSMuted = muted
    console.log('SimpleFlowController: TTS muted set to:', muted)
    
    // Wenn TTS stumm geschaltet wird, stoppe aktuelle Wiedergabe
    if (muted) {
      this.stopTTS()
    }
  }

  /**
   * Gibt zurück, ob TTS stumm geschaltet ist
   */
  public isTTSMuted(): boolean {
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
      isTTSMuted: this.isTTSMuted
    }
  }
}

export const simpleFlowController = SimpleFlowController.getInstance()
