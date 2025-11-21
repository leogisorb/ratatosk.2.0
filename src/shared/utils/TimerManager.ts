/**
 * Unified Timer Management
 * Eliminiert Timer-Duplikate und Race Conditions
 */

export type TimerId = symbol

export interface TimerHandle {
  readonly id: TimerId
  cancel(): void
  readonly cancelled: boolean
}

interface TimerEntry {
  id: TimerId
  handle: ReturnType<typeof setTimeout> | ReturnType<typeof requestAnimationFrame>
  type: 'timeout' | 'interval' | 'animationFrame'
  cancelled: boolean
}

/**
 * TimerManager - Zentrale Verwaltung aller Timer
 * Verhindert Memory Leaks und Race Conditions
 */
export class TimerManager {
  private timers = new Map<TimerId, TimerEntry>()
  private nextId = 0

  /**
   * Erstellt einen Timeout-Timer
   */
  setTimeout(callback: () => void, delay: number): TimerHandle {
    const id = this.createId()
    const handle = setTimeout(() => {
      const entry = this.timers.get(id)
      if (entry && !entry.cancelled) {
        this.timers.delete(id)
        callback()
      }
    }, delay)

    this.timers.set(id, {
      id,
      handle,
      type: 'timeout',
      cancelled: false
    })

    return this.createHandle(id)
  }

  /**
   * Erstellt einen Interval-Timer
   */
  setInterval(callback: () => void, delay: number): TimerHandle {
    const id = this.createId()
    const handle = setInterval(() => {
      const entry = this.timers.get(id)
      if (entry && !entry.cancelled) {
        callback()
      } else {
        this.clearInterval(handle)
      }
    }, delay)

    this.timers.set(id, {
      id,
      handle,
      type: 'interval',
      cancelled: false
    })

    return this.createHandle(id)
  }

  /**
   * Erstellt einen AnimationFrame-Timer
   */
  requestAnimationFrame(callback: () => void): TimerHandle {
    const id = this.createId()
    const handle = requestAnimationFrame(() => {
      const entry = this.timers.get(id)
      if (entry && !entry.cancelled) {
        this.timers.delete(id)
        callback()
      }
    })

    this.timers.set(id, {
      id,
      handle,
      type: 'animationFrame',
      cancelled: false
    })

    return this.createHandle(id)
  }

  /**
   * Erstellt einen Promise-basierten Delay
   */
  delay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'))
        return
      }

      const handle = this.setTimeout(() => {
        if (signal?.aborted) {
          reject(new DOMException('Aborted', 'AbortError'))
        } else {
          resolve()
        }
      }, ms)

      signal?.addEventListener('abort', () => {
        handle.cancel()
        reject(new DOMException('Aborted', 'AbortError'))
      }, { once: true })
    })
  }

  /**
   * Bricht einen Timer ab
   */
  cancel(id: TimerId): void {
    const entry = this.timers.get(id)
    if (!entry || entry.cancelled) {
      return
    }

    entry.cancelled = true

    switch (entry.type) {
      case 'timeout':
        clearTimeout(entry.handle as ReturnType<typeof setTimeout>)
        break
      case 'interval':
        clearInterval(entry.handle as ReturnType<typeof setInterval>)
        break
      case 'animationFrame':
        cancelAnimationFrame(entry.handle as ReturnType<typeof requestAnimationFrame>)
        break
    }

    this.timers.delete(id)
  }

  /**
   * Bricht alle Timer ab
   */
  cancelAll(): void {
    const ids = Array.from(this.timers.keys())
    ids.forEach(id => this.cancel(id))
  }

  /**
   * Prüft ob ein Timer existiert
   */
  has(id: TimerId): boolean {
    return this.timers.has(id) && !this.timers.get(id)!.cancelled
  }

  /**
   * Gibt die Anzahl aktiver Timer zurück
   */
  getActiveCount(): number {
    return Array.from(this.timers.values()).filter(e => !e.cancelled).length
  }

  /**
   * Erstellt eine eindeutige ID
   */
  private createId(): TimerId {
    return Symbol(`timer_${++this.nextId}`)
  }

  /**
   * Erstellt ein TimerHandle
   */
  private createHandle(id: TimerId): TimerHandle {
    const timers = this.timers
    return {
      id,
      cancel: () => this.cancel(id),
      get cancelled() {
        const entry = timers.get(id)
        return !entry || entry.cancelled
      }
    }
  }

  /**
   * Interne Methode zum Löschen von Intervals
   */
  private clearInterval(handle: ReturnType<typeof setInterval>): void {
    clearInterval(handle)
  }
}

/**
 * Globale TimerManager-Instanz
 */
export const timerManager = new TimerManager()

/**
 * Vue Composable für automatisches Cleanup von Timern
 */
import { onUnmounted } from 'vue'

export function useTimerManager() {
  const manager = new TimerManager()

  onUnmounted(() => {
    manager.cancelAll()
  })

  return manager
}

