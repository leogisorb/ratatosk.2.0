/**
 * Cleanup Registry
 * Manages cleanup functions for views to prevent memory leaks
 * and ensure proper cleanup during navigation
 */

export interface CleanupFunction {
  (): Promise<void> | void
}

class CleanupRegistry {
  private cleanups = new Map<string, CleanupFunction>()

  /**
   * Register a cleanup function for a view
   */
  register(viewName: string, cleanup: CleanupFunction): void {
    this.cleanups.set(viewName, cleanup)
    console.log(`CleanupRegistry: Registered cleanup for ${viewName}`)
  }

  /**
   * Unregister a cleanup function
   */
  unregister(viewName: string): void {
    if (this.cleanups.delete(viewName)) {
      console.log(`CleanupRegistry: Unregistered cleanup for ${viewName}`)
    }
  }

  /**
   * Execute cleanup for a specific view with timeout
   */
  async cleanup(viewName: string, timeout = 1000): Promise<void> {
    const cleanup = this.cleanups.get(viewName)
    if (!cleanup) {
      console.log(`CleanupRegistry: No cleanup registered for ${viewName}`)
      return
    }

    console.log(`CleanupRegistry: Executing cleanup for ${viewName}`)

    try {
      const cleanupResult = cleanup()
      
      // Handle both sync and async cleanups
      const cleanupPromise = cleanupResult instanceof Promise 
        ? cleanupResult 
        : Promise.resolve()
      
      await Promise.race([
        cleanupPromise,
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('Cleanup timeout')), timeout)
        )
      ])
      console.log(`CleanupRegistry: Cleanup completed for ${viewName}`)
    } catch (error) {
      if (error instanceof Error && error.message === 'Cleanup timeout') {
        console.warn(`CleanupRegistry: Cleanup timeout for ${viewName} after ${timeout}ms`)
      } else {
        console.error(`CleanupRegistry: Cleanup error for ${viewName}:`, error)
      }
    } finally {
      this.unregister(viewName)
    }
  }

  /**
   * Cleanup all registered views
   */
  async cleanupAll(timeout = 1000): Promise<void> {
    const viewNames = Array.from(this.cleanups.keys())
    console.log(`CleanupRegistry: Cleaning up ${viewNames.length} views`)

    await Promise.allSettled(
      viewNames.map(viewName => this.cleanup(viewName, timeout))
    )
  }

  /**
   * Check if a view has registered cleanup
   */
  hasCleanup(viewName: string): boolean {
    return this.cleanups.has(viewName)
  }
}

// Singleton for registry (ok, because it's only coordination)
export const cleanupRegistry = new CleanupRegistry()

