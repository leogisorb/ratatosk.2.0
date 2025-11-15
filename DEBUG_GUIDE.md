# 🔧 Debug Guide für Ratatosk

## Übersicht

Dieses Projekt bietet verschiedene Debugging-Möglichkeiten:

1. **Vue DevTools** - Browser-Erweiterung für Vue.js
2. **Debug Utility** - Zentrale Debug-Funktionen
3. **Browser DevTools** - Standard Browser-Debugging
4. **Console Logs** - Strukturierte Logs mit Kategorien

---

## 🚀 Schnellstart

### 1. Vue DevTools aktivieren

Vue DevTools sind bereits konfiguriert. Nach dem Start des Dev-Servers:

1. **Chrome/Edge**: Installiere die [Vue DevTools Extension](https://chrome.google.com/webstore/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
2. **Firefox**: Installiere die [Vue DevTools Extension](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
3. Öffne die Browser DevTools (F12)
4. Du siehst einen neuen Tab "Vue" mit Component-Inspektion

### 2. Debug-Modus aktivieren

Im Browser-Console:

```javascript
// Debug-Modus aktivieren
localStorage.setItem('debug', 'true')
location.reload()

// Oder über das globale Debug-Objekt
window.__RATATOSK_DEBUG__.enable()
```

### 3. Debug-Logs verwenden

```typescript
import { debug, debugCarousel, debugTTS, debugAutoMode } from '@/shared/utils/debug'

// Allgemeine Logs
debug.log('Category', 'Message', data)
debug.warn('Category', 'Warning')
debug.error('Category', 'Error')

// Carousel-spezifisch
debugCarousel.indexChange(0, 1, 5)
debugCarousel.itemClick(item, index)

// TTS-spezifisch
debugTTS.speak('Hallo Welt', false)
debugTTS.stateChange(false, true)

// AutoMode-spezifisch
debugAutoMode.start(false)
debugAutoMode.indexChange(2, 5)
```

---

## 📋 Debug-Funktionen

### Debug Utility (`src/shared/utils/debug.ts`)

#### Allgemeine Funktionen

```typescript
// Logs (nur im Debug-Modus)
debug.log('Category', 'Message', data)
debug.warn('Category', 'Warning')
debug.error('Category', 'Error') // Immer sichtbar
debug.info('Category', 'Info')

// Performance-Timing
debug.time('Operation')
// ... Code ...
debug.timeEnd('Operation')

// Gruppierte Logs
debug.group('Group Name')
debug.log('Category', 'Message 1')
debug.log('Category', 'Message 2')
debug.groupEnd()

// Tabellen für strukturierte Daten
debug.table([{ name: 'Item 1', value: 10 }], 'Table Name')
```

#### Carousel-Debugging

```typescript
import { debugCarousel } from '@/shared/utils/debug'

// Index-Wechsel loggen
debugCarousel.indexChange(oldIndex, newIndex, totalItems)

// Item-Klick loggen
debugCarousel.itemClick(item, index)

// Aktuelle Position als Tabelle anzeigen
debugCarousel.position(currentIndex, items)
```

#### TTS-Debugging

```typescript
import { debugTTS } from '@/shared/utils/debug'

// TTS-Sprache loggen
debugTTS.speak('Text', isMuted)

// TTS-State-Wechsel loggen
debugTTS.stateChange(oldMuted, newMuted)
```

#### AutoMode-Debugging

```typescript
import { debugAutoMode } from '@/shared/utils/debug'

// AutoMode-Start loggen
debugAutoMode.start(skipTitle)

// AutoMode-Stop loggen
debugAutoMode.stop()

// Index-Wechsel loggen
debugAutoMode.indexChange(index, totalItems)
```

---

## 🎯 Praktische Beispiele

### Beispiel 1: Carousel-Verhalten debuggen

```typescript
// In CarouselView.vue oder einem Composable
import { debugCarousel } from '@/shared/utils/debug'

watch(() => currentIndex.value, (newIndex, oldIndex) => {
  debugCarousel.indexChange(oldIndex, newIndex, items.value.length)
  
  // Detaillierte Position als Tabelle
  debugCarousel.position(newIndex, items.value)
})
```

### Beispiel 2: TTS-Verhalten debuggen

```typescript
// In useSpeech.ts oder ähnlich
import { debugTTS } from '@/shared/utils/debug'

const speak = (text: string) => {
  const isMuted = simpleFlowController.getTTSMuted()
  debugTTS.speak(text, isMuted)
  
  if (!isMuted) {
    // ... TTS-Logik
  }
}
```

### Beispiel 3: Performance messen

```typescript
import { debug } from '@/shared/utils/debug'

const expensiveOperation = () => {
  debug.time('Expensive Operation')
  
  // ... Code ...
  
  debug.timeEnd('Expensive Operation')
}
```

### Beispiel 4: Component-State debuggen

```typescript
import { debugComponent } from '@/shared/utils/debug'

onMounted(() => {
  debugComponent.lifecycle('MyComponent', 'mounted')
  debugComponent.props('MyComponent', props)
  debugComponent.state('MyComponent', { count: count.value })
})
```

---

## 🔍 Browser DevTools

### Breakpoints setzen

1. Öffne Browser DevTools (F12)
2. Gehe zum Tab "Sources" (Chrome) oder "Debugger" (Firefox)
3. Navigiere zu deiner Datei
4. Klicke auf die Zeilennummer, um einen Breakpoint zu setzen

### Console-Befehle

```javascript
// Debug-Objekt verfügbar machen
window.__RATATOSK_DEBUG__

// Debug-Modus aktivieren/deaktivieren
window.__RATATOSK_DEBUG__.enable()
window.__RATATOSK_DEBUG__.disable()

// Prüfen ob Debug aktiv ist
window.__RATATOSK_DEBUG__.isEnabled()

// Direkt Debug-Funktionen aufrufen
window.__RATATOSK_DEBUG__.debug.log('Test', 'Message')
window.__RATATOSK_DEBUG__.debugCarousel.position(0, items)
```

### Vue DevTools Features

- **Component Tree**: Alle Vue Components anzeigen
- **Component State**: Props, Data, Computed Properties inspizieren
- **Events**: Event-Handler und ausgelöste Events sehen
- **Timeline**: Performance und Component-Lifecycle verfolgen
- **Router**: Vue Router State und Navigation verfolgen

---

## 🐛 Häufige Debug-Szenarien

### Problem: Carousel springt nicht korrekt

```typescript
// In useCarousel.ts oder ähnlich
import { debugCarousel } from '@/shared/utils/debug'

watch(() => currentIndex.value, (newIndex, oldIndex) => {
  debugCarousel.indexChange(oldIndex, newIndex, items.length)
  
  // Prüfe ob Index gültig ist
  if (newIndex < 0 || newIndex >= items.length) {
    debug.error('Carousel', `Ungültiger Index: ${newIndex}`)
  }
})
```

### Problem: TTS spricht nicht

```typescript
// In useSpeech.ts oder ähnlich
import { debugTTS } from '@/shared/utils/debug'

const speak = async (text: string) => {
  const isMuted = simpleFlowController.getTTSMuted()
  debugTTS.speak(text, isMuted)
  
  if (isMuted) {
    debug.warn('TTS', 'TTS ist stumm - Text wird nicht gesprochen')
    return
  }
  
  // ... TTS-Logik
}
```

### Problem: AutoMode stoppt unerwartet

```typescript
// In useAutoMode.ts
import { debugAutoMode } from '@/shared/utils/debug'

const start = (skipTitle: boolean = false) => {
  debugAutoMode.start(skipTitle)
  
  // ... AutoMode-Logik
  
  watch(() => index.value, (newIndex) => {
    debugAutoMode.indexChange(newIndex, items.length)
  })
}
```

---

## 📊 Debug-Logs filtern

In der Browser-Console kannst du Logs filtern:

- `[DEBUG:Carousel]` - Nur Carousel-Logs
- `[DEBUG:TTS]` - Nur TTS-Logs
- `[DEBUG:AutoMode]` - Nur AutoMode-Logs
- `[ERROR]` - Nur Fehler
- `[WARN]` - Nur Warnungen

---

## ⚙️ Konfiguration

### Debug-Modus dauerhaft aktivieren

In `src/shared/utils/debug.ts`:

```typescript
// Immer aktiv (auch in Production)
const DEBUG_MODE = true
```

**⚠️ Achtung**: Nicht für Production-Builds empfohlen!

### Debug-Modus nur in Development

```typescript
// Nur im Development-Modus
const DEBUG_MODE = import.meta.env.DEV
```

### Debug-Modus über localStorage

```typescript
// Über localStorage steuerbar
const DEBUG_MODE = import.meta.env.DEV || localStorage.getItem('debug') === 'true'
```

---

## 🎓 Best Practices

1. **Kategorien verwenden**: Immer eine Kategorie angeben (`debug.log('Carousel', ...)`)
2. **Strukturierte Daten**: Für Arrays/Objekte `debug.table()` verwenden
3. **Performance messen**: `debug.time()` / `debug.timeEnd()` für langsame Operationen
4. **Fehler immer loggen**: `debug.error()` ist immer aktiv
5. **Gruppieren**: Verwandte Logs mit `debug.group()` gruppieren
6. **Nicht zu viel loggen**: Nur relevante Informationen loggen

---

## 🔗 Weitere Ressourcen

- [Vue DevTools Dokumentation](https://devtools.vuejs.org/)
- [Chrome DevTools Guide](https://developer.chrome.com/docs/devtools/)
- [Firefox DevTools Guide](https://firefox-source-docs.mozilla.org/devtools-user/)

---

## ❓ Fragen?

Bei Problemen oder Fragen zum Debugging:
1. Prüfe die Browser-Console auf Fehler
2. Aktiviere Vue DevTools
3. Nutze `window.__RATATOSK_DEBUG__` für interaktives Debugging
4. Setze Breakpoints in kritischen Code-Stellen

