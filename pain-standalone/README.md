# Pain Assessment System - Standalone

Dieses Paket enthält das komplette Pain Assessment System aus der Ratatosk-Anwendung.

## Enthaltene Komponenten

### PainDialogView - 3-Phasen-Dialog
- **Phase 1**: Hauptregionen (Kopf, Beine, Arme, Torso) - Grid Layout
- **Phase 2**: Subregionen - 3D-Karussell (wie Ernährung)
- **Phase 3**: Schmerzskala (1-10) - Visuelle Progress Bar
- **Phase 4**: Bestätigung - Zusammenfassung

### PainScaleView - Schmerzskala
- **1-10 Schmerzskala** mit visueller Progress Bar
- **Auto-Mode** durchläuft alle Schmerzlevel
- **Blinzel-Erkennung** für Auswahl
- **TTS-Integration** für Sprachausgabe

## Enthaltene Dateien

### Hauptkomponenten
- `src/features/pain-assessment/views/PainDialogView.vue` - 3-Phasen-Dialog
- `src/features/pain-assessment/views/PainDialogView.css` - 721 Zeilen CSS
- `src/features/pain-assessment/views/PainScaleView.vue` - Schmerzskala
- `src/features/pain-assessment/views/PainScaleView.css` - 350 Zeilen CSS

### Daten & Logik
- `src/features/pain-assessment/data/painAssessmentData.ts` - Alle Schmerzdaten
- `src/features/pain-assessment/composables/usePainAssessment.ts` - Zentrale Logik
- `src/features/pain-assessment/composables/usePainDialogFlow.ts` - Dialog-Flow
- `src/features/pain-assessment/services/PainAssessmentService.ts` - Business Logic

### Abhängigkeiten
- `src/shared/components/AppHeader.vue` - Header-Komponente
- `src/shared/types/index.ts` - TypeScript-Typen
- `src/features/settings/stores/settings.ts` - Pinia Store
- `src/features/face-recognition/composables/useFaceRecognition.ts` - Face Recognition
- `src/core/application/SimpleFlowController.ts` - Flow Controller
- `src/config/ttsConfig.ts` - TTS-Konfiguration
- `src/assets/main.css` - Globale Styles (560 Zeilen)

### Konfiguration
- `package.json` - Dependencies (Vue 3, Pinia, Vue Router, Vite)
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

- **3D-Karussell** für Subregion-Auswahl
- **TTS (Text-to-Speech)** Integration
- **Face Recognition** für Blinzel-Erkennung
- **Auto-Mode** für automatische Durchlauf
- **Responsive Design** (Mobile, Tablet, Desktop)
- **Dark/Light Mode** Support
- **4-Phasen-Workflow**: Hauptregion → Subregion → Schmerzskala → Bestätigung

## Workflow

1. **Hauptregionen**: Grid mit 4 Kacheln (Kopf, Beine, Arme, Torso)
2. **Subregionen**: 3D-Karussell je nach Hauptregion
3. **Schmerzskala**: 1-10 Skala mit visueller Progress Bar
4. **Bestätigung**: Zusammenfassung der Auswahl

## Technische Details

- **Vue 3 + Composition API**
- **TypeScript** für Typsicherheit
- **Pinia** für State Management
- **Vue Router** für Navigation
- **Vite** für Build-Tool
- **CSS Custom Properties** für Theming
- **3D-Transforms** für Karussell-Effekte

