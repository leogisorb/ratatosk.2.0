import { onMounted, onUnmounted } from 'vue'

/**
 * useSingleEyeBlinkHandler
 * 
 * Handler für einseitiges Blinzeln (links/rechts) als Shortcuts.
 * Funktioniert parallel zum normalen beidäugigen Blinzeln.
 * 
 * Verwendungsbeispiel:
 * ```ts
 * const handler = useSingleEyeBlinkHandler({
 *   onLeftEyeBlink: () => {
 *     console.log('Linkes Auge geblinzelt - Shortcut 1')
 *   },
 *   onRightEyeBlink: () => {
 *     console.log('Rechtes Auge geblinzelt - Shortcut 2')
 *   }
 * })
 * 
 * handler.start()
 * handler.stop()
 * ```
 */

export interface SingleEyeBlinkHandlerConfig {
  /**
   * Callback für linkes Auge Blinzeln
   */
  onLeftEyeBlink?: () => void
  
  /**
   * Callback für rechtes Auge Blinzeln
   */
  onRightEyeBlink?: () => void
  
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

  let isActive = false
  let lastShortcutTime = 0
  let eventListener: EventListener | null = null

  /**
   * Prüft ob Cooldown abgelaufen ist
   */
  function checkCooldown(): boolean {
    const now = Date.now()
    if (now - lastShortcutTime < cooldown) {
      return false
    }
    lastShortcutTime = now
    return true
  }

  /**
   * Event-Handler für einseitiges Blinzeln
   */
  function handleSingleEyeBlink(event: Event) {
    if (!isActive) return
    
    const customEvent = event as CustomEvent
    const { eye } = customEvent.detail || {}
    
    if (!checkCooldown()) {
      console.log('SingleEyeBlinkHandler: Cooldown aktiv, ignoriere Event')
      return
    }

    if (eye === 'left' && onLeftEyeBlink) {
      console.log('SingleEyeBlinkHandler: Linkes Auge Blinzeln erkannt - Shortcut ausgelöst')
      onLeftEyeBlink()
    } else if (eye === 'right' && onRightEyeBlink) {
      console.log('SingleEyeBlinkHandler: Rechtes Auge Blinzeln erkannt - Shortcut ausgelöst')
      onRightEyeBlink()
    }
  }

  /**
   * Startet den Handler
   */
  function start() {
    if (isActive) {
      console.warn('SingleEyeBlinkHandler: Bereits aktiv')
      return
    }

    isActive = true
    console.log('✅ SingleEyeBlinkHandler: Gestartet')

    // Event-Listener registrieren
    eventListener = handleSingleEyeBlink as EventListener
    window.addEventListener('faceSingleEyeBlinkDetected', eventListener)
  }

  /**
   * Stoppt den Handler
   */
  function stop() {
    if (!isActive) {
      return
    }

    isActive = false
    console.log('✅ SingleEyeBlinkHandler: Gestoppt')

    // Event-Listener entfernen
    if (eventListener) {
      window.removeEventListener('faceSingleEyeBlinkDetected', eventListener)
      eventListener = null
    }
  }

  // Auto-Cleanup on unmount
  onUnmounted(() => {
    stop()
  })

  return {
    start,
    stop,
    isActive: () => isActive
  }
}

