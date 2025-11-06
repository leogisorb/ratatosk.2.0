# 🧪 Ratatosk - UI/UX Test-Szenarien

**Ziel:** Umfassende Tests der Benutzeroberfläche und Benutzererfahrung  
**Anzahl:** 10 Test-Szenarien  
**Dauer pro Szenario:** 10-15 Minuten

---

## 📋 Test-Vorbereitung

### Test-Umgebung:
- **Browser:** Chrome, Firefox, Safari (jeweils testen)
- **Geräte:** Desktop, Tablet, Smartphone
- **Betriebssysteme:** Windows, macOS, iOS, Android
- **Kamera:** Webcam verfügbar
- **Lichtverhältnisse:** Gutes Licht, schlechtes Licht

### Test-Dokumentation:
- Screenshots/Videos von Problemen
- Notizen zu Fehlern
- Bewertung: ✅ Funktioniert | ⚠️ Probleme | ❌ Funktioniert nicht

---

## 🎯 Test-Szenario 1: Erster Start & Kamera-Aktivierung

**Zielgruppe:** Neuer Nutzer  
**Dauer:** 10 Minuten  
**Schwierigkeit:** Einfach

### Aufgaben:

1. **Startbildschirm öffnen**
   - [ ] Website öffnen
   - [ ] Startbildschirm wird angezeigt
   - [ ] Logo "RATATOSK" ist sichtbar
   - [ ] Status "Kamera nicht aktiv" wird angezeigt

2. **Kamera aktivieren**
   - [ ] Button "Kamera und Sprachausgabe aktivieren" klicken
   - [ ] Browser fragt nach Kamera-Berechtigung
   - [ ] Berechtigung erteilen
   - [ ] Status ändert sich zu "Kamera aktiv"
   - [ ] Status ändert sich zu "Gesicht suchen..."

3. **Gesichtserkennung**
   - [ ] Vor die Kamera stellen
   - [ ] Status ändert sich zu "Gesicht erkannt"
   - [ ] Blinzeln-Anweisung erscheint

4. **Blinzeln zum Starten**
   - [ ] 2 Sekunden lang die Augen geschlossen halten
   - [ ] Fortschrittsbalken füllt sich (0% → 100%)
   - [ ] TTS spricht: "Blinzeln erkannt. Halten Sie die Augen geschlossen."
   - [ ] TTS spricht: "Weiter so." (bei 50%)
   - [ ] TTS spricht: "Starte Programm." (bei 100%)
   - [ ] Programm startet automatisch → HomeView

### Erwartete Ergebnisse:
- ✅ Alle Status-Anzeigen funktionieren korrekt
- ✅ Kamera-Berechtigung wird korrekt angefordert
- ✅ Gesichtserkennung funktioniert
- ✅ Blinzeln-Erkennung funktioniert
- ✅ TTS-Feedback während des Blinzelns
- ✅ Automatischer Start nach 2 Sekunden

### Bekannte Probleme dokumentieren:
- [ ] Kamera startet nicht
- [ ] Gesicht wird nicht erkannt
- [ ] Blinzeln wird nicht erkannt
- [ ] TTS spricht nicht
- [ ] Programm startet nicht automatisch

---

## 🎯 Test-Szenario 2: Navigation durch Hauptmenü

**Zielgruppe:** Alle Nutzer  
**Dauer:** 15 Minuten  
**Schwierigkeit:** Mittel

### Aufgaben:

1. **HomeView erreichen**
   - [ ] Startbildschirm durchlaufen (Szenario 1)
   - [ ] HomeView wird angezeigt
   - [ ] Menü-Kacheln sind sichtbar (Schmerz, Ich, Umgebung, etc.)

2. **Auto-Mode testen**
   - [ ] Warten, bis Auto-Mode startet
   - [ ] Kacheln werden nacheinander hervorgehoben
   - [ ] TTS spricht jede Kachel vor
   - [ ] Timing ist konsistent (3-5 Sekunden pro Kachel)

3. **Navigation mit Blinzeln**
   - [ ] Warten, bis gewünschte Kachel aktiv ist
   - [ ] Blinzeln (2 Sekunden)
   - [ ] Kachel wird ausgewählt
   - [ ] Navigation zum entsprechenden Dialog

4. **Navigation mit Mausklick**
   - [ ] Zurück zur HomeView
   - [ ] Direkt auf eine Kachel klicken (ohne Auto-Mode)
   - [ ] Kachel wird sofort ausgewählt
   - [ ] Navigation funktioniert

5. **Navigation mit Touch** (auf Tablet/Smartphone)
   - [ ] Zurück zur HomeView
   - [ ] Auf eine Kachel tippen
   - [ ] Kachel wird ausgewählt
   - [ ] Navigation funktioniert

### Erwartete Ergebnisse:
- ✅ Auto-Mode funktioniert korrekt
- ✅ Alle drei Eingabemethoden funktionieren
- ✅ TTS spricht alle Kacheln vor
- ✅ Navigation funktioniert zuverlässig
- ✅ Visuelles Feedback ist klar erkennbar

### Bekannte Probleme dokumentieren:
- [ ] Auto-Mode startet nicht
- [ ] Kacheln werden nicht hervorgehoben
- [ ] TTS spricht nicht
- [ ] Blinzeln funktioniert nicht
- [ ] Navigation funktioniert nicht

---

## 🎯 Test-Szenario 3: Schmerzerfassung (Pain-Dialog)

**Zielgruppe:** Patienten mit Schmerzen  
**Dauer:** 15 Minuten  
**Schwierigkeit:** Mittel

### Aufgaben:

1. **Pain-Dialog öffnen**
   - [ ] Von HomeView zu "Schmerz" navigieren
   - [ ] Pain-Dialog wird angezeigt
   - [ ] Titel "Wo haben Sie Schmerzen?" wird angezeigt
   - [ ] TTS spricht den Titel

2. **Hauptregion auswählen**
   - [ ] Auto-Mode durchläuft Hauptregionen (Kopf, Torso, Arme, Beine)
   - [ ] TTS spricht jede Region vor
   - [ ] Blinzeln/Klick/Touch auf gewünschte Region
   - [ ] Sub-Region View wird angezeigt

3. **Sub-Region auswählen**
   - [ ] Auto-Mode durchläuft Sub-Regionen (z.B. Stirn, Nacken, etc.)
   - [ ] TTS spricht jede Sub-Region vor
   - [ ] Blinzeln/Klick/Touch auf gewünschte Sub-Region
   - [ ] Pain Scale View wird angezeigt

4. **Schmerzlevel auswählen**
   - [ ] Auto-Mode durchläuft Schmerzlevel (1-10)
   - [ ] TTS spricht jedes Level vor (z.B. "1, kein Schmerz", "5, mittel")
   - [ ] Blinzeln/Klick/Touch auf gewünschtes Level
   - [ ] Bestätigungs-View wird angezeigt

5. **Bestätigung prüfen**
   - [ ] Bestätigungstext wird angezeigt (z.B. "Sie haben leichten Schmerz am Kopf angegeben")
   - [ ] TTS spricht Bestätigungstext
   - [ ] Nach 5 Sekunden zurück zum Hauptmenü

6. **Zurück-Button testen**
   - [ ] Im Hauptregion-View auf "Zurück" blinzeln/klicken
   - [ ] Zurück zur HomeView
   - [ ] Auto-Mode und TTS stoppen korrekt

### Erwartete Ergebnisse:
- ✅ Alle Schritte funktionieren mit Blinzeln, Klick und Touch
- ✅ TTS spricht alle Texte vor
- ✅ Auto-Mode funktioniert in allen Views
- ✅ Bestätigungstext ist korrekt
- ✅ Zurück-Button funktioniert

### Bekannte Probleme dokumentieren:
- [ ] Navigation zwischen Views funktioniert nicht
- [ ] TTS spricht nicht alle Texte
- [ ] Auto-Mode stoppt nicht
- [ ] Bestätigungstext ist falsch
- [ ] Zurück-Button funktioniert nicht

---

## 🎯 Test-Szenario 4: Ich-Dialog (Bedürfnisse)

**Zielgruppe:** Patienten mit Bedürfnissen  
**Dauer:** 15 Minuten  
**Schwierigkeit:** Mittel

### Aufgaben:

1. **Ich-Dialog öffnen**
   - [ ] Von HomeView zu "Ich" navigieren
   - [ ] Ich-Dialog wird angezeigt
   - [ ] Titel "Was möchten Sie machen?" wird angezeigt
   - [ ] TTS spricht den Titel

2. **Hauptkategorie auswählen**
   - [ ] Auto-Mode durchläuft Kategorien (Bewegung, Ernährung, Gefühle, Hygiene, Kleidung)
   - [ ] TTS spricht jede Kategorie vor
   - [ ] Blinzeln/Klick/Touch auf gewünschte Kategorie
   - [ ] Sub-Region View wird angezeigt

3. **Sub-Region auswählen**
   - [ ] Auto-Mode durchläuft Sub-Regionen (z.B. bei Bewegung: Aufstehen, Liegen, etc.)
   - [ ] TTS spricht jede Sub-Region vor
   - [ ] Blinzeln/Klick/Touch auf gewünschte Sub-Region
   - [ ] Bestätigungs-View wird angezeigt

4. **Bestätigung prüfen**
   - [ ] Bestätigungstext wird angezeigt
   - [ ] TTS spricht Bestätigungstext
   - [ ] Nach 5 Sekunden zurück zum Hauptmenü

5. **Zurück-Button testen**
   - [ ] Im Hauptkategorie-View auf "Zurück" blinzeln/klicken
   - [ ] Zurück zur HomeView
   - [ ] Auto-Mode und TTS stoppen korrekt

### Erwartete Ergebnisse:
- ✅ Alle Kategorien sind verfügbar
- ✅ Navigation funktioniert korrekt
- ✅ TTS spricht alle Texte vor
- ✅ Bestätigungstext ist korrekt
- ✅ Zurück-Button funktioniert

### Bekannte Probleme dokumentieren:
- [ ] Kategorien fehlen
- [ ] Navigation funktioniert nicht
- [ ] TTS spricht nicht
- [ ] Bestätigungstext ist falsch

---

## 🎯 Test-Szenario 5: Umgebung-Dialog

**Zielgruppe:** Patienten, die Umgebung steuern möchten  
**Dauer:** 15 Minuten  
**Schwierigkeit:** Mittel

### Aufgaben:

1. **Umgebung-Dialog öffnen**
   - [ ] Von HomeView zu "Umgebung" navigieren
   - [ ] Umgebung-Dialog wird angezeigt
   - [ ] Titel "Was möchten Sie an ihrer Umgebung verändern?" wird angezeigt
   - [ ] TTS spricht den Titel

2. **Hauptregion auswählen**
   - [ ] Auto-Mode durchläuft Hauptregionen (Licht, Temperatur, etc.)
   - [ ] TTS spricht jede Region vor
   - [ ] Blinzeln/Klick/Touch auf gewünschte Region
   - [ ] Sub-Region View wird angezeigt

3. **Sub-Region auswählen**
   - [ ] Auto-Mode durchläuft Sub-Regionen
   - [ ] TTS spricht jede Sub-Region vor
   - [ ] Blinzeln/Klick/Touch auf gewünschte Sub-Region
   - [ ] Sub-Sub-Region View wird angezeigt

4. **Sub-Sub-Region (Verb) auswählen**
   - [ ] Auto-Mode durchläuft Verben (z.B. "heller machen", "dunkler machen")
   - [ ] TTS spricht jedes Verb vor
   - [ ] Blinzeln/Klick/Touch auf gewünschtes Verb
   - [ ] Bestätigungs-View wird angezeigt

5. **Bestätigung prüfen**
   - [ ] Bestätigungstext wird angezeigt
   - [ ] TTS spricht Bestätigungstext
   - [ ] Nach 3 Sekunden zurück zum Hauptmenü

### Erwartete Ergebnisse:
- ✅ Drei-Ebenen-Navigation funktioniert
- ✅ TTS spricht alle Texte vor
- ✅ Auto-Mode funktioniert in allen Views
- ✅ Bestätigungstext ist korrekt

### Bekannte Probleme dokumentieren:
- [ ] Navigation zwischen Ebenen funktioniert nicht
- [ ] TTS spricht nicht
- [ ] Auto-Mode stoppt nicht
- [ ] Bestätigungstext ist falsch

---

## 🎯 Test-Szenario 6: Kommunikation (Virtuelle Tastatur)

**Zielgruppe:** Patienten, die kommunizieren möchten  
**Dauer:** 20 Minuten  
**Schwierigkeit:** Hoch

### Aufgaben:

1. **UnterhaltenView öffnen**
   - [ ] Von HomeView zu "Unterhalten" navigieren
   - [ ] UnterhaltenView wird angezeigt
   - [ ] Status-Text wird angezeigt
   - [ ] TTS spricht Einführungstext

2. **Zeilenauswahl-Modus**
   - [ ] Auto-Mode durchläuft Zeilen
   - [ ] Aktive Zeile wird hervorgehoben (türkise Farbe)
   - [ ] TTS spricht: "Zeile 1", "Zeile 2", etc.
   - [ ] Blinzeln/Klick/Touch auf gewünschte Zeile
   - [ ] Zeile wird ausgewählt (grüne Farbe)

3. **Buchstabenauswahl-Modus**
   - [ ] Auto-Mode durchläuft Buchstaben in der ausgewählten Zeile
   - [ ] Aktive Taste wird hervorgehoben (türkise Farbe)
   - [ ] TTS spricht jeden Buchstaben vor
   - [ ] Blinzeln/Klick/Touch auf gewünschten Buchstaben
   - [ ] Buchstabe wird zum Text hinzugefügt

4. **Text aufbauen**
   - [ ] Mehrere Buchstaben auswählen
   - [ ] Text wird oben angezeigt
   - [ ] TTS spricht jeden Buchstaben vor
   - [ ] "Leerzeichen" Taste funktioniert
   - [ ] "Löschen" Taste funktioniert

5. **Satz abschicken**
   - [ ] Kompletten Satz eingeben (z.B. "Ich habe Durst")
   - [ ] "Absenden" Taste auswählen
   - [ ] TTS spricht kompletten Satz vor
   - [ ] Text wird zurückgesetzt

### Erwartete Ergebnisse:
- ✅ Zeilenauswahl funktioniert korrekt
- ✅ Buchstabenauswahl funktioniert korrekt
- ✅ Text wird korrekt aufgebaut
- ✅ TTS spricht alle Buchstaben vor
- ✅ Spezialtasten (Leerzeichen, Löschen) funktionieren

### Bekannte Probleme dokumentieren:
- [ ] Zeilenauswahl funktioniert nicht
- [ ] Buchstabenauswahl funktioniert nicht
- [ ] Text wird nicht korrekt angezeigt
- [ ] TTS spricht nicht
- [ ] Spezialtasten funktionieren nicht

---

## 🎯 Test-Szenario 7: Einstellungen & Dark Mode

**Zielgruppe:** Alle Nutzer  
**Dauer:** 15 Minuten  
**Schwierigkeit:** Mittel

### Aufgaben:

1. **Einstellungen öffnen**
   - [ ] Von HomeView zu "Einstellungen" navigieren
   - [ ] Einstellungen-Dialog wird angezeigt
   - [ ] Kategorien werden angezeigt (Leuchtdauer, Blinzeldauer, Farbmodus, etc.)

2. **Dark Mode aktivieren**
   - [ ] Im Header auf Dark Mode Button klicken
   - [ ] Dark Mode wird aktiviert
   - [ ] Alle Seiten wechseln zu Dark Mode
   - [ ] Kontraste sind gut lesbar
   - [ ] Aktive Elemente sind gut sichtbar (türkise Farbe)

3. **Einstellungen ändern**
   - [ ] "Leuchtdauer" Kategorie auswählen
   - [ ] Optionen werden angezeigt
   - [ ] TTS spricht aktuelle Einstellung vor
   - [ ] Neue Einstellung auswählen
   - [ ] Einstellung wird gespeichert
   - [ ] Bestätigung wird angezeigt

4. **Kamera-Einstellungen**
   - [ ] "Kamera" Kategorie auswählen
   - [ ] Kamerabild wird angezeigt
   - [ ] Helligkeits-Slider funktioniert
   - [ ] Zoom-Slider funktioniert
   - [ ] Änderungen werden sofort angezeigt

5. **Zurück zu Light Mode**
   - [ ] Im Header auf Dark Mode Button klicken
   - [ ] Light Mode wird aktiviert
   - [ ] Alle Seiten wechseln zu Light Mode

### Erwartete Ergebnisse:
- ✅ Dark Mode funktioniert auf allen Seiten
- ✅ Kontraste sind gut lesbar
- ✅ Aktive Elemente sind gut sichtbar
- ✅ Einstellungen werden gespeichert
- ✅ Kamera-Einstellungen funktionieren

### Bekannte Probleme dokumentieren:
- [ ] Dark Mode funktioniert nicht auf allen Seiten
- [ ] Kontraste sind schlecht lesbar
- [ ] Aktive Elemente sind nicht sichtbar
- [ ] Einstellungen werden nicht gespeichert
- [ ] Kamera-Einstellungen funktionieren nicht

---

## 🎯 Test-Szenario 8: TTS Stummschalten & Lautstärke

**Zielgruppe:** Alle Nutzer  
**Dauer:** 10 Minuten  
**Schwierigkeit:** Einfach

### Aufgaben:

1. **TTS aktivieren**
   - [ ] Startbildschirm durchlaufen
   - [ ] TTS ist aktiviert
   - [ ] TTS spricht Texte vor

2. **TTS stummschalten**
   - [ ] Im Header auf Lautstärke-Button klicken
   - [ ] TTS wird stumm geschaltet
   - [ ] Button zeigt stumm-Symbol
   - [ ] TTS spricht keine Texte mehr (auch in allen Dialogen)

3. **TTS in verschiedenen Dialogen testen**
   - [ ] Zu Pain-Dialog navigieren
   - [ ] TTS spricht nicht (stumm)
   - [ ] Zu Ich-Dialog navigieren
   - [ ] TTS spricht nicht (stumm)
   - [ ] Zu Umgebung-Dialog navigieren
   - [ ] TTS spricht nicht (stumm)
   - [ ] Zu UnterhaltenView navigieren
   - [ ] TTS spricht nicht (stumm)

4. **TTS wieder aktivieren**
   - [ ] Im Header auf Lautstärke-Button klicken
   - [ ] TTS wird wieder aktiviert
   - [ ] Button zeigt Lautstärke-Symbol
   - [ ] TTS spricht wieder Texte vor

5. **TTS während laufender Ausgabe testen**
   - [ ] TTS spricht einen Text vor
   - [ ] Während des Sprechens auf Stumm schalten
   - [ ] TTS stoppt sofort
   - [ ] Volume wird auf 0 gesetzt

### Erwartete Ergebnisse:
- ✅ TTS kann stumm geschaltet werden
- ✅ Stummschalten funktioniert auf allen Seiten
- ✅ TTS kann wieder aktiviert werden
- ✅ TTS stoppt während laufender Ausgabe
- ✅ Volume wird korrekt auf 0 gesetzt

### Bekannte Probleme dokumentieren:
- [ ] TTS kann nicht stumm geschaltet werden
- [ ] Stummschalten funktioniert nicht auf allen Seiten
- [ ] TTS spricht weiterhin (nicht stumm)
- [ ] TTS stoppt nicht während laufender Ausgabe

---

## 🎯 Test-Szenario 9: Responsive Design & Mobile

**Zielgruppe:** Mobile Nutzer  
**Dauer:** 20 Minuten  
**Schwierigkeit:** Mittel

### Aufgaben:

1. **Desktop-Ansicht testen**
   - [ ] Browser auf Desktop-Größe (1920x1080)
   - [ ] Alle Elemente sind gut sichtbar
   - [ ] Layout ist übersichtlich
   - [ ] Navigation funktioniert mit Maus

2. **Tablet-Ansicht testen**
   - [ ] Browser auf Tablet-Größe (768x1024)
   - [ ] Layout passt sich an
   - [ ] Kacheln sind gut klickbar
   - [ ] Navigation funktioniert mit Touch
   - [ ] Carousel funktioniert (wenn vorhanden)

3. **Smartphone-Ansicht testen**
   - [ ] Browser auf Smartphone-Größe (375x667)
   - [ ] Layout passt sich an
   - [ ] Kacheln sind gut tippbar
   - [ ] Text ist lesbar
   - [ ] Navigation funktioniert mit Touch
   - [ ] Carousel funktioniert

4. **Landscape-Modus testen**
   - [ ] Browser auf Landscape (1024x768)
   - [ ] Layout passt sich an
   - [ ] Alle Funktionen sind verfügbar
   - [ ] Navigation funktioniert

5. **Sehr kleine Bildschirme testen**
   - [ ] Browser auf sehr kleine Größe (320x568)
   - [ ] Layout passt sich an
   - [ ] Text ist noch lesbar
   - [ ] Kacheln sind noch klickbar
   - [ ] Navigation funktioniert

### Erwartete Ergebnisse:
- ✅ Layout passt sich an alle Bildschirmgrößen an
- ✅ Alle Funktionen sind auf allen Geräten verfügbar
- ✅ Touch-Navigation funktioniert auf mobilen Geräten
- ✅ Text ist auf allen Geräten lesbar
- ✅ Kacheln sind auf allen Geräten gut klickbar

### Bekannte Probleme dokumentieren:
- [ ] Layout passt sich nicht an
- [ ] Funktionen fehlen auf mobilen Geräten
- [ ] Touch-Navigation funktioniert nicht
- [ ] Text ist nicht lesbar
- [ ] Kacheln sind zu klein zum Klicken

---

## 🎯 Test-Szenario 10: Fehlerbehandlung & Edge Cases

**Zielgruppe:** Alle Nutzer  
**Dauer:** 20 Minuten  
**Schwierigkeit:** Hoch

### Aufgaben:

1. **Kamera-Fehler testen**
   - [ ] Kamera-Berechtigung verweigern
   - [ ] Fehlermeldung wird angezeigt
   - [ ] Button "Ohne Blinzeln starten" ist verfügbar
   - [ ] Programm kann ohne Kamera gestartet werden

2. **Gesichtserkennung-Fehler testen**
   - [ ] Kamera aktivieren, aber kein Gesicht zeigen
   - [ ] Status zeigt "Gesicht suchen..."
   - [ ] Button "Ohne Blinzeln starten" ist verfügbar
   - [ ] Programm kann ohne Gesichtserkennung gestartet werden

3. **Blinzeln-Fehler testen**
   - [ ] Blinzeln zu kurz (unter 2 Sekunden)
   - [ ] Fortschrittsbalken geht zurück auf 0%
   - [ ] Keine Fehlermeldung (normales Verhalten)
   - [ ] Erneutes Blinzeln funktioniert

4. **Navigation-Fehler testen**
   - [ ] Während Auto-Mode auf inaktive Kachel klicken
   - [ ] Nichts passiert (korrekt)
   - [ ] Während Auto-Mode auf aktive Kachel klicken
   - [ ] Navigation funktioniert

5. **TTS-Fehler testen**
   - [ ] TTS stumm schalten während laufender Ausgabe
   - [ ] TTS stoppt sofort
   - [ ] Volume wird auf 0 gesetzt
   - [ ] Keine Fehlermeldung

6. **Browser-Kompatibilität testen**
   - [ ] Chrome testen
   - [ ] Firefox testen
   - [ ] Safari testen
   - [ ] Edge testen (optional)
   - [ ] Alle Funktionen funktionieren in allen Browsern

7. **Performance testen**
   - [ ] Schnelle Navigation zwischen Dialogen
   - [ ] Keine Verzögerungen
   - [ ] Auto-Mode läuft flüssig
   - [ ] TTS startet schnell
   - [ ] Keine Memory-Leaks (bei längerer Nutzung)

### Erwartete Ergebnisse:
- ✅ Alle Fehler werden korrekt behandelt
- ✅ Fallback-Optionen sind verfügbar
- ✅ Keine Crashes oder Freezes
- ✅ Alle Browser werden unterstützt
- ✅ Performance ist gut

### Bekannte Probleme dokumentieren:
- [ ] Fehler werden nicht korrekt behandelt
- [ ] Fallback-Optionen fehlen
- [ ] Crashes oder Freezes
- [ ] Browser-Kompatibilitätsprobleme
- [ ] Performance-Probleme

---

## 📊 Test-Ergebnis-Zusammenfassung

### Nach jedem Test-Szenario ausfüllen:

**Test-Szenario:** [Nummer]  
**Datum:** [Datum]  
**Tester:** [Name]  
**Browser:** [Browser + Version]  
**Gerät:** [Desktop/Tablet/Smartphone]  
**Betriebssystem:** [OS + Version]

**Ergebnis:**
- ✅ Alle Aufgaben erfolgreich
- ⚠️ Einige Aufgaben mit Problemen
- ❌ Viele Aufgaben fehlgeschlagen

**Gefundene Probleme:**
1. [Problem 1]
2. [Problem 2]
3. [Problem 3]

**Screenshots/Videos:**
- [ ] Screenshots erstellt
- [ ] Videos aufgenommen

**Priorität:**
- 🔴 Hoch (kritisch, blockiert Nutzung)
- 🟡 Mittel (beeinträchtigt Nutzung)
- 🟢 Niedrig (kosmetisch, nicht kritisch)

---

## 🎯 Zusätzliche Test-Szenarien (Optional)

### Test-Szenario 11: Barrierefreiheit (WCAG 2.1)
- Kontraste prüfen
- Tastatur-Navigation prüfen
- Screen Reader Kompatibilität prüfen

### Test-Szenario 12: Performance & Ladezeiten
- Initiale Ladezeit messen
- Navigation-Geschwindigkeit messen
- Memory-Usage prüfen

### Test-Szenario 13: Mehrsprachigkeit (falls implementiert)
- Sprache wechseln
- Alle Texte sind übersetzt
- TTS verwendet korrekte Sprache

---

## 📝 Test-Checkliste (Quick Reference)

### Vor jedem Test:
- [ ] Browser-Cache leeren
- [ ] Kamera-Berechtigung zurücksetzen
- [ ] Alle Tabs schließen
- [ ] Browser neu starten (optional)

### Nach jedem Test:
- [ ] Ergebnisse dokumentieren
- [ ] Screenshots/Videos speichern
- [ ] Probleme in Issue-Tracker eintragen
- [ ] Test-Protokoll ausfüllen

---

*Diese Test-Szenarien decken die wichtigsten UI/UX-Aspekte von Ratatosk ab und helfen dabei, Probleme frühzeitig zu identifizieren.*

