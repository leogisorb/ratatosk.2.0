/**
 * Debug Utility für Ratatosk
 * 
 * Zentrale Debugging-Funktionen für das gesamte Projekt
 */

const DEBUG_MODE = import.meta.env.DEV || localStorage.getItem('debug') === 'true'

/**
 * Debug-Logger mit Kategorien
 */
export const debug = {
  /**
   * Allgemeine Debug-Logs
   */
  log: (category: string, ...args: any[]) => {
    if (DEBUG_MODE) {
      console.log(`[DEBUG:${category}]`, ...args)
    }
  },

  /**
   * Warnungen
   */
  warn: (category: string, ...args: any[]) => {
    if (DEBUG_MODE) {
      console.warn(`[WARN:${category}]`, ...args)
    }
  },

  /**
   * Fehler
   */
  error: (category: string, ...args: any[]) => {
    console.error(`[ERROR:${category}]`, ...args)
  },

  /**
   * Info-Logs
   */
  info: (category: string, ...args: any[]) => {
    if (DEBUG_MODE) {
      console.info(`[INFO:${category}]`, ...args)
    }
  },

  /**
   * Performance-Timing
   */
  time: (label: string) => {
    if (DEBUG_MODE) {
      console.time(`[PERF:${label}]`)
    }
  },

  timeEnd: (label: string) => {
    if (DEBUG_MODE) {
      console.timeEnd(`[PERF:${label}]`)
    }
  },

  /**
   * Gruppierte Logs
   */
  group: (label: string) => {
    if (DEBUG_MODE) {
      console.group(`[GROUP:${label}]`)
    }
  },

  groupEnd: () => {
    if (DEBUG_MODE) {
      console.groupEnd()
    }
  },

  /**
   * Tabelle für strukturierte Daten
   */
  table: (data: any, category?: string) => {
    if (DEBUG_MODE) {
      if (category) {
        console.log(`[TABLE:${category}]`)
      }
      console.table(data)
    }
  }
}

/**
 * Debug-Flag setzen (z.B. localStorage.setItem('debug', 'true'))
 */
export const enableDebug = () => {
  localStorage.setItem('debug', 'true')
  console.log('🔧 Debug-Modus aktiviert. Seite neu laden.')
}

/**
 * Debug-Flag entfernen
 */
export const disableDebug = () => {
  localStorage.removeItem('debug')
  console.log('🔧 Debug-Modus deaktiviert. Seite neu laden.')
}

/**
 * Prüft ob Debug-Modus aktiv ist
 */
export const isDebugMode = (): boolean => {
  return DEBUG_MODE
}

/**
 * Vue Component Debug Helper
 */
export const debugComponent = {
  /**
   * Loggt Component Props
   */
  props: (componentName: string, props: any) => {
    debug.log('Component', `${componentName} Props:`, props)
  },

  /**
   * Loggt Component State
   */
  state: (componentName: string, state: any) => {
    debug.log('Component', `${componentName} State:`, state)
  },

  /**
   * Loggt Component Lifecycle
   */
  lifecycle: (componentName: string, lifecycle: 'mounted' | 'unmounted' | 'updated') => {
    debug.log('Component', `${componentName} ${lifecycle}`)
  }
}

/**
 * Carousel-spezifische Debug-Funktionen
 */
export const debugCarousel = {
  /**
   * Loggt Carousel-Index-Wechsel
   */
  indexChange: (oldIndex: number, newIndex: number, totalItems: number) => {
    debug.log('Carousel', `Index: ${oldIndex} → ${newIndex} (von ${totalItems})`)
  },

  /**
   * Loggt Carousel-Item-Klick
   */
  itemClick: (item: any, index: number) => {
    debug.log('Carousel', `Item geklickt: ${item.title || item.id} (Index: ${index})`)
  },

  /**
   * Loggt Carousel-Position
   */
  position: (currentIndex: number, items: any[]) => {
    debug.table(
      items.map((item, idx) => ({
        Index: idx,
        Title: item.title || item.id,
        Active: idx === currentIndex ? '✓' : '',
        Offset: idx - currentIndex
      })),
      'Carousel Position'
    )
  }
}

/**
 * TTS-spezifische Debug-Funktionen
 */
export const debugTTS = {
  /**
   * Loggt TTS-Sprache
   */
  speak: (text: string, muted: boolean = false) => {
    if (muted) {
      debug.log('TTS', `[STUMM] Würde sprechen: "${text}"`)
    } else {
      debug.log('TTS', `Spricht: "${text}"`)
    }
  },

  /**
   * Loggt TTS-State-Wechsel
   */
  stateChange: (oldState: boolean, newState: boolean) => {
    debug.log('TTS', `Muted: ${oldState} → ${newState}`)
  }
}

/**
 * AutoMode-spezifische Debug-Funktionen
 */
export const debugAutoMode = {
  /**
   * Loggt AutoMode-Start
   */
  start: (skipTitle: boolean = false) => {
    debug.log('AutoMode', `Start${skipTitle ? ' (skipTitle)' : ''}`)
  },

  /**
   * Loggt AutoMode-Stop
   */
  stop: () => {
    debug.log('AutoMode', 'Stop')
  },

  /**
   * Loggt AutoMode-Index-Wechsel
   */
  indexChange: (index: number, totalItems: number) => {
    debug.log('AutoMode', `Index: ${index} (von ${totalItems})`)
  }
}

// Globale Debug-Funktionen im Window-Objekt verfügbar machen (nur im Dev-Modus)
if (DEBUG_MODE && typeof window !== 'undefined') {
  ;(window as any).__RATATOSK_DEBUG__ = {
    enable: enableDebug,
    disable: disableDebug,
    isEnabled: isDebugMode,
    debug,
    debugCarousel,
    debugTTS,
    debugAutoMode
  }
  
  console.log('🔧 Ratatosk Debug-Tools verfügbar: window.__RATATOSK_DEBUG__')
}

