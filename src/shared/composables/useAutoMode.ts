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

export interface AutoModeConfig {
  speak: (text: string) => Promise<void>
  getItems: () => any[]
  getTitle: () => string
  onCycle?: (index: number, item: any) => void
  initialDelay?: number
  cycleDelay?: number
}

// Globales Flag zur Synchronisation - verhindert gleichzeitige Auto-Mode Instanzen
let globalAutoModeActive: boolean = false

export function useAutoMode(config: AutoModeConfig) {
  const { speak, getItems, getTitle, onCycle, initialDelay = 3000, cycleDelay = 3000 } = config

  const running = ref(false)
  const index = ref(0)

  let timer: number | null = null
  let initialTimer: number | null = null

  /**
   * Stoppt den AutoMode und alle Timer
   */
  function stop() {
    running.value = false
    
    // ✅ Entferne globales Flag
    globalAutoModeActive = false
    
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
    // ✅ Prüfe ob bereits ein Auto-Mode aktiv ist
    if (globalAutoModeActive) {
      console.warn('❌ useAutoMode.start() - Auto-Mode bereits aktiv - warte...')
      // Warte kurz, damit andere Instanz sich aufräumen kann
      setTimeout(() => {
        if (!globalAutoModeActive) {
          start(skipTitle)
        }
      }, 100)
      return
    }

    stop()
    
    const items = getItems()
    console.log('✅ useAutoMode.start() - Items:', items?.length, items)
    
    if (!items || !items.length) {
      console.warn('❌ useAutoMode.start() - Keine Items gefunden')
      return
    }

    // ✅ Setze globales Flag
    globalAutoModeActive = true

    running.value = true
    // ✅ WICHTIG: Index immer bei 0 starten für sequenziellen Durchlauf (0-1-2-3-4-5...)
    index.value = 0
    console.log(`✅ useAutoMode.start() - Starte sequenziellen Durchlauf bei Index 0 (${items.length} Items)`)

    // ✅ Titel wird NUR gesprochen wenn skipTitle = false
    if (!skipTitle) {
      const title = getTitle()
      console.log('✅ useAutoMode.start() - Titel:', title)
      await speak(title)

      // ✅ Prüfe ob noch laufend (wurde möglicherweise gestoppt während TTS)
      if (!running.value) {
        console.warn('❌ useAutoMode.start() - Gestoppt während TTS')
        globalAutoModeActive = false
        return
      }

      // ✅ Warte initialDelay Sekunden, dann starte Loop bei Index 0
      console.log(`✅ useAutoMode.start() - Starte sequenziellen Loop in ${initialDelay}ms bei Index 0...`)
      initialTimer = window.setTimeout(() => {
        if (running.value) {
          // ✅ Sicherstellen, dass Index bei 0 startet
          index.value = 0
          console.log(`✅ useAutoMode.start() - Starte sequenziellen Loop: Index ${index.value} → ${index.value + 1} → ...`)
          loop()
        } else {
          console.warn('❌ useAutoMode.start() - Nicht mehr laufend beim Start des Loops')
          globalAutoModeActive = false
        }
      }, initialDelay)
    } else {
      // ✅ Titel wurde bereits gesprochen, warte nur initialDelay Sekunden, dann starte Loop bei Index 0
      console.log(`✅ useAutoMode.start() - Titel bereits gesprochen, starte sequenziellen Loop in ${initialDelay}ms bei Index 0...`)
      initialTimer = window.setTimeout(() => {
        if (running.value) {
          // ✅ Sicherstellen, dass Index bei 0 startet
          index.value = 0
          console.log(`✅ useAutoMode.start() - Starte sequenziellen Loop: Index ${index.value} → ${index.value + 1} → ...`)
          loop()
        } else {
          console.warn('❌ useAutoMode.start() - Nicht mehr laufend beim Start des Loops')
          globalAutoModeActive = false
        }
      }, initialDelay)
    }
  }

  /**
   * Haupt-Loop: Spricht aktuelles Item, wartet, geht zum nächsten
   */
  function loop() {
    if (!running.value) {
      console.warn('❌ useAutoMode.loop() - Nicht mehr laufend')
      globalAutoModeActive = false
      return
    }

    const items = getItems()
    if (!items || !items.length) {
      console.warn('❌ useAutoMode.loop() - Keine Items gefunden')
      running.value = false
      globalAutoModeActive = false
      return
    }

    // ✅ Sicherstellen, dass Index gültig ist und sequenziell bleibt
    if (index.value >= items.length || index.value < 0) {
      console.warn(`⚠️ useAutoMode.loop() - Index ${index.value} außerhalb des gültigen Bereichs [0-${items.length - 1}], setze auf 0`)
      index.value = 0
    }

    const item = items[index.value]
    if (!item) {
      console.warn('❌ useAutoMode.loop() - Item nicht gefunden für Index:', index.value)
      running.value = false
      globalAutoModeActive = false
      return
    }

    // ✅ Bestimme Text zum Sprechen
    let itemTitle: string
    if ('level' in item && typeof item.level === 'number' && 'description' in item && typeof item.description === 'string') {
      // Pain Level: description verwenden (z.B. "kein Schmerz", "sehr leicht", etc.)
      itemTitle = item.description
    } else if ('ttsText' in item && typeof item.ttsText === 'string') {
      // Sub-Region mit speziellem TTS-Text
      itemTitle = item.ttsText
    } else {
      // Normales Item: title, name oder description verwenden
      itemTitle = item.title || item.name || item.description || String(item)
    }
    
    console.log(`✅ useAutoMode.loop() - Index: ${index.value}, Item:`, itemTitle, item)
    
    // ✅ Callback aufrufen wenn vorhanden (für Navigation, etc.)
    if (onCycle) {
      onCycle(index.value, item)
    }
    
    // ✅ WICHTIG: Index wird NUR aktualisiert NACH TTS ist komplett fertig
    speak(itemTitle).then(() => {
      // ✅ Prüfe ob noch laufend (wurde möglicherweise gestoppt während TTS)
      if (!running.value) {
        console.warn('❌ useAutoMode.loop() - Gestoppt während TTS')
        globalAutoModeActive = false
        return
      }

      const currentItems = getItems()
      if (!currentItems || !currentItems.length) {
        console.warn('❌ useAutoMode.loop() - Keine Items nach TTS')
        running.value = false
        globalAutoModeActive = false
        return
      }

      // ✅ Warte cycleDelay Sekunden, DANN erst Index aktualisieren
      timer = window.setTimeout(() => {
        if (!running.value) {
          globalAutoModeActive = false
          return
        }
        
        // ✅ JETZT erst Index aktualisieren (nach TTS + cycleDelay Wartezeit)
        // ✅ WICHTIG: Sequenzieller Durchlauf 0-1-2-3-4-5...
        const oldIndex = index.value
        const nextIndex = (index.value + 1) % currentItems.length
        index.value = nextIndex
        console.log(`✅ useAutoMode.loop() - Sequenzieller Durchlauf: Index von ${oldIndex} auf ${index.value} geändert (von ${currentItems.length} Items)`)

        // ✅ Starte nächsten Cycle (spricht neues Item)
        if (running.value) {
          loop()
        } else {
          globalAutoModeActive = false
        }
      }, cycleDelay)
    }).catch((error) => {
      console.error('❌ useAutoMode.loop() - Fehler beim Sprechen:', error)
      running.value = false
      globalAutoModeActive = false
    })
  }

  return {
    start,
    stop,
    index, // ✅ Direkt ref zurückgeben für bessere Reaktivität
    running: computed(() => running.value),
  }
}

