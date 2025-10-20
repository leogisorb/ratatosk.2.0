# TTS (Text-to-Speech) Architektur - HomeView Fokus

## Übersicht
Diese ZIP-Datei enthält alle Dateien, die für die TTS-Funktionalität in der HomeView und den damit verbundenen Komponenten relevant sind.

## Dateistruktur

### Hauptkomponenten
- **`src/features/navigation/views/HomeView.vue`** - Hauptmenü mit TTS-Implementierung
- **`src/shared/components/AppHeader.vue`** - Header mit Volume-Toggle
- **`src/shared/components/TTSActivator.vue`** - Globaler TTS-Aktivator

### Stores und State Management
- **`src/features/settings/stores/settings.ts`** - Zentrale Einstellungen (TTS-Konfiguration)
- **`src/features/communication/stores/communication.ts`** - Kommunikations-Store

### Face Recognition
- **`src/features/face-recognition/composables/useFaceRecognition.ts`** - Blinzeln-Erkennung für TTS

### Types und Konfiguration
- **`src/shared/types/index.ts`** - TypeScript-Definitionen für TTS
- **`src/config/gridConfig.ts`** - Grid-Konfiguration für UI

### Styling
- **`src/assets/main.css`** - Globale CSS-Styles für TTS-Komponenten

## TTS-Architektur

### 1. Zentrale TTS-Kontrolle
- **AppHeader.vue**: Volume-Toggle steuert globales Audio
- **TTSActivator.vue**: Aktiviert TTS beim App-Start
- **Settings Store**: Speichert TTS-Einstellungen

### 2. HomeView TTS-Implementierung
```typescript
// TTS-Funktionen in HomeView.vue
const speakText = (text: string) => {
  // Browser-Autoplay-Policy-Handling
  // User-Interaction-Erkennung
  // TTS-Ausgabe mit deutschen Einstellungen
}

const enableTTSOnInteraction = () => {
  // Aktiviert TTS nach erster Benutzerinteraktion
}
```

### 3. Browser-Autoplay-Policy
- **Problem**: Browser blockieren TTS ohne Benutzerinteraktion
- **Lösung**: User-Interaction-Detection mit visuellen Indikatoren
- **Status-Indikator**: Zeigt an, wenn TTS blockiert ist

### 4. TTS-Konfiguration
```typescript
// Deutsche TTS-Einstellungen
utterance.lang = 'de-DE'
utterance.rate = 0.8
utterance.pitch = 1.0
utterance.volume = 0.8
```

### 5. Event-System
- **Volume-Toggle**: AppHeader → HomeView
- **User-Interaction**: Global → TTS-Aktivierung
- **Face-Recognition**: Blinzeln → TTS-Ausgabe

## Abhängigkeiten

### HomeView.vue importiert:
- `useSettingsStore` - Einstellungen
- `useCommunicationStore` - Kommunikation
- `useFaceRecognition` - Blinzeln-Erkennung
- `AppHeader` - Header-Komponente

### TTS-Features:
- **Auto-Modus**: Automatische Sprachausgabe bei Kachel-Wechsel
- **Blinzeln-Erkennung**: TTS-Aktivierung durch Blinzeln
- **Volume-Kontrolle**: Globale Audio-Steuerung
- **Status-Indikatoren**: Visuelle Rückmeldung bei TTS-Blockierung

## Verwendung

1. **TTS wird automatisch aktiviert** beim App-Start
2. **User-Interaction erforderlich** für Browser-Kompatibilität
3. **Volume-Toggle** im Header steuert globales Audio
4. **Auto-Modus** spricht Menüpunkte automatisch vor
5. **Blinzeln** aktiviert Menüauswahl mit TTS

## Technische Details

- **Browser-API**: `window.speechSynthesis`
- **Sprache**: Deutsch (de-DE)
- **Geschwindigkeit**: 0.8 (etwas langsamer)
- **Lautstärke**: 0.8 (80%)
- **Tonhöhe**: 1.0 (normal)

## Fehlerbehandlung

- **"not-allowed" Error**: Browser blockiert TTS
- **User-Interaction-Detection**: Aktiviert TTS nach Klick
- **Status-Indikatoren**: Zeigen TTS-Status an
- **Fallback-Verhalten**: Graceful Degradation bei Problemen
