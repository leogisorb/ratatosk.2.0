/**
 * ✅ InputManager - Zentraler Input-Manager für alle Eingabemedien
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

import { useFaceRecognition } from '../../features/face-recognition/composables/useFaceRecognition'

export type InputType = 'blink' | 'click' | 'touch' | 'voice' | 'gesture'
export type InputEvent = {
  type: InputType
  timestamp: number
  source?: string
  data?: any
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
}

export class InputManager {
  private config: Required<Omit<InputManagerConfig, 'onSelect'>> & { onSelect: (event: InputEvent) => void }
  private faceRecognition = useFaceRecognition()
  
  private isActive = false
  private lastInputTime = 0
  private blinkCheckInterval: number | null = null
  
  // Event Listeners
  private clickHandler: ((event: MouseEvent) => void) | null = null
  private touchHandler: ((event: TouchEvent) => void) | null = null
  private blinkEventListener: ((event: CustomEvent) => void) | null = null
  
  constructor(config: InputManagerConfig) {
    this.config = {
      enabledInputs: config.enabledInputs || ['blink', 'click', 'touch'],
      cooldown: config.cooldown || 300,
      customBlinkHandler: config.customBlinkHandler,
      onSelect: config.onSelect
    }
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
    console.log('✅ InputManager: Starting with inputs:', this.config.enabledInputs)

    // ✅ Blink Detection
    if (this.config.enabledInputs.includes('blink')) {
      this.setupBlinkDetection()
    }

    // ✅ Click Detection
    if (this.config.enabledInputs.includes('click')) {
      this.setupClickDetection()
    }

    // ✅ Touch Detection
    if (this.config.enabledInputs.includes('touch')) {
      this.setupTouchDetection()
    }

    // ✅ Voice Commands (zukünftig)
    if (this.config.enabledInputs.includes('voice')) {
      // TODO: Voice recognition setup
      console.log('InputManager: Voice commands not yet implemented')
    }

    // ✅ Gestures (zukünftig)
    if (this.config.enabledInputs.includes('gesture')) {
      // TODO: Gesture recognition setup
      console.log('InputManager: Gestures not yet implemented')
    }
  }

  /**
   * Stoppt den Input-Manager und entfernt alle Event-Listener
   */
  stop() {
    if (!this.isActive) {
      return
    }

    this.isActive = false
    console.log('✅ InputManager: Stopping')

    // ✅ Cleanup Blink Detection
    if (this.blinkCheckInterval) {
      clearInterval(this.blinkCheckInterval)
      this.blinkCheckInterval = null
    }

    if (this.blinkEventListener) {
      window.removeEventListener('faceBlinkDetected', this.blinkEventListener as EventListener)
      this.blinkEventListener = null
    }

    // ✅ Cleanup Click Detection
    if (this.clickHandler) {
      document.removeEventListener('contextmenu', this.clickHandler)
      this.clickHandler = null
    }

    // ✅ Cleanup Touch Detection
    if (this.touchHandler) {
      document.removeEventListener('touchstart', this.touchHandler)
      this.touchHandler = null
    }
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
          if (type === 'blink') this.setupBlinkDetection()
          if (type === 'click') this.setupClickDetection()
          if (type === 'touch') this.setupTouchDetection()
        }
      }
    } else {
      this.config.enabledInputs = this.config.enabledInputs.filter(t => t !== type)
      
      // Cleanup wenn Manager aktiv
      if (this.isActive) {
        if (type === 'blink') {
          if (this.blinkCheckInterval) {
            clearInterval(this.blinkCheckInterval)
            this.blinkCheckInterval = null
          }
          if (this.blinkEventListener) {
            window.removeEventListener('faceBlinkDetected', this.blinkEventListener as EventListener)
            this.blinkEventListener = null
          }
        }
        if (type === 'click' && this.clickHandler) {
          document.removeEventListener('contextmenu', this.clickHandler)
          this.clickHandler = null
        }
        if (type === 'touch' && this.touchHandler) {
          document.removeEventListener('touchstart', this.touchHandler)
          this.touchHandler = null
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
   */
  private triggerInput(type: InputType, source?: string, data?: any) {
    if (!this.checkCooldown()) {
      return
    }

    const event: InputEvent = {
      type,
      timestamp: Date.now(),
      source,
      data
    }

    this.config.onSelect(event)
  }

  /**
   * Setup Blink Detection
   */
  private setupBlinkDetection() {
    // ✅ Methode 1: Event-basiert (faceBlinkDetected Event)
    this.blinkEventListener = ((event: CustomEvent) => {
      if (!this.isActive) return
      
      // Ignoriere Events von bestimmten Quellen (z.B. Header-Buttons)
      if (event.detail?.source === 'fallback-interaction') {
        return
      }
      
      this.triggerInput('blink', 'face-recognition', event.detail)
    }) as EventListener

    window.addEventListener('faceBlinkDetected', this.blinkEventListener)

    // ✅ Methode 2: Polling-basiert (falls Event nicht funktioniert)
    if (this.faceRecognition && !this.blinkCheckInterval) {
      this.blinkCheckInterval = window.setInterval(() => {
        if (!this.isActive) return
        
        // Custom Blink Handler hat Priorität
        if (this.config.customBlinkHandler) {
          if (this.config.customBlinkHandler()) {
            this.triggerInput('blink', 'custom', null)
          }
          return
        }

        // Standard: Face Recognition
        if (this.faceRecognition.isBlinking()) {
          this.triggerInput('blink', 'face-recognition', null)
        }
      }, 100) // Check alle 100ms
    }
  }

  /**
   * Setup Click Detection (Right-Click als Blink-Ersatz)
   */
  private setupClickDetection() {
    this.clickHandler = (event: MouseEvent) => {
      if (!this.isActive) return
      
      event.preventDefault()
      event.stopPropagation()
      
      this.triggerInput('click', 'mouse', {
        button: event.button,
        clientX: event.clientX,
        clientY: event.clientY
      })
    }

    document.addEventListener('contextmenu', this.clickHandler, { passive: false })
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

    document.addEventListener('touchstart', this.touchHandler, { passive: true })
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

