# Korrekte Verzeichnisstruktur für Server-Upload

## 🚨 Problem: "Multiple Choices" / SVG-Dateien werden als Verzeichnisse interpretiert

Der Fehler tritt auf, wenn der Server SVG-Dateien als **Verzeichnisse** statt als **Dateien** interpretiert.

## ✅ Korrekte Struktur auf dem Server

```
/server-root/                    (z.B. public_html, htdocs, www)
└── ratatosk.2.0/                ← Ordner (genau dieser Name!)
    ├── .htaccess                 ← Datei (nicht Ordner!)
    ├── index.html                ← Datei
    ├── index.php                 ← Datei
    ├── favicon.ico               ← Datei
    ├── favicon.svg               ← Datei (nicht Ordner!)
    ├── Ratatosk.svg              ← Datei (nicht Ordner!)
    ├── kopf1.svg                 ← Datei (nicht Ordner!)
    ├── bein1.svg                 ← Datei (nicht Ordner!)
    ├── arm1.svg                  ← Datei (nicht Ordner!)
    ├── torso1.svg                ← Datei (nicht Ordner!)
    ├── [alle anderen SVG-Dateien] ← Alle als Dateien!
    ├── assets/                    ← Ordner
    │   ├── index-B4pbxt0W.js     ← Datei
    │   ├── index-sTESwraa.css    ← Datei
    │   └── [weitere Asset-Dateien]
    └── [alle anderen Dateien]
```

## ⚠️ WICHTIG: Dateien vs. Verzeichnisse

**FALSCH:**
```
ratatosk.2.0/
└── Ratatosk.svg/          ← ❌ Verzeichnis (falsch!)
    └── index.html
```

**RICHTIG:**
```
ratatosk.2.0/
├── Ratatosk.svg           ← ✅ Datei (richtig!)
└── index.html
```

## 📤 Schritt-für-Schritt Upload-Anleitung

### 1. Lokalen Build erstellen
```bash
npm run build
```

### 2. Dateien prüfen (lokal)
Stelle sicher, dass im `dist` Ordner:
- ✅ Alle SVG-Dateien als **Dateien** vorhanden sind (nicht als Ordner!)
- ✅ `index.html` vorhanden ist
- ✅ `.htaccess` vorhanden ist
- ✅ `assets/` Ordner mit allen Dateien vorhanden ist

### 3. Auf Server hochladen

**WICHTIG:** Verwende einen FTP-Client, der Dateien korrekt hochlädt:

#### Option A: FileZilla (empfohlen)
1. **Verbinde dich** mit dem Server
2. **Navigiere** zum Server-Root (z.B. `public_html`)
3. **Erstelle Ordner** `ratatosk.2.0` (falls nicht vorhanden)
4. **Öffne** den `ratatosk.2.0` Ordner
5. **Wähle ALLE Dateien** aus dem lokalen `dist` Ordner
6. **Ziehe sie** in den `ratatosk.2.0` Ordner auf dem Server
7. **WICHTIG:** Stelle sicher, dass Dateien als **Dateien** hochgeladen werden, nicht als Ordner!

#### Option B: cPanel File Manager
1. **Öffne cPanel** → **File Manager**
2. **Navigiere** zum Root (z.B. `public_html`)
3. **Erstelle Ordner** `ratatosk.2.0`
4. **Öffne** den `ratatosk.2.0` Ordner
5. **Upload** → Wähle alle Dateien aus `dist`
6. **WICHTIG:** Prüfe, ob Dateien als Dateien hochgeladen wurden!

### 4. Verzeichnisstruktur auf Server prüfen

**Nach dem Upload prüfen:**

1. **Öffne** den `ratatosk.2.0` Ordner auf dem Server
2. **Prüfe** jede SVG-Datei:
   - Ist `Ratatosk.svg` eine **Datei**? ✅
   - Oder ist `Ratatosk.svg` ein **Ordner**? ❌

3. **Falls SVG-Dateien als Ordner erkannt werden:**
   - Lösche die Ordner
   - Lade die Dateien erneut hoch
   - Stelle sicher, dass sie als **Dateien** hochgeladen werden

### 5. Testen

**Test 1: Direkter Zugriff auf SVG**
```
https://deine-domain.com/ratatosk.2.0/Ratatosk.svg
```
→ Sollte das SVG-Bild anzeigen (nicht 404 oder "Multiple Choices")

**Test 2: Direkter Zugriff auf index.html**
```
https://deine-domain.com/ratatosk.2.0/index.html
```
→ Sollte die App laden

**Test 3: App aufrufen**
```
https://deine-domain.com/ratatosk.2.0/
```
→ Sollte die App laden

## 🔧 Fehlerbehebung

### Problem: SVG-Dateien werden als Verzeichnisse erkannt

**Lösung 1: Dateien manuell prüfen**
1. Öffne den Server-Ordner
2. Prüfe, ob SVG-Dateien Ordner oder Dateien sind
3. Falls Ordner: Lösche sie und lade Dateien erneut hoch

**Lösung 2: FTP-Client-Einstellungen prüfen**
- Stelle sicher, dass der FTP-Client im **Binär-Modus** lädt
- Nicht im ASCII-Modus (kann Probleme verursachen)

**Lösung 3: Einzelne Dateien hochladen**
- Lade SVG-Dateien einzeln hoch, um sicherzustellen, dass sie als Dateien erkannt werden

### Problem: "Multiple Choices" Fehler

**Ursache:** Server findet mehrere Möglichkeiten für den Pfad

**Lösung:**
1. Prüfe, ob es **Duplikate** gibt (z.B. `Ratatosk.svg` als Datei UND als Ordner)
2. Lösche alle Duplikate
3. Stelle sicher, dass nur **eine** Version existiert (als Datei)

## ✅ Checkliste

- [ ] Alle SVG-Dateien sind als **Dateien** hochgeladen (nicht als Ordner)
- [ ] `index.html` ist vorhanden
- [ ] `.htaccess` ist vorhanden
- [ ] `assets/` Ordner ist vollständig hochgeladen
- [ ] Keine Duplikate (Datei + Ordner mit gleichem Namen)
- [ ] Test: SVG-Datei direkt aufrufbar
- [ ] Test: `index.html` direkt aufrufbar
- [ ] Test: App unter `/ratatosk.2.0/` läuft

## 🎯 Zusammenfassung

**Das Problem:** Der Server interpretiert SVG-Dateien als Verzeichnisse.

**Die Lösung:**
1. Stelle sicher, dass alle SVG-Dateien als **Dateien** hochgeladen werden
2. Prüfe die Verzeichnisstruktur auf dem Server
3. Lösche alle Duplikate (Datei + Ordner)
4. Verwende die aktualisierte `.htaccess` (mit `Options -MultiViews`)

