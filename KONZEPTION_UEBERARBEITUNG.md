# 6. Konzeption der Verbesserung - Überarbeitete Version

## 6.1 Auswahl neuer Features

Die im Vorfeld durchgeführte Analyse der ursprünglichen Version zeigte mehrere kritische Fehler auf. Insbesondere stellte die ausschließlich visuelle Kommunikation für Nutzer:innen mit zusätzlicher Sehbehinderung oder Leseschwierigkeiten eine Barriere dar, die behoben werden sollte. Darüber hinaus erschwerte die monolithische Codestruktur die Arbeit am Programm erheblich. Aufgrund der Ausgangssituation ergab sich die Entscheidung, nicht nur neue Features zu planen, sondern die gesamte Architektur grundlegend zu überarbeiten. Die wichtigsten geplanten Features waren folgende:

**Text-to-Speech-System (TTS):**
Durch das Einbinden eines zentralen Text-to-Speech-Systems sollte die Anwendung vollständig auditiv nutzbar sein. Menüoptionen, Auswahlen oder Bestätigungen sollten vorgelesen werden können. Damit sollten auch Nutzer:innen, die neben der temporären Sprachunfähigkeit eine Sehbehinderung haben, einen barrierefreien Zugang zum Programm und zur Kommunikation erhalten. Die TTS-Funktionalität sollte als zentraler Service (`TTSService`) implementiert werden, um Code-Duplikation zu vermeiden und eine konsistente API zu gewährleisten.

**Modulare Architektur:**
Die im Vorfeld oft bemängelte, monolithische Struktur sollte vollständig überdacht und aufgebrochen werden. Ziel war es, eine feature-basierte Architektur zu etablieren, die Wiederverwendbarkeit von Komponenten ermöglicht, die Fehleranfälligkeit minimiert und spätere Erweiterungen erleichtert. Die Architektur sollte Clean Architecture Prinzipien folgen mit klarer Trennung zwischen Domain-Layer, Application-Layer und UI-Layer.

**Unified Timer Management:**
Die tief verschachtelten `setTimeout`-Rekursionen der ursprünglichen Version sollten durch ein zentrales Timer-Management-System (`TimerManager`) ersetzt werden. Dieses System sollte alle Timer-Operationen (`setTimeout`, `setInterval`, `requestAnimationFrame`) vereinheitlichen, automatisches Tracking und Cleanup ermöglichen und Memory Leaks sowie Race Conditions verhindern.

**Unified Cleanup System:**
Um Memory Leaks zu vermeiden und Ressourcen korrekt freizugeben, sollte ein einheitliches Cleanup-System (`UnifiedCleanup`) implementiert werden. Dieses System sollte Component-scoped und View-scoped Cleanup koordinieren und automatisch bei Navigation oder Component-Unmounting ausgeführt werden.

**Event- und Timing-Konstanten:**
Magic Strings und Magic Numbers sollten durch zentrale Konstanten (`EVENTS`, `TIMING`) ersetzt werden, um Typsicherheit zu gewährleisten und Fehler durch Tippfehler zu vermeiden.

**Unterstützung alternativer Sensoren:**
Eine Unterstützung alternativer Sensoren sollte zudem möglich gemacht werden. Die Architektur soll in Zukunft die Integration anderer Eingabegeräte erlauben, wie zum Beispiel eines Balldrucksensors. Der Balldrucksensor löst durch Drücken eines Balles eine Aktion aus. Dieser soll symbolisch durch einen rechten Mausklick dargestellt werden.

**Responsive Design:**
Das Responsive-Design muss komplett überarbeitet werden. Die Anwendung soll auf allen relevanten Geräten, insbesondere auf Smartphones und Tablets korrekt dargestellt werden. Layout- und Interaktionselemente sollen flexibel anpassbar sein.

**Browserkompatibilität:**
Die Kameraintegration soll in allen Browsern funktionieren, um die visuelle Interaktion durch Blinzeln reibungslos zu ermöglichen.

**Konsistente Visualisierung:**
Geplant war auch eine konsistentere Visualisierung der Icons und Interface-Elemente, um die Orientierung und Nutzerfreundlichkeit zu verbessern.

**Blinzel-Shortcuts:**
Um die Effizienz der Navigation zu steigern, sollen zudem Blinzel-Shortcuts etabliert werden. Diese sollen es Nutzer:innen ermöglichen, schneller durch das Programm zu navigieren und wichtige Funktionen direkt ansteuern zu können. Insbesondere die Unterstützung für einzelne Augen-Blinzeln als Shortcut-Funktion war geplant.

**Erweiterbarkeit:**
Abschließend war es wichtig, die Architektur so auszulegen, dass neue Eingabegeräte oder Technologien später leicht durch andere Programmierer:innen hinzugefügt werden können. Dies umfasste auch eine saubere und logische Dokumentation im Code.

## 6.2 Nutzerzentrierter Designansatz

Der visuelle und funktionale Neuaufbau der Benutzeroberfläche stand klar im Fokus. Mit dem Designtool Figma wurde ein Designkonzept erstellt. Dieses Konzept umfasste eine Ausführung für die Desktop-Version und eine Ausführung für die Mobile-Version. Von Beginn an war ein Kacheldesign in einem Grid vorgesehen. Es war wichtig, dass die aktive Kachel stark von den inaktiven Kacheln abhebt. Die ursprünglichen Farben der Version 1.0 sollten überarbeitet werden. Es wurden wenige Akzente verwendet, um eine visuelle Klarheit zu schaffen und die Aufmerksamkeit gezielt auf das aktive Objekt zu legen. Die Icons wurden erneuert und passender sowie genauer dargestellt.

Da die Submenüs eine viel größere Auswahlmöglichkeit bieten, war es hier wichtig, vom traditionellen Grid-Modell abzusehen. Es wurde ein Karussell-System konzipiert. Das Hauptaugenmerk sollte auf der aktiven Kachel in der Bildschirmmitte liegen. Inaktive Kacheln sollen im Gegensatz zur aktiven Kachel eher in den Hintergrund rücken. Durch die Einführung des Karussell-Systems ist das Layout für Mobile und Desktop gleichermaßen gut nutzbar. Jede aktive Kachel ist mit einem visuellen Feedback versehen und macht den Unterschied zwischen aktiv und inaktiv unmissverständlich klar. Zudem sollen die Kacheln in den Untermenüs durch Icons oder Smileys ergänzt werden, um den Begriff für Benutzer:innen nachvollziehbar zu machen.

Die Navigation durch die Anwendung soll über einen einheitlichen Dialogansatz gesteuert werden. Anstatt vieler einzelner Seiten gibt es nun vier Hauptdialoge: den Ich-, den Schmerz-, den Umgebungs- und den Einstellungs-Dialog. Jeder der genannten Dialoge nutzt den gleichen Aufbau, das gleiche CSS und unterscheidet sich nur in inhaltsspezifischen Inhalten. Dies erhöht die Konsistenz der Anwendung, vereinfacht die Wartung und reduziert die Lernkurve für Nutzer:innen.

Die Tastatur soll für Nutzer:innen mit Sehbeeinträchtigungen deutlich intuitiver gestaltet werden. Anstelle eines QWERTZ-Tastatur- oder eines Häufigkeits-Layouts wurde ein alphabetisches Layout gewählt. Da Nutzer:innen oft nicht das Bild einer Tastatur im Kopf haben, machen alle anderen Formate anstatt einer klassischen ABC-Tastatur wenig Sinn. Es soll nach Zeilen und dann buchstabenweise vorgelesen werden. Dies sichert eine konsistente und auditiv unterstützte Eingabe ab.

Ein weiterer wichtiger Bestandteil des Konzepts war die Bestätigungskommunikation. Nach jedem Dialogdurchlauf und somit nach Bildung eines aussagekräftigen Satzes soll ein Bestätigungstext vorgelesen werden. Dieser soll die Auswahl zusammenfassen und den Nutzer:innen das Gefühl geben, mit seinem Gegenüber aktiv kommunizieren zu können.

## 6.3 Technische Anforderungen

Für eine Neuauflage dieser Anwendung war eine modulare Architektur auf Basis von TypeScript und Vue 3 Composition API unabdingbar. Dies gewährleistet eine Wiederverwendbarkeit von Komponenten und die Typsicherheit. Zudem konnten durch die Umstellung auf TypeScript typische Fehlerquellen der vorherigen JavaScript-Version während der Entwicklung erkannt und behoben werden. Die Nutzung von Composable-Patterns von Vue 3 ermöglicht eine Trennung von Logik und Darstellung. Wiederverwendbare Composables (`useAutoMode`, `useInputManager`, `useFaceRecognition`, `useDialogMachine`, etc.) trennen komplexe Logik und können somit wiederverwendet werden. Dies reduziert zudem Code-Duplikationen und verbessert die Testbarkeit.

**Feature-basierte Architektur:**
Die Anwendung sollte in klar getrennte Features unterteilt werden, die jeweils ihre eigene Struktur mit `views/`, `composables/`, `data/` und optional `stores/` besitzen. Diese Architektur ermöglicht eine saubere Isolation der Funktionalitäten und erleichtert die Wartbarkeit und Erweiterbarkeit erheblich. Die Projektstruktur sollte Clean Architecture Prinzipien mit einer klaren Trennung zwischen Domain-Layer (`src/core/domain/`), Application-Layer (`src/core/application/`) und UI-Layer (`src/features/`) folgen.

**Zentrale Service-Architektur:**
Um Code-Duplikation zu vermeiden und konsistente Patterns zu gewährleisten, sollten zentrale Services implementiert werden:
- **TTSService**: Zentrale TTS-Logik mit Promise-basierter API und `AbortController`-Unterstützung
- **TimerManager**: Vereinheitlichtes Timer-Management mit automatischem Tracking und Cleanup
- **UnifiedCleanup**: Einheitliches Cleanup-System für Component- und View-scoped Ressourcen

**Konstanten-System:**
Magic Strings und Magic Numbers sollten durch zentrale Konstanten ersetzt werden:
- **EVENTS**: Event-Konstanten für alle Event-Namen im System
- **TIMING**: Timing-Konstanten für alle Zeitwerte

**State Management:**
Durch das zentrale State-Management-System Pinia soll eine persistente Speicherung von Einstellungen ermöglicht werden. Dies soll im Local-Storage geschehen. Dadurch wird sichergestellt, dass die Nutzerpräferenzen während der Session erhalten bleiben, auch nach einem Seitenneuladen.

**Timer-Verwaltung:**
Die tief verschachtelten `setTimeout`-Rekursionen der ursprünglichen Version mussten durch ein zentrales Timer-Management-System (`TimerManager`) ersetzt werden. Dieses System sollte:
- Alle Timer-Operationen (`setTimeout`, `setInterval`, `requestAnimationFrame`) vereinheitlichen
- Automatisches Tracking und Cleanup ermöglichen
- Memory Leaks verhindern
- Race Conditions durch Guards verhindern
- Eine einheitliche API mit `TimerHandle`-Interface bereitstellen

**TTS-System:**
Für das TTS-System war eine zentrale Service-Implementierung (`TTSService`) vorgesehen, die:
- Eine Promise-basierte API mit `AbortController`-Unterstützung bietet
- Sicherstellt, dass der visuelle Durchlauf erst nach vollständigem Abschluss der Sprachausgabe fortfährt
- Umfassende Fehlerbehandlung und Voice-Management bereitstellt
- Code-Duplikation zwischen verschiedenen TTS-Implementierungen eliminiert

**Cleanup-System:**
Ein einheitliches Cleanup-System (`UnifiedCleanup`) sollte implementiert werden, das:
- Component-scoped Cleanup über `CleanupCoordinator` ermöglicht
- View-scoped Cleanup über `ViewCleanupRegistry` koordiniert
- Automatisch bei Navigation oder Component-Unmounting ausgeführt wird
- Router Guards für automatisches Cleanup bei View-Wechseln integriert

**Browserkompatibilität:**
Die Browserkompatibilität, insbesondere im Zusammenhang mit der Kamera und Blinzelsteuerung, war ein zentraler Bestandteil der Anforderungen. Die Performance soll durch eine optimierte Animationssteuerung verbessert werden.

## 6.4 Machbarkeitsanalyse

Während der Machbarkeitsanalyse wurde überprüft, ob die im Konzept erarbeiteten Anforderungen mit den verfügbaren Technologien, Browserfähigkeiten und Ressourcen umsetzbar sind. Die Analyse diente dazu, technische Risiken frühzeitig zu identifizieren und die Realisierbarkeit der geplanten Version sicherzustellen.

### 6.4.1 Technische Machbarkeit

Die technische Analyse zeigte, dass alle Funktionen mit aktuellen Webstandards umsetzbar sind. Die Web Speech API bietet beispielsweise eine stabile Möglichkeit zur Text-to-Speech-Synthese und unterstützt eine auditive Benutzerführung. Kleine Tests zu Beginn des Projektes bestätigten, dass die gängigsten Browser eine ausreichende Qualität und Geschwindigkeit bereitstellen, um eine Menüführung zuverlässig auditiv auszugeben.

Die Implementierung eines zentralen `TTSService` als Singleton-Pattern ermöglicht es, alle TTS-Funktionalität zu kapseln und Code-Duplikation zu eliminieren. Die Promise-basierte API mit `AbortController`-Unterstützung gewährleistet eine zuverlässige Synchronisation zwischen visueller und auditiver Ausgabe.

Die Einführung eines `TimerManager`-Systems ist vollständig realisierbar und bietet erhebliche Vorteile gegenüber der ursprünglichen Implementierung. Durch die Vereinheitlichung aller Timer-Operationen und automatisches Tracking können Memory Leaks und Race Conditions effektiv verhindert werden.

### 6.4.2 System- und Browserkompatibilität

Die Browser-Fragmentierung, insbesondere für Safari unter iOS, stellte ein Risiko dar. Zwar unterstützen die gängigen Browser die benötigten APIs, jedoch existieren große Unterschiede in der Handhabung von Audio-Startbedingungen, Berechtigungsanfragen und Kamerastreams. Die Analyse zeigt jedoch, dass durch unterschiedliche Fallback-Mechanismen und zusätzliche Nutzerbestätigungen Unterschiede ausgeglichen werden können. Durch die Nutzung moderner CSS-Technologien konnte ein responsives Layout für Smartphones und Tablets ermöglicht werden, die besonders in klinischen Umgebungen häufig zum Einsatz kommen.

Die zentrale Service-Architektur mit `TTSService` ermöglicht es, browser-spezifische Unterschiede an einer zentralen Stelle zu behandeln, was die Wartbarkeit erheblich verbessert.

### 6.4.3 Barrierefreiheit

Die Anforderungen an die Barrierefreiheit sind vollständig umsetzbar. Eine Umstellung auf ein auditives Interface, klare Kontraste, ein alphabetisches Tastaturlayout und die dialogbasierte Führung lassen sich mit einfachen Web-Standards umsetzen. WCAG-konforme Elemente können ohne technischen Mehraufwand integriert werden. Die Unterstützung alternativer Eingabemethoden ist vorbereitet. Der Balldrucksensor kann über einen Mausklick symbolisch dargestellt werden und später ohne strukturellen Umbau ersetzt werden.

Die zentrale TTS-Integration über `TTSService` gewährleistet, dass alle Komponenten konsistent auditiv unterstützt werden, was die Barrierefreiheit erheblich verbessert.

### 6.4.4 Architektonische Machbarkeit

Die Modularisierung ist vollständig realisierbar. Vue 3 fördert eine komponentenbasierte Struktur. Die Composition API ermöglicht eine flexible Trennung von Logik und Darstellung. Die Einführung eines State-Managements mit Pinia unterstützt eine Wiederverwendbarkeit und erleichtert spätere Funktionserweiterungen. TypeScript kann den Entwicklungsprozess durch eine starke Typisierung erheblich stabilisieren. Zudem begünstigt es eine frühzeitige Fehlererkennung, wodurch die architektonische Machbarkeit gestärkt wird.

Die feature-basierte Architektur mit Clean Architecture Prinzipien ermöglicht eine klare Trennung von Concerns und erleichtert die Wartbarkeit und Erweiterbarkeit erheblich. Die zentrale Service-Architektur mit `TTSService`, `TimerManager` und `UnifiedCleanup` eliminiert Code-Duplikation und gewährleistet konsistente Patterns im gesamten Codebase.

Die Einführung von Event- und Timing-Konstanten (`EVENTS`, `TIMING`) eliminiert Magic Strings und Magic Numbers, was die Typsicherheit erhöht und Fehler durch Tippfehler verhindert.

### 6.4.5 Risiken und Annahmen

Zu den größten Risiken zählen Unterschiede zwischen den verschiedenen Browsern in Bezug auf TTS, Kamerazugriff und Event-Handling. Ebenso können externe Hardware-Abhängigkeiten entstehen. Auf älteren Geräten können weiterhin Leistungsschwankungen auftreten. 

Die zentrale Service-Architektur hilft jedoch, diese Risiken zu minimieren, da browser-spezifische Unterschiede an zentralen Stellen behandelt werden können. Das `TimerManager`-System verhindert Memory Leaks und Race Conditions, die auf älteren Geräten besonders problematisch sein können.

Trotz dieser Risiken war klar, dass alle Anforderungen realisierbar sind und sich ein robustes Gesamtsystem implementieren lässt. Die modulare Architektur ermöglicht es, einzelne Komponenten unabhängig zu testen und zu optimieren, was die Gesamtstabilität des Systems erhöht.

