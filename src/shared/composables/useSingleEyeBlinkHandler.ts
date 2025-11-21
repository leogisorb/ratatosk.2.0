import { ref, readonly, onMounted, onUnmounted } from 'vue'
import { EVENTS } from '../constants/events'

/**
 * Typed Event für einseitiges Blinzeln
 */
export interface SingleEyeBlinkEventDetail {
  eye: 'left' | 'right'
  timestamp: number
}

/**
 * useSingleEyeBlinkHandler
 * 
 * Handler für einseitiges Blinzeln (links/rechts) als Shortcuts.
 * Funktioniert parallel zum normalen beidäugigen Blinzeln.
 * 
 * Verwendungsbeispiel:
 * ```ts
 * const handler = useSingleEyeBlinkHandler({
 *   onLeftEyeBlink: [
 *     () => console.log('Shortcut 1'),
 *     () => console.log('Shortcut 2')
 *   ],
 *   onRightEyeBlink: () => console.log('Shortcut 3')
 * })
 * 
 * handler.start()
 * handler.stop()
 * ```
 */

export interface SingleEyeBlinkHandlerConfig {
  /**
   * Callbacks für linkes Auge Blinzeln (Array für mehrere Callbacks)
   */
  onLeftEyeBlink?: (() => void) | (() => void)[]
  
  /**
   * Callbacks für rechtes Auge Blinzeln (Array für mehrere Callbacks)
   */
  onRightEyeBlink?: (() => void) | (() => void)[]
  
  /**
   * Cooldown zwischen Shortcuts (in ms)
   * Verhindert zu häufige Auslösung
   */
  cooldown?: number
}

export function useSingleEyeBlinkHandler(config: SingleEyeBlinkHandlerConfig = {}) {
  const {
    onLeftEyeBlink,
    onRightEyeBlink,
    cooldown = 500 // Standard: 500ms Cooldown
  } = config

  // Refs statt let für Reaktivität
  const isActive = ref(false)
  const lastShortcutTime = ref(0)
  let eventListener: EventListener | null = null
  
  // Normalisiere Callbacks zu Arrays
  const leftCallbacks = Array.isArray(onLeftEyeBlink) ? onLeftEyeBlink : (onLeftEyeBlink ? [onLeftEyeBlink] : [])
  const rightCallbacks = Array.isArray(onRightEyeBlink) ? onRightEyeBlink : (onRightEyeBlink ? [onRightEyeBlink] : [])

  /**
   * Prüft ob Cooldown abgelaufen ist
   */
  function checkCooldown(): boolean {
    const now = Date.now()
    if (now - lastShortcutTime.value < cooldown) {
      return false
    }
    lastShortcutTime.value = now
    return true
  }

  /**
   * Event-Handler für einseitiges Blinzeln
   */
  function handleSingleEyeBlink(event: Event) {
    if (!isActive.value) return
    
    const customEvent = event as CustomEvent<SingleEyeBlinkEventDetail>
    const { eye, timestamp } = customEvent.detail || {}
    
    if (!checkCooldown()) {
      console.log('SingleEyeBlinkHandler: Cooldown aktiv, ignoriere Event')
      return
    }

    if (eye === 'left' && leftCallbacks.length > 0) {
      console.log('SingleEyeBlinkHandler: Linkes Auge Blinzeln erkannt - Shortcut ausgelöst')
      leftCallbacks.forEach(callback => {
        try {
          callback()
        } catch (error) {
          console.error('SingleEyeBlinkHandler: Left eye blink callback error:', error)
        }
      })
    } else if (eye === 'right' && rightCallbacks.length > 0) {
      console.log('SingleEyeBlinkHandler: Rechtes Auge Blinzeln erkannt - Shortcut ausgelöst')
      rightCallbacks.forEach(callback => {
        try {
          callback()
        } catch (error) {
          console.error('SingleEyeBlinkHandler: Right eye blink callback error:', error)
        }
      })
    }
  }

  /**
   * Startet den Handler
   */
  function start() {
    if (isActive.value) {
      console.warn('SingleEyeBlinkHandler: Bereits aktiv')
      return
    }

    isActive.value = true
    console.log('SingleEyeBlinkHandler: Gestartet')

    // Event-Listener registrieren
    eventListener = handleSingleEyeBlink as EventListener
    window.addEventListener(EVENTS.FACE_SINGLE_EYE_BLINK_DETECTED, eventListener)
  }

  /**
   * Stoppt den Handler
   */
  function stop() {
    if (!isActive.value) {
      return
    }

    isActive.value = false
    console.log('SingleEyeBlinkHandler: Gestoppt')

    // Event-Listener entfernen
    if (eventListener) {
      window.removeEventListener(EVENTS.FACE_SINGLE_EYE_BLINK_DETECTED, eventListener)
      eventListener = null
    }
  }

  // Automatisches Aufräumen beim Unmount
  onUnmounted(() => {
    stop()
  })

  return {
    start,
    stop,
    isActive: readonly(isActive) // Reaktiv und read-only
  }
}

