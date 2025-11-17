# 500 Internal Server Error - Fehlerbehebung

## ✅ Lösung 1: Minimale .htaccess verwenden

Ich habe eine **minimale `.htaccess`** erstellt, die garantiert funktioniert:

```apache
# Minimale .htaccess - garantiert funktionsfähig
# Setze index.html als primäre Datei
DirectoryIndex index.html
```

**Diese Datei ist jetzt im `dist` Ordner vorhanden.**

## ✅ Lösung 2: .htaccess komplett entfernen (Test)

Falls der Fehler weiterhin auftritt:

1. **Lösche die `.htaccess` Datei** auf dem Server komplett
2. **Teste die App** - sie sollte auch ohne `.htaccess` funktionieren
3. Falls sie **ohne `.htaccess` funktioniert**, dann war die `.htaccess` das Problem

## ✅ Lösung 3: Server-Logs prüfen

Der 500 Error kommt vom Server. Die genaue Ursache steht in den Server-Logs:

### Apache Logs (häufige Pfade):
```bash
/var/log/apache2/error.log
/var/log/httpd/error_log
/home/benutzer/logs/error_log
```

### cPanel:
1. **cPanel** → **Errors** (oder **Error Log**)
2. Suche nach Einträgen zu `/ratatosk.2.0/`

### Was in den Logs steht:
- Syntax-Fehler in `.htaccess`
- Fehlende Module (z.B. `mod_rewrite`)
- Berechtigungsprobleme
- PHP-Fehler (falls `index.php` verwendet wird)

## ✅ Lösung 4: Schritt-für-Schritt Test

### Test 1: Ohne .htaccess
1. Lösche `.htaccess` auf dem Server
2. Teste: `https://deine-domain.com/ratatosk.2.0/`
3. Funktioniert es? → Problem war `.htaccess`

### Test 2: Direkter Zugriff auf index.html
1. Teste: `https://deine-domain.com/ratatosk.2.0/index.html`
2. Funktioniert es? → Problem ist DirectoryIndex

### Test 3: Direkter Zugriff auf Assets
1. Teste: `https://deine-domain.com/ratatosk.2.0/assets/index-B4pbxt0W.js`
2. Funktioniert es? → Assets sind erreichbar

## ✅ Lösung 5: Alternative .htaccess (falls nötig)

Falls die minimale `.htaccess` nicht funktioniert, versuche diese noch einfachere Version:

```apache
# Noch einfacher - nur DirectoryIndex
DirectoryIndex index.html index.php
```

Oder **komplett leer lassen** (nur Kommentar):

```apache
# .htaccess
```

## ✅ Lösung 6: Server-Konfiguration prüfen

### Apache: mod_rewrite prüfen
Falls deine `.htaccess` Rewrite-Regeln enthält, muss `mod_rewrite` aktiviert sein.

**Test:** Entferne alle Rewrite-Regeln aus `.htaccess` und teste erneut.

### PHP prüfen
Falls `index.php` verwendet wird, muss PHP aktiviert sein.

**Test:** Erstelle eine Test-Datei `test.php`:
```php
<?php phpinfo(); ?>
```
Rufe auf: `https://deine-domain.com/ratatosk.2.0/test.php`

## 🔍 Häufige Ursachen für 500 Error

1. **Syntax-Fehler in `.htaccess`**
   - Lösung: Minimale `.htaccess` verwenden oder entfernen

2. **Fehlende Module**
   - Lösung: Entferne entsprechende Direktiven aus `.htaccess`

3. **Berechtigungsprobleme**
   - Lösung: `chmod 644 .htaccess` auf dem Server

4. **PHP-Fehler in `index.php`**
   - Lösung: Prüfe `index.php` oder entferne sie

5. **Server-Konfiguration**
   - Lösung: Kontaktiere Server-Administrator

## 📋 Checkliste

- [ ] Minimale `.htaccess` hochgeladen (nur `DirectoryIndex index.html`)
- [ ] `index.html` existiert im `ratatosk.2.0` Ordner
- [ ] `index.php` existiert (als Fallback)
- [ ] Alle Dateien haben korrekte Berechtigungen (644 für Dateien, 755 für Ordner)
- [ ] Server-Logs geprüft
- [ ] Test ohne `.htaccess` durchgeführt

## 🚀 Schnell-Fix

**Wenn nichts hilft:**

1. **Lösche `.htaccess` komplett** auf dem Server
2. **Benenne `index.html` um** zu `index.php` (falls Server PHP bevorzugt)
3. **Oder:** Kontaktiere deinen Server-Administrator

Die App sollte **auch ohne `.htaccess` funktionieren**, da sie Hash-Routing verwendet (`#/` in der URL).

