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
  
  // Timer-Tracking: Set statt Array für O(1) Operationen
  const pendingTimers = new Set<number>()
  
  // Cleanup Registry für mehrere Cleanup-Funktionen
  const cleanupFunctions: (() => void)[] = []
  
  /**
   * Registriert eine Cleanup-Funktion
   */
  function registerCleanup(cleanup: () => void): void {
    cleanupFunctions.push(cleanup)
  }
  
  /**
   * Erstellt einen Timer mit automatischer Prüfung auf isActive
   * Timer wird automatisch getrackt und kann beim Cleanup gestoppt werden
   * Atomic: Prüft isActive BEVOR Timer registriert wird
   */
  function scheduleTimer(callback: () => void, delay: number): number {
    // Atomic check: Wenn nicht aktiv, Timer gar nicht erstellen
    if (!isActive.value) {
      console.log(`${dialogName}: Dialog nicht aktiv - Timer wird nicht erstellt`)
      return -1 // Invalid timer ID
    }
    
    const timerId = window.setTimeout(() => {
      // Timer aus Set entfernen
      pendingTimers.delete(timerId)
      
      // Prüfe ob Dialog noch aktiv ist (double-check für Race Conditions)
      if (!isActive.value) {
        console.log(`${dialogName}: Dialog verlassen - Timer-Callback wird nicht ausgeführt`)
        return
      }
      
      // Callback ausführen mit Error Handling
      try {
      callback()
      } catch (error) {
        console.error(`${dialogName}: Timer callback error:`, error)
      }
    }, delay)
    
    // Timer zum Set hinzufügen (nur wenn noch aktiv)
    if (isActive.value) {
    pendingTimers.add(timerId)
    } else {
      // Race condition: cleanup wurde zwischen Check und Add aufgerufen
      clearTimeout(timerId)
      return -1
    }
    
    return timerId
  }
  
  /**
   * Erstellt einen Timer mit Promise und async/await Support
   */
  function scheduleTimerAsync<T>(
    callback: () => T | Promise<T>,
    delay: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timerId = window.setTimeout(async () => {
        pendingTimers.delete(timerId)
        
        if (!isActive.value) {
          reject(new Error('Dialog inactive'))
          return
        }
        
        try {
          const result = await callback()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }, delay)
      
      pendingTimers.add(timerId)
    })
  }
  
  /**
   * Stoppt alle Timer und verhindert weitere AutoMode-Starts
   * Atomic cleanup to prevent race conditions
   */
  function cleanup() {
    // Atomic: Erst Flag prüfen, dann setzen
    if (!isActive.value) {
      console.warn(`${dialogName}: Cleanup bereits aufgerufen`)
      return
    }
    
    console.log(`${dialogName}: Cleanup - Stoppe alle Timer und verhindere weitere AutoMode-Starts`)
    
    // Flag setzen: Dialog ist nicht mehr aktiv (atomic)
    isActive.value = false
    
    // Copy timer IDs to avoid iteration during modification
    const timersCopy = Array.from(pendingTimers)
    pendingTimers.clear()
    
    // Stoppe alle pending Timer
    timersCopy.forEach((timerId) => {
      clearTimeout(timerId)
    })
    
    // Führe alle registrierten Cleanup-Funktionen aus mit Error Handling
    const cleanupErrors: Error[] = []
    cleanupFunctions.forEach((fn, index) => {
      try {
        fn()
      } catch (error) {
        console.error(`${dialogName}: Cleanup function ${index} failed:`, error)
        cleanupErrors.push(error as Error)
      }
    })
    cleanupFunctions.length = 0
    
    // Callback aufrufen (z.B. um AutoMode zu stoppen) mit Error Handling
    if (onCleanup) {
      try {
      onCleanup()
      } catch (error) {
        console.error(`${dialogName}: onCleanup callback failed:`, error)
        cleanupErrors.push(error as Error)
      }
    }
    
    // Log aggregated errors if any
    if (cleanupErrors.length > 0) {
      console.error(`${dialogName}: Cleanup completed with ${cleanupErrors.length} errors`)
    } else {
    console.log(`${dialogName}: Cleanup abgeschlossen - alle Timer gestoppt`)
    }
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
    scheduleTimerAsync,
    registerCleanup,
    cleanup,
    checkIsActive
  }
}

