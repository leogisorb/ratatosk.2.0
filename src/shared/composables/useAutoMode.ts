/**
 * ✅ Gemeinsames useAutoMode() Composable
 * 
 * Ziele:
 * ✅ immer nur EIN aktiver Timer
 * ✅ nie wieder „Springende Tiles"
 * ✅ nur sprechen, wenn TTS fertig
 * ✅ AutoMode einfach ein-/ausschaltbar
 * ✅ Verhindert Konflikte zwischen mehreren Auto-Mode Instanzen
 */

import { ref, computed } from 'vue'

// Named Constants für Magic Numbers
const AUTO_MODE_RETRY_DELAY = 100 // ms
const DEFAULT_INITIAL_DELAY = 3000 // ms
const DEFAULT_CYCLE_DELAY = 3000 // ms

export interface AutoModeConfig {
  speak: (text: string) => Promise<void>
  getItems: () => any[]
  getTitle: () => string
  onCycle?: (index: number, item: any) => void
  initialDelay?: number // defaults to DEFAULT_INITIAL_DELAY
  cycleDelay?: number // defaults to DEFAULT_CYCLE_DELAY
}

/**
 * AutoMode Coordinator - Singleton Pattern statt globaler Variable
 * Verhindert gleichzeitige Auto-Mode Instanzen mit Symbol-basierter Identifikation
 */
class AutoModeCoordinator {
  private static activeInstance: symbol | null = null

  static requestActivation(instanceId: symbol): boolean {
    if (this.activeInstance && this.activeInstance !== instanceId) {
      return false
    }
    this.activeInstance = instanceId
    return true
  }

  static release(instanceId: symbol): void {
    if (this.activeInstance === instanceId) {
      this.activeInstance = null
    }
  }

  static isActive(instanceId: symbol): boolean {
    return this.activeInstance === instanceId
  }
}

/**
 * Strategy Pattern für Text-Extraktion aus Items
 */
const TEXT_EXTRACTORS = [
  (item: any) => {
    // Pain Level: description verwenden
    if ('level' in item && typeof item.level === 'number' && 'description' in item && typeof item.description === 'string') {
      return item.description
    }
    return null
  },
  (item: any) => {
    // Sub-Region mit speziellem TTS-Text
    if ('ttsText' in item && typeof item.ttsText === 'string') {
      return item.ttsText
    }
    return null
  },
  (item: any) => item.title || null,
  (item: any) => item.name || null,
  (item: any) => item.description || null,
  (item: any) => String(item)
] as const

function extractItemText(item: any): string {
  for (const extractor of TEXT_EXTRACTORS) {
    const text = extractor(item)
    if (text) return text
  }
  return String(item)
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
  
  // Symbol-basierte Instanz-ID für Coordinator
  const instanceId = Symbol('autoMode')
  
  // AbortController für async Operations
  let abortController: AbortController | null = null
  
  let timer: number | null = null
  let initialTimer: number | null = null

  /**
   * Promise-basierte Delay-Funktion mit AbortController Support
   */
  async function delay(ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (abortController?.signal.aborted) {
        reject(new Error('Aborted'))
        return
      }
      
      const timerId = setTimeout(() => {
        if (abortController?.signal.aborted) {
          reject(new Error('Aborted'))
        } else {
          resolve()
        }
      }, ms)
      
      abortController?.signal.addEventListener('abort', () => {
        clearTimeout(timerId)
        reject(new Error('Aborted'))
      }, { once: true })
    })
  }

  /**
   * Stoppt den AutoMode und alle Timer
   */
  function stop() {
    running.value = false
    
    // Abort alle async Operations
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    
    // Release Coordinator
    AutoModeCoordinator.release(instanceId)
    
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    
    if (initialTimer) {
      clearTimeout(initialTimer)
      initialTimer = null
    }
  }

  /**
   * Startet den AutoMode
   * 1. Wartet initialDelay Sekunden (Titel wird gesprochen wenn skipTitle = false)
   * 2. Beginnt dann mit dem Durchlaufen der Items
   */
  async function start(skipTitle = false) {
    // Prüfe ob bereits ein Auto-Mode aktiv ist
    if (!AutoModeCoordinator.requestActivation(instanceId)) {
      console.warn('❌ useAutoMode.start() - Auto-Mode bereits aktiv - warte...')
      // Warte kurz, damit andere Instanz sich aufräumen kann
      try {
        await delay(AUTO_MODE_RETRY_DELAY)
        if (!AutoModeCoordinator.isActive(instanceId)) {
          start(skipTitle)
        }
      } catch (error) {
        // Aborted - ignore
      }
      return
    }

    stop()
    
    // Neuer AbortController für diese Session
    abortController = new AbortController()
    
    const items = getItems()
    console.log('✅ useAutoMode.start() - Items:', items?.length, items)
    
    if (!items || !items.length) {
      console.warn('❌ useAutoMode.start() - Keine Items gefunden')
      AutoModeCoordinator.release(instanceId)
      return
    }

    running.value = true
    // WICHTIG: Index immer bei 0 starten für sequenziellen Durchlauf (0-1-2-3-4-5...)
    index.value = 0
    console.log(`✅ useAutoMode.start() - Starte sequenziellen Durchlauf bei Index 0 (${items.length} Items)`)

    try {
      // Titel wird NUR gesprochen wenn skipTitle = false
      if (!skipTitle) {
        const title = getTitle()
        console.log('✅ useAutoMode.start() - Titel:', title)
        
        try {
          await speak(title)
        } catch (error) {
          if (error instanceof Error && error.message !== 'Aborted') {
            console.error('❌ useAutoMode.start() - TTS Error:', error)
          }
          throw error
        }

        // Prüfe ob noch laufend (wurde möglicherweise gestoppt während TTS)
        if (!running.value || abortController?.signal.aborted) {
          console.warn('❌ useAutoMode.start() - Gestoppt während TTS')
          AutoModeCoordinator.release(instanceId)
          return
        }
      }

      // Warte initialDelay Sekunden, dann starte Loop bei Index 0
      console.log(`✅ useAutoMode.start() - Starte sequenziellen Loop in ${initialDelay}ms bei Index 0...`)
      
      try {
        await delay(initialDelay)
        
        if (running.value && !abortController?.signal.aborted) {
          // ✅ Sicherstellen, dass Index bei 0 startet (wichtig für visuelles Karussell)
          index.value = 0
          console.log(`✅ useAutoMode.start() - Starte sequenziellen Loop: Index ${index.value} → ${index.value + 1} → ...`)
          
          // ✅ Starte Loop - spricht Item bei Index 0 und bleibt dort bis cycleDelay abgelaufen ist
          await loop()
        } else {
          console.warn('❌ useAutoMode.start() - Nicht mehr laufend beim Start des Loops')
          AutoModeCoordinator.release(instanceId)
        }
      } catch (error) {
        if (error instanceof Error && error.message !== 'Aborted') {
          console.error('❌ useAutoMode.start() - Delay Error:', error)
        }
        AutoModeCoordinator.release(instanceId)
      }
    } catch (error) {
      if (error instanceof Error && error.message !== 'Aborted') {
        console.error('❌ useAutoMode.start() - Error:', error)
      }
      stop()
    }
  }

  /**
   * Haupt-Loop: Spricht aktuelles Item, wartet, geht zum nächsten
   */
  async function loop() {
    try {
      if (!running.value || abortController?.signal.aborted) {
        console.warn('❌ useAutoMode.loop() - Nicht mehr laufend')
        AutoModeCoordinator.release(instanceId)
        return
      }

      const items = getItems()
      if (!items || !items.length) {
        console.warn('❌ useAutoMode.loop() - Keine Items gefunden')
        running.value = false
        AutoModeCoordinator.release(instanceId)
        return
      }

      // Sicherstellen, dass Index gültig ist und sequenziell bleibt
      if (index.value >= items.length || index.value < 0) {
        console.warn(`⚠️ useAutoMode.loop() - Index ${index.value} außerhalb des gültigen Bereichs [0-${items.length - 1}], setze auf 0`)
        index.value = 0
      }

      const item = items[index.value]
      if (!item) {
        console.warn('❌ useAutoMode.loop() - Item nicht gefunden für Index:', index.value)
        running.value = false
        AutoModeCoordinator.release(instanceId)
        return
      }

      // Text-Extraktion mit Strategy Pattern
      const itemTitle = extractItemText(item)
      
      console.log(`✅ useAutoMode.loop() - Index: ${index.value}, Item:`, itemTitle, item)
      
      // Callback aufrufen wenn vorhanden (für Navigation, etc.)
      if (onCycle) {
        try {
          onCycle(index.value, item)
        } catch (error) {
          console.error('❌ useAutoMode.loop() - Callback Error:', error)
        }
      }
      
      // WICHTIG: Index wird NUR aktualisiert NACH TTS ist komplett fertig
      try {
        await speak(itemTitle)
      } catch (speakError) {
        if (speakError instanceof Error && speakError.message !== 'Aborted') {
          console.error('❌ useAutoMode.loop() - TTS Error:', speakError)
          // Optional: Retry mit exponential backoff könnte hier implementiert werden
        }
        throw speakError
      }

      // Prüfe ob noch laufend (wurde möglicherweise gestoppt während TTS)
      if (!running.value || abortController?.signal.aborted) {
        console.warn('❌ useAutoMode.loop() - Gestoppt während TTS')
        AutoModeCoordinator.release(instanceId)
        return
      }

      const currentItems = getItems()
      if (!currentItems || !currentItems.length) {
        console.warn('❌ useAutoMode.loop() - Keine Items nach TTS')
        running.value = false
        AutoModeCoordinator.release(instanceId)
        return
      }

      // Warte cycleDelay Sekunden, DANN erst Index aktualisieren
      try {
        await delay(cycleDelay)
        
        if (!running.value || abortController?.signal.aborted) {
          AutoModeCoordinator.release(instanceId)
          return
        }
        
        // JETZT erst Index aktualisieren (nach TTS + cycleDelay Wartezeit)
        // WICHTIG: Sequenzieller Durchlauf 0-1-2-3-4-5...
        const oldIndex = index.value
        const nextIndex = (index.value + 1) % currentItems.length
        index.value = nextIndex
        console.log(`✅ useAutoMode.loop() - Sequenzieller Durchlauf: Index von ${oldIndex} auf ${index.value} geändert (von ${currentItems.length} Items)`)

        // Starte nächsten Cycle (spricht neues Item)
        if (running.value && !abortController?.signal.aborted) {
          await loop()
        } else {
          AutoModeCoordinator.release(instanceId)
        }
      } catch (error) {
        if (error instanceof Error && error.message !== 'Aborted') {
          console.error('❌ useAutoMode.loop() - Delay Error:', error)
        }
        AutoModeCoordinator.release(instanceId)
      }
    } catch (error) {
      if (error instanceof Error && error.message !== 'Aborted') {
        console.error('❌ useAutoMode.loop() - Loop Error:', error)
      }
      stop()
    }
  }

  return {
    start,
    stop,
    index, // ✅ Direkt ref zurückgeben für bessere Reaktivität
    running: computed(() => running.value),
  }
}

