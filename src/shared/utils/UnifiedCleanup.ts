/**
 * Unified Cleanup System
 * Vereinheitlicht CleanupCoordinator und cleanupRegistry
 * Bietet sowohl Component-scoped als auch View-scoped Cleanup
 */

import { onUnmounted } from 'vue'
import { CleanupCoordinator, type CleanupScope } from './CleanupCoordinator'
import type { TimerHandle } from './TimerManager'

export type CleanupFunction = () => void | Promise<void>

/**
 * View-scoped Cleanup für Navigation
 * Ersetzt cleanupRegistry
 */
class ViewCleanup {
  private coordinators = new Map<string, CleanupCoordinator>()

  /**
   * Registriert Cleanup für einen View
   */
  register(viewName: string, cleanup: CleanupFunction): void {
    const coordinator = this.getOrCreate(viewName)
    coordinator.register(cleanup, `${viewName}-cleanup`)
    console.log(`ViewCleanup: Registered cleanup for ${viewName}`)
  }

  /**
   * Entfernt Cleanup-Registrierung
   */
  unregister(viewName: string): void {
    const coordinator = this.coordinators.get(viewName)
    if (coordinator) {
      this.coordinators.delete(viewName)
      console.log(`ViewCleanup: Unregistered cleanup for ${viewName}`)
    }
  }

  /**
   * Führt Cleanup für einen View aus
   */
  async cleanup(viewName: string): Promise<void> {
    const coordinator = this.coordinators.get(viewName)
    if (!coordinator) {
      console.log(`ViewCleanup: No cleanup registered for ${viewName}`)
      return
    }

    console.log(`ViewCleanup: Executing cleanup for ${viewName}`)
    await coordinator.execute()
    this.coordinators.delete(viewName)
  }

  /**
   * Räumt alle Views auf
   */
  async cleanupAll(): Promise<void> {
    const viewNames = Array.from(this.coordinators.keys())
    console.log(`ViewCleanup: Cleaning up ${viewNames.length} views`)

    await Promise.allSettled(
      viewNames.map(viewName => this.cleanup(viewName))
    )
  }

  /**
   * Prüft ob ein View registriert ist
   */
  hasCleanup(viewName: string): boolean {
    return this.coordinators.has(viewName)
  }

  /**
   * Gibt Coordinator für einen View zurück oder erstellt neuen
   */
  private getOrCreate(viewName: string): CleanupCoordinator {
    let coordinator = this.coordinators.get(viewName)
    if (!coordinator) {
      coordinator = new CleanupCoordinator(`ViewCleanup:${viewName}`)
      this.coordinators.set(viewName, coordinator)
    }
    return coordinator
  }
}

/**
 * Vue Composable für Component-scoped Cleanup
 * Ersetzt useCleanup aus CleanupCoordinator
 * 
 * WICHTIG: onUnmounted kann nicht async sein!
 * Die async Operation läuft im Hintergrund.
 */
export function useCleanup(context: string = 'Component'): CleanupScope {
  const coordinator = new CleanupCoordinator(context)

  onUnmounted(() => {
    // onUnmounted kann nicht async sein - führe Cleanup im Hintergrund aus
    coordinator.execute().catch(error => {
      console.error(`${context}: Cleanup error in onUnmounted:`, error)
    })
  })

  return coordinator
}

/**
 * Globale View-Cleanup-Instanz
 * Ersetzt cleanupRegistry
 */
export const ViewCleanupRegistry = new ViewCleanup()

/**
 * Legacy-Export für Rückwärtskompatibilität
 * @deprecated Verwende ViewCleanupRegistry statt cleanupRegistry
 */
export const cleanupRegistry = {
  register: (viewName: string, cleanup: CleanupFunction) => {
    ViewCleanupRegistry.register(viewName, cleanup)
  },
  unregister: (viewName: string) => {
    ViewCleanupRegistry.unregister(viewName)
  },
  cleanup: (viewName: string, timeout?: number) => {
    // timeout wird ignoriert, da CleanupCoordinator bereits Timeout hat
    return ViewCleanupRegistry.cleanup(viewName)
  },
  cleanupAll: (timeout?: number) => {
    // timeout wird ignoriert
    return ViewCleanupRegistry.cleanupAll()
  },
  hasCleanup: (viewName: string) => {
    return ViewCleanupRegistry.hasCleanup(viewName)
  }
}

/**
 * Erweiterte CleanupScope mit Timer-Support
 */
export interface ExtendedCleanupScope extends CleanupScope {
  registerTimer(handle: TimerHandle, name?: string): void
  registerEventListener(
    target: EventTarget,
    event: string,
    handler: EventListener,
    name?: string
  ): void
  registerAbortController(
    controller: AbortController,
    name?: string
  ): void
}

/**
 * Erweiterte useCleanup mit allen Features
 * 
 * WICHTIG: onUnmounted kann nicht async sein!
 * Die async Operation läuft im Hintergrund.
 */
export function useExtendedCleanup(context: string = 'Component'): ExtendedCleanupScope {
  const coordinator = new CleanupCoordinator(context)

  onUnmounted(() => {
    // onUnmounted kann nicht async sein - führe Cleanup im Hintergrund aus
    coordinator.execute().catch(error => {
      console.error(`${context}: Cleanup error in onUnmounted:`, error)
    })
  })

  return {
    register: (cleanup: CleanupFunction, name?: string) => coordinator.register(cleanup, name),
    unregister: (name: string) => coordinator.unregister(name),
    execute: () => coordinator.execute(),
    get isCleanedUp() { return coordinator.isCleanedUp },
    registerTimer: (handle: TimerHandle, name?: string) => {
      coordinator.registerTimer(handle, name)
    },
    registerEventListener: (
      target: EventTarget,
      event: string,
      handler: EventListener,
      name?: string
    ) => {
      coordinator.registerEventListener(target, event, handler, name)
    },
    registerAbortController: (controller: AbortController, name?: string) => {
      coordinator.registerAbortController(controller, name)
    }
  }
}

