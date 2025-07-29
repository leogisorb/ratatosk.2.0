# 🚀 GitHub + IONOS Setup: Vollständige Anleitung

## 📋 Übersicht

Diese Anleitung dokumentiert die vollständige Einrichtung einer automatischen Deployment-Pipeline für die Ratatosk-App von GitHub zu IONOS, inklusive aller aufgetretenen Fehler und deren Lösungen.

## 🎯 Ziel

- ✅ Automatisches Deployment von GitHub zu IONOS
- ✅ HTTPS für Kamera-Funktionalität auf iPhone
- ✅ Keine manuellen Uploads mehr nötig
- ✅ Domain `idothisshit.de` funktional

## 📁 Projektstruktur

```
Ratatosk/
├── index.html          # Haupt-App (reine HTML/JavaScript)
├── public/             # Statische Assets (SVG, Audio, JS)
├── .github/workflows/  # GitHub Actions
├── vite.config.js      # Vite-Konfiguration (für lokale Entwicklung)
└── package.json        # Node.js Dependencies
```

## 🔧 Schritt-für-Schritt Setup

### Phase 1: Lokale Vorbereitung

#### 1.1 Git Repository initialisieren
```bash
cd /Users/leopoldbrosig/Documents/uni/Bachelor/Ratatosk
git init
git add .
git commit -m "Initial commit with automatic deployment setup"
```

#### 1.2 .gitignore erstellen
```bash
# Logs
logs
*.log
npm-debug.log*

# Dependencies
node_modules
dist
dist-ssr
*.local

# Editor
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store

# SSL certificates
*.pem
*.key
*.crt

# Environment
.env*
```

### Phase 2: GitHub Repository Setup

#### 2.1 Repository erstellen
- Gehe zu [GitHub.com](https://github.com)
- Erstelle neues Repository: `ratatosk`
- **WICHTIG**: Nicht mit README initialisieren

#### 2.2 Lokales Repository verbinden
```bash
git remote add origin https://github.com/leogisorb/ratatosk.git
git branch -M main
git push -u origin main
```

### Phase 3: GitHub Pages Konfiguration

#### 3.1 GitHub Pages aktivieren
- Repository → Settings → Pages
- Source: **"Deploy from a branch"** (nicht GitHub Actions!)
- Branch: `main`
- Folder: `/ (root)`
- Save

#### 3.2 Custom Domain konfigurieren
- Custom domain: `idothisshit.de`
- Enforce HTTPS: ✅ aktiviert

### Phase 4: IONOS DNS-Konfiguration

#### 4.1 Domain-Verifizierung
GitHub verlangt TXT-Record für Domain-Verifizierung:
```
Name: _github-pages-challenge-leogisorb
Value: a639868f26d83a170821c37747fec1
```

#### 4.2 DNS-Records für GitHub Pages
**A-Records** (4 Stück):
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

**CNAME-Record**:
```
Name: www
Value: leogisorb.github.io
```

#### 4.3 Wichtige Hinweise
- **DNSSEC deaktiviert lassen** (GitHub Pages unterstützt es nicht)
- **Alte IONOS A-Records entfernen**
- **DNS-Propagation** dauert 15-30 Minuten

## ❌ Aufgetretene Fehler und Lösungen

### Fehler 1: "getUserMedia nicht verfügbar" auf iPhone
**Problem**: Kamera-API funktioniert nicht über HTTP
**Lösung**: HTTPS aktivieren
```javascript
// Vite-Konfiguration für lokale Entwicklung
server: {
  host: '0.0.0.0',
  port: 5173,
  https: {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
  }
}
```

### Fehler 2: Vue.js vs. HTML-App Konfusion
**Problem**: App ist reine HTML/JavaScript, aber GitHub Actions versucht Vue.js Build
**Lösung**: GitHub Pages direkt verwenden statt GitHub Actions
- Source: "Deploy from a branch" statt "GitHub Actions"
- Kein Build-Prozess nötig

### Fehler 3: Git Rebase-Konflikte
**Problem**: Divergente Branches beim Push
**Lösung**: Sauberer Merge
```bash
git pull origin main --no-rebase
# Konflikte lösen
git add .
git commit -m "Fix merge conflicts"
git push origin main
```

### Fehler 4: Vim-Editor-Konflikte
**Problem**: Git öffnet Vim-Editor bei Commits
**Lösung**: Vim verlassen
```
:q!  # Verlassen ohne Speichern
Q    # Komplett verlassen
```

### Fehler 5: GitHub Actions Workflow-Fehler
**Problem**: Workflow-Deployment schlägt fehl
**Lösung**: Einfache GitHub Pages Konfiguration
- Keine GitHub Actions verwenden
- Direktes Deployment von Branch

### Fehler 6: DNS-Propagation
**Problem**: Domain zeigt noch auf alte IONOS IP
**Lösung**: Warten (15-30 Minuten)
```bash
nslookup idothisshit.de
# Sollte GitHub Pages IPs zeigen
```

## 🚨 ALLE FEHLER UND PROBLEME - CHRONOLOGISCH

### Tag 1: 29. Juli 2025 - Vollständige Fehlerchronik

#### Problem 1: Falsche Annahme über App-Typ
**Was passiert ist**: 
- Dachten die App sei eine Vue.js App
- Versuchten GitHub Actions mit Node.js Build zu konfigurieren
- Tatsächlich ist es eine reine HTML/JavaScript App

**Fehler**: 
- Erstellten komplexe GitHub Actions Workflows
- Versuchten `npm run build` für nicht-existentes Vue.js Projekt
- Deployment schlug fehl

**Lösung**: 
- Erkannt: App ist in `index.html` (reine HTML/JavaScript)
- GitHub Pages direkt verwenden statt GitHub Actions

#### Problem 2: HTTPS für lokale Entwicklung
**Was passiert ist**:
- Kamera funktionierte nicht auf iPhone
- Fehler: "getUserMedia nicht verfügbar"
- HTTP funktioniert nicht für Kamera-API auf iOS

**Fehler**:
- Versuchten HTTP für lokale Entwicklung
- Kamera-Test schlug fehl

**Lösung**:
- SSL-Zertifikate erstellt: `key.pem` und `cert.pem`
- Vite-Konfiguration für HTTPS angepasst

#### Problem 3: Git Rebase-Katastrophe
**Was passiert ist**:
- Mehrere Commits parallel gemacht
- Git Rebase gestartet
- Vim-Editor öffnete sich mehrfach
- Konflikte in Workflow-Dateien

**Fehler**:
```bash
# Falsche Befehle:
git rebase --continue  # Öffnete Vim
git pull origin main --rebase  # Mehr Konflikte
```

**Lösung**:
```bash
# Richtige Befehle:
git rebase --abort  # Rebase abbrechen
git pull origin main --no-rebase  # Merge statt Rebase
```

#### Problem 4: Vim-Editor-Hölle
**Was passiert ist**:
- Git öffnete Vim-Editor bei jedem Commit
- Mehrere Vim-Instanzen liefen parallel
- Swap-Dateien verursachten Konflikte

**Fehler**:
```
E325: ATTENTION
Found a swap file by the name "~/Documents/uni/Bachelor/Ratatosk/.git/.COMMIT_EDITMSG.swp"
```

**Lösung**:
- `:q!` oder `Q` um Vim zu verlassen
- Rebase komplett abbrechen
- Sauberer Neustart

#### Problem 5: GitHub Actions Workflow-Fehler
**Was passiert ist**:
- Erstellten mehrere Workflow-Dateien
- Alle schlugen fehl
- Deployment funktionierte nicht

**Fehler**:
- `deploy.yml` - fehlgeschlagen
- `static.yml` - fehlgeschlagen
- Workflow-Konflikte

**Lösung**:
- GitHub Actions komplett vermieden
- GitHub Pages direkt konfiguriert
- "Deploy from a branch" statt "GitHub Actions"

#### Problem 6: DNS-Konfiguration Chaos
**Was passiert ist**:
- IONOS DNS-Einstellungen verwirrend
- Mehrere A-Records konfiguriert
- DNSSEC-Frage kam auf

**Fehler**:
- Dachten DNSSEC aktivieren zu müssen
- Verwirrung bei A-Records
- DNS-Propagation nicht verstanden

**Lösung**:
- DNSSEC deaktiviert gelassen
- 4 GitHub Pages A-Records korrekt konfiguriert
- DNS-Propagation abgewartet

#### Problem 7: Domain-Verifizierung
**Was passiert ist**:
- GitHub verlangte TXT-Record
- IONOS DNS-Interface verwirrend
- Verifizierung schlug zunächst fehl

**Fehler**:
- TXT-Record falsch konfiguriert
- DNS-Propagation nicht abgewartet

**Lösung**:
- TXT-Record korrekt hinzugefügt
- 15-30 Minuten gewartet
- Verifizierung erfolgreich

#### Problem 8: Falsche GitHub Pages Konfiguration
**Was passiert ist**:
- Versuchten "GitHub Actions" als Source
- Deployment schlug fehl
- App wurde nicht korrekt angezeigt

**Fehler**:
- Komplexe Workflows erstellt
- Build-Prozess für statische HTML-App

**Lösung**:
- "Deploy from a branch" gewählt
- Kein Build-Prozess nötig
- Direktes Deployment funktioniert

#### Problem 9: Merge-Konflikte
**Was passiert ist**:
- Divergente Branches
- Konflikte in Workflow-Dateien
- Push wurde abgelehnt

**Fehler**:
```bash
! [rejected] main -> main (non-fast-forward)
error: failed to push some refs to 'https://github.com/leogisorb/ratatosk.git'
```

**Lösung**:
```bash
git pull origin main --no-rebase
# Konflikte lösen
git add .
git commit -m "Fix merge conflicts"
git push origin main
```

#### Problem 10: Terminal-Probleme
**Was passiert ist**:
- Terminal-Befehle wurden abgebrochen
- Shell-Wechsel zwischen zsh und bash
- Verwirrung bei Git-Befehlen

**Fehler**:
- Befehle wurden nicht ausgeführt
- Git-Status unklar

**Lösung**:
- Sauberer Terminal-Neustart
- Schritt-für-Schritt Anleitung
- Manuelle Befehlsausführung

## 🎯 Finale Konfiguration

### GitHub Pages
- ✅ Source: "Deploy from a branch"
- ✅ Branch: main
- ✅ Folder: / (root)
- ✅ Custom domain: idothisshit.de
- ✅ HTTPS: aktiviert

### IONOS DNS
- ✅ A-Records: 4x GitHub Pages IPs
- ✅ CNAME: www → leogisorb.github.io
- ✅ TXT-Record: Domain-Verifizierung
- ✅ DNSSEC: deaktiviert

### Lokale Entwicklung
- ✅ HTTPS für Kamera-Test
- ✅ Automatisches Deployment bei Push

## 🚀 Automatisches Deployment

### Workflow
1. **Code ändern**
2. **Commit und Push**
   ```bash
   git add .
   git commit -m "Neue Features"
   git push origin main
   ```
3. **Automatisches Deployment** (2-3 Minuten)
4. **App verfügbar** unter:
   - https://leogisorb.github.io/ratatosk/
   - https://idothisshit.de (nach DNS-Propagation)

### URLs
- **Entwicklung**: https://localhost:5173/ (HTTPS)
- **GitHub Pages**: https://leogisorb.github.io/ratatosk/
- **Custom Domain**: https://idothisshit.de

## 📱 iPhone-Kamera-Test

### Voraussetzungen
- ✅ HTTPS aktiviert
- ✅ Kamera-Berechtigung erteilt
- ✅ Safari oder Chrome verwenden

### Test-Schritte
1. Öffne https://leogisorb.github.io/ratatosk/
2. Erlaube Kamera-Zugriff
3. Kamera sollte funktionieren
4. Keine "getUserMedia nicht verfügbar" Fehler

## 🔍 Troubleshooting

### App lädt nicht
- GitHub Pages Status prüfen
- DNS-Propagation abwarten
- Browser-Cache leeren

### Kamera funktioniert nicht
- HTTPS prüfen
- Kamera-Berechtigung prüfen
- Anderen Browser testen

### Deployment schlägt fehl
- GitHub Actions Logs prüfen
- Einfache GitHub Pages Konfiguration verwenden
- Keine GitHub Actions für statische HTML-Apps

## 📚 Wichtige Erkenntnisse

1. **Statische HTML-Apps** brauchen keine GitHub Actions
2. **HTTPS ist essentiell** für Kamera-API auf iOS
3. **DNS-Propagation** braucht Zeit
4. **Git Rebase** kann komplex sein - Merge ist einfacher
5. **GitHub Pages** ist perfekt für statische Apps
6. **Vim-Editor** ist verwirrend - besser vermeiden
7. **Einfache Lösungen** sind oft die besten
8. **DNS-Konfiguration** braucht Geduld
9. **Terminal-Probleme** können frustrierend sein
10. **Fehler sind Lernchancen** - nicht aufgeben!

## 🎉 Erfolg

Nach diesem Setup:
- ✅ Automatisches Deployment funktioniert
- ✅ Kamera funktioniert auf iPhone
- ✅ Domain ist konfiguriert
- ✅ HTTPS ist aktiviert
- ✅ Keine manuellen Uploads mehr nötig

## 💡 Was wir gelernt haben

1. **Nicht zu komplex denken** - einfache Lösungen sind oft besser
2. **App-Typ verstehen** - Vue.js vs. HTML/JavaScript
3. **Git-Probleme vermeiden** - saubere Commits, keine Rebase-Komplexität
4. **HTTPS ist wichtig** - besonders für mobile APIs
5. **DNS braucht Zeit** - Geduld haben
6. **GitHub Pages ist mächtig** - für statische Apps perfekt
7. **Fehler dokumentieren** - hilft bei zukünftigen Problemen
8. **Terminal-Probleme** - sauberer Neustart hilft
9. **Workflow-Simplizität** - weniger ist mehr
10. **Durchhalten lohnt sich** - am Ende funktioniert alles!

---

**Erstellt am**: 29. Juli 2025  
**Projekt**: Ratatosk Kommunikationsassistent  
**Domain**: idothisshit.de  
**GitHub**: leogisorb/ratatosk  
**Zeitaufwand**: ~4 Stunden  
**Fehler**: 10+ verschiedene Probleme  
**Ergebnis**: ✅ Erfolgreich! 