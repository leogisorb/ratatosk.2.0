# 3 Stand der Technik

## 3.1 Beschreibung von Ratatosk.bayern

Ratatosk.bayern ist die ursprüngliche Version der Ratatosk Webapplikation, die als Bachelorarbeit entwickelt wurde. Die Anwendung wurde als Kommunikationshilfe für Menschen mit eingeschränkter Sprech- oder Bewegungsfähigkeit konzipiert und bietet eine alternative Eingabemethode über Augenblinzeln.

Die Zielgruppe der ursprünglichen Version umfasst Menschen mit motorischen Einschränkungen, die Schwierigkeiten bei der Bedienung herkömmlicher Eingabegeräte haben. Dies schließt Personen ein, die aufgrund von Behinderungen oder Erkrankungen nicht in der Lage sind, eine Maus oder Tastatur zu bedienen, aber noch die Kontrolle über ihre Augenbewegungen und das Blinzeln haben.

Die Hauptfunktionen von Ratatosk.bayern umfassen:

- **Schmerz-Assessment**: Benutzer können Schmerzen an verschiedenen Körperteilen beschreiben. Die Anwendung bietet eine hierarchische Struktur zur Auswahl von Körperteilen (Kopf, Torso, Arme, Beine) mit Unterkategorien und eine Schmerzskala von 0-10 zur Bewertung der Schmerzintensität.

- **Warnton (SOS)**: Benutzer können einen Warnton aktivieren, um Aufmerksamkeit zu erlangen. Der Ton wird als Audio-Datei abgespielt und kann wiederholt werden.

- **Nachrichten-Eingabe**: Eine virtuelle Tastatur mit drei verschiedenen Layouts (Alphabetisch, QWERTZ, Häufigkeit) ermöglicht die Eingabe von freiem Text. Die Tastatur unterstützt deutsche Umlaute und Sonderzeichen.

- **Schnellbausteine "Umgebung"**: Vordefinierte Phrasen für Gespräche, Gegenstände, Zimmer-Elemente und Bett-Bedienung ermöglichen schnelle Kommunikation.

- **Schnellbausteine "Ich"**: Vordefinierte Phrasen für Ernährung, Gefühle, Kleidung, Hygiene und Bewegung unterstützen die Kommunikation persönlicher Bedürfnisse.

- **Einstellungen**: Konfigurierbare Parameter umfassen die Blinzeldauer (wie lange die Augen geschlossen sein müssen, um eine Aktion auszulösen), die Leuchtdauer (Zeitdauer, in der Symbole aufleuchten), das Tastaturdesign und den Farbmodus (Hell/Dunkel).

Die Anwendung ist vollständig offline-fähig und kann nach einmaligem Laden ohne Internetverbindung genutzt werden. Dies wird durch die Verwendung lokaler JavaScript-Bibliotheken und eingebetteter Ressourcen erreicht.

## 3.2 Technische Architektur

Die ursprüngliche Version von Ratatosk.bayern wurde als monolithische Single-Page Application (SPA) implementiert. Die gesamte Anwendung besteht aus einer einzigen HTML-Datei (index.html), die alle Funktionalitäten direkt im Browser ausführt.

### 3.2.1 Frontend

Das Frontend wurde mit Vue.js 3 (Version 3.2.47) und der Options API implementiert. Die gesamte Anwendungslogik ist in einer einzigen Vue-App-Instanz organisiert, die direkt in der HTML-Datei definiert ist. Die Anwendung verwendet Vue.js über einen ES-Module-Bundler (Vite) für die Entwicklung, wird aber als standalone HTML-Datei mit eingebetteten Skripten bereitgestellt.

Die Benutzeroberfläche wird durch Vue.js Template-Direktiven gesteuert, die bedingte Renderung (v-if, v-for) und Event-Handler (@click) verwenden. Die Navigation zwischen verschiedenen Menüs erfolgt über eine zentrale Variable (showMenu), die den aktuellen Menüzustand repräsentiert.

Das Styling erfolgt über eine separate CSS-Datei (pageStyle.css), die CSS-Variablen für Farben und Abmessungen verwendet. Das Design unterstützt Responsive Design durch Media Queries für verschiedene Bildschirmausrichtungen (Landscape/Portrait). Ein Dark-Mode wird durch CSS-Klassen und Filter umgesetzt, die die Farben invertieren.

Die Anwendung verwendet SVG-Icons für die visuelle Darstellung von Menüoptionen und Funktionen. Diese Icons werden als lokale Dateien eingebunden und können farblich gefiltert werden, um den Auswahlzustand zu visualisieren.

### 3.2.2 Backend

Ratatosk.bayern hat kein separates Backend. Die gesamte Anwendungslogik wird clientseitig im Browser ausgeführt. Es gibt keine Server-Kommunikation, keine Datenbank und keine externe API-Integration. Alle Daten werden ausschließlich im Browser-Speicher (Memory) gehalten und gehen bei einem Seiten-Reload verloren.

Die einzige externe Abhängigkeit ist MediaPipe FaceMesh, das über CDN geladen wird, aber auch lokal eingebunden werden kann für Offline-Nutzung. Die Gesichtserkennung erfolgt vollständig im Browser ohne Server-Interaktion.

### 3.2.3 Eingabemethoden

Die primäre Eingabemethode von Ratatosk.bayern ist die Augenblinzeln-Erkennung über MediaPipe FaceMesh. Die Anwendung verwendet eine Webcam, um kontinuierlich Videoframes aufzunehmen und diese an MediaPipe FaceMesh zu senden.

MediaPipe FaceMesh analysiert jedes Frame und erkennt Gesichtslandmarks. Die Anwendung verwendet spezifische Landmarks für die Augen (Links: 387, 386, 374, 373; Rechts: 160, 159, 144, 145) und die Gesichtsgröße (10, 152) zur Berechnung, ob die Augen geschlossen sind.

Die Blinzeln-Erkennung basiert auf der Berechnung des Abstands zwischen den Augenlidern im Verhältnis zur Gesichtsgröße. Wenn beide Augen geschlossen sind und dieser Zustand über eine konfigurierbare Anzahl von Frames (time_closed) hinweg besteht, wird eine Aktion ausgelöst. Die Erkennung berücksichtigt auch die Orientierung des Gesichts (horizontal oder vertikal) und passt die Berechnung entsprechend an.

Neben der Blinzeln-Erkennung unterstützt die Anwendung auch Mausklicks und Touch-Events als alternative Eingabemethoden. Diese werden direkt als Event-Handler in den Vue.js-Templates implementiert und können parallel zur Blinzeln-Erkennung genutzt werden.

Die Navigation erfolgt über ein sequenzielles Aufleuchten von Symbolen (AutoMode). Jedes Symbol wird für eine konfigurierbare Dauer (waittime) hervorgehoben, bevor das nächste Symbol aufleuchtet. Wenn der Benutzer blinzelt, während ein Symbol aufleuchtet, wird die diesem Symbol zugeordnete Aktion ausgeführt.

Die Implementierung der AutoMode-Funktionalität erfolgt durch rekursive setTimeout-Aufrufe, die die Reihenfolge der aufleuchtenden Symbole steuern. Jeder Dialog hat seine eigene AutoMode-Implementierung, die spezifisch für die Menüstruktur angepasst ist.

### 3.2.4 Gesichtserkennung und Blinzeln-Erkennung

Die Gesichtserkennung wird durch MediaPipe FaceMesh realisiert, das als JavaScript-Bibliothek eingebunden ist. MediaPipe FaceMesh erkennt Gesichter in Videoframes und extrahiert 468 Landmark-Punkte, die die Gesichtsstruktur beschreiben.

Die Anwendung initialisiert MediaPipe FaceMesh mit folgenden Konfigurationen:

- **maxNumFaces**: 1 (nur ein Gesicht wird erkannt)
- **refineLandmarks**: true (präzise Landmark-Erkennung)
- **minDetectionConfidence**: 0.5 (mindestens 50% Sicherheit für Gesichtserkennung)
- **minTrackingConfidence**: 0.5 (mindestens 50% Sicherheit für Landmark-Verfolgung)

Die Blinzeln-Erkennung erfolgt in der Funktion `detectEyesOpen()`, die für jedes Frame aufgerufen wird. Die Funktion berechnet:

1. Die Gesichtsgröße (Höhe und Breite) basierend auf Landmarks 10 und 152
2. Die Abstände zwischen den Augenlidern für beide Augen
3. Ob die Augen geschlossen sind, basierend auf einem experimentellen Faktor (facefactor, Standardwert: 55)

Die Erkennung berücksichtigt die Orientierung des Gesichts: Wenn die Gesichtsbreite größer als die Gesichtshöhe ist, wird die horizontale Orientierung angenommen und die Abstandsmessungen erfolgen auf der X-Achse. Andernfalls erfolgen die Messungen auf der Y-Achse.

Wenn beide Augen geschlossen sind, wird ein Zähler (closed_frames) inkrementiert. Wenn die Augen wieder geöffnet werden, wird der Zähler auf 0 zurückgesetzt. Wenn der Zähler den Schwellenwert (time_closed) erreicht, wird die Aktion für das aktuell aufleuchtende Symbol ausgeführt.

### 3.2.5 Datenstrukturen und Menüorganisation

Die Menüstruktur wird durch verschachtelte Arrays definiert, die direkt im Vue.js-Datenobjekt gespeichert sind. Jeder Dialog hat seine eigene Datenstruktur:

- **Keyboards**: Drei verschiedene Tastaturlayouts (Alphabetisch, QWERTZ, Häufigkeit)
- **Schmerz**: Vier Hauptkategorien (Kopf, Torso, Arme, Beine) mit Unterkategorien
- **UmgebungMenu**: Vier Kategorien (Gespräch, Gegenstände, Im Zimmer, Im Bett)
- **IchMenu**: Fünf Kategorien (Ernährung, Gefühle, Kleidung, Hygiene, Bewegung)
- **Schmerzskala**: Array mit Werten von 0-10
- **Blinkzeiten**: Array mit konfigurierbaren Blinkdauern

Die Navigation zwischen Menüs erfolgt durch Änderung der Variable `showMenu`, die numerische Werte verwendet, um verschiedene Menüzustände zu repräsentieren:

- 0: Hauptmenü
- 1: Warnton-Menü
- 2: Schmerz-Hauptmenü
- 3: Nachrichten-Menü
- 4: Umgebung-Schnellbausteine
- 5: Ich-Schnellbausteine
- 6: Einstellungsmenü
- 200-300: Schmerz-Untermenüs
- 300-400: Nachrichten-Untermenüs
- 400-500: Umgebung-Untermenüs
- 500-600: Ich-Untermenüs
- 600-700: Einstellungs-Untermenüs

Die AutoMode-Implementierung verwendet diese numerischen Werte, um zu bestimmen, welche Symbole in welcher Reihenfolge aufleuchten sollen.

### 3.2.6 Text-to-Speech

Die ursprüngliche Version von Ratatosk.bayern verwendet keine Text-to-Speech (TTS)-Funktionalität. Die Anwendung zeigt Text nur visuell an und verlässt sich auf die visuelle Darstellung für die Kommunikation mit dem Benutzer.

Audio wird nur für den Warnton (ServiceGlocke.wav) verwendet, der als Audio-Objekt geladen und abgespielt wird.

### 3.2.7 Deployment und Distribution

Die Anwendung wurde für Deployment auf einem Webserver konzipiert. Der Build-Prozess erstellt einen dist-Ordner, der alle notwendigen Dateien enthält:

- index.html (Haupt-HTML-Datei)
- CSS-Dateien (pageStyle.css)
- JavaScript-Bibliotheken (MediaPipe FaceMesh, Vue.js, Camera Utils)
- SVG-Icons und andere Ressourcen
- Audio-Dateien (ServiceGlocke.wav)

Für die Offline-Nutzung müssen die MediaPipe-Bibliotheken lokal eingebunden werden, anstatt sie über CDN zu laden. Die Anwendung kann dann vollständig ohne Internetverbindung genutzt werden.

Die Anwendung wurde ursprünglich auf einem Apache-Server unter /var/www/html deployiert und war unter der Domain ratatosk.bayern erreichbar.

## 3.3 Beschreibung von Ratatosk Version 2.0

Ratatosk Version 2.0 ist eine vollständige Neuentwicklung der ursprünglichen Ratatosk.bayern-Anwendung. Die neue Version wurde mit modernen Webentwicklungspraktiken und einer modularen Architektur entwickelt, um die Wartbarkeit, Erweiterbarkeit und Codequalität zu verbessern.

Die Zielgruppe bleibt identisch mit der ursprünglichen Version: Menschen mit eingeschränkter Sprech- oder Bewegungsfähigkeit, die auf alternative Eingabemethoden angewiesen sind. Die Funktionen sind ebenfalls weitgehend gleich, wurden jedoch architektonisch neu strukturiert und um zusätzliche Features erweitert.

Die Hauptfunktionen von Ratatosk Version 2.0 umfassen:

- **Schmerz-Assessment**: Vollständig neu entwickelter Dialog mit State Machine, Dictionary-System und Grammatik-Unterstützung
- **Umgebungs-Dialog**: Einheitlicher Dialog für Umgebungskommunikation mit wiederverwendbaren Komponenten
- **Ich-Dialog**: Konsolidierter Dialog für persönliche Bedürfnisse (Ernährung, Gefühle, Kleidung, Hygiene, Bewegung)
- **Virtuelle Tastatur**: Verbesserte Tastatur mit TTS-Integration und besserer Navigation
- **Einstellungen**: Erweiterte Einstellungsmöglichkeiten mit konsolidiertem Dialog-System
- **Text-to-Speech**: Vollständige TTS-Integration in allen Dialogen
- **AutoMode**: Wiederverwendbares System für automatische Navigation

Die neue Version bietet eine deutlich verbesserte Benutzererfahrung durch konsistente Dialog-Navigation, bessere Fehlerbehandlung und optimierte Performance.

## 3.4 Technische Architektur von Ratatosk Version 2.0

Ratatosk Version 2.0 wurde als modulare Single-Page Application (SPA) mit TypeScript implementiert. Die Anwendung folgt einer Clean Architecture und verwendet eine feature-basierte Projektstruktur.

### 3.4.1 Frontend

Das Frontend wurde mit Vue.js 3 (Version 3.5.18) und der Composition API implementiert. Die Anwendung verwendet TypeScript für vollständige Typsicherheit und bessere Codequalität.

Die Projektstruktur ist in mehrere Hauptbereiche unterteilt:

- **features/**: Enthält alle Features der Anwendung (pain-assessment, umgebung-dialog, ich, communication, navigation, settings, warning, face-recognition). Jedes Feature hat seine eigene Struktur mit views/, composables/, data/ und optional stores/.
- **shared/**: Enthält wiederverwendbare Komponenten, Composables und Styles, die von mehreren Features verwendet werden.
- **core/**: Enthält die Kern-Architektur mit Domain-Entities, Application Services (InputManager, CommunicationService, UserService) und Repository Interfaces.
- **config/**: Enthält Konfigurationsdateien (gridConfig.ts, ttsConfig.ts).
- **router/**: Enthält die Vue Router-Konfiguration für die Navigation.

Die Anwendung verwendet Pinia für State Management, Vue Router für Navigation und verschiedene Composables für wiederverwendbare Funktionalität. Die Benutzeroberfläche wird durch Vue-Komponenten mit TypeScript-Support gesteuert.

Das Styling erfolgt durch modulare CSS-Dateien (DialogBase.css, common.css) und feature-spezifische Styles. Die Anwendung unterstützt vollständig Responsive Design und Dark Mode durch CSS-Variablen und Theme-System.

### 3.4.2 Backend

Wie die ursprüngliche Version hat auch Ratatosk Version 2.0 kein separates Backend. Die gesamte Anwendungslogik wird clientseitig im Browser ausgeführt. Es gibt keine Server-Kommunikation, keine Datenbank und keine externe API-Integration.

Die Anwendung verwendet MediaPipe FaceMesh für die Gesichtserkennung und Browser-APIs für Text-to-Speech. Alle Ressourcen werden lokal eingebunden, um Offline-Nutzung zu ermöglichen.

### 3.4.3 Eingabemethoden

Die Eingabemethoden sind identisch zur ursprünglichen Version: Augenblinzeln-Erkennung (primär), Mausklicks und Touch-Events. Der entscheidende Unterschied ist die Implementierung durch einen zentralen Input Manager.

Der Input Manager (core/application/InputManager.ts) abstrahiert alle Eingabetypen und vereinheitlicht deren Behandlung. Er bietet:

- Einheitliche Schnittstelle für alle Eingabetypen
- Cooldown-System zur Vermeidung von zu schnellen Eingaben
- Event-basierte Architektur für bessere Entkopplung
- TypeScript-Typisierung für Typsicherheit

Die Augenblinzeln-Erkennung verwendet die gleiche MediaPipe FaceMesh-Implementierung wie die ursprüngliche Version, wird aber durch den Input Manager abstrahiert.

Die AutoMode-Funktionalität wurde in wiederverwendbare Composables (useAutoMode.ts) ausgelagert, die von allen Dialogen verwendet werden können. Dies eliminiert Code-Duplikation und gewährleistet Konsistenz.

### 3.4.4 Dialog-System und State Machines

Alle Dialoge in Version 2.0 verwenden eine einheitliche Dialog-Maschine-Architektur. Jeder Dialog hat seine eigene State Machine (usePainDialogMachine.ts, useUmgebungDialogMachine.ts, useIchDialogMachine.ts, useSettingsDialogMachine.ts), die den Dialog-Zustand und die Navigation verwaltet.

Die State Machines definieren klare Zustände (mainView, subRegionView, confirmation) und Übergänge zwischen diesen Zuständen. Dies verhindert Fehlerzustände und erleichtert das Debugging.

Jeder Dialog verwendet außerdem ein Dictionary-System (usePainDictionary.ts, useUmgebungDictionary.ts, useIchDictionary.ts), das die Dialog-Daten und Grammatikregeln verwaltet. Dies ermöglicht es, Dialoge einfach zu erweitern oder zu modifizieren, ohne die Komponenten-Logik zu ändern.

### 3.4.5 Text-to-Speech Integration

Version 2.0 implementiert eine vollständige Text-to-Speech (TTS)-Integration in allen Dialogen. Das TTS-System wird durch wiederverwendbare Composables (useTTS.ts) bereitgestellt, die von allen Dialogen verwendet werden.

Das TTS-System bietet:

- Robuste Fehlerbehandlung
- Lebenszyklus-Management (start, pause, stop, cleanup)
- Synchronisation mit AutoMode
- Browser-API-Integration (Web Speech API)
- Konfigurierbare Sprachgeschwindigkeit und Stimme

Die TTS-Funktionalität ist vollständig in die Dialog-Navigation integriert und wird automatisch für alle ausgewählten Optionen ausgeführt.

### 3.4.6 Build-System und Deployment

Version 2.0 verwendet Vite als Build-Tool und Entwicklungsserver. Die Anwendung unterstützt:

- TypeScript-Compilation
- Hot Module Replacement (HMR) für Entwicklung
- Code-Splitting und Optimierung für Production
- Type-Checking mit vue-tsc
- ESLint und Prettier für Codequalität

Die Anwendung kann als statische Website auf jedem Webserver deployiert werden. Sie wurde für GitHub Pages entwickelt und kann auch auf anderen Hosting-Plattformen bereitgestellt werden.

# 4 Analyse des Ist-Zustands

Eine detaillierte Analyse der ursprünglichen Version von Ratatosk.bayern zeigt verschiedene Problemfelder und Limitierungen auf, die die Notwendigkeit einer Neuentwicklung begründen.

## 4.1 Bestehende Probleme & Limitierungen

Die ursprüngliche Version von Ratatosk.bayern wies mehrere strukturelle Probleme auf, die die Wartbarkeit, Erweiterbarkeit und Codequalität beeinträchtigten:

**Code-Duplikation**: Funktionalitäten wie AutoMode, Text-to-Speech und Navigation wurden in jedem Dialog neu implementiert, obwohl sie identisch waren. Dies führte zu erheblichen Code-Duplikationen (geschätzt über 4.000 Zeilen duplizierter Code) und Inkonsistenzen zwischen den Dialogen.

**Monolithische Struktur**: Die gesamte Anwendung bestand aus einer einzigen HTML-Datei mit allen Funktionalitäten direkt eingebettet. Dies erschwerte die Navigation im Code, die Wartung und das Debugging erheblich.

**Fehlende Modularität**: Die Anwendung hatte keine klare Trennung von Verantwortlichkeiten. Geschäftslogik, Präsentationslogik und Infrastrukturlogik waren miteinander vermischt, was das Testen und die Wartung erschwerte.

**Keine Typsicherheit**: Die gesamte Anwendung war in JavaScript geschrieben, ohne Typisierung. Dies führte zu Laufzeitfehlern, die erst bei der Ausführung des Codes entdeckt wurden, und erschwerte die Entwicklung durch fehlende IntelliSense-Unterstützung.

**Inkonsistente Eingabe-Behandlung**: Verschiedene Eingabetypen (Blinzeln, Maus, Touch) wurden unterschiedlich behandelt. Es gab keine zentrale Stelle, an der alle Eingaben vereinheitlicht wurden.

**Fehlende Wiederverwendbarkeit**: Code konnte nicht zwischen Komponenten geteilt werden. Jede neue Funktionalität erforderte die Duplikation von Code.

**Schwierige Testbarkeit**: Die enge Kopplung von Komponenten und die monolithische Struktur erschwerten das Schreiben von Unit-Tests oder Integrationstests erheblich.

**Fehlende Text-to-Speech**: Die ursprüngliche Version hatte keine TTS-Funktionalität, was die Barrierefreiheit für Benutzer mit Sehbehinderungen einschränkte.

**Begrenzte Erweiterbarkeit**: Neue Dialoge oder Funktionalitäten hinzuzufügen erforderte die Duplikation von Code und konnte zu Inkonsistenzen führen.

## 4.2 Feedback von Nutzer:innen

Obwohl keine umfassenden Nutzerstudien dokumentiert wurden, lassen sich aus der Nutzung der ursprünglichen Version verschiedene Probleme identifizieren, die auf Feedback oder Nutzungserfahrungen hindeuten:

**Komplexe Navigation**: Die Navigation durch verschachtelte Menüs war komplex und erforderte viele Blinzeln-Interaktionen, um zu bestimmten Optionen zu gelangen. Dies konnte für Benutzer ermüdend sein.

**Fehlende Audio-Unterstützung**: Die ausschließlich visuelle Darstellung beschränkte die Nutzbarkeit für Benutzer mit Sehbehinderungen. Die fehlende TTS-Funktionalität wurde als Limitierung wahrgenommen.

**Inkonsistente Benutzeroberfläche**: Verschiedene Dialoge verhielten sich unterschiedlich, obwohl sie ähnliche Funktionalität aufwiesen. Dies konnte Verwirrung bei Benutzern verursachen.

**Begrenzte Anpassbarkeit**: Die Einstellungsmöglichkeiten waren begrenzt, und die Anpassung der Anwendung an individuelle Bedürfnisse war schwierig.

**Fehlende Fehlerbehandlung**: Die Anwendung bot keine klare Fehlerbehandlung oder Feedback bei Problemen, z.B. wenn die Kamera nicht funktionierte oder die Gesichtserkennung fehlschlug.

## 4.3 Technische Schwächen

Die ursprüngliche Version wies mehrere technische Schwächen auf, die die Funktionalität und Benutzererfahrung beeinträchtigten:

**UI-Anpassung**: Die Benutzeroberfläche war nicht vollständig responsive und hatte Schwierigkeiten mit verschiedenen Bildschirmgrößen und Ausrichtungen. Die Media Queries waren grundlegend, aber nicht umfassend.

**Kameraunterstützung**: Die Kamera-Initialisierung hatte keine robuste Fehlerbehandlung. Probleme mit Kamera-Berechtigungen oder fehlenden Kameras wurden nicht klar kommuniziert. Die Anwendung konnte nicht zwischen verschiedenen verfügbaren Kameras wählen.

**Gesichtserkennung**: Die Blinzeln-Erkennung war sensitiv für Beleuchtungsbedingungen und Kopfposition. Es gab keine Anpassung der Erkennungsparameter während der Laufzeit, und die Konfiguration war statisch.

**Performance**: Die monolithische Struktur und die rekursiven setTimeout-Aufrufe für AutoMode konnten zu Performance-Problemen führen, insbesondere bei längerer Nutzung oder auf weniger leistungsstarken Geräten.

**Fehlende Fehlerbehandlung**: Die Anwendung hatte keine umfassende Fehlerbehandlung. Laufzeitfehler konnten dazu führen, dass die Anwendung nicht mehr reagierte, ohne dass der Benutzer informiert wurde.

**Memory Management**: Die Anwendung hatte keine explizite Bereinigung von Event-Listeners oder Timern. Dies konnte zu Memory-Leaks bei längerer Nutzung führen.

**Browser-Kompatibilität**: Die Anwendung wurde primär für bestimmte Browser entwickelt, und die Kompatibilität mit verschiedenen Browsern war nicht vollständig getestet.

**Fehlende Dokumentation**: Der Code hatte nur begrenzte Kommentare und keine strukturierte Dokumentation, was die Wartung und Erweiterung erschwerte.

**Fehlende Versionierung**: Die Anwendung hatte kein Versionsmanagement oder Update-Mechanismus, was die Verteilung von Updates erschwerte.

**Fehlende Persistenz**: Alle Daten gingen bei einem Seiten-Reload verloren, da es keine lokale Speicherung gab. Dies konnte frustrierend für Benutzer sein, die ihre Einstellungen oder Nachrichten nicht verlieren wollten.

Diese technischen Schwächen und Probleme der ursprünglichen Version begründeten die Notwendigkeit einer vollständigen Neuentwicklung mit modernen Webentwicklungspraktiken und einer modularen Architektur.
