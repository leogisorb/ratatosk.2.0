/**
 * Simplified Dialog Timer Tracking
 * 
 * Nutzt TimerManager und UnifiedCleanup für DRY-Code
 * Verwaltet Timer-Tracking und Cleanup-Logik für Dialoge.
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
import { timerManager } from '../utils/TimerManager'
import type { TimerHandle } from '../utils/TimerManager'
import { useExtendedCleanup } from '../utils/UnifiedCleanup'

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
  
  // Unified Cleanup für automatisches Timer-Management
  const cleanup = useExtendedCleanup(dialogName)
  
  // Registriere onCleanup callback
  if (onCleanup) {
    cleanup.register(onCleanup, 'onCleanup')
  }
  
  /**
   * Erstellt Timer mit automatischer Registrierung
   */
  function scheduleTimer(callback: () => void, delay: number): TimerHandle | null {
    // Atomic check
    if (!isActive.value) {
      console.log(`${dialogName}: Inactive - timer not created`)
      return null
    }
    
    const handle = timerManager.setTimeout(() => {
      // Double-check für Race Conditions
      if (!isActive.value) {
        console.log(`${dialogName}: Dialog left - callback not executed`)
        return
      }
      
      try {
        callback()
      } catch (error) {
        console.error(`${dialogName}: Timer callback error:`, error)
      }
    }, delay)
    
    // Registriere für automatisches Cleanup
    cleanup.registerTimer(handle, `timer_${delay}ms`)
    
    return handle
  }
  
  /**
   * Async Timer mit Promise
   */
  function scheduleTimerAsync<T>(
    callback: () => T | Promise<T>,
    delay: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!isActive.value) {
        reject(new Error('Dialog inactive'))
        return
      }
      
      const handle = timerManager.setTimeout(async () => {
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
      
      cleanup.registerTimer(handle, `async_timer_${delay}ms`)
    })
  }
  
  /**
   * Registriert zusätzliche Cleanup-Funktion
   */
  function registerCleanup(fn: () => void, name?: string): void {
    cleanup.register(fn, name)
  }
  
  /**
   * Stoppt alle Timer und führt Cleanup aus
   */
  async function executeCleanup(): Promise<void> {
    if (!isActive.value) {
      console.warn(`${dialogName}: Cleanup already called`)
      return
    }
    
    console.log(`${dialogName}: Cleanup - stopping all timers`)
    isActive.value = false
    
    await cleanup.execute()
  }
  
  /**
   * Prüft ob der Dialog noch aktiv ist
   */
  function checkIsActive(): boolean {
    return isActive.value
  }
  
  return {
    isActive,
    scheduleTimer,
    scheduleTimerAsync,
    registerCleanup,
    cleanup: executeCleanup,
    checkIsActive: () => isActive.value
  }
}


