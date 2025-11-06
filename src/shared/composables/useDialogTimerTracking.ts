/**
 * Dialog Timer Tracking Composable
 * 
 * Verwaltet Timer-Tracking und Cleanup-Logik für Dialoge.
 * Verhindert, dass AutoMode oder andere Funktionen gestartet werden,
 * wenn der Dialog bereits verlassen wurde.
 * 
 * Beispiel:
 * ```ts
 * const { isActive, scheduleTimer, cleanup } = useDialogTimerTracking({
 *   onCleanup: () => {
 *     autoMode.stop()
 *   }
 * })
 * 
 * // Timer mit Prüfung erstellen
 * scheduleTimer(() => {
 *   if (items.value.length > 0) {
 *     autoMode.start(true)
 *   }
 * }, 3000)
 * ```
 */

import { ref } from 'vue'

export interface DialogTimerTrackingConfig {
  /**
   * Callback, der beim Cleanup aufgerufen wird
   * Wird verwendet, um AutoMode oder andere Services zu stoppen
   */
  onCleanup?: () => void
  
  /**
   * Name des Dialogs (für Logging)
   */
  dialogName?: string
}

export function useDialogTimerTracking(config: DialogTimerTrackingConfig = {}) {
  const { onCleanup, dialogName = 'Dialog' } = config
  
  // Flag: Verhindert, dass AutoMode gestartet wird, wenn der Dialog verlassen wurde
  const isActive = ref(true)
  
  // Timer-Tracking: Alle Timer, die AutoMode starten könnten
  const pendingTimers: number[] = []
  
  /**
   * Erstellt einen Timer mit automatischer Prüfung auf isActive
   * Timer wird automatisch getrackt und kann beim Cleanup gestoppt werden
   */
  function scheduleTimer(callback: () => void, delay: number): number {
    const timerId = window.setTimeout(() => {
      // Timer aus Liste entfernen
      const index = pendingTimers.indexOf(timerId)
      if (index > -1) {
        pendingTimers.splice(index, 1)
      }
      
      // Prüfe ob Dialog noch aktiv ist
      if (!isActive.value) {
        console.log(`${dialogName}: Dialog verlassen - Timer-Callback wird nicht ausgeführt`)
        return
      }
      
      // Callback ausführen
      callback()
    }, delay)
    
    // Timer zur Liste hinzufügen
    pendingTimers.push(timerId)
    
    return timerId
  }
  
  /**
   * Stoppt alle Timer und verhindert weitere AutoMode-Starts
   */
  function cleanup() {
    console.log(`${dialogName}: Cleanup - Stoppe alle Timer und verhindere weitere AutoMode-Starts`)
    
    // Flag setzen: Dialog ist nicht mehr aktiv
    isActive.value = false
    
    // Stoppe alle pending Timer
    pendingTimers.forEach((timerId) => {
      clearTimeout(timerId)
    })
    pendingTimers.length = 0
    
    // Callback aufrufen (z.B. um AutoMode zu stoppen)
    if (onCleanup) {
      onCleanup()
    }
    
    console.log(`${dialogName}: Cleanup abgeschlossen - alle Timer gestoppt`)
  }
  
  /**
   * Prüft ob der Dialog noch aktiv ist
   */
  function checkIsActive(): boolean {
    return isActive.value
  }
  
  return {
    // State
    isActive,
    
    // Functions
    scheduleTimer,
    cleanup,
    checkIsActive
  }
}

