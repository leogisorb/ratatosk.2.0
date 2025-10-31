# 📋 Migration Guide: Dialog-Refaktorierung zu modularer Architektur

**Datum:** 2025-01-XX  
**Basis:** Pain Dialog Refaktorierung  
**Ziel:** Vorgehensweise für Migration anderer Dialoge (Ich, Umgebung, etc.)

---

## 🎯 Übersicht

Dieser Guide dokumentiert die vollständige Refaktorierung des Pain Dialogs zu einer modularen, wartbaren Architektur. Die Schritte können auf andere Dialoge übertragen werden.

---

## 📦 Phase 1: Modulare Architektur erstellen

### 1.1 TTS-Modul (`useTTS.ts`)

**Ziel:** Robuste, Promise-basierte TTS-Implementierung ohne Deadlocks

**Erstelle:** `src/features/[feature]/composables/useTTS.ts`

```typescript
import { ref } from 'vue'

export function useTTS() {
  const isSpeaking = ref(false)
  const enabled = ref(true)

  function speak(text: string): Promise<void> {
    return new Promise(resolve => {
      if (!enabled.value || !text.trim()) {
        resolve()
        return
      }

      const synth = window.speechSynthesis
      synth.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'de-DE'
      utterance.rate = 1
      utterance.volume = 1

      isSpeaking.value = true

      // Timeout-Fallback (10 Sekunden)
      let timeoutId = window.setTimeout(() => {
        synth.cancel()
        isSpeaking.value = false
        resolve()
      }, 10000)

      utterance.onend = () => {
        clearTimeout(timeoutId)
        isSpeaking.value = false
        resolve()
      }

      utterance.onerror = () => {
        clearTimeout(timeoutId)
        isSpeaking.value = false
        resolve()
      }

      synth.speak(utterance)
    })
  }

  return { isSpeaking, enabled, speak }
}
```

**Vorteile:**
- ✅ Promise-basiert (await-able)
- ✅ Deadlock-Schutz durch Timeout
- ✅ Automatisches Cleanup
- ✅ Wiederverwendbar

---

### 1.2 AutoMode-Modul (`useAutoMode.ts`)

**Ziel:** Synchronisierter Auto-Mode mit Index-Tracking

**Erstelle:** `src/features/[feature]/composables/useAutoMode.ts`

```typescript
import { ref } from 'vue'

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

  function stop() {
    running.value = false
    if (timer) clearTimeout(timer)
    if (initialTimer) clearTimeout(initialTimer)
    timer = null
    initialTimer = null
  }

  async function start(skipTitle = false) {
    stop()
    
    const items = getItems()
    if (!items || !items.length) return

    running.value = true
    index.value = 0

    // Titel sprechen (wenn nicht skipTitle)
    if (!skipTitle) {
      await speak(getTitle())
      if (!running.value) return
    }

    // Nach 3 Sekunden Loop starten
    initialTimer = window.setTimeout(() => {
      if (running.value) {
        index.value = 0
        loop()
      }
    }, 3000)
  }

  function loop() {
    if (!running.value) return

    const items = getItems()
    if (!items || !items.length) {
      running.value = false
      return
    }

    // Index validieren
    if (index.value >= items.length || index.value < 0) {
      index.value = 0
    }

    const item = items[index.value]
    if (!item) {
      running.value = false
      return
    }

    // Item sprechen (Pain Levels: "3, leicht", sonst: title)
    let itemTitle: string
    if ('level' in item && typeof item.level === 'number' && 'description' in item) {
      itemTitle = `${item.level}, ${item.description}`
    } else {
      itemTitle = item.title || item.name || String(item)
    }
    
    speak(itemTitle).then(() => {
      if (!running.value) return

      const currentItems = getItems()
      if (!currentItems || !currentItems.length) {
        running.value = false
        return
      }

      // WICHTIG: Index erst nach TTS + 3s aktualisieren
      timer = window.setTimeout(() => {
        if (!running.value) return
        
        index.value = (index.value + 1) % currentItems.length
        if (running.value) {
          loop()
        }
      }, 3000)
    })
  }

  return {
    start,
    stop,
    index, // ✅ Direkt ref, nicht computed
    running: computed(() => running.value),
  }
}
```

**Wichtige Punkte:**
- ✅ `skipTitle` Parameter: Titel wird bereits in select-Funktionen gesprochen
- ✅ Index wird erst NACH TTS + 3s aktualisiert (synchronisiert mit visueller Darstellung)
- ✅ Ein Timer-Timeout verhindert Race Conditions

---

### 1.3 Dictionary-Modul (`useDictionary.ts`)

**Ziel:** Zentrale Daten- und Sprachlogik

**Erstelle:** `src/features/[feature]/composables/useDictionary.ts`

```typescript
import { mainRegions, subRegionMap } from '../data/regions'
import { painLevels } from '../data/painLevels'
import { generateConfirmationText } from '../data/grammar'

export function useDictionary() {
  function getSubRegions(mainRegionId: string | null) {
    if (!mainRegionId) return []
    return subRegionMap[mainRegionId] ?? []
  }

  function getViewTitle(mainRegionId: string | null) {
    // Logik für Titel-Generierung (Singular/Plural)
    // z.B. "Wählen Sie einen Bereich im Kopf aus" vs "an den Beinen"
  }

  function generateConfirmation(subRegionId: string | null, level: number | null): string {
    // Grammatik-Logik
    return generateConfirmationText(subRegionId, level)
  }

  return {
    mainRegions,
    subRegionMap,
    painLevels,
    getSubRegions,
    getViewTitle,
    generateConfirmation,
    // Helper Functions...
  }
}
```

**Daten-Dateien reorganisieren:**
- `data/regions.ts` - Alle Regionen
- `data/painLevels.ts` - Alle Levels
- `data/grammar.ts` - Grammatik-Regeln
- `data/mapping.ts` - UI ↔ Domain ID Mapping

---

### 1.4 State Machine (`useDialogMachine.ts`)

**Ziel:** Zentrale State-Machine mit klarem Flow

**Erstelle:** `src/features/[feature]/composables/useDialogMachine.ts`

```typescript
import { ref, computed } from 'vue'
import { useTTS } from './useTTS'
import { useAutoMode } from './useAutoMode'
import { useDictionary } from './useDictionary'

export type DialogState = 'mainView' | 'subView' | 'selectionView' | 'confirmation'

export function useDialogMachine() {
  const tts = useTTS()
  const dict = useDictionary()

  // ✅ State
  const state = ref<DialogState>('mainView')
  const selectedMain = ref<string | null>(null)
  const selectedSub = ref<string | null>(null)

  // ✅ Computed: Items basierend auf State
  const items = computed(() => {
    if (state.value === 'mainView') return dict.mainItems
    if (state.value === 'subView') return dict.getSubItems(selectedMain.value)
    return []
  })

  // ✅ Computed: Titel basierend auf State
  const title = computed(() => {
    switch (state.value) {
      case 'mainView': return 'Haupttitel'
      case 'subView': return dict.getSubViewTitle(selectedMain.value)
      default: return ''
    }
  })

  // ✅ AutoMode konfigurieren
  const autoMode = useAutoMode({
    speak: tts.speak,
    getItems: () => items.value,
    getTitle: () => title.value,
  })

  // ✅ Actions
  async function selectMain(id: string) {
    autoMode.stop()
    selectedMain.value = id
    state.value = 'subView'
    
    // ✅ Titel sprechen (skipTitle = true, da hier gesprochen)
    await tts.speak(title.value)
    
    setTimeout(() => {
      if (state.value === 'subView') {
        autoMode.start(true) // ✅ skipTitle = true
      }
    }, 3000)
  }

  async function selectSub(id: string) {
    autoMode.stop()
    // ... State-Wechsel
    await tts.speak(title.value)
    setTimeout(() => {
      autoMode.start(true)
    }, 3000)
  }

  function handleBlink() {
    const currentItems = items.value
    if (!currentItems || !currentItems.length) return
    
    const currentIndex = autoMode.index.value
    const currentItem = currentItems[currentIndex]
    
    if (!currentItem) return
    
    // State-spezifische Auswahl
    if (state.value === 'mainView') {
      selectMain(currentItem.id)
    } else if (state.value === 'subView') {
      selectSub(currentItem.id)
    }
  }

  return {
    state: computed(() => state.value),
    items,
    title,
    autoMode,
    selectMain,
    selectSub,
    handleBlink,
  }
}
```

**Wichtige Punkte:**
- ✅ Alle Actions zentralisiert
- ✅ `autoMode.start(true)` nach State-Wechsel (Titel bereits gesprochen)
- ✅ State-Flow klar definiert

---

## 📦 Phase 2: Input Manager Integration

### 2.1 Input Manager erstellen (bereits vorhanden)

**Datei:** `src/core/application/InputManager.ts`  
**Composable:** `src/shared/composables/useInputManager.ts`

**Verwendung im Dialog:**

```typescript
import { useInputManager } from '../../../shared/composables/useInputManager'
import type { InputEvent } from '../../../core/application/InputManager'

const inputManager = useInputManager({
  onSelect: (event: InputEvent) => {
    console.log('Input detected:', event.type, event.source)
    // ✅ Einheitlicher Callback für Blink und Rechtsklick
    machine.handleBlink()
  },
  enabledInputs: ['blink', 'click'], // ✅ Nur Blinzeln und Rechtsklick
  cooldown: 300 // ✅ Verhindert zu häufige Inputs
})
```

**Lifecycle:**

```typescript
onMounted(() => {
  faceRecognition.start()
  autoMode.start()
  inputManager.start() // ✅ Alle Handler automatisch registriert
})

onUnmounted(() => {
  autoMode.stop()
  inputManager.stop() // ✅ Alle Handler automatisch entfernt
  faceRecognition.stop()
})
```

**Vorteile:**
- ✅ Einheitliche API für alle Input-Typen
- ✅ Automatisches Setup/Cleanup
- ✅ Einfach erweiterbar (Voice, Gestures)
- ✅ Rechtsklick überall auf der Seite funktioniert (nicht nur auf Kacheln)

---

## 📦 Phase 3: View-Refaktorierung

### 3.1 Template anpassen

**Vorher:**
```vue
<div 
  class="menu-tile"
  :class="currentTileIndex === index ? 'tile-active' : 'tile-inactive'"
  @click="selectMain(region.id)"
  @contextmenu.prevent="handleRightClick($event)"
>
```

**Nachher:**
```vue
<div 
  class="menu-tile"
  :class="autoMode.index.value === index ? 'tile-active' : 'tile-inactive'"
  @click="autoMode.index.value === index ? selectMain(String(region.id)) : null"
  @contextmenu.prevent="autoMode.index.value === index ? null : null"
>
```

**Wichtige Änderungen:**
- ✅ `autoMode.index.value` statt `currentTileIndex`
- ✅ Click nur wenn Kachel aktiv ist (optional, falls gewünscht)
- ✅ `@contextmenu.prevent` kann leer bleiben (InputManager übernimmt)

---

### 3.2 Script-Setup refaktorieren

**Vorher:**
```typescript
// Viele einzelne Handler
const handleRightClick = (event: MouseEvent) => { ... }
const handleBlink = () => { ... }

// Manuelle Event-Listener
document.addEventListener('contextmenu', handleRightClick)
window.addEventListener('faceBlinkDetected', handleBlink)
```

**Nachher:**
```typescript
// ✅ Input Manager statt einzelner Handler
const inputManager = useInputManager({
  onSelect: (event: InputEvent) => {
    machine.handleBlink()
  },
  enabledInputs: ['blink', 'click']
})

// ✅ Automatisch über inputManager.start()/stop()
```

---

## 📦 Phase 4: CSS-Bereinigung

### 4.1 Hover-Effekte entfernen

**Entferne alle:**
```css
.pain-dialog .menu-tile:hover { ... }
.pain-dialog .carousel-indicator:hover { ... }
```

**Ersetze mit:**
```css
/* Hover Effects entfernt */
```

---

## 📋 Checkliste für Migration

### ✅ Vorbereitung
- [ ] Feature-Verzeichnis identifizieren
- [ ] Bestehende Handler auflisten
- [ ] State-Flow analysieren

### ✅ Module erstellen
- [ ] `useTTS.ts` erstellen
- [ ] `useAutoMode.ts` erstellen
- [ ] `useDictionary.ts` erstellen
- [ ] `useDialogMachine.ts` erstellen

### ✅ Daten reorganisieren
- [ ] Daten-Dateien in `data/` verschieben
- [ ] Grammatik-Regeln extrahieren
- [ ] Mapping-Tabellen erstellen

### ✅ Input Manager
- [ ] `useInputManager` importieren
- [ ] Config mit `onSelect` Callback erstellen
- [ ] `enabledInputs` festlegen
- [ ] Im Lifecycle integrieren

### ✅ View refaktorieren
- [ ] Template auf `autoMode.index.value` umstellen
- [ ] Click-Handler anpassen (optional)
- [ ] Alte Handler entfernen
- [ ] Lifecycle vereinfachen

### ✅ CSS bereinigen
- [ ] Hover-Effekte entfernen
- [ ] Unnötige Styles entfernen
- [ ] Responsive Styles prüfen

### ✅ Testing
- [ ] AutoMode testen
- [ ] TTS testen
- [ ] Blinzeln testen
- [ ] Rechtsklick testen
- [ ] State-Wechsel testen

---

## 🔧 Konfiguration & Anpassungen

### AutoMode Timing
- **Initialer Start:** Titel sprechen → 3s warten → Loop starten
- **State-Wechsel:** Titel sprechen → 3s warten → AutoMode starten (skipTitle = true)
- **Loop:** Item sprechen → 3s warten → Index aktualisieren → Loop

### TTS-Verhalten
- **Titel:** Wird in select-Funktionen gesprochen, dann `autoMode.start(true)`
- **Items:** Werden automatisch im Loop gesprochen
- **Pain Levels:** Format "3, leicht" statt "Drei"

### Input-Verhalten
- **Blinzeln:** Wählt aktive Kachel
- **Rechtsklick:** Wählt aktive Kachel (überall auf Seite)
- **Cooldown:** 300ms verhindert zu häufige Inputs

---

## 📝 Bekannte Patterns

### Pattern 1: State-Machine Flow
```
mainView → selectMain → subView → selectSub → selectionView → selectItem → confirmation → (reset)
```

### Pattern 2: TTS-Synchronisation
```
selectFunction() {
  1. autoMode.stop()
  2. state.value = newState
  3. await tts.speak(title.value)
  4. setTimeout(() => autoMode.start(true), 3000)
}
```

### Pattern 3: Index-Synchronisation
```
TTS spricht Item → Warte 3s → Index aktualisieren → Nächstes Item sprechen
```

---

## 🎯 Nächste Dialoge

**Empfohlene Reihenfolge:**
1. ✅ Pain Dialog (fertig)
2. Ich Dialog
3. Umgebung Dialog
4. Settings Dialog (falls nötig)

**Gemeinsamkeiten:**
- Alle verwenden AutoMode
- Alle verwenden TTS
- Alle haben State-Flow
- Alle haben ähnliche UI-Patterns

**Unterschiede:**
- Verschiedene Datenstrukturen
- Verschiedene Grammatik-Regeln
- Verschiedene State-Namen

---

## 📚 Referenzen

**Module:**
- `src/features/pain-assessment/composables/useTTS.ts`
- `src/features/pain-assessment/composables/useAutoMode.ts`
- `src/features/pain-assessment/composables/usePainDictionary.ts`
- `src/features/pain-assessment/composables/usePainDialogMachine.ts`

**Input Manager:**
- `src/core/application/InputManager.ts`
- `src/shared/composables/useInputManager.ts`

**Beispiel:**
- `src/features/pain-assessment/views/PainDialogView.vue`

---

**Viel Erfolg bei der Migration! 🚀**

