# Neue saubere Verzeichnisstruktur

## ✅ Was wurde geändert

### Vorher (chaotisch):
```
dist/
├── index.html
├── assets/
│   └── [JS/CSS Dateien]
├── kopf1.svg          ← Alle SVG-Dateien im Root
├── bein1.svg
├── arm1.svg
├── [100+ weitere SVG-Dateien]
└── ...
```

### Nachher (sauber):
```
dist/
├── index.html
├── assets/
│   └── [JS/CSS Dateien]
├── images/            ← Alle Bilder in einem Ordner
│   ├── kopf1.svg
│   ├── bein1.svg
│   ├── arm1.svg
│   └── [alle anderen SVG/PNG/ICO Dateien]
└── ...
```

## 📁 Lokale Struktur

### `public/` Ordner (Quelle):
```
public/
├── favicon.ico        ← Bleibt im Root (wird zu dist/favicon.ico)
├── favicon.svg        ← Bleibt im Root
├── images/            ← Alle Bilder hier
│   ├── kopf1.svg
│   ├── bein1.svg
│   ├── bell.svg
│   └── [alle anderen]
└── ...
```

### `dist/` Ordner (Build-Output):
```
dist/
├── index.html
├── favicon.ico
├── favicon.svg
├── images/            ← Wird von Vite automatisch kopiert
│   ├── kopf1.svg
│   ├── bein1.svg
│   └── [alle anderen]
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── ...
```

## 🔧 Technische Details

### Vite-Konfiguration
- Dateien aus `public/` werden automatisch nach `dist/` kopiert
- Die Struktur wird erhalten: `public/images/` → `dist/images/`
- Die `assetFileNames` Funktion wurde angepasst, um die Struktur zu erhalten

### Pfade im Code
Alle Pfade wurden von:
- `/ratatosk.2.0/kopf1.svg` → `/ratatosk.2.0/images/kopf1.svg`
- `/bell.svg` → `/ratatosk.2.0/images/bell.svg`

## ✅ Vorteile

1. **Saubere Struktur**: Alle Bilder in einem Ordner
2. **Keine Verwechslung**: Keine Dateien mehr im Root
3. **Einfacheres Deployment**: Klare Struktur auf dem Server
4. **Wartbarkeit**: Einfacher zu finden und zu organisieren

## 🚀 Deployment

Nach dem Build (`npm run build`) ist die Struktur im `dist` Ordner:
```
ratatosk.2.0/
├── index.html
├── favicon.ico
├── favicon.svg
├── images/          ← Alle Bilder hier
│   └── [alle SVG/PNG/ICO Dateien]
├── assets/         ← JavaScript und CSS
│   └── [JS/CSS Dateien]
└── .htaccess
```

Diese Struktur kann direkt auf den Server hochgeladen werden!



