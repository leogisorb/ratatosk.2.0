/**
 * ✅ MODUL 2 — useAutoMode() (perfekt synchronisiert)
 * 
 * Ziele:
 * ✅ immer nur EIN aktiver Timer
 * ✅ nie wieder „Springende Tiles“
 * ✅ nur sprechen, wenn TTS fertig
 * ✅ AutoMode einfach ein-/ausschaltbar
 */

import { ref, computed } from 'vue'

export interface AutoModeConfig {
  speak: (text: string) => Promise<void>
  getItems: () => any[]
  getTitle: () => string
}

export function useAutoMode(config: AutoModeConfig) {
  const { speak, getItems, getTitle } = config

  const running = ref(false)
  const index = ref(0)

  let timer: number | null = null
  let initialTimer: number | null = null

  /**
   * Stoppt den AutoMode und alle Timer
   */
  function stop() {
    running.value = false
    
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
   * 1. Wartet 3 Sekunden (Titel wird bereits in select-Funktionen gesprochen)
   * 2. Beginnt dann mit dem Durchlaufen der Items
   */
  async function start(skipTitle = false) {
    stop()
    
    const items = getItems()
    console.log('✅ useAutoMode.start() - Items:', items?.length, items)
    
    if (!items || !items.length) {
      console.warn('❌ useAutoMode.start() - Keine Items gefunden')
      return
    }

    running.value = true
    index.value = 0

    // ✅ Titel wird NUR gesprochen wenn skipTitle = false und es der initiale Start ist
    // In select-Funktionen wird der Titel bereits gesprochen, daher skipTitle = true
    if (!skipTitle) {
      const title = getTitle()
      console.log('✅ useAutoMode.start() - Titel:', title)
      await speak(title)

      // ✅ Prüfe ob noch laufend (wurde möglicherweise gestoppt während TTS)
      if (!running.value) {
        console.warn('❌ useAutoMode.start() - Gestoppt während TTS')
        return
      }

      // ✅ Warte 3 Sekunden, dann starte Loop
      console.log('✅ useAutoMode.start() - Starte Loop in 3 Sekunden...')
      initialTimer = window.setTimeout(() => {
        if (running.value) {
          index.value = 0
          console.log('✅ useAutoMode.start() - Starte Loop mit Index:', index.value)
          loop()
        } else {
          console.warn('❌ useAutoMode.start() - Nicht mehr laufend beim Start des Loops')
        }
      }, 3000)
    } else {
      // ✅ Titel wurde bereits gesprochen, warte nur 3 Sekunden, dann starte Loop
      console.log('✅ useAutoMode.start() - Titel bereits gesprochen, starte Loop in 3 Sekunden...')
      initialTimer = window.setTimeout(() => {
        if (running.value) {
          index.value = 0
          console.log('✅ useAutoMode.start() - Starte Loop mit Index:', index.value)
          loop()
        } else {
          console.warn('❌ useAutoMode.start() - Nicht mehr laufend beim Start des Loops')
        }
      }, 3000)
    }
  }

  /**
   * Haupt-Loop: Spricht aktuelles Item, wartet, geht zum nächsten
   */
  function loop() {
    if (!running.value) {
      console.warn('❌ useAutoMode.loop() - Nicht mehr laufend')
      return
    }

    const items = getItems()
    if (!items || !items.length) {
      console.warn('❌ useAutoMode.loop() - Keine Items gefunden')
      running.value = false
      return
    }

    // ✅ Sicherstellen, dass Index gültig ist
    if (index.value >= items.length || index.value < 0) {
      index.value = 0
    }

    const item = items[index.value]
    if (!item) {
      console.warn('❌ useAutoMode.loop() - Item nicht gefunden für Index:', index.value)
      running.value = false
      return
    }

    // ✅ Spreche Titel des aktuellen Items
    // Für Pain Levels: Format "3, leicht" statt "Drei"
    let itemTitle: string
    if ('level' in item && typeof item.level === 'number' && 'description' in item && typeof item.description === 'string') {
      // Pain Level: "3, leicht"
      itemTitle = `${item.level}, ${item.description}`
    } else {
      // Normales Item: title verwenden
      itemTitle = item.title || item.name || String(item)
    }
    console.log(`✅ useAutoMode.loop() - Index: ${index.value}, Item:`, itemTitle, item)
    
    // ✅ WICHTIG: Index wird NUR aktualisiert NACH TTS ist komplett fertig
    // Während TTS spricht, bleibt der visuelle Index beim aktuellen Item
    speak(itemTitle).then(() => {
      // ✅ Prüfe ob noch laufend (wurde möglicherweise gestoppt während TTS)
      if (!running.value) {
        console.warn('❌ useAutoMode.loop() - Gestoppt während TTS')
        return
      }

      const currentItems = getItems()
      if (!currentItems || !currentItems.length) {
        console.warn('❌ useAutoMode.loop() - Keine Items nach TTS')
        running.value = false
        return
      }

      // ✅ Warte 3 Sekunden, DANN erst Index aktualisieren
      // So bleibt das visuelle Item während des Sprechens korrekt
      timer = window.setTimeout(() => {
        if (!running.value) return
        
        // ✅ JETZT erst Index aktualisieren (nach TTS + 3 Sekunden Wartezeit)
        const oldIndex = index.value
        index.value = (index.value + 1) % currentItems.length
        console.log(`✅ useAutoMode.loop() - Index von ${oldIndex} auf ${index.value} geändert (nach TTS + Wartezeit)`)

        // ✅ Starte nächsten Cycle (spricht neues Item)
        if (running.value) {
          loop()
        }
      }, 3000)
    })
  }

  return {
    start,
    stop,
    index, // ✅ Direkt ref zurückgeben für bessere Reaktivität
    running: computed(() => running.value),
  }
}

