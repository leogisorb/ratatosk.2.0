# Deployment-Checkliste für Ratatosk 2.0

## Problem: App läuft nicht nach Upload in `ratatosk.2.0` Ordner

### ✅ Schritt 1: Verzeichnisstruktur prüfen

Stelle sicher, dass die Struktur auf dem Server so aussieht:
```
/ratatosk.2.0/
  ├── index.html
  ├── index.php
  ├── .htaccess
  ├── favicon.ico
  ├── favicon.svg
  ├── assets/
  │   ├── index-BmQkBwd3.js
  │   ├── index-Cs_MQ6g5.css
  │   └── ...
  └── [alle anderen Dateien aus dist/]
```

### ✅ Schritt 2: Browser-Konsole prüfen

1. Öffne die App im Browser: `https://deine-domain.com/ratatosk.2.0/`
2. Öffne die Entwicklertools (F12)
3. Gehe zum Tab "Console" und prüfe auf Fehler
4. Gehe zum Tab "Network" und prüfe, welche Dateien nicht geladen werden (404-Fehler)

**Häufige Fehler:**
- `404 Not Found` für `/ratatosk.2.0/assets/...` → Pfad-Problem
- `404 Not Found` für `/assets/...` → Base-Pfad fehlt
- `CORS Error` → Server-Konfiguration

### ✅ Schritt 3: URL-Struktur prüfen

Die App sollte erreichbar sein unter:
- `https://deine-domain.com/ratatosk.2.0/` (mit abschließendem Slash)
- `https://deine-domain.com/ratatosk.2.0/index.html`

Nach dem Laden sollte die URL so aussehen:
- `https://deine-domain.com/ratatosk.2.0/#/` (Hash-Routing)

### ✅ Schritt 4: Server-Konfiguration prüfen

**Apache (.htaccess):**
- Stelle sicher, dass `mod_rewrite` aktiviert ist
- Die `.htaccess` Datei muss im `ratatosk.2.0` Ordner liegen
- Prüfe, ob `.htaccess` Dateien erlaubt sind (AllowOverride All)

**Nginx:**
- Benötigt eine spezielle Konfiguration für das Subverzeichnis
- Beispiel-Konfiguration:
```nginx
location /ratatosk.2.0/ {
    try_files $uri $uri/ /ratatosk.2.0/index.html;
}
```

### ✅ Schritt 5: Pfad-Probleme beheben

**Problem:** Assets werden nicht gefunden (404-Fehler)

**Lösung 1:** Prüfe, ob die absoluten Pfade korrekt sind
- In `index.html` sollten die Pfade so aussehen: `/ratatosk.2.0/assets/...`
- Diese Pfade gehen vom Server-Root aus

**Lösung 2:** Falls die Pfade nicht funktionieren, könnte es sein, dass:
- Der Server die App nicht unter `/ratatosk.2.0/` bereitstellt
- Die Domain-Struktur anders ist (z.B. Subdomain)

### ✅ Schritt 6: Manuelle Tests

1. **Teste direktes Laden einer Asset-Datei:**
   ```
   https://deine-domain.com/ratatosk.2.0/assets/index-BmQkBwd3.js
   ```
   → Sollte die JavaScript-Datei laden (nicht 404)

2. **Teste favicon:**
   ```
   https://deine-domain.com/ratatosk.2.0/favicon.ico
   ```
   → Sollte das Favicon anzeigen

3. **Prüfe Browser-Cache:**
   - Hard Refresh: `Ctrl+Shift+R` (Windows/Linux) oder `Cmd+Shift+R` (Mac)
   - Oder: Entwicklertools → Network → "Disable cache" aktivieren

### ✅ Schritt 7: Alternative Lösung (falls nichts hilft)

Falls die absoluten Pfade nicht funktionieren, kann die `base` in `vite.config.ts` geändert werden:

**Option A:** Relativer Pfad (funktioniert immer)
```typescript
base: './',
```
Dann müssen die Pfade in `index.html` relativ sein.

**Option B:** Anpassung an tatsächliche Server-Struktur
```typescript
base: '/tatsaechlicher-pfad/',
```

## Häufige Probleme und Lösungen

### Problem: "Weißer Bildschirm" / "App lädt nicht"
- **Ursache:** JavaScript-Fehler oder Assets werden nicht geladen
- **Lösung:** Browser-Konsole prüfen, Network-Tab prüfen

### Problem: "404 Not Found" für Assets
- **Ursache:** Falsche Pfade oder Server-Konfiguration
- **Lösung:** `.htaccess` prüfen, Server-Logs prüfen

### Problem: "CORS Error"
- **Ursache:** Server blockiert Cross-Origin-Requests
- **Lösung:** Server-Konfiguration anpassen

### Problem: "Router funktioniert nicht"
- **Ursache:** Hash-Routing wird nicht unterstützt
- **Lösung:** Sollte mit `createWebHashHistory` funktionieren, prüfe Router-Konfiguration

## Debug-Informationen sammeln

Falls nichts hilft, sammle folgende Informationen:

1. **Browser-Konsole:** Alle Fehler kopieren
2. **Network-Tab:** Screenshot oder Liste aller fehlgeschlagenen Requests
3. **Server-Logs:** Apache/Nginx Error-Logs
4. **URL-Struktur:** Vollständige URL, unter der die App erreichbar sein soll
5. **Server-Typ:** Apache, Nginx, oder anderer Webserver?

