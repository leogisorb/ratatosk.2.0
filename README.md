# Ratatosk Modern - Kommunikationsassistent

Ein moderner Kommunikationsassistent für Menschen mit eingeschränkter Mobilität, der durch Augenblinzeln gesteuert werden kann.

## Features

### 🎯 Startseite mit Kamera-Aktivierung
- **Kamera aktivieren**: Einfacher Button zum Starten der Kamera
- **Gesichtserkennung**: Automatische Erkennung des Benutzers
- **Blinzeln zum Starten**: Halten Sie beide Augen für 2 Sekunden geschlossen
- **Manueller Start**: Alternative ohne Gesichtserkennung verfügbar
- **Status-Anzeige**: Echtzeit-Feedback über Kamera- und Gesichtserkennungsstatus

### 💬 Kommunikation
- **Nachrichten eingeben**: Textbasierte Kommunikation
- **Schnellnachrichten**: Vordefinierte Nachrichten für häufige Situationen
- **Nachrichtenverlauf**: Übersicht über gesendete Nachrichten

### 😣 Schmerzerfassung (in Entwicklung)
- Dokumentation von Schmerzen und Beschwerden
- Schmerzskala und Lokalisierung

### ⚙️ Einstellungen
- **Dark Mode**: Dunkles Design für bessere Lesbarkeit
- **Hoher Kontrast**: Verbesserte Sichtbarkeit
- **Große Schrift**: Bessere Lesbarkeit für Menschen mit Sehbehinderung

## Technologie

- **Vue.js 3**: Moderne Frontend-Framework
- **TypeScript**: Typsichere Entwicklung
- **Tailwind CSS**: Utility-first CSS Framework
- **MediaPipe**: Google's Face Mesh für Gesichtserkennung
- **Pinia**: State Management

## Installation

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev

# Produktions-Build erstellen
npm run build
```

## Verwendung

### 1. Startseite
1. Öffnen Sie die Anwendung im Browser
2. Klicken Sie auf "Kamera aktivieren"
3. Erlauben Sie den Zugriff auf die Kamera
4. Stellen Sie sich vor die Kamera
5. Blinzeln Sie für 2 Sekunden, um die App zu starten

### 2. Hauptinterface
- **Kommunikation**: Nachrichten eingeben und senden
- **Schmerzerfassung**: Schmerzen dokumentieren
- **Einstellungen**: App konfigurieren

### 3. Alternative Bedienung
Falls die Gesichtserkennung nicht funktioniert:
- Klicken Sie auf "Ohne Blinzeln starten"
- Verwenden Sie die Maus/Touch für die Navigation

## Browser-Kompatibilität

- **Chrome/Edge**: Vollständige Unterstützung
- **Firefox**: Unterstützt (MediaPipe kann eingeschränkt sein)
- **Safari**: Unterstützt (MediaPipe kann eingeschränkt sein)
- **Mobile Browser**: Touch-Navigation verfügbar

## Entwicklung

### Projektstruktur
```
src/
├── components/     # Vue-Komponenten
├── composables/    # Vue Composables (useFaceRecognition)
├── router/         # Vue Router Konfiguration
├── stores/         # Pinia Stores
├── types/          # TypeScript Typen
├── views/          # Seiten-Komponenten
│   ├── StartView.vue    # Startseite mit Kamera
│   └── HomeView.vue     # Hauptinterface
└── assets/         # Statische Assets
```

### Face Recognition
Die Gesichtserkennung verwendet MediaPipe Face Mesh:
- **Landmarks**: 468 Punkte im Gesicht
- **Augenerkennung**: Spezielle Landmarks für Augen
- **Blinzelerkennung**: Messung der Augenöffnung

### Routing
- `/`: Startseite mit Kamera-Aktivierung
- `/app`: Hauptinterface der Anwendung
- `/about`: Über-Seite

## Barrierefreiheit

- **Kontrast**: Hoher Kontrast für bessere Sichtbarkeit
- **Schriftgröße**: Anpassbare Schriftgrößen
- **Tastaturnavigation**: Vollständige Tastatur-Unterstützung
- **Screen Reader**: ARIA-Labels und semantisches HTML

## Lizenz

Dieses Projekt ist Teil der Ratatosk-Entwicklung für barrierefreie Kommunikation.

## Support

Bei Fragen oder Problemen wenden Sie sich an das Entwicklungsteam.
