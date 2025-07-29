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

## 🎉 Erfolg

Nach diesem Setup:
- ✅ Automatisches Deployment funktioniert
- ✅ Kamera funktioniert auf iPhone
- ✅ Domain ist konfiguriert
- ✅ HTTPS ist aktiviert
- ✅ Keine manuellen Uploads mehr nötig

---

**Erstellt am**: 29. Juli 2025  
**Projekt**: Ratatosk Kommunikationsassistent  
**Domain**: idothisshit.de  
**GitHub**: leogisorb/ratatosk 