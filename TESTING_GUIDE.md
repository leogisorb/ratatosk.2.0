# Testing Guide: 5-Sekunden-Blinzeln für Rückkehr zum Hauptmenü

## 🧪 Lokales Testen

### 1. Änderungen hinzufügen und committen

```bash
# Neue Datei hinzufügen
git add src/shared/composables/useGlobalBlinkHandler.ts

# Geänderte Datei hinzufügen
git add src/App.vue

# Commit erstellen
git commit -m "feat: Add global 5-second blink handler for home navigation

- Erstellt useGlobalBlinkHandler Composable
- Überwacht kontinuierlich Augen-Status (alle 100ms)
- Navigiert zurück zu /app bei 5 Sekunden geschlossenen Augen
- Funktioniert global in allen Views
- Normale Blinzeln (< 5 Sek) funktionieren weiterhin normal"
```

### 2. Lokal testen

```bash
# Development Server starten
npm run dev

# Oder mit Build
npm run build
npm run preview
```

### 3. Test-Szenarien

#### ✅ Test 1: Normales Blinzeln (< 5 Sek)
1. Navigiere zu einem Untermenü (z.B. `/schmerz` oder `/ich-dialog`)
2. Blinzle normal (< 5 Sekunden)
3. **Erwartung**: Normale Blinzel-Funktion funktioniert weiterhin

#### ✅ Test 2: Langes Blinzeln (≥ 5 Sek)
1. Navigiere zu einem Untermenü (z.B. `/schmerz` oder `/ich-dialog`)
2. Halte die Augen **5 Sekunden lang** geschlossen
3. **Erwartung**: Automatische Navigation zurück zu `/app` (Hauptmenü)

#### ✅ Test 3: In verschiedenen Views
1. Teste in verschiedenen Views:
   - `/schmerz` (PainDialogView)
   - `/ich-dialog` (IchDialogView)
   - `/umgebung-dialog` (UmgebungDialogView)
   - `/einstellungen` (SettingsDialogView)
2. **Erwartung**: Funktioniert in allen Views

#### ✅ Test 4: Console Logs prüfen
Öffne die Browser-Console und prüfe die Logs:
- `GlobalBlinkHandler: Starte globale Blinzel-Überwachung`
- `GlobalBlinkHandler: Augen geschlossen - Timer gestartet`
- `GlobalBlinkHandler: 5 Sekunden Blinzeln erkannt - Navigiere zurück zum Hauptmenü`
- `GlobalBlinkHandler: Navigiere von /schmerz zurück zu /app`

## 🔍 Debugging

### Console Logs aktivieren
Die Implementierung loggt automatisch alle wichtigen Events in die Console.

### Face Recognition Status prüfen
```javascript
// In Browser Console
// Prüfe ob Face Recognition aktiv ist
// (wird automatisch in App.vue gestartet)
```

### Handler Status prüfen
Der Handler startet automatisch beim Mount von App.vue.

## 📦 Git Workflow

### Branch erstellen (optional)
```bash
# Neuen Branch erstellen
git checkout -b feature/global-blink-handler

# Änderungen committen
git add src/shared/composables/useGlobalBlinkHandler.ts src/App.vue
git commit -m "feat: Add global 5-second blink handler"

# Branch pushen
git push origin feature/global-blink-handler
```

### Auf test Branch committen
```bash
# Du bist bereits auf test Branch
git add src/shared/composables/useGlobalBlinkHandler.ts src/App.vue
git commit -m "feat: Add global 5-second blink handler for home navigation"
git push origin test
```

## 🐛 Bekannte Probleme / Troubleshooting

### Problem: Handler funktioniert nicht
**Lösung**: Prüfe ob Face Recognition aktiv ist:
- Console: `GlobalBlinkHandler: Starte globale Blinzel-Überwachung`
- Face Recognition sollte automatisch in App.vue gestartet werden

### Problem: Navigation funktioniert nicht
**Lösung**: Prüfe Router-Status:
- Console: `GlobalBlinkHandler: Navigiere von /schmerz zurück zu /app`
- Prüfe ob Router korrekt initialisiert ist

### Problem: Normale Blinzeln funktionieren nicht mehr
**Lösung**: Der Handler sollte normale Blinzeln nicht blockieren:
- Normale Blinzeln (< 5 Sek) werden weiterhin normal verarbeitet
- Nur bei ≥ 5 Sekunden wird navigiert

## ✅ Checkliste vor Commit

- [ ] Code kompiliert ohne Fehler (`npm run build`)
- [ ] Linter-Fehler behoben (`npm run lint`)
- [ ] Lokal getestet (normales Blinzeln funktioniert)
- [ ] Lokal getestet (5-Sekunden-Blinzeln navigiert zurück)
- [ ] In verschiedenen Views getestet
- [ ] Console Logs geprüft
- [ ] Git Status geprüft (`git status`)


