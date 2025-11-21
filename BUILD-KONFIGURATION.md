# Build-Konfigurationen für Ratatosk 2.0

Dieses Dokument beschreibt die beiden Build-Konfigurationen für verschiedene Deployment-Ziele.

## 🎯 Zwei Build-Varianten

### 1. GitHub Pages Build (Standard für Git)
- **Base Path:** `/ratatosk.2.0/`
- **Verwendung:** Wenn auf GitHub Pages deployed wird
- **Router Base:** `/ratatosk.2.0/`

### 2. IONOS Server Build (für SFTP Deployment)
- **Base Path:** `/`
- **Verwendung:** Wenn auf IONOS Server via SFTP deployed wird
- **Router Base:** `/`

---

## 📝 Aktuelle Konfiguration

**Status:** Siehe unten, welche Dateien geändert werden müssen.

---

## 🔄 Umstellen zwischen den Konfigurationen

### Von IONOS → GitHub Pages (Standard)

#### 1. `vite.config.ts`
```typescript
base: '/ratatosk.2.0/',  // Statt '/'
```

#### 2. `src/router/index.ts`
```typescript
history: createWebHistory('/ratatosk.2.0/'),  // Statt '/'
```

#### 3. `index.html` (favicon)
```html
<link rel="icon" href="/ratatosk.2.0/favicon.ico">  // Bereits korrekt
```

#### 4. `public/.htaccess` (für GitHub Pages nicht relevant, aber für IONOS)
```apache
RewriteBase /ratatosk.2.0/  # Statt '/'
RewriteRule . /ratatosk.2.0/index.html [L]  # Statt '/index.html'
```

---

### Von GitHub Pages → IONOS Server

#### 1. `vite.config.ts`
```typescript
base: '/',  // Statt '/ratatosk.2.0/'
```

#### 2. `src/router/index.ts`
```typescript
history: createWebHistory('/'),  // Statt '/ratatosk.2.0/'
```

#### 3. `index.html` (favicon)
```html
<link rel="icon" href="/favicon.ico">  // Statt '/ratatosk.2.0/favicon.ico'
```

#### 4. `public/.htaccess`
```apache
RewriteBase /  # Statt '/ratatosk.2.0/'
RewriteRule . /index.html [L]  # Statt '/ratatosk.2.0/index.html'
```

---

## 🚀 Build-Befehle

Beide Konfigurationen verwenden den gleichen Build-Befehl:
```bash
npm run build
```

Der Build erstellt die Dateien im `dist/` Ordner.

---

## 📍 Aktueller Stand

**Letzte Änderung:** $(date)

**Aktuelle Konfiguration:** ✅ GitHub Pages (base: '/ratatosk.2.0/')

**Zuletzt geändert für:** GitHub Pages Deployment

**Status:** Konfiguriert für GitHub Pages - bereit für Git Commit

---

## ⚠️ Wichtige Hinweise

1. **Immer beide Konfigurationen testen** nach Änderungen
2. **Git Status prüfen** - GitHub Pages sollte der Standard sein
3. **IONOS Build nur lokal** - nicht committen, nur für SFTP Upload
4. **Nach IONOS Deployment** - immer wieder auf GitHub Pages zurücksetzen

---

## 🔍 Schnellprüfung

Um zu prüfen, welche Konfiguration aktiv ist:

```bash
# Prüfe vite.config.ts
grep "base:" vite.config.ts

# Prüfe router
grep "createWebHistory" src/router/index.ts

# Prüfe index.html
grep "favicon" index.html
```

---

## 📋 Checkliste vor Git Commit

- [ ] `vite.config.ts` hat `base: '/ratatosk.2.0/'`
- [ ] `src/router/index.ts` hat `createWebHistory('/ratatosk.2.0/')`
- [ ] `index.html` hat `/ratatosk.2.0/favicon.ico`
- [ ] Build erfolgreich: `npm run build`
- [ ] Type-Check erfolgreich: `npm run type-check`

