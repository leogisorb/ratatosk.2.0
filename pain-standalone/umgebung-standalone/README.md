# Ratatosk Umgebung Standalone

Eine standalone Version der Umgebung-Views aus Ratatosk 2.0.

## Features

- **UmgebungView**: Hauptmenü für Umgebungsbereiche
- **BettView**: Bett-Bereich mit Items (Decke, Kissen, Bettbezug, Fernbedienung)
- **BettVerbenView**: Verben für Bett-Items (wechseln, waschen, bringen, etc.)
- **GegenstaendeView**: Gegenstände-Bereich (Handy, Glas, Brille, etc.)
- **GegenstaendeVerbenView**: Verben für Gegenstände (benutzen, halten, legen, etc.)
- **ZimmerView**: Zimmer-Bereich mit Items (Tür, Fenster, Licht, etc.)
- **ZimmerVerbenView**: Verben für Zimmer-Items (öffnen, schließen, anmachen, etc.)
- **VerbenView**: Allgemeine Verben-View

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Features

- Face Recognition mit Blink-Detection
- Text-to-Speech (TTS)
- Auto-Modus für automatischen Durchlauf
- Responsive Design
- Touch-optimiert für Tablets

## Verwendung

1. Starte den Development Server: `npm run dev`
2. Öffne http://localhost:5173
3. Navigiere durch die verschiedenen Umgebungsbereiche
4. Verwende Blinzeln oder rechte Maustaste zur Auswahl
5. TTS kann über den Toggle-Button aktiviert/deaktiviert werden

## Technologie

- Vue 3
- TypeScript
- Vite
- Pinia (State Management)
- Vue Router
- MediaPipe (Face Recognition)
- Web Speech API (TTS)
