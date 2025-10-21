# Ernährung Feature - Standalone

Dieses Paket enthält alle notwendigen Dateien für das Ernährung-Feature aus der Ratatosk-Anwendung.

## Enthaltene Dateien

### Hauptkomponenten
- `src/features/nutrition/views/ErnaehrungView.vue` - Vue-Komponente
- `src/features/nutrition/views/ErnaehrungView.ts` - TypeScript-Logik
- `src/features/nutrition/views/ErnaehrungView.css` - Styling

### Abhängigkeiten
- `src/shared/components/AppHeader.vue` - Header-Komponente
- `src/shared/types/index.ts` - TypeScript-Typen
- `src/features/settings/stores/settings.ts` - Pinia Store
- `src/features/face-recognition/composables/useFaceRecognition.ts` - Face Recognition
- `src/core/application/SimpleFlowController.ts` - Flow Controller
- `src/config/ttsConfig.ts` - TTS-Konfiguration
- `src/assets/main.css` - Globale Styles

### Konfiguration
- `package.json` - Dependencies
- `vite.config.ts` - Vite-Konfiguration
- `index.html` - HTML-Template
- `src/main.ts` - App-Initialisierung
- `src/App.vue` - Root-Komponente

## Installation

```bash
npm install
npm run dev
```

## Features

- 3D-Karussell für Ernährung-Auswahl
- TTS (Text-to-Speech) Integration
- Face Recognition für Blinzel-Erkennung
- Responsive Design
- Dark/Light Mode Support
- Auto-Mode für automatische Durchlauf

