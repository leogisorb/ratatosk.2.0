# Schritt-für-Schritt Anleitung: Ratatosk 2.0 auf Server deployen

## 🎯 Ziel
Die App soll unter `https://deine-domain.com/ratatosk.2.0/` laufen.

## 📋 Schritt 1: Lokalen Build erstellen

```bash
# Im Projektverzeichnis
npm run build
```

Dies erstellt den `dist` Ordner mit allen benötigten Dateien.

## 📁 Schritt 2: Verzeichnisstruktur auf dem Server

**WICHTIG:** Der Ordner muss genau so heißen: `ratatosk.2.0` (mit Punkt, nicht Unterstrich!)

Die Struktur auf dem Server sollte so aussehen:

```
/                          (Server-Root, z.B. public_html oder htdocs)
└── ratatosk.2.0/          ← Dieser Ordner muss genau so heißen!
    ├── .htaccess          ← WICHTIG: Muss vorhanden sein!
    ├── index.html
    ├── index.php
    ├── favicon.ico
    ├── favicon.svg
    ├── assets/
    │   ├── index-BmQkBwd3.js
    │   ├── index-Cs_MQ6g5.css
    │   └── [weitere Asset-Dateien]
    └── [alle anderen Dateien aus dist/]
```

## 📤 Schritt 3: Dateien auf Server hochladen

### Option A: FTP/SFTP (z.B. FileZilla, WinSCP)

1. **Verbinde dich mit dem Server** via FTP/SFTP
2. **Navigiere zum Server-Root** (meist `public_html`, `htdocs`, oder `www`)
3. **Erstelle den Ordner** `ratatosk.2.0` (falls er nicht existiert)
   - **WICHTIG:** Name muss genau `ratatosk.2.0` sein (mit Punkt!)
4. **Lade ALLE Dateien aus dem lokalen `dist` Ordner hoch** in `ratatosk.2.0/`
   - Inklusive `.htaccess` (versteckte Datei!)
   - Inklusive `assets/` Ordner mit allen Dateien
   - Inklusive aller SVG, PNG, ICO Dateien

### Option B: SSH/Terminal

```bash
# Auf dem Server (via SSH)
cd /path/to/server/root  # z.B. /var/www/html oder ~/public_html

# Erstelle den Ordner
mkdir -p ratatosk.2.0

# Kopiere alle Dateien (vom lokalen Rechner)
scp -r dist/* benutzer@server:/path/to/server/root/ratatosk.2.0/
```

### Option C: cPanel File Manager

1. **Öffne cPanel** → **File Manager**
2. **Navigiere zum Root-Verzeichnis** (meist `public_html`)
3. **Erstelle neuen Ordner** → Name: `ratatosk.2.0`
4. **Öffne den Ordner** `ratatosk.2.0`
5. **Upload** → Wähle alle Dateien aus dem lokalen `dist` Ordner
6. **WICHTIG:** Aktiviere "Show Hidden Files" um `.htaccess` zu sehen und hochzuladen

## ✅ Schritt 4: Verzeichnisstruktur prüfen

Nach dem Upload sollte im `ratatosk.2.0` Ordner folgendes vorhanden sein:

- ✅ `.htaccess` (versteckte Datei - muss vorhanden sein!)
- ✅ `index.html`
- ✅ `index.php`
- ✅ `favicon.ico`
- ✅ `favicon.svg`
- ✅ `assets/` Ordner mit JavaScript und CSS Dateien
- ✅ Alle SVG, PNG, ICO Dateien

## 🔧 Schritt 5: Berechtigungen prüfen (falls nötig)

```bash
# Auf dem Server (via SSH)
cd ratatosk.2.0
chmod 644 .htaccess
chmod 644 index.html
chmod 755 assets/
```

## 🌐 Schritt 6: App testen

1. **Öffne im Browser:**
   ```
   https://deine-domain.com/ratatosk.2.0/
   ```
   (Ersetze `deine-domain.com` mit deiner tatsächlichen Domain)

2. **Prüfe Browser-Konsole (F12):**
   - Tab "Console": Gibt es Fehler?
   - Tab "Network": Werden alle Dateien geladen? (keine 404-Fehler?)

3. **Erwartetes Verhalten:**
   - App lädt ohne Fehler
   - URL zeigt: `https://deine-domain.com/ratatosk.2.0/#/`
   - Keine weißen Bildschirme

## 🚨 Fehlerbehebung: 500 Internal Server Error

Wenn du einen **500 Internal Server Error** bekommst:

### Lösung 1: `.htaccess` vereinfachen

Falls die `.htaccess` Probleme verursacht, verwende diese minimale Version:

```apache
# Minimale .htaccess (falls die erweiterte Version Probleme macht)
DirectoryIndex index.php index.html
```

### Lösung 2: `.htaccess` temporär umbenennen

```bash
# Auf dem Server
cd ratatosk.2.0
mv .htaccess .htaccess.backup
```

Dann testen, ob die App ohne `.htaccess` läuft. Falls ja, liegt das Problem in der `.htaccess`.

### Lösung 3: Server-Logs prüfen

```bash
# Apache Error Log prüfen (Pfad variiert je nach Server)
tail -f /var/log/apache2/error.log
# oder
tail -f /var/log/httpd/error_log
```

### Lösung 4: `mod_rewrite` prüfen

Falls `mod_rewrite` nicht aktiviert ist, entferne die Rewrite-Regeln aus `.htaccess`:

```apache
# Nur diese Zeilen behalten:
Options -Indexes
DirectoryIndex index.php index.html
```

## 📝 Checkliste vor dem Upload

- [ ] `npm run build` erfolgreich ausgeführt
- [ ] `dist` Ordner enthält alle Dateien
- [ ] `.htaccess` ist im `dist` Ordner vorhanden
- [ ] Ordner auf Server heißt genau `ratatosk.2.0` (mit Punkt!)
- [ ] Alle Dateien wurden hochgeladen (inkl. versteckter Dateien)
- [ ] `assets/` Ordner wurde vollständig hochgeladen

## 🔍 Häufige Fehler

### ❌ "404 Not Found" für Assets
- **Ursache:** Pfade in `index.html` sind falsch
- **Lösung:** Prüfe, ob die Pfade `/ratatosk.2.0/assets/...` sind

### ❌ "500 Internal Server Error"
- **Ursache:** `.htaccess` Syntax-Fehler oder fehlende Module
- **Lösung:** Siehe Fehlerbehebung oben

### ❌ "Weißer Bildschirm"
- **Ursache:** JavaScript-Fehler oder Assets werden nicht geladen
- **Lösung:** Browser-Konsole prüfen (F12)

### ❌ "Ordner wird nicht gefunden"
- **Ursache:** Falscher Ordnername oder falscher Pfad
- **Lösung:** Prüfe, ob der Ordner genau `ratatosk.2.0` heißt (mit Punkt!)

## 📞 Nächste Schritte bei Problemen

1. **Browser-Konsole öffnen** (F12) und alle Fehler notieren
2. **Network-Tab prüfen:** Welche Dateien geben 404?
3. **Server-Logs prüfen:** Was steht in den Error-Logs?
4. **Test-URL direkt aufrufen:**
   - `https://deine-domain.com/ratatosk.2.0/assets/index-BmQkBwd3.js`
   - Sollte die JavaScript-Datei laden (nicht 404)

