/**
 * InputManager - Zentraler Input-Manager für alle Eingabemedien
 * 
 * Abstrahiert alle Eingabemethoden:
 * - Blink Detection (Face Recognition)
 * - Click/Touch Events
 * - Voice Commands (zukünftig)
 * - Gestures (zukünftig)
 * 
 * Verwendungsbeispiel:
 * ```ts
 * const inputManager = new InputManager({
 *   onSelect: (item) => { ... },
 *   enabledInputs: ['blink', 'click', 'touch']
 * })
 * 
 * inputManager.start()
 * inputManager.stop()
 * ```
 */

import { timerManager } from '../../shared/utils/TimerManager'
import type { TimerHandle } from '../../shared/utils/TimerManager'
import { EVENTS } from '../../shared/constants/events'

// Benannte Konstanten für Magic Numbers
const INPUT_CONFIG = {
  DEFAULT_COOLDOWN_MS: 300,
  EVENT_DEBOUNCE_MS: 100,
  BLINK_POLLING_INTERVAL_MS: 16 // ~60fps (requestAnimationFrame)
} as const

export type InputType = 'blink' | 'click' | 'touch' | 'voice' | 'gesture'
export type InputEvent = {
  type: InputType
  timestamp: number
  source?: string
  data?: any
}

export interface FaceRecognitionAPI {
  isBlinking(): boolean
  isActive?: { value: boolean } // Optional für Kompatibilität
}

export interface InputManagerConfig {
  /**
   * Callback wird aufgerufen, wenn ein Input erkannt wurde
   */
  onSelect: (event: InputEvent) => void
  
  /**
   * Welche Input-Typen sind aktiviert
   */
  enabledInputs?: InputType[]
  
  /**
   * Cooldown zwischen Inputs (in ms)
   */
  cooldown?: number
  
  /**
   * Optional: Custom Blink-Erkennung (falls nicht Face Recognition)
   */
  customBlinkHandler?: () => boolean
  
  /**
   * Optional: Face Recognition API (für Dependency Injection)
   * Falls nicht angegeben, wird useFaceRecognition() verwendet
   */
  faceRecognition?: FaceRecognitionAPI
}

type InputSetupConfig = {
  setup: () => void
  cleanup: () => void
}

export class InputManager {
  private config: Omit<InputManagerConfig, 'onSelect'> & { 
    enabledInputs: InputType[]
    cooldown: number
    onSelect: (event: InputEvent) => void
  }
  private faceRecognition: FaceRecognitionAPI | null = null
  
  private isActive = false
  private shouldCleanup = false // Explizites Cleanup-Flag
  private lastInputTime = 0
  private blinkCheckInterval: TimerHandle | null = null
  
  // Ereignis-Listener
  private clickHandler: ((event: MouseEvent) => void) | null = null
  private touchHandler: ((event: TouchEvent) => void) | null = null
  private blinkEventListener: EventListener | null = null
  
  // AbortController für Ereignis-Listener (Verhindert Memory Leaks)
  private abortController: AbortController | null = null
  
  // Map-basiertes Input-Setup zur Reduzierung von Code-Duplikation
  private inputSetup: Map<InputType, InputSetupConfig> = new Map()
  
  // Ereignis-Deduplizierung: Verhindert doppelte Ereignisse
  private lastEventHash: string | null = null
  private lastEventTime = 0
  
  // Blink Detection Mode: 'event' oder 'polling' (nur eine Methode aktiv)
  private blinkDetectionMode: 'event' | 'polling' | null = null
  
  constructor(config: InputManagerConfig) {
    // Dependency Injection für Face Recognition (optional)
    // Bevorzugt: faceRecognition über Config injizieren
    if (config.faceRecognition) {
      this.faceRecognition = config.faceRecognition
    } else {
      // Fallback: Direkter Import (für Rückwärtskompatibilität)
      // Tight Coupling - sollte durch Dependency Injection ersetzt werden
      try {
        // Dynamischer Import zur Laufzeit (verhindert Circular Dependencies)
        // Wird asynchron geladen, daher wird faceRecognition erst später verfügbar
        void import('../../features/face-recognition/composables/useFaceRecognition').then(module => {
          this.faceRecognition = module.useFaceRecognition() as FaceRecognitionAPI
        }).catch(error => {
          console.warn('InputManager: Face Recognition not available', error)
        })
      } catch (error) {
        console.warn('InputManager: Face Recognition not available', error)
      }
    }
    
    this.config = {
      enabledInputs: config.enabledInputs || ['blink', 'click', 'touch'],
      cooldown: config.cooldown || INPUT_CONFIG.DEFAULT_COOLDOWN_MS,
      customBlinkHandler: config.customBlinkHandler,
      onSelect: config.onSelect
    }
    
    // Initialisiere Input-Setup Map
    this.inputSetup.set('blink', {
      setup: () => this.setupBlinkDetection(),
      cleanup: () => this.cleanupBlinkDetection()
    })
    this.inputSetup.set('click', {
      setup: () => this.setupClickDetection(),
      cleanup: () => this.cleanupClickDetection()
    })
    this.inputSetup.set('touch', {
      setup: () => this.setupTouchDetection(),
      cleanup: () => this.cleanupTouchDetection()
    })
  }

  /**
   * Startet den Input-Manager und aktiviert alle konfigurierten Input-Typen
   */
  start() {
    if (this.isActive) {
      console.warn('InputManager: Already active')
      return
    }

    this.isActive = true
    this.shouldCleanup = false // Setze Cleanup-Flag zurück
    console.log('InputManager: Starting with inputs:', this.config.enabledInputs)

    // Erstelle neuen AbortController für Ereignis-Listener
    this.abortController = new AbortController()

    // Setup für alle aktivierten Input-Typen über Map
    for (const inputType of this.config.enabledInputs) {
      const setup = this.inputSetup.get(inputType)
      if (setup) {
        setup.setup()
      } else if (inputType === 'voice' || inputType === 'gesture') {
        // TODO: Voice/Gesture recognition setup
        console.log(`InputManager: ${inputType} not yet implemented`)
      }
    }
  }

  /**
   * Stoppt den Input-Manager und entfernt alle Event-Listener
   */
  stop() {
    if (!this.isActive) {
      return
    }

    this.shouldCleanup = true // Setze Cleanup-Flag zuerst
    this.isActive = false
    console.log('InputManager: Stopping')

    // Cleanup für alle aktivierten Input-Typen über Map
    for (const inputType of this.config.enabledInputs) {
      const setup = this.inputSetup.get(inputType)
      if (setup) {
        setup.cleanup()
      }
    }

    // AbortController für alle Ereignis-Listener
    this.abortController?.abort()
    this.abortController = null
    
    // Setze Ereignis-Deduplizierung zurück
    this.lastEventHash = null
    this.lastEventTime = 0
  }

  /**
   * Aktiviert/Deaktiviert einen spezifischen Input-Typ
   */
  enableInput(type: InputType, enable: boolean) {
    if (enable) {
      if (!this.config.enabledInputs.includes(type)) {
        this.config.enabledInputs.push(type)
        
        // Setup wenn Manager bereits aktiv
        if (this.isActive) {
          const setup = this.inputSetup.get(type)
          if (setup) {
            setup.setup()
          }
        }
      }
    } else {
      this.config.enabledInputs = this.config.enabledInputs.filter(t => t !== type)
      
      // Cleanup wenn Manager aktiv
      if (this.isActive) {
        const setup = this.inputSetup.get(type)
        if (setup) {
          setup.cleanup()
        }
      }
    }
  }

  /**
   * Prüft ob Cooldown abgelaufen ist
   */
  private checkCooldown(): boolean {
    const now = Date.now()
    if (now - this.lastInputTime < this.config.cooldown) {
      return false
    }
    this.lastInputTime = now
    return true
  }

  /**
   * Erstellt ein Input-Event und ruft den Callback auf
   * Mit Event-Deduplication um doppelte Events zu vermeiden
   */
  private triggerInput(type: InputType, source?: string, data?: any) {
    if (!this.checkCooldown()) {
      return
    }

    // Ereignis-Deduplizierung: Verhindert doppelte Ereignisse innerhalb kurzer Zeit
    const now = Date.now()
    const eventHash = `${type}-${source}-${JSON.stringify(data)}`
    
    // Prüfe ob identisches Event innerhalb von DEBOUNCE_MS
    if (
      this.lastEventHash === eventHash &&
      now - this.lastEventTime < INPUT_CONFIG.EVENT_DEBOUNCE_MS
    ) {
      console.log('InputManager: Duplicate event ignored:', eventHash)
      return
    }
    
    this.lastEventHash = eventHash
    this.lastEventTime = now

    const event: InputEvent = {
      type,
      timestamp: now,
      source,
      data
    }

    this.config.onSelect(event)
  }

  /**
   * Setup Blink Detection
   * Nur eine Methode aktiv (Event-basiert hat Priorität)
   * Verhindert Race Conditions zwischen Event Listener und Polling
   */
  private setupBlinkDetection() {
    // Prüfe ob bereits aktiv
    if (this.blinkDetectionMode !== null) {
      console.warn('InputManager: Blink detection already set up')
      return
    }

    // Methode 1: Ereignis-basiert (faceBlinkDetected Ereignis) - hat Priorität
    // Wenn Ereignisse verfügbar sind, verwende diese (effizienter)
    this.blinkEventListener = (event: Event) => {
      if (!this.isActive || this.shouldCleanup) return
      
      const customEvent = event as CustomEvent
      // Ignoriere Events von bestimmten Quellen (z.B. Header-Buttons)
      if (customEvent.detail?.source === 'fallback-interaction') {
        return
      }
      
      this.triggerInput('blink', 'face-recognition', customEvent.detail)
    }

    window.addEventListener(EVENTS.FACE_BLINK_DETECTED, this.blinkEventListener, {
      signal: this.abortController?.signal
    })
    
    this.blinkDetectionMode = 'event'
    console.log('InputManager: Blink detection (event-based) activated')

    // Methode 2: Polling-basiert nur wenn Ereignis-basiert nicht verfügbar
    // Wird nur verwendet, wenn kein Ereignis-System vorhanden ist
    // ODER wenn customBlinkHandler vorhanden ist (benötigt Polling)
    if (this.config.customBlinkHandler || (!this.faceRecognition && !this.blinkEventListener)) {
      // Wechsle zu Polling-Modus
      if (this.blinkEventListener) {
        window.removeEventListener(EVENTS.FACE_BLINK_DETECTED, this.blinkEventListener)
        this.blinkEventListener = null
      }
      
      this.blinkDetectionMode = 'polling'
      console.log('InputManager: Blink detection (polling-based) activated')
      
      if (!this.blinkCheckInterval) {
        const checkBlink = () => {
          // Explizites Cleanup-Flag prüfen
          if (!this.isActive || this.shouldCleanup) {
            if (this.blinkCheckInterval !== null) {
              this.blinkCheckInterval.cancel()
              this.blinkCheckInterval = null
            }
            return
          }
          
          // Custom Blink Handler hat Priorität
          if (this.config.customBlinkHandler) {
            if (this.config.customBlinkHandler()) {
              this.triggerInput('blink', 'custom', null)
            }
          } else if (this.faceRecognition?.isBlinking()) {
            // Standard: Face Recognition
            this.triggerInput('blink', 'face-recognition', null)
          }
          
          // Nächster Frame, wenn noch aktiv und nicht im Cleanup
          if (this.isActive && !this.shouldCleanup) {
            this.blinkCheckInterval = timerManager.requestAnimationFrame(checkBlink)
          } else {
            this.blinkCheckInterval = null
          }
        }
        
        this.blinkCheckInterval = timerManager.requestAnimationFrame(checkBlink)
      }
    }
  }

  /**
   * Cleanup Blink Detection
   */
  private cleanupBlinkDetection() {
    this.shouldCleanup = true // Setze Cleanup-Flag
    
    if (this.blinkCheckInterval !== null) {
      this.blinkCheckInterval.cancel()
      this.blinkCheckInterval = null
    }
    if (this.blinkEventListener) {
      window.removeEventListener(EVENTS.FACE_BLINK_DETECTED, this.blinkEventListener as EventListener)
      this.blinkEventListener = null
    }
    
    this.blinkDetectionMode = null
  }

  /**
   * Setup Click Detection (Rechtsklick) - überall auf der Seite
   */
  private setupClickDetection() {
    this.clickHandler = (event: MouseEvent) => {
      if (!this.isActive) return
      
      // Nur normale Clicks, nicht auf interaktive Elemente (z.B. Buttons)
      const target = event.target as HTMLElement
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
        return // Ignoriere Clicks auf Buttons/Links - die haben ihre eigenen Handler
      }
      
      // Rechtsklick überall auf der Seite wird als Input erkannt
      // Die aktive Kachel wird automatisch über handleBlink() ausgewählt
      event.preventDefault()
      event.stopPropagation()
      
      this.triggerInput('click', 'mouse', {
        button: event.button,
        clientX: event.clientX,
        clientY: event.clientY
      })
    }

    // Rechtsklick (contextmenu) - überall auf der Seite
    document.addEventListener('contextmenu', this.clickHandler, { 
      passive: false,
      signal: this.abortController?.signal
    })
  }

  /**
   * Cleanup Click Detection
   */
  private cleanupClickDetection() {
    if (this.clickHandler) {
      document.removeEventListener('contextmenu', this.clickHandler)
      this.clickHandler = null
    }
  }

  /**
   * Setup Touch Detection
   */
  private setupTouchDetection() {
    this.touchHandler = (event: TouchEvent) => {
      if (!this.isActive) return
      
      // Nur einfache Touch-Events (keine Multi-Touch)
      if (event.touches.length === 1) {
        const touch = event.touches[0]
        this.triggerInput('touch', 'touchscreen', {
          clientX: touch.clientX,
          clientY: touch.clientY
        })
      }
    }

    document.addEventListener('touchstart', this.touchHandler, { 
      passive: true,
      signal: this.abortController?.signal
    })
  }

  /**
   * Cleanup Touch Detection
   */
  private cleanupTouchDetection() {
    if (this.touchHandler) {
      document.removeEventListener('touchstart', this.touchHandler)
      this.touchHandler = null
    }
  }

  /**
   * Gibt den aktuellen Status zurück
   */
  getStatus() {
    return {
      isActive: this.isActive,
      enabledInputs: [...this.config.enabledInputs],
      lastInputTime: this.lastInputTime
    }
  }
}

