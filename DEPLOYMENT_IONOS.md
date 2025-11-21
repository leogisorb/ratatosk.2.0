# Deployment-Anleitung für IONOS Server

## Voraussetzungen

1. **FileZilla** installiert (bereits vorhanden)
2. **IONOS FTP-Zugangsdaten** (Host, Benutzername, Passwort)
3. **Aktueller Build** im `dist` Ordner

## Schritt 1: Build erstellen

```bash
npm run build
```

Dies erstellt einen optimierten Build im `dist` Ordner.

## Schritt 2: Ordnerstruktur auf IONOS Server

Die App ist für den Pfad `/ratatosk.2.0/` konfiguriert. Das bedeutet:

### Option A: App im Unterordner (empfohlen)
- **Ordner auf Server:** `ratatosk.2.0` (im Root-Verzeichnis, z.B. `htdocs/ratatosk.2.0/`)
- **URL:** `https://ihre-domain.de/ratatosk.2.0/`
- **Keine Änderungen nötig** - die aktuelle Konfiguration passt!

### Option B: App im Root-Verzeichnis
Wenn die App direkt unter `https://ihre-domain.de/` laufen soll:
- **Ordner auf Server:** Root-Verzeichnis (`htdocs/` oder `public_html/`)
- **Änderungen nötig:** Siehe "Konfiguration anpassen" unten

## Schritt 3: Dateien hochladen mit FileZilla

1. **FileZilla öffnen** und mit IONOS Server verbinden:
   - **Host:** `ftp.ihre-domain.de` (oder was IONOS Ihnen gegeben hat)
   - **Benutzername:** Ihr IONOS FTP-Benutzername
   - **Passwort:** Ihr IONOS FTP-Passwort
   - **Port:** 21 (Standard FTP) oder 22 (SFTP)

2. **Lokaler Ordner:** Navigieren Sie zu:
   ```
   /Users/leopoldbrosig/Documents/uni/Bachelor/Ratatosk/dist
   ```

3. **Server-Ordner:** Navigieren Sie zu:
   - **Option A:** `htdocs/ratatosk.2.0/` (oder `public_html/ratatosk.2.0/`)
   - **Option B:** `htdocs/` (oder `public_html/`)

4. **Alle Dateien hochladen:**
   - Wählen Sie **alle Dateien** im `dist` Ordner aus
   - Ziehen Sie sie in den Server-Ordner
   - Wichtig: **Alle Dateien**, inklusive:
     - `index.html`
     - `404.html`
     - `.htaccess` (wichtig für SPA-Routing!)
     - `assets/` Ordner (komplett)

## Schritt 4: Dateiberechtigungen prüfen

Nach dem Upload sollten die Dateien folgende Berechtigungen haben:
- **Ordner:** 755
- **Dateien:** 644
- **`.htaccess`:** 644

In FileZilla: Rechtsklick auf Datei → "Dateiberechtigungen" → entsprechend setzen.

## Schritt 5: Testen

Öffnen Sie im Browser:
- **Option A:** `https://ihre-domain.de/ratatosk.2.0/`
- **Option B:** `https://ihre-domain.de/`

## Konfiguration anpassen (nur für Option B - Root-Verzeichnis)

Wenn die App im Root-Verzeichnis laufen soll, müssen Sie folgende Dateien ändern:

### 1. `vite.config.ts`
```typescript
base: '/',  // Statt '/ratatosk.2.0/'
```

### 2. `src/router/index.ts`
```typescript
history: createWebHistory('/'),  // Statt '/ratatosk.2.0/'
```

### 3. `public/.htaccess`
```apache
RewriteBase /
RewriteRule . /index.html [L]  // Statt /ratatosk.2.0/index.html
```

Dann **neu builden** mit `npm run build` und erneut hochladen.

## Wichtige Dateien

- **`.htaccess`** - Wichtig für Vue Router SPA-Routing (Apache Rewrite Rules)
- **`404.html`** - Fallback für Server, die keine .htaccess unterstützen
- **`index.html`** - Haupt-HTML-Datei
- **`assets/`** - Alle JavaScript, CSS und Bilder

## Troubleshooting

### Problem: 404-Fehler beim Navigieren
- **Lösung:** Stellen Sie sicher, dass `.htaccess` hochgeladen wurde und die Berechtigungen korrekt sind (644)

### Problem: Assets werden nicht geladen
- **Lösung:** Prüfen Sie, ob der `base`-Pfad in `vite.config.ts` mit dem Server-Pfad übereinstimmt

### Problem: Weißer Bildschirm
- **Lösung:** Öffnen Sie die Browser-Konsole (F12) und prüfen Sie auf Fehler. Oft sind es falsche Pfade zu Assets.

### Problem: .htaccess wird ignoriert
- **Lösung:** Prüfen Sie, ob Apache `mod_rewrite` aktiviert ist (sollte bei IONOS standardmäßig aktiv sein)

## Aktualisierungen

Bei Änderungen am Code:
1. `npm run build` ausführen
2. Alle Dateien im `dist` Ordner erneut hochladen (überschreiben)

---

**Empfehlung:** Verwenden Sie Option A (Unterordner), da keine Konfigurationsänderungen nötig sind!

