# Leuchtdauer-Utility Dokumentation

## Übersicht

Die `leuchtdauerUtils.ts` bietet eine zentrale Verwaltung der Leuchtdauer-Einstellungen. Alle Views verwenden standardmäßig die globale Leuchtdauer aus den Settings, können aber bei Bedarf eigene Werte überschreiben.

## Verwendung

### 1. Standard-Import

```typescript
import { getLeuchtdauer, getAutoModeLeuchtdauer, getCSSLeuchtdauer, createTransition, createAnimation } from '../../../core/utils/leuchtdauerUtils'
```

### 2. Auto-Modus (setTimeout/setInterval)

**Standard (globale Leuchtdauer):**
```typescript
// Verwendet settingsStore.settings.leuchtdauer
autoModeInterval.value = window.setTimeout(cycleTiles, getAutoModeLeuchtdauer('ViewName'))
```

**Benutzerdefiniert:**
```typescript
// Verwendet 2 Sekunden statt globale Einstellung
autoModeInterval.value = window.setTimeout(cycleTiles, getAutoModeLeuchtdauer('ViewName', 2))
```

### 3. CSS-Transitions

**Standard (globale Leuchtdauer):**
```typescript
const transition = computed(() => 
  createTransition('ViewName', ['background-color', 'transform'])
)
```

**Benutzerdefiniert:**
```typescript
const fastTransition = computed(() => 
  createTransition('ViewName', ['background-color', 'transform'], 0.5) // 0.5s
)
```

### 4. CSS-Animationen

**Standard:**
```typescript
const animation = computed(() => 
  createAnimation('ViewName', 'fadeIn')
)
```

**Benutzerdefiniert:**
```typescript
const slowAnimation = computed(() => 
  createAnimation('ViewName', 'fadeIn', 2) // 2s
)
```

### 5. Direkte Werte

**Millisekunden (für JavaScript):**
```typescript
const duration = getLeuchtdauer('ViewName') // Gibt Millisekunden zurück
```

**Sekunden (für CSS):**
```typescript
const duration = getCSSLeuchtdauer('ViewName') // Gibt Sekunden zurück
```

## Migration bestehender Views

### Vorher:
```typescript
// Alte Methode
autoModeInterval.value = window.setTimeout(cycleTiles, settingsStore.settings.autoModeSpeed)
```

### Nachher:
```typescript
// Neue Methode
import { getAutoModeLeuchtdauer } from '../../../core/utils/leuchtdauerUtils'

autoModeInterval.value = window.setTimeout(cycleTiles, getAutoModeLeuchtdauer('ViewName'))
```

## Beispiele für spezielle Anwendungsfälle

### 1. Schnelle Navigation (0.5s)
```typescript
// Für schnelle Menü-Navigation
const fastDuration = getAutoModeLeuchtdauer('QuickMenu', 0.5)
```

### 2. Langsame Animationen (2s)
```typescript
// Für langsame, beruhigende Animationen
const slowTransition = createTransition('CalmView', ['opacity', 'transform'], 2)
```

### 3. CSS-Animationen mit globaler Leuchtdauer
```typescript
// Verwendet globale Einstellung
const pulseAnimation = createAnimation('PulseView', 'pulse')
```

## Vorteile

1. **Zentrale Verwaltung**: Alle Leuchtdauer-Einstellungen an einem Ort
2. **Flexibilität**: Views können bei Bedarf eigene Werte verwenden
3. **Konsistenz**: Standardverhalten ist einheitlich
4. **Debugging**: Logs zeigen, welche Leuchtdauer verwendet wird
5. **Wartbarkeit**: Einfache Änderungen an der globalen Logik

## Debugging

Alle Funktionen loggen ihre Verwendung:
```
LeuchtdauerUtils: ViewName verwendet globale Leuchtdauer: 3s
LeuchtdauerUtils: ViewName verwendet benutzerdefinierte Dauer: 0.5s
```

## Best Practices

1. **Verwende immer die Utility-Funktionen** statt direkte Settings-Zugriffe
2. **Gib aussagekräftige View-Namen** für besseres Debugging
3. **Verwende benutzerdefinierte Werte nur bei echten Anforderungen** (z.B. CSS-Animationen)
4. **Dokumentiere spezielle Anwendungsfälle** in Kommentaren
