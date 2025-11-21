/**
 * Cleanup Coordinator
 * Vereinheitlicht alle Cleanup-Patterns und verhindert Memory Leaks
 */

import { onUnmounted } from 'vue'

export type CleanupFunction = () => void | Promise<void>

export interface CleanupScope {
  register(cleanup: CleanupFunction, name?: string): void
  unregister(name: string): void
  execute(): Promise<void>
  readonly isCleanedUp: boolean
}

/**
 * Cleanup Coordinator
 * Verwaltet Cleanup-Funktionen mit Scoping und Error Handling
 */
export class CleanupCoordinator implements CleanupScope {
  private cleanups = new Map<string, CleanupFunction>()
  private cleanedUp = false
  private readonly context: string
  private cleanupCount = 0

  constructor(context: string = 'CleanupCoordinator') {
    this.context = context
  }

  /**
   * Registriert Cleanup-Funktion
   */
  register(cleanup: CleanupFunction, name?: string): void {
    if (this.cleanedUp) {
      console.warn(`${this.context}: Already cleaned up, ignoring registration`)
      return
    }

    const cleanupName = name ?? `cleanup_${++this.cleanupCount}`
    
    if (this.cleanups.has(cleanupName)) {
      console.warn(`${this.context}: Overwriting existing cleanup: ${cleanupName}`)
    }

    this.cleanups.set(cleanupName, cleanup)
    console.log(`${this.context}: Registered cleanup: ${cleanupName}`)
  }

  /**
   * Entfernt Cleanup-Funktion
   */
  unregister(name: string): void {
    if (this.cleanups.delete(name)) {
      console.log(`${this.context}: Unregistered cleanup: ${name}`)
    }
  }

  /**
   * Führt alle Cleanups aus
   */
  async execute(): Promise<void> {
    if (this.cleanedUp) {
      console.warn(`${this.context}: Already cleaned up`)
      return
    }

    console.log(`${this.context}: Executing ${this.cleanups.size} cleanups`)
    this.cleanedUp = true

    const errors: Array<{ name: string; error: unknown }> = []

    // Führe alle Cleanups parallel mit Timeout aus
    const cleanupPromises = Array.from(this.cleanups.entries()).map(
      async ([name, cleanup]) => {
        try {
          await this.executeWithTimeout(cleanup, name, 1000)
        } catch (error) {
          errors.push({ name, error })
        }
      }
    )

    await Promise.allSettled(cleanupPromises)
    this.cleanups.clear()

    // Log Errors
    if (errors.length > 0) {
      console.error(`${this.context}: ${errors.length} cleanup(s) failed:`)
      errors.forEach(({ name, error }) => {
        console.error(`  - ${name}:`, error)
      })
    } else {
      console.log(`${this.context}: All cleanups completed successfully`)
    }
  }

  /**
   * Führt Cleanup mit Timeout aus
   */
  private async executeWithTimeout(
    cleanup: CleanupFunction,
    name: string,
    timeout: number
  ): Promise<void> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
    })

    const cleanupPromise = Promise.resolve(cleanup())

    try {
      await Promise.race([cleanupPromise, timeoutPromise])
      console.log(`${this.context}: Cleanup completed: ${name}`)
    } catch (error) {
      console.error(`${this.context}: Cleanup failed: ${name}`, error)
      throw error
    }
  }

  get isCleanedUp(): boolean {
    return this.cleanedUp
  }

  /**
   * Shortcut für häufige Cleanup-Typen
   */
  registerTimer(handle: { cancel(): void }, name?: string): void {
    this.register(() => handle.cancel(), name ?? 'timer')
  }

  registerEventListener(
    target: EventTarget,
    event: string,
    handler: EventListener,
    name?: string
  ): void {
    this.register(
      () => target.removeEventListener(event, handler),
      name ?? `event_${event}`
    )
  }

  registerAbortController(
    controller: AbortController,
    name?: string
  ): void {
    this.register(() => controller.abort(), name ?? 'abort_controller')
  }
}

/**
 * Vue Composable für automatisches Cleanup
 */
export function useCleanup(context: string): CleanupScope {
  const coordinator = new CleanupCoordinator(context)

  onUnmounted(async () => {
    await coordinator.execute()
  })

  return coordinator
}

/**
 * Decorator für automatisches Cleanup in Klassen
 */
export function withCleanup(context: string) {
  return function <T extends { new(...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      private cleanup = new CleanupCoordinator(context)

      constructor(...args: any[]) {
        super(...args)
      }

      protected registerCleanup(fn: CleanupFunction, name?: string): void {
        this.cleanup.register(fn, name)
      }

      async destroy(): Promise<void> {
        await this.cleanup.execute()
      }
    }
  }
}

/**
 * Globale Cleanup Registry für Cross-Component Cleanup
 */
class GlobalCleanupRegistry {
  private coordinators = new Map<string, CleanupCoordinator>()

  getOrCreate(key: string): CleanupCoordinator {
    let coordinator = this.coordinators.get(key)
    
    if (!coordinator) {
      coordinator = new CleanupCoordinator(key)
      this.coordinators.set(key, coordinator)
    }

    return coordinator
  }

  async cleanup(key: string): Promise<void> {
    const coordinator = this.coordinators.get(key)
    
    if (coordinator) {
      await coordinator.execute()
      this.coordinators.delete(key)
    }
  }

  async cleanupAll(): Promise<void> {
    const keys = Array.from(this.coordinators.keys())
    await Promise.all(keys.map(key => this.cleanup(key)))
  }
}

export const globalCleanup = new GlobalCleanupRegistry()

