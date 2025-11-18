import { ref, computed, onUnmounted, nextTick } from 'vue'
import { TIMING } from '../constants/timing'
import { handleError, isAbortError } from '../utils/errorHandling'
import { simpleFlowController } from '../../core/application/SimpleFlowController'

const DEBUG = false // Debug-Logging ein/aus

export interface AutoModeConfig {
  speak: (text: string) => Promise<void>
  getItems: () => any[]
  getTitle: () => string
  onCycle?: (index: number, item: any) => void
  initialDelay?: number
  cycleDelay?: number
}

/**
 * AutoMode Registry - Singleton Pattern
 * Manages active AutoMode instances to prevent memory leaks
 */
class AutoModeRegistry {
  private static instance: AutoModeRegistry
  private activeInstance: { id: symbol; stop: () => void } | null = null

  private constructor() {}

  static getInstance(): AutoModeRegistry {
    if (!AutoModeRegistry.instance) {
      AutoModeRegistry.instance = new AutoModeRegistry()
    }
    return AutoModeRegistry.instance
  }

  register(id: symbol, stop: () => void): boolean {
    if (this.activeInstance && this.activeInstance.id !== id) {
      this.activeInstance.stop()
      return false
    }
    this.activeInstance = { id, stop }
    return true
  }

  unregister(id: symbol): void {
    if (this.activeInstance?.id === id) {
      this.activeInstance = null
    }
  }

  stopActive(): void {
    this.activeInstance?.stop()
    this.activeInstance = null
  }

  getActiveId(): symbol | null {
    return this.activeInstance?.id || null
  }
}

const registry = AutoModeRegistry.getInstance()

// Extrahiert Text aus einem Item, probiert verschiedene Felder durch
function extractItemText(item: any): string {
  // Bei Pain Levels nehmen wir die Beschreibung
  if ('level' in item && 'description' in item && typeof item.description === 'string') {
    return item.description
  }
  
  // Manche Items haben speziellen TTS-Text
  if (item.ttsText && typeof item.ttsText === 'string') {
    return item.ttsText
  }
  
  // Fallback: title, name, description oder einfach als String
  return item.title || item.name || item.description || String(item)
}

// Hilfsfunktion für Debug-Ausgaben
function debug(...args: any[]) {
  if (DEBUG) console.log('[AutoMode]', ...args)
}

export function useAutoMode(config: AutoModeConfig) {
  const { 
    speak, 
    getItems, 
    getTitle, 
    onCycle, 
    initialDelay = TIMING.AUTO_MODE.INITIAL_DELAY, 
    cycleDelay = TIMING.AUTO_MODE.CYCLE_DELAY 
  } = config

  const running = ref(false)
  const index = ref(0)
  const instanceId = Symbol('autoMode') // Eindeutige ID für diese Instanz
  
  let abortController: AbortController | null = null

  // Wartet eine bestimmte Zeit, kann aber abgebrochen werden
  function delay(ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      // Prüfe sofort ob bereits aborted
      if (abortController?.signal.aborted) {
        reject(new Error('Aborted'))
        return
      }
      
      const timeoutId = setTimeout(resolve, ms)
      
      abortController?.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId)
        reject(new Error('Aborted'))
      }, { once: true })
    })
  }

  // Stoppt den AutoMode und räumt auf
  function stop() {
    debug('Stopping')
    running.value = false
    index.value = 0 // Index zurücksetzen, damit UI nicht alten Wert zeigt
    
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    
    // Unregister from registry to prevent memory leaks
    registry.unregister(instanceId)
  }

  // Cleanup on component unmount to prevent memory leaks
  onUnmounted(() => {
    debug('Component unmounted - cleaning up AutoMode')
    stop()
  })

  // Hauptschleife, die durch alle Items geht und sie vorliest
  async function loop() {
    try {
      while (running.value && !abortController?.signal.aborted) {
        const items = getItems()
        
        // Wenn keine Items da sind, aufhören
        if (!items?.length) {
          debug('No items, stopping')
          break
        }

        // Index prüfen und zurücksetzen falls nötig
        if (index.value < 0 || index.value >= items.length) {
          debug(`Invalid index ${index.value}, resetting to 0`)
          index.value = 0
        }

        const item = items[index.value]
        const itemTitle = extractItemText(item)
        
        debug(`Cycle ${index.value}/${items.length}: ${itemTitle}`)
        
        // Callback aufrufen falls vorhanden
        onCycle?.(index.value, item)
        
        // Sicherstellen, dass UI Zeit hat, den aktuellen Index anzuzeigen
        await nextTick()
        
        // Item vorlesen
        try {
          await speak(itemTitle)
        } catch (error) {
          // TTS-Fehler sind nicht kritisch, einfach weitermachen
          if (isAbortError(error)) {
            throw error // Aborted weiterwerfen
          }
          handleError('[AutoMode] TTS error', error, { logLevel: 'warn' })
        }

        // Prüfen ob noch aktiv
        if (!running.value || abortController?.signal.aborted) {
          break
        }

        // Warten vor dem nächsten Durchlauf
        await delay(cycleDelay)
        
        // Nochmal prüfen ob noch aktiv
        if (!running.value || abortController?.signal.aborted) {
          break
        }

        // Zum nächsten Index springen
        const currentItems = getItems()
        if (currentItems?.length) {
          index.value = (index.value + 1) % currentItems.length
          debug(`Next index: ${index.value}`)
        }
      }
    } catch (error) {
      if (!isAbortError(error)) {
        handleError('[AutoMode] Loop error', error)
      }
    } finally {
      debug('Loop finished')
      running.value = false
    }
  }

  // Startet den AutoMode
  async function start(skipTitle = false) {
    debug('Starting', { skipTitle })
    
    // Falls schon eine andere Instanz läuft, die erst stoppen
    const activeId = registry.getActiveId()
    if (activeId && activeId !== instanceId) {
      debug('Stopping previous instance')
      registry.stopActive()
      // Kurz warten damit die alte Instanz aufräumen kann
      await new Promise(resolve => setTimeout(resolve, TIMING.AUTO_MODE.RETRY_DELAY))
    }

    // Eigenen vorherigen State aufräumen
    running.value = false
    if (abortController) {
      abortController.abort()
      abortController = null
    }

    // Als aktive Instanz registrieren
    registry.register(instanceId, stop)
    
    // Neue Session initialisieren
    abortController = new AbortController()
    running.value = true
    index.value = 0
    
    const items = getItems()
    
    if (!items?.length) {
      debug('No items found')
      stop()
      return
    }

    debug(`Starting with ${items.length} items`)

    try {
      // Titel vorlesen falls gewünscht
      if (!skipTitle) {
        const title = getTitle()
        debug('Speaking title:', title)
        
        try {
          await speak(title)
        } catch (error) {
          if (!isAbortError(error)) {
            handleError('[AutoMode] Title TTS error', error)
          }
          throw error
        }

        // Prüfen ob noch aktiv
        if (!running.value || abortController?.signal.aborted) {
          debug('Stopped during title')
          return
        }
      }

      // Initiale Wartezeit - kürzer wenn TTS muted ist
      const isTTSMuted = simpleFlowController.getTTSMuted()
      const effectiveInitialDelay = isTTSMuted ? Math.min(initialDelay, 500) : initialDelay
      debug(`Waiting ${effectiveInitialDelay}ms before starting loop (TTS muted: ${isTTSMuted})`)
      await delay(effectiveInitialDelay)
      
      // Nochmal prüfen ob noch aktiv
      if (!running.value || abortController?.signal.aborted) {
        debug('Stopped during initial delay')
        return
      }

      // Sicherstellen, dass UI Zeit hat, Index 0 anzuzeigen
      await nextTick()
      
      // Nochmal prüfen ob noch aktiv
      if (!running.value || abortController?.signal.aborted) {
        debug('Stopped after nextTick')
        return
      }

      // Hauptschleife starten
      debug('Starting main loop')
      await loop()
      
    } catch (error) {
      if (!isAbortError(error)) {
        handleError('[AutoMode] Start error', error)
      }
    } finally {
      debug('Start finished')
      stop()
    }
  }

  return {
    start,
    stop,
    index,
    running: computed(() => running.value),
  }
}
