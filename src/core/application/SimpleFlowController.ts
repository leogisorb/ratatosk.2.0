// FlowController für die zentrale Steuerung von TTS und AutoMode

import { timerManager } from '../../shared/utils/TimerManager'
import type { TimerHandle } from '../../shared/utils/TimerManager'
import { EVENTS } from '../../shared/constants/events'
import { ttsService } from '../../shared/services/TTSService'

// Benannte Konstanten für Magic Numbers
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
  // Singleton mit besserer Typsicherheit (Verzögerte Initialisierung ohne null)
  private static instance: SimpleFlowController
  
  
  private autoModeInterval: TimerHandle | null = null
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
  
  // Abbruch-Token für TTS-Warteschlange - verhindert Race Conditions
  private ttsQueueCancellation: AbortController | null = null

  private constructor() {
    // Mute-State aus localStorage laden
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
    
    // Alle laufenden Prozesse stoppen
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
    
    // Erst alle laufenden Auto-Modes stoppen
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
    this.autoModeInterval = timerManager.setTimeout(() => {
      // Nochmal prüfen ob Auto-Mode noch aktiv sein soll
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
      this.autoModeInterval.cancel()
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
    // Prüfen ob Auto-Mode noch aktiv sein soll
    if (!this.isAutoModeActive || !this.onCycleCallback || this.currentItems.length === 0) {
      console.log('SimpleFlowController: Auto-mode cycle stopped - conditions not met')
      return
    }

    const currentItem = this.currentItems[this.currentIndex]
    if (!currentItem) {
      console.error('SimpleFlowController: Item not found at index:', this.currentIndex)
      this.currentIndex = 0 // Zurücksetzen auf Anfang
      this.autoModeInterval = timerManager.setTimeout(() => {
        this.executeCycle(cycleDelay)
      }, cycleDelay)
      return
    }

    // Typ-Prüfung für Einträge mit title oder text Eigenschaft
    const itemTitle = (currentItem as any)?.title || (currentItem as any)?.text || 'Unknown'
    console.log('SimpleFlowController: Auto-mode cycle:', itemTitle, 'at index:', this.currentIndex)
    
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
    this.autoModeInterval = timerManager.setTimeout(() => {
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

  // TTS in Warteschlange einreihen und verarbeiten
  // Abbruch-Token-Pattern verhindert Race Conditions
  private async queueAndSpeak(text: string): Promise<void> {
    // Prüfe auf Duplikate in der Queue
    if (this.ttsQueue.includes(text)) {
      console.log('SimpleFlowController: Duplicate TTS text skipped:', text)
      return
    }
    
    // Füge Text zur Queue hinzu
    this.ttsQueue.push(text)
    console.log('SimpleFlowController: Added to TTS queue:', text, 'Queue length:', this.ttsQueue.length)
    
    // Starte Queue-Processing wenn nicht bereits aktiv
    if (!this.isProcessingQueue) {
      this.processQueue()
    }
  }

  /**
   * Verarbeite TTS-Warteschlange mit Abbruch-Unterstützung
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) return

    this.isProcessingQueue = true
    
    // Erstelle neues Abbruch-Token für diese Warteschlangen-Session
    this.ttsQueueCancellation = new AbortController()
    const signal = this.ttsQueueCancellation.signal

    try {
      // Verarbeite alle Einträge in der Warteschlange sequenziell
      while (this.ttsQueue.length > 0 && !signal.aborted) {
        // Warte bis vorherige TTS fertig ist
        while (this.isSpeaking && !signal.aborted) {
          await this.delayWithCancellation(TTS_CONFIG.CHECK_INTERVAL_MS, signal)
        }
        
        if (signal.aborted) break

        // Verarbeite nächsten Warteschlangen-Eintrag
        const text = this.ttsQueue.shift()!
        console.log('SimpleFlowController: Processing queue item:', text)
        
        try {
          await this.performSpeak(text, signal)
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            console.log('SimpleFlowController: TTS aborted during speak')
            break
          }
          // Echte Fehler loggen, aber weiter mit nächstem Eintrag
          if (error instanceof Error && !error.message.includes('cancelled')) {
            console.error('SimpleFlowController: TTS error:', error)
          }
          // Weiter mit nächstem Eintrag auch bei Fehler
        }

        if (signal.aborted) break
        
        // Pause zwischen TTS-Einträgen
        if (this.ttsQueue.length > 0) {
          await this.delayWithCancellation(TTS_CONFIG.PAUSE_BETWEEN_ITEMS_MS, signal)
        }
      }
      
      // Triggere TTS-Ende-Listener wenn Warteschlange vollständig verarbeitet ist
      if (this.ttsQueue.length === 0 && this.ttsEndListeners.length > 0 && !signal.aborted) {
        this.triggerTTSEndListeners()
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('SimpleFlowController: Queue processing aborted')
      } else {
      console.error('SimpleFlowController: Error in TTS queue:', error)
      }
    } finally {
      this.isProcessingQueue = false
      this.ttsQueueCancellation = null
    }
  }

  /**
   * Verzögerung mit Abbruch-Unterstützung
   */
  private delayWithCancellation(ms: number, signal: AbortSignal): Promise<void> {
    return timerManager.delay(ms, signal)
  }


  /**
   * TTS ausführen via TTSService
   * Kann via AbortController in der Warteschlangen-Verarbeitung abgebrochen werden
   */
  private async performSpeak(text: string, signal?: AbortSignal): Promise<void> {
    console.log('SimpleFlowController: Speaking:', text)
    
    // Stoppe nur die aktuelle TTS, aber leere nicht die Queue
    this.stopTTSOnly()
    await timerManager.delay(TTS_CONFIG.RESTART_DELAY_MS)
    
    // Prüfe TTS-Verfügbarkeit
    if (!ttsService.isAvailable()) {
      console.warn('SimpleFlowController: TTS not available')
      this.isSpeaking = false
      return
    }

    // Markiere als sprechend
    this.isSpeaking = true

    try {
      await ttsService.speak(text, {
        lang: 'de-DE',
        rate: 0.8,
        pitch: 1.0,
        volume: this.isTTSMuted ? 0 : 0.8
      }, {
        signal,
        timeout: 10000,
        onStart: () => {
          console.log('SimpleFlowController: TTS started')
        },
        onEnd: () => {
          console.log('SimpleFlowController: Finished speaking:', text)
          this.isSpeaking = false
          
          // Race Condition bei TTS + Auto-Mode vermeiden
          // Atomare Prüfung und Update von pendingCycle
          const wasPending = this.pendingCycle
          const isAutoModeStillActive = this.isAutoModeActive
          
          if (wasPending && isAutoModeStillActive) {
            // Atomare Update: Setze pendingCycle auf false
            this.pendingCycle = false
            console.log('SimpleFlowController: TTS finished, starting next cycle...')
            
            // Starte nächsten Zyklus nach Delay
            timerManager.setTimeout(() => {
              // Prüfe nochmal ob Auto-Mode noch aktiv (Race Condition Prevention)
              if (this.isAutoModeActive) {
                // Verwende den aktuellen cycleDelay
                this.autoModeInterval = timerManager.setTimeout(() => {
                  this.executeCycle(this.currentCycleDelay)
                }, AUTO_MODE_CONFIG.CYCLE_POST_TTS_DELAY_MS)
              }
            }, AUTO_MODE_CONFIG.CYCLE_POST_TTS_DELAY_MS)
          }
          
          // Prüfe ob TTS-Queue leer ist und triggere Listener
          if (this.ttsQueue.length === 0 && this.ttsEndListeners.length > 0) {
            this.triggerTTSEndListeners()
          }
        },
        onError: (error) => {
          this.isSpeaking = false
          console.warn('SimpleFlowController: TTS error:', error.message, 'for text:', text)
          
          // Spezielle Behandlung für not-allowed
          if (error.message.includes('not-allowed')) {
            this.requestUserInteraction()
          }
          
          // Auch bei Fehlern prüfen ob TTS-Queue leer ist und Listener triggern
          if (this.ttsQueue.length === 0 && this.ttsEndListeners.length > 0) {
            this.triggerTTSEndListeners()
          }
        }
      })
    } catch (error) {
      this.isSpeaking = false
      
      // AbortError ist kein echter Fehler
      if (error instanceof DOMException && error.name === 'AbortError') {
        // Prüfe ob TTS-Queue leer ist und triggere Listener
        if (this.ttsQueue.length === 0 && this.ttsEndListeners.length > 0) {
          this.triggerTTSEndListeners()
        }
        return // Resolve silently
      }
      
      throw error
    }
  }

  /**
   * Stoppt TTS und leert die Queue (nur bei explizitem Stoppen)
   */
  public stopTTS(): void {
    // Stoppe TTS via TTSService
    ttsService.cancel()
    this.isSpeaking = false
    this.pendingCycle = false
    console.log('SimpleFlowController: TTS stopped')
    
    // Breche Warteschlangen-Verarbeitung mit Abbruch-Token ab
    if (this.ttsQueueCancellation) {
      this.ttsQueueCancellation.abort()
      this.ttsQueueCancellation = null
    }
    
    // Leere Warteschlange
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
    // Stoppe TTS via TTSService
    ttsService.cancel()
    this.isSpeaking = false
    this.pendingCycle = false
    console.log('SimpleFlowController: TTS stopped (queue preserved)')
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
      window.addEventListener(EVENTS.FACE_BLINK_DETECTED, enableTTS, { once: true })
      
      // Fallback: Entferne Event Listener nach Timeout
      timerManager.setTimeout(() => {
        document.removeEventListener('click', enableTTS)
        document.removeEventListener('touchstart', enableTTS)
        document.removeEventListener('keydown', enableTTS)
        window.removeEventListener(EVENTS.FACE_BLINK_DETECTED, enableTTS)
      }, STORAGE_CONFIG.USER_INTERACTION_TIMEOUT_MS)
  }

  /**
   * Lädt Mute-State aus sessionStorage (gerätespezifisch, nicht zwischen Geräten geteilt)
   * Mit besserer Fehlerbehandlung für Safari Private Mode etc.
   */
  private loadMuteState(): void {
    try {
      const savedMuted = sessionStorage.getItem(STORAGE_CONFIG.MUTE_STATE_KEY)
      if (savedMuted !== null) {
        this.isTTSMuted = savedMuted === 'true'
        console.log('SimpleFlowController: Mute state loaded from sessionStorage:', this.isTTSMuted)
      } else {
        // Default: nicht stumm
        this.isTTSMuted = false
        console.log('SimpleFlowController: No saved mute state, using default (not muted)')
      }
    } catch (error) {
      // Safari Private Mode wirft DOMException
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('SimpleFlowController: sessionStorage quota exceeded')
      } else {
        console.error('SimpleFlowController: Failed to load mute state:', error)
      }
      this.isTTSMuted = false
    }
  }

  /**
   * Speichert Mute-State in sessionStorage (gerätespezifisch, nicht zwischen Geräten geteilt)
   * Mit besserer Fehlerbehandlung für Safari Private Mode etc.
   */
  private saveMuteState(): void {
    try {
      sessionStorage.setItem(STORAGE_CONFIG.MUTE_STATE_KEY, String(this.isTTSMuted))
      console.log('SimpleFlowController: Mute state saved to sessionStorage:', this.isTTSMuted)
    } catch (error) {
      // Safari Private Mode wirft DOMException
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('SimpleFlowController: sessionStorage quota exceeded')
      } else {
        console.error('SimpleFlowController: Failed to save mute state:', error)
      }
    }
  }

  // Schaltet TTS global stumm/an (durch sanftes Ausfaden)
  // Nur vom Header-Button aufrufbar - Views dürfen dies nicht tun!
  public setTTSMuted(muted: boolean): void {
    this.isTTSMuted = muted
    console.log('SimpleFlowController: TTS muted set to:', muted)
    
    // Mute-State persistent speichern
    this.saveMuteState()
    
    // Wenn stumm geschaltet wird: Alle laufenden TTS stoppen
    if (muted) {
      // Stoppe SimpleFlowController TTS
      this.stopTTSOnly()
      
      // Stoppe alle TTS via TTSService
      ttsService.cancel()
      console.log('SimpleFlowController: All TTS cancelled (muted)')
    }
  }


  /**
   * Gibt zurück, ob TTS stumm geschaltet ist
   */
  public getTTSMuted(): boolean {
    return this.isTTSMuted
  }


  /**
   * Prüft TTS-Verfügbarkeit
   */
  public isTTSAvailable(): boolean {
    return ttsService.isAvailable()
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
