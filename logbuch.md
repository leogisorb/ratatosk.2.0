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
- HTTPS: https://localhost:8443 (für Kamera-Zugriff) 