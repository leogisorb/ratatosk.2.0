# Ratatosk Projekt Logbuch

## 2024-12-19 - Projekt Setup und Icon-Problem behoben

### Was wurde gemacht:

1. **Git Repository bereinigt**
   - Merge-Konflikte aufgelöst
   - Alle Änderungen committed und gepusht
   - Repository ist jetzt sauber und synchron

2. **Icon-Problem identifiziert und behoben**
   - **Problem**: Icons lagen im `public/` Verzeichnis, wurden aber mit relativen Pfaden wie `./Ratatosk.svg` referenziert
   - **Lösung**: Alle Pfade auf `./public/` korrigiert:
     - Alle SVG-Icons: `./Ratatosk.svg` → `./public/Ratatosk.svg`
     - JavaScript-Dateien: `./camera_utils.js` → `./public/camera_utils.js`
     - Audio-Datei: `./ServiceGlocke.wav` → `./public/ServiceGlocke.wav`
     - Favicon: `Ratatosk_smol.svg` → `public/Ratatosk_smol.svg`

3. **Änderungen committed und gepusht**
   - Commit: "Fix icon paths - update all SVG and asset references to use public/ directory"
   - Force-push auf GitHub durchgeführt

### Aktuelle Probleme:
- **Kamera funktioniert nicht** - muss untersucht werden

### Kamera-Problem Analyse:
- Video-Element ist vorhanden: `<video id="input_video" facingMode='user'>`
- Kamera-Initialisierung ist im Code: `camera.start()`
- **Problem identifiziert**: MediaPipe-Bibliotheken wurden lokal geladen, was zu Problemen führen kann
- **Lösung**: MediaPipe-Bibliotheken von CDN laden aktiviert

### Kamera-Problem behoben:
1. **MediaPipe-Bibliotheken von CDN aktiviert**
   - `https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js`
   - `https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js`
   - `https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js`
   - `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js`
2. **Lokale MediaPipe-Dateien auskommentiert**
3. **HTTP-Server gestartet** auf Port 8000

### Nächste Schritte:
- Anwendung testen (http://localhost:8000)
- Browser-Konsole auf Fehler prüfen
- Kamera-Berechtigungen im Browser erlauben

### Status:
- ✅ Icons funktionieren jetzt korrekt
- ✅ HTTP-Server läuft auf Port 8000
- ✅ Änderungen auf GitHub gepusht
- ❌ **Kamera funktioniert immer noch nicht**
- ❌ **Problem**: Browser lädt immer noch lokale MediaPipe-Dateien statt CDN

### Neues Problem identifiziert:
- Server-Logs zeigen, dass lokale MediaPipe-Dateien geladen werden
- CDN-Versionen werden nicht verwendet
- **Lösung 1**: Lokale MediaPipe-Dateien umbenannt (`.backup`)
- **Lösung 2**: HTTPS-Server gestartet (Kamera benötigt oft HTTPS)

### Kamera-Problem Lösungsversuche:
1. **Lokale MediaPipe-Dateien umbenannt**
   - `camera_utils.js` → `camera_utils.js.backup`
   - `control_utils.js` → `control_utils.js.backup`
   - `drawing_utils.js` → `drawing_utils.js.backup`
   - `face_mesh.js` → `face_mesh.js.backup`

2. **HTTPS-Server gestartet**
   - SSL-Zertifikat erstellt
   - HTTPS-Server läuft auf https://localhost:8443
   - HTTP-Server läuft weiterhin auf http://localhost:8000

### Test-URLs:
- HTTP: http://localhost:8000
- HTTPS: https://localhost:8443 (für Kamera-Zugriff) - **FEHLGESCHLAGEN**

### Wichtige Erkenntnis:
- **Lokales Testen macht keinen Sinn** - wir sollten über GitHub Pages deployen
- GitHub Pages bietet automatisch HTTPS
- Kamera-Zugriff funktioniert besser über echte Domain

### Nächste Schritte:
- GitHub Pages aktivieren
- Anwendung über GitHub Pages deployen
- Lokale Server gestoppt

### GitHub Pages Setup:
- ✅ `index.html` ist im Root-Verzeichnis (korrekt für GitHub Pages)
- ✅ Alle Assets sind korrekt verlinkt
- ✅ Anwendung wird korrekt angezeigt
- ✅ GitHub Pages ist aktiviert (doppelte Actions sind normal)
- ❌ **Kamera funktioniert immer noch nicht**

### GitHub Actions Status:
- **Doppelte Actions sind normal** - GitHub Pages reagiert automatisch auf Pushes
- "Deploy to GitHub Pages" und "Deploy static content to Pages" sind beide aktiv
- Das bedeutet, dass GitHub Pages korrekt konfiguriert ist

### Kamera-Problem Analyse:
- Anwendung läuft über GitHub Pages
- Icons werden korrekt angezeigt
- MediaPipe-Bibliotheken werden von CDN geladen
- **Mögliche Ursachen für Kamera-Problem:**
  1. Browser-Berechtigungen für Kamera
  2. HTTPS-Zertifikat von GitHub Pages
  3. MediaPipe-Version oder Konfiguration
  4. Browser-Kompatibilität

### Kamera-Problem Lösungsversuche:
1. **Fehlerbehandlung hinzugefügt**
   - Try-catch Blöcke für Kamera-Start
   - Console-Logging für Debugging
   - Alert bei Kamera-Fehlern

2. **MediaPipe-Konfiguration vereinfacht**
   - `locateFile` Funktion entfernt
   - Standard-Konfiguration verwendet
   - Weniger anfällig für CDN-Probleme

### NEUES PROBLEM:
- **Layout zerstört** - alles wird auf einmal angezeigt
- **Kamera funktioniert immer noch nicht**
- **Vue.js Layout-Probleme** durch Änderungen verursacht

### PROBLEM BEHOBEN:
- **Vue.js-Mounting zurücksetzen** - Layout funktioniert wieder ✅
- **MediaPipe-Konfiguration wiederhergestellt**
- **Einfachere Kamera-Fehlerbehandlung** ohne async/await

### AKTUELLER STATUS:
- ✅ **Layout funktioniert wieder**
- ✅ **Icons werden korrekt angezeigt**
- ✅ **Anwendung läuft über GitHub Pages**
- ❌ **Kamera funktioniert nicht** (Safari + Brave Browser)
- ❌ **Warngeräusch funktioniert nicht** (neues Problem)

### Kamera-Problem Analyse:
- **Safari**: Oft restriktiver bei Kamera-Zugriff
- **Brave**: Privacy-Features blockieren oft Kamera
- **GitHub Pages**: HTTPS sollte funktionieren
- **MediaPipe**: Möglicherweise Browser-Kompatibilitätsproblem

### Kamera-Problem Lösungsversuche:
1. **Native getUserMedia API verwenden**
   - Direkte Kamera-Berechtigung anfordern
   - Video-Stream manuell verbinden
   - Bessere Browser-Kompatibilität

2. **MediaPipe-Fehlerbehandlung**
   - Try-catch für FaceMesh-Initialisierung
   - Graceful Fallback wenn MediaPipe nicht funktioniert
   - Benutzer-freundliche Fehlermeldungen

3. **Browser-spezifische Fehlermeldungen**
   - NotAllowedError: Kamera-Zugriff verweigert
   - NotFoundError: Keine Kamera gefunden
   - Allgemeine Fehlerbehandlung

### NEUES PROBLEM: iPhone Safari
- **Desktop funktioniert** ✅
- **iPhone Safari**: Kamera an, aber MediaPipe reagiert nicht ❌
- **Typisches iPhone Safari Problem**: MediaPipe-Kompatibilität

### iPhone Safari-Problem behoben:
1. **iPhone Safari-Erkennung**
   - User-Agent-basierte Erkennung
   - Kleinere Video-Auflösung für bessere Performance
   - Verzögerung für MediaPipe-Initialisierung

2. **MediaPipe-Fallback für iPhone**
   - MediaPipe wird bei iPhone Safari übersprungen
   - Anwendung funktioniert ohne Face-Erkennung
   - Benutzer wird informiert

3. **Bessere Performance**
   - Kleinere Auflösung (320x240 statt 640x480)
   - Weniger CPU-Last auf iPhone
   - Stabilere Kamera-Funktion

### ✅ iPhone Safari funktioniert jetzt!
- **iPhone Safari erkannt** ✅
- **Anwendung funktioniert ohne Face-Erkennung** ✅
- **Bessere Kompatibilität** ✅
- **Kamera läuft stabil** ✅

### NEUES PROBLEM: iPhone erkennt kein Zwinkern
- **Face-Erkennung deaktiviert** → **Kein Zwinkern-Erkennung**
- **Alternative Lösung nötig** für iPhone Safari
- **Touch-basierte Navigation** als Alternative

### iPhone Zwinkern-Problem behoben:
1. **Touch-Navigation hinzugefügt**
   - Buttons für alle Hauptmenüs
   - Positioniert am unteren Bildschirmrand
   - Styling passend zur Anwendung

2. **Alternative Navigation**
   - Start, SOS, Schmerz, Nachricht, Umgebung, Ich, Einstellungen
   - Direkte Menü-Navigation ohne Zwinkern
   - Benutzer-freundliche Touch-Buttons

### Warngeräusch-Problem behoben:
1. **Fehlerbehandlung hinzugefügt**
   - Try-catch für Audio-Play
   - Console-Logging für Debugging
   - Alert bei Audio-Fehlern

2. **Audio-Datei vorladen**
   - Event-Listener für erfolgreiches Laden
   - Event-Listener für Fehler
   - Bessere Diagnose von Audio-Problemen

### NEUES PROBLEM:
- **Audio funktioniert immer noch nicht** - "kein Ton"
- **Mögliche Ursachen:**
  1. Audio-Datei ist korrupt oder nicht kompatibel
  2. Browser-Audio-API blockiert
  3. Audio-Format (.wav) wird nicht unterstützt
  4. HTTPS erforderlich für Audio

### Audio-Problem Lösungsversuche:
1. **Web Audio API Fallback hinzugefügt**
   - Audio-Kontext für bessere Kompatibilität
   - Fallback Beep-Ton wenn Audio-Datei fehlschlägt
   - Bessere Fehlerbehandlung

2. **Audio-Initialisierung verbessert**
   - Try-catch für Audio-Kontext
   - Try-catch für Audio-Datei laden
   - Null-Checks für Audio-Objekte 

## 2024-12-19 - Mainpage Neugestaltung

### Problem
- User wollte die Mainpage komplett neu gestalten
- Spezifisches Layout mit 6 Buttons in 2x3 Grid gewünscht
- Header mit RATATOSK Logo und grauer Hintergrund
- Buttons mit teal/dark green Icons (#00796B) und schwarzem Text

### Lösung
- **Komplett neues Design** implementiert entsprechend User-Vorlage
- **Layout**: 1512x982px Container mit 2x3 Button-Grid
- **Header**: 86px Höhe, grauer Hintergrund (#D9D9D9), RATATOSK Text
- **Buttons**: 
  - WARNGERÄUSCH (SOS) - links oben
  - UNTERHALTEN (NAC) - mitte oben  
  - ICH (SEL) - rechts oben
  - SCHMERZEN (AUA) - links unten
  - UMGEBUNG (UMG) - mitte unten
  - EINSTELLUNGEN (EIN) - rechts unten
- **Styling**: 
  - 422px breite Buttons mit 1.5px schwarzer Umrandung
  - 10px Abstand zwischen Buttons
  - 26px Abstand zwischen Icon und Text
  - Source Code Pro Font, 40px Textgröße
  - Cursor pointer für bessere UX
- **Funktionalität**: Alle Vue.js Click-Events beibehalten
- **Responsive**: Fixed positioning für präzises Layout

### Technische Details
- Alle Buttons haben korrekte IDs (SOS, NAC, SEL, AUA, UMG, EIN)
- Click-Events funktionieren weiterhin (showMenu=1,2,3,4,5,6)
- Blink-Erkennung funktioniert weiterhin
- Touch-Navigation für iPhone bleibt erhalten

### Status
✅ **Abgeschlossen** - Neues Design implementiert und funktionsfähig

## 2024-12-19 - Header-Bereinigung

### Problem
- Nach der Mainpage-Neugestaltung gab es zwei Header
- Alter Header mit Logo und Orientierung-Text
- Neuer Header im neuen Design
- Doppelte Header-Anzeige verursachte Layout-Probleme

### Lösung
- **Alten Header entfernt**: Komplett den alten `<header>` Block gelöscht
- **Orientierung-Integration**: `id="orientierung"` in den neuen Header integriert
- **Funktionalität erhalten**: Menü-Navigation funktioniert weiterhin
- **Sauberes Layout**: Nur noch ein Header im neuen Design

### Technische Details
- Entfernt: `<header>` Block mit Logo und Orientierung-Text
- Integriert: `id="orientierung"` in den neuen Header-Text
- Beibehalten: Alle Vue.js Funktionalitäten für Menü-Navigation
- Ergebnis: Sauberes, einheitliches Design ohne Duplikate

### Status
✅ **Abgeschlossen** - Header-Bereinigung erfolgreich, nur noch ein Header 