# 📚 Ratatosk - Grundlagen & Technischer Hintergrund

## 2. Grundlagen

---

## 2.1 Barrierefreie Kommunikation & Assistive Technologien

### Was ist Barrierefreie Kommunikation?

Barrierefreie Kommunikation umfasst alle Technologien und Methoden, die Menschen mit eingeschränkten körperlichen oder kognitiven Fähigkeiten ermöglichen, zu kommunizieren und mit digitalen Systemen zu interagieren.

**Zielgruppen:**
- Menschen mit eingeschränkter Arm-/Handbeweglichkeit
- Menschen mit Sprachbeeinträchtigungen
- Menschen mit komplexen Behinderungen (z.B. Locked-in-Syndrom)
- Menschen in Pflegeeinrichtungen
- Menschen mit temporären Einschränkungen (z.B. nach Operationen)

### Assistive Technologien (AT)

Assistive Technologien sind Werkzeuge, Geräte oder Software, die Menschen mit Behinderungen helfen, ihre Fähigkeiten zu erweitern oder zu kompensieren.

**Kategorien:**
1. **Eingabehilfen** (Input Devices)
   - Augensteuerung (Eye-Tracking)
   - Sprachsteuerung (Voice Control)
   - Kopfsteuerung (Head Tracking)
   - Blink-Erkennung (Blink Detection)
   - Brain-Computer Interfaces (BCI)

2. **Ausgabehilfen** (Output Devices)
   - Text-to-Speech (TTS)
   - Screen Reader
   - Vergrößerungssoftware
   - Braille-Displays

3. **Kommunikationshilfen** (AAC - Augmentative and Alternative Communication)
   - Kommunikationstafeln
   - Sprachgeneratoren
   - Symbol-basierte Systeme

### Warum ist Ratatosk wichtig?

Ratatosk kombiniert mehrere assistive Technologien:
- **Blinzeln-Erkennung** als primäre Eingabemethode
- **Touch-Unterstützung** für mobile Geräte
- **Automatischer Modus** für einfache Navigation
- **Text-to-Speech** für barrierefreie Ausgabe
- **Keine spezielle Hardware** erforderlich - funktioniert mit Standard-Webcams

---

## 2.2 Ähnliche Systeme / Projekte (Benchmarking)

### Vergleichbare Systeme

#### 1. **Tobii Dynavox** (Eye-Tracking)
- **Technologie:** Spezialisierte Eye-Tracking-Hardware
- **Vorteile:** Sehr präzise, professionell
- **Nachteile:** Teuer, benötigt spezielle Hardware, komplexe Einrichtung
- **Unterschied zu Ratatosk:** Ratatosk verwendet Standard-Webcams, keine spezielle Hardware

#### 2. **Grid 3** (Scanning-Bedienung)
- **Technologie:** Raster-Scanning mit Tastatur/Maus/Augensteuerung
- **Vorteile:** Sehr umfangreich, professionell
- **Nachteile:** Komplex, teuer, Lernkurve
- **Unterschied zu Ratatosk:** Ratatosk ist einfacher, webbasiert, kostenlos

#### 3. **Predictable** (Text-basiert)
- **Technologie:** Text-Eingabe mit Vorhersage
- **Vorteile:** Schnelle Text-Eingabe
- **Nachteile:** Fokus auf Text, weniger visuell
- **Unterschied zu Ratatosk:** Ratatosk bietet visuelle Icons und Struktur

#### 4. **EyeAble** (Eye-Tracking Software)
- **Technologie:** Eye-Tracking mit Standard-Kameras
- **Vorteile:** Web-basiert, keine spezielle Hardware
- **Nachteile:** Fokus auf Augensteuerung, weniger andere Eingabemethoden
- **Unterschied zu Ratatosk:** Ratatosk bietet mehrere Eingabemethoden (Blinzeln, Klick, Touch)

#### 5. **Talkitt** (Sprachsteuerung)
- **Technologie:** Spracherkennung für unverständliche Sprache
- **Vorteile:** Natürliche Eingabe
- **Nachteile:** Benötigt Sprachfähigkeit
- **Unterschied zu Ratatosk:** Ratatosk funktioniert auch ohne Sprachfähigkeit

### Ratatosk's Alleinstellungsmerkmale

| Feature | Ratatosk | Andere Systeme |
|---------|----------|----------------|
| **Hardware** | Standard-Webcam | Oft spezielle Hardware |
| **Kosten** | Kostenlos/Open Source | Meist kostenpflichtig |
| **Eingabemethoden** | Blinzeln, Klick, Touch | Meist nur eine Methode |
| **Web-basiert** | ✅ Ja | ❌ Oft Desktop-App |
| **Automatischer Modus** | ✅ Ja | ⚠️ Selten |
| **Einfache Bedienung** | ✅ Ja | ⚠️ Oft komplex |
| **Schneller Start** | ✅ Sofort | ⚠️ Oft Einrichtung nötig |

### Warum Ratatosk anders ist

1. **Keine spezielle Hardware:** Funktioniert mit jeder Standard-Webcam
2. **Mehrere Eingabemethoden:** Blinzeln, Mausklick, Touch - automatisch erkannt
3. **Automatischer Modus:** Navigiert automatisch durch Optionen, Nutzer wählt nur aus
4. **Web-basiert:** Keine Installation nötig, funktioniert überall
5. **Kostenlos:** Open Source, keine Lizenzgebühren
6. **Schneller Start:** Sofort nutzbar, keine komplexe Einrichtung

---

## 2.3 Eingabemethoden im Vergleich

### Blinzeln (Blink Detection)

**Technologie:**
- Verwendet MediaPipe Face Mesh für Gesichtserkennung
- Erkennt geschlossene Augen durch Gesichtslandmarken
- Misst Blinzeldauer (Standard: 2 Sekunden)

**Vorteile:**
- ✅ Sehr barrierefrei - funktioniert auch bei starken körperlichen Einschränkungen
- ✅ Keine Handbewegung nötig
- ✅ Präzise Erkennung bei guten Lichtverhältnissen
- ✅ Funktioniert mit Standard-Webcams

**Nachteile:**
- ⚠️ Benötigt gutes Licht
- ⚠️ Benötigt freie Sicht auf Gesicht
- ⚠️ Kann bei Müdigkeit schwieriger sein

**Einsatzgebiete:**
- Locked-in-Syndrom
- Schwere Lähmungen
- Menschen mit eingeschränkter Handbeweglichkeit

**Technische Details:**
- Erkennungsrate: ~95% bei guten Bedingungen
- Latenz: <100ms
- Benötigt: Webcam, MediaPipe Face Mesh

---

### Touch (Touchscreen)

**Technologie:**
- Native Browser-Touch-Events
- Funktioniert auf Tablets, Smartphones, Touch-Monitoren
- Direkte Berührung der gewünschten Option

**Vorteile:**
- ✅ Sehr intuitiv - direktes Antippen
- ✅ Schnell - keine Wartezeit
- ✅ Funktioniert auf mobilen Geräten
- ✅ Keine Gesichtserkennung nötig

**Nachteile:**
- ⚠️ Benötigt Handbeweglichkeit
- ⚠️ Benötigt Touch-fähiges Gerät
- ⚠️ Kann bei Feinmotorik-Problemen schwierig sein

**Einsatzgebiete:**
- Menschen mit leichten Einschränkungen
- Mobile Nutzung
- Schnelle Interaktion

**Technische Details:**
- Erkennungsrate: ~99% (nativ)
- Latenz: <50ms
- Benötigt: Touch-fähiges Gerät

---

### Mausklick (Click)

**Technologie:**
- Standard Browser-Click-Events
- Funktioniert mit Maus, Trackpad, Touchpad
- Kombiniert mit automatischem Modus (highlighting)

**Vorteile:**
- ✅ Präzise - gezielter Klick
- ✅ Funktioniert auf Desktop-Geräten
- ✅ Kann mit verschiedenen Eingabegeräten verwendet werden
- ✅ Kombiniert mit Auto-Mode für einfache Navigation

**Nachteile:**
- ⚠️ Benötigt Handbeweglichkeit
- ⚠️ Benötigt Maus/Trackpad
- ⚠️ Kann bei Feinmotorik-Problemen schwierig sein

**Einsatzgebiete:**
- Desktop-Nutzung
- Menschen mit leichten Einschränkungen
- Kombination mit Auto-Mode für einfache Navigation

**Technische Details:**
- Erkennungsrate: ~99% (nativ)
- Latenz: <50ms
- Benötigt: Maus/Trackpad

---

### Vergleichstabelle

| Kriterium | Blinzeln | Touch | Mausklick |
|-----------|----------|-------|-----------|
| **Barrierefreiheit** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Geschwindigkeit** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Intuitivität** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Hardware-Anforderungen** | ⭐⭐⭐⭐⭐ (Webcam) | ⭐⭐⭐ (Touch-Screen) | ⭐⭐⭐⭐ (Maus) |
| **Präzision** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Erschwinglichkeit** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Einsatzgebiet** | Schwere Einschränkungen | Mobile, Leichte Einschränkungen | Desktop, Leichte Einschränkungen |

### Warum Ratatosk alle drei Methoden unterstützt

1. **Flexibilität:** Jeder Nutzer kann die für ihn beste Methode wählen
2. **Fallback:** Wenn eine Methode nicht funktioniert, gibt es Alternativen
3. **Kombination:** Methoden können kombiniert werden (z.B. Auto-Mode + Klick)
4. **Universalität:** Funktioniert auf verschiedenen Geräten (Desktop, Tablet, Smartphone)

### Automatischer Modus (Auto-Mode)

**Was ist Auto-Mode?**
- Navigiert automatisch durch alle Optionen
- Hebt jede Option nacheinander hervor
- Nutzer wählt durch Blinzeln/Klick/Touch aus
- Reduziert kognitive Belastung

**Vorteile:**
- ✅ Keine Suche nötig - alle Optionen werden gezeigt
- ✅ Reduziert Entscheidungsaufwand
- ✅ Funktioniert mit allen Eingabemethoden
- ✅ Konsistentes Timing

**Technische Details:**
- Standard-Zyklus: 3-5 Sekunden pro Option
- Anpassbar in Einstellungen
- Kann übersprungen werden (direkte Auswahl)

---

## Zusammenfassung

### Warum Ratatosk?

**Ratatosk kombiniert:**
- ✅ Barrierefreie Eingabemethoden (Blinzeln, Touch, Klick)
- ✅ Automatischen Modus für einfache Navigation
- ✅ Standard-Hardware (keine speziellen Geräte nötig)
- ✅ Web-basiert (keine Installation)
- ✅ Kostenlos (Open Source)
- ✅ Schneller Start (sofort nutzbar)

**Ideal für:**
- Menschen mit eingeschränkter Beweglichkeit
- Pflegeeinrichtungen
- Schnelle Kommunikation
- Menschen ohne Zugang zu teurer Spezial-Hardware

**Technischer Vorteil:**
- Kombiniert mehrere assistive Technologien in einem System
- Bietet Flexibilität und Fallback-Optionen
- Einfach zu bedienen, aber trotzdem mächtig

---

## Weiterführende Informationen

### Standards & Richtlinien

- **WCAG 2.1** (Web Content Accessibility Guidelines)
- **EN 301 549** (European Accessibility Standard)
- **BITV 2.0** (Barrierefreie-Informationstechnik-Verordnung)

### Weitere Ressourcen

- **AAC (Augmentative and Alternative Communication)**: Erweiterte und alternative Kommunikation
- **AT (Assistive Technology)**: Assistive Technologien
- **Eye-Tracking**: Augensteuerung
- **BCI (Brain-Computer Interface)**: Gehirn-Computer-Schnittstellen

---

*Diese Dokumentation dient als technischer Hintergrund für Ratatosk und erklärt die Grundlagen barrierefreier Kommunikation.*

