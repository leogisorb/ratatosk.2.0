import { ref, computed } from 'vue'

// Konstanten für Timing
const AUTO_MODE_RETRY_DELAY = 100 // ms
const DEFAULT_INITIAL_DELAY = 3000 // ms
const DEFAULT_CYCLE_DELAY = 3000 // ms
const DEBUG = false // Debug-Logging ein/aus

export interface AutoModeConfig {
  speak: (text: string) => Promise<void>
  getItems: () => any[]
  getTitle: () => string
  onCycle?: (index: number, item: any) => void
  initialDelay?: number
  cycleDelay?: number
}

// Globale Variable, damit immer nur eine AutoMode-Instanz gleichzeitig läuft
let activeInstance: { id: symbol; stop: () => void } | null = null

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
    initialDelay = DEFAULT_INITIAL_DELAY, 
    cycleDelay = DEFAULT_CYCLE_DELAY 
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
    
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    
    // Wenn wir die aktive Instanz sind, entfernen wir uns aus der globalen Variable
    if (activeInstance?.id === instanceId) {
      activeInstance = null
    }
  }

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
        
        // Item vorlesen
        try {
          await speak(itemTitle)
        } catch (error) {
          // TTS-Fehler sind nicht kritisch, einfach weitermachen
          if (error instanceof Error && error.message !== 'Aborted') {
            console.error('[AutoMode] TTS error:', error)
          } else {
            throw error // Aborted weiterwerfen
          }
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
      if (error instanceof Error && error.message !== 'Aborted') {
        console.error('[AutoMode] Loop error:', error)
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
    if (activeInstance && activeInstance.id !== instanceId) {
      debug('Stopping previous instance')
      activeInstance.stop()
      // Kurz warten damit die alte Instanz aufräumen kann
      await new Promise(resolve => setTimeout(resolve, AUTO_MODE_RETRY_DELAY))
    }

    // Eigenen vorherigen State aufräumen
    running.value = false
    if (abortController) {
      abortController.abort()
      abortController = null
    }

    // Als aktive Instanz registrieren
    activeInstance = { id: instanceId, stop }
    
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
          if (error instanceof Error && error.message !== 'Aborted') {
            console.error('[AutoMode] Title TTS error:', error)
          }
          throw error
        }

        // Prüfen ob noch aktiv
        if (!running.value || abortController?.signal.aborted) {
          debug('Stopped during title')
          return
        }
      }

      // Initiale Wartezeit
      debug(`Waiting ${initialDelay}ms before starting loop`)
      await delay(initialDelay)
      
      // Nochmal prüfen ob noch aktiv
      if (!running.value || abortController?.signal.aborted) {
        debug('Stopped during initial delay')
        return
      }

      // Hauptschleife starten
      debug('Starting main loop')
      await loop()
      
    } catch (error) {
      if (error instanceof Error && error.message !== 'Aborted') {
        console.error('[AutoMode] Start error:', error)
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
