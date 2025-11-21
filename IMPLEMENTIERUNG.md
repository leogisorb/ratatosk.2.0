# 6. Implementierung

## 6.1 Architektur und Code-Organisation

### 6.1.1 Feature-basierte Modulare Architektur

Die Implementierung basiert auf einer vollständig modularen, feature-basierten Architektur. Die gesamte Anwendung ist in klar getrennte Features unterteilt, die jeweils ihre eigene Struktur mit `views/`, `composables/`, `data/` und optional `stores/` besitzen. Diese Architektur ermöglicht eine saubere Isolation der Funktionalitäten und erleichtert die Wartbarkeit und Erweiterbarkeit erheblich.

Die Projektstruktur folgt Clean Architecture Prinzipien mit einer klaren Trennung zwischen Domain-Layer (`src/core/domain/`), Application-Layer (`src/core/application/`) und UI-Layer (`src/features/`). Der Domain-Layer enthält Business-Logik und Entities, der Application-Layer Use Cases und Services, während der UI-Layer die Präsentationslogik in Features organisiert.

Jedes Feature ist vollständig eigenständig und kann unabhängig entwickelt, getestet und gewartet werden. Die Features kommunizieren über klar definierte Interfaces und Services miteinander, was eine lose Kopplung und hohe Kohäsion gewährleistet.

### 6.1.2 TypeScript für vollständige Typsicherheit

Die gesamte Anwendung wurde mit TypeScript implementiert, was eine vollständige Typsicherheit auf allen Ebenen ermöglicht. Alle Funktionen, Interfaces, Types und Services sind vollständig typisiert, was zur Laufzeit Fehler verhindert und die Entwicklerproduktivität erheblich steigert.

Über 250 TypeScript-Interfaces und -Types wurden definiert, die die gesamte Anwendungsstruktur abdecken. Dies umfasst Domain-Entities, Application-Services, Composable-Rückgabewerte, Router-Konfigurationen und Store-Strukturen. Die Typsicherheit erstreckt sich bis in die Vue-Komponenten, wo Props, Emits und Slots vollständig typisiert sind.

### 6.1.3 Vue 3 Composition API

Die Anwendung nutzt Vue 3 mit der Composition API, was eine deutlich bessere Code-Organisation und Wiederverwendbarkeit ermöglicht. Die Composition API erlaubt es, logisch zusammengehörige Funktionalitäten in Composables zu gruppieren, die dann in verschiedenen Komponenten wiederverwendet werden können.

Composables wie `useAutoMode`, `useInputManager`, `useFaceRecognition`, `useSingleEyeBlinkHandler` und `useDialogTimerTracking` kapseln komplexe Logik und bieten eine saubere, testbare Schnittstelle. Zusätzlich wurden zentrale Services (`TTSService`, `TimerManager`) und Utilities (`UnifiedCleanup`, `EVENTS`) implementiert, die Code-Duplikation eliminieren und eine konsistente Architektur gewährleisten.

### 6.1.4 Clean Code Prinzipien

Die Implementierung folgt konsequent Clean Code Prinzipien. Funktionen sind klein, fokussiert und haben eine einzige Verantwortlichkeit. Namen sind aussagekräftig und selbstdokumentierend. Die Code-Struktur ist flach und vermeidet tiefe Verschachtelungen.

Komplexe Logik wurde in kleinere, testbare Einheiten aufgeteilt. Jede Funktion hat einen klaren Zweck und ist gut dokumentiert. Die Verwendung von TypeScript-Interfaces und -Types macht die Absichten des Codes explizit und verhindert Missverständnisse.

### 6.1.5 Wiederverwendbarkeit und DRY-Prinzip

Ein zentrales Prinzip der Implementierung ist die Wiederverwendbarkeit. Statt Code zu duplizieren, wurden wiederverwendbare Composables und Services erstellt. Das `useAutoMode` Composable wird beispielsweise in allen Dialogen verwendet, was eine konsistente Funktionalität gewährleistet und gleichzeitig Code-Duplikation verhindert.

Das DRY-Prinzip (Don't Repeat Yourself) wurde konsequent angewendet. Gemeinsame Funktionalitäten wurden in `shared/composables/` oder `core/application/` ausgelagert, wo sie von allen Features verwendet werden können.

## 6.2 Text-to-Speech Integration

### 6.2.1 Zentrale TTS-Architektur mit TTSService

Die Text-to-Speech-Integration wurde als zentraler Service (`TTSService`) implementiert, der alle TTS-Funktionalität kapselt und Code-Duplikation eliminiert. Der Service bietet eine vollständige Abstraktionsebene über die Browser-native **SpeechSynthesis API** (Teil der Web Speech API) und ermöglicht es, das TTS-System einfach auszutauschen oder zu erweitern.

**Wichtig:** Die Implementierung nutzt die **SpeechSynthesis API** (nicht die gesamte Web Speech API), die von Chrome 33+, Edge 14+, Firefox 49+ und Safari 7+ unterstützt wird. Die Synchronisation erfolgt über **Promise-basierte Callbacks** mit Event-Handlern (`onEnd`, `onStart`), nicht ausschließlich über Events.

Der `TTSService` wurde als Singleton implementiert und wird von allen Komponenten verwendet, die TTS benötigen. Er bietet eine Promise-basierte API mit `AbortController`-Unterstützung für Cancellation und umfassende Fehlerbehandlung.

**Konkrete Implementierung:**

Der `TTSService` (`src/shared/services/TTSService.ts`) implementiert eine zentrale, Promise-basierte TTS-Funktion:

```typescript
export class TTSService {
  private speechSynthesis: SpeechSynthesis
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private isSpeaking = false

  /**
   * Spricht Text mit Promise-basierter API
   */
  async speak(
    text: string,
    config: Partial<TTSConfig> = {},
    options: TTSOptions = {}
  ): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('TTS not available')
    }

    // Stoppe vorherige TTS
    this.cancel()

    // Warte kurz bevor neue TTS startet
    await timerManager.delay(200)

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text.trim())
      
      // Konfiguration anwenden
      utterance.lang = config.lang ?? this.defaultConfig.lang
      utterance.rate = config.rate ?? this.defaultConfig.rate
      utterance.pitch = config.pitch ?? this.defaultConfig.pitch
      utterance.volume = config.volume ?? this.defaultConfig.volume

      // AbortController-Unterstützung
      if (options.signal?.aborted) {
        reject(new Error('TTS canceled'))
        return
      }

      // Event-Handler
      utterance.onend = () => {
        this.isSpeaking = false
        this.currentUtterance = null
        options.onEnd?.()
        resolve()
      }

      utterance.onerror = (event) => {
        this.isSpeaking = false
        this.currentUtterance = null
        const error = new Error(TTS_ERROR_MESSAGES[event.error] || 'TTS error')
        options.onError?.(error)
        reject(error)
      }

      this.currentUtterance = utterance
      this.isSpeaking = true
      options.onStart?.()
      this.speechSynthesis.speak(utterance)
    })
  }

  /**
   * Stoppt aktuelle TTS-Ausgabe
   */
  cancel(): void {
    if (this.currentUtterance) {
      this.speechSynthesis.cancel()
      this.currentUtterance = null
      this.isSpeaking = false
    }
  }
}

// Singleton-Instanz
export const ttsService = new TTSService()
```

Diese zentrale Implementierung eliminiert Code-Duplikation zwischen `SimpleFlowController` und `useTTSWithCancellation` und gewährleistet konsistente TTS-Behandlung im gesamten Codebase.

### 6.2.2 TTS-Synchronisation mit AutoMode

Eine besondere Raffinesse der Implementierung ist die präzise Synchronisation zwischen TTS und AutoMode. Das System wartet, bis die Sprachausgabe vollständig abgeschlossen ist, bevor es zum nächsten Item im AutoMode wechselt. Dies verhindert, dass Text abgeschnitten wird oder mehrere TTS-Ausgaben gleichzeitig laufen.

Die Synchronisation erfolgt über Promise-basierte Callbacks. Wenn AutoMode ein Item spricht, wartet es auf das TTS-Promise, bevor es zum nächsten Item wechselt. Dies gewährleistet eine flüssige, vorhersagbare Benutzererfahrung.

**Konkrete Implementierung:**

Das `useAutoMode` Composable (`src/features/pain-assessment/composables/useAutoMode.ts`) synchronisiert sich präzise mit TTS:

```typescript
function loop() {
  const item = items[index.value]
  const itemTitle = item.title || item.name || String(item)
  
  // ✅ WICHTIG: Index wird NUR aktualisiert NACH TTS ist komplett fertig
  // Während TTS spricht, bleibt der visuelle Index beim aktuellen Item
  speak(itemTitle).then(() => {
    // ✅ Prüfe ob noch laufend (wurde möglicherweise gestoppt während TTS)
    if (!running.value) return
    
    // ✅ Warte 3 Sekunden, DANN erst Index aktualisieren
    // So bleibt das visuelle Item während des Sprechens korrekt
    timer = window.setTimeout(() => {
      if (!running.value) return
      
      // ✅ JETZT erst Index aktualisieren (nach TTS + 3 Sekunden Wartezeit)
      index.value = (index.value + 1) % items.length
      
      // ✅ Starte nächsten Cycle (spricht neues Item)
      if (running.value) {
        loop()
      }
    }, 3000)
  })
}
```

Diese Implementierung stellt sicher, dass:
1. Der visuelle Index während der TTS-Ausgabe beim aktuellen Item bleibt
2. Der Index erst nach vollständiger TTS-Ausgabe + 3 Sekunden Wartezeit aktualisiert wird
3. AutoMode sicher gestoppt werden kann, ohne Race Conditions zu verursachen

### 6.2.3 TTS-Fehlerbehandlung

Das TTS-System enthält umfassende Fehlerbehandlung für Fälle, in denen die SpeechSynthesis API nicht verfügbar ist oder fehlschlägt. Es prüft die Verfügbarkeit der API und fällt elegant auf stumme Ausgabe zurück, wenn TTS nicht verfügbar ist.

Zusätzlich bietet das System eine Queue-Funktionalität für mehrere TTS-Anfragen. Wenn mehrere TTS-Anfragen gleichzeitig gestellt werden, werden sie in eine Warteschlange eingereiht und nacheinander abgearbeitet. Dies verhindert Race Conditions und gewährleistet, dass alle Nachrichten korrekt vorgelesen werden.

### 6.2.4 TTS-Mute-Funktionalität

Eine globale Mute-Funktionalität wurde implementiert, die es ermöglicht, TTS systemweit zu deaktivieren, ohne die Funktionalität zu beeinträchtigen. Wenn TTS stumm geschaltet ist, werden alle TTS-Aufrufe mit Volume 0 ausgeführt, was die Synchronisation mit AutoMode aufrechterhält, ohne hörbare Ausgabe zu erzeugen.

Der Mute-Status wird im SimpleFlowController zentral verwaltet und kann über den AppHeader global gesteuert werden. Der Status wird in localStorage persistiert, sodass die Einstellung zwischen Sitzungen erhalten bleibt.

### 6.2.5 SimpleFlowController als zentrales Flow-Management-System

Der `SimpleFlowController` ist ein **zentrales System** für die Verwaltung von TTS-Queues, AutoMode-Zyklen und View-Transitions. Er bietet eine zentrale TTS-Verwaltung mit Queue-System für die HomeView-Navigation. Alle TTS-Anfragen für die Hauptnavigation werden über den SimpleFlowController geleitet, was eine konsistente Behandlung gewährleistet.

**Wichtig:** Der SimpleFlowController nutzt intern den `TTSService` für die eigentliche TTS-Ausgabe. Die Queue-Logik bleibt im SimpleFlowController, da sie spezifisch für die HomeView-Navigation ist. Der SimpleFlowController ist ein **Singleton** und wird systemweit verwendet, um den Flow zwischen verschiedenen Views zu koordinieren.

**Konkrete Implementierung:**

Der `SimpleFlowController` (`src/core/application/SimpleFlowController.ts`) verwendet `TTSService` für TTS-Operationen:

```typescript
import { ttsService } from '../../shared/services/TTSService'
import { timerManager } from '../../shared/utils/TimerManager'

export class SimpleFlowController {
  private ttsQueue: string[] = []
  private isProcessingQueue: boolean = false
  private ttsQueueCancellation: AbortController | null = null

  /**
   * Fügt Text zur TTS-Queue hinzu
   */
  private async queueAndSpeak(text: string): Promise<void> {
    // Prüfe auf Duplikate
    if (this.ttsQueue.includes(text)) {
      console.log('Duplicate TTS text skipped:', text)
      return
    }
    
    this.ttsQueue.push(text)
    
    if (!this.isProcessingQueue) {
      this.processQueue()
    }
  }
  
  /**
   * Verarbeitet TTS-Queue mit TTSService
   */
  private async processQueue(): Promise<void> {
    this.isProcessingQueue = true
    this.ttsQueueCancellation = new AbortController()
    
    while (this.ttsQueue.length > 0) {
      const text = this.ttsQueue.shift()!
      
      try {
        // Nutze TTSService für TTS-Ausgabe
        await ttsService.speak(text, {}, {
          signal: this.ttsQueueCancellation.signal
        })
      } catch (error) {
        // Fehlerbehandlung
      }
      
      // Pause zwischen Items
      await timerManager.delay(500)
    }
    
    this.isProcessingQueue = false
  }

  /**
   * Stoppt TTS (nutzt TTSService)
   */
  stopTTS(): void {
    ttsService.cancel()
    // ... Queue-Logik
  }
}
```

Diese Implementierung stellt sicher, dass:
1. TTS-Logik zentralisiert ist (TTSService)
2. Queue-Logik im SimpleFlowController bleibt (spezifisch für HomeView)
3. Keine Code-Duplikation zwischen verschiedenen TTS-Implementierungen
4. Konsistente Fehlerbehandlung und Cancellation

## 6.3 Input Management System

### 6.3.1 Zentrale Input-Abstraktion als Kernarchitektur

Ein zentraler `InputManager` wurde implementiert, der **alle Eingabemethoden** (Blinzeln, Mausklick, Touch, alternative Sensoren) abstrahiert und vereinheitlicht. Der InputManager ist das **zentrale Input-System** der gesamten Anwendung und wird **in allen Views** verwendet. Er bietet eine einheitliche Schnittstelle für alle Eingabetypen und ermöglicht es, Eingaben unabhängig von ihrer Quelle zu behandeln.

**Alle Views nutzen InputManager:**
- ✅ **EnvironmentDialogView** - `['blink', 'click']`
- ✅ **SelfDialogView** - `['blink', 'click']`
- ✅ **PainDialogView** - `['blink', 'click']`
- ✅ **SettingsDialogView** - `['blink', 'click']`
- ✅ **StartView** - `['blink', 'click']`
- ✅ **WarningView** - `['blink', 'click']` (umgestellt von `useBlinkInput()`)
- ✅ **CommunicationView** - `['blink', 'click']` (umgestellt von `useBlinkInput()`)

Der InputManager verwendet das Event-basierte Pattern und hört auf das `faceBlinkDetected` Event, das von der Face Recognition ausgelöst wird. Zusätzlich bietet er eine Polling-basierte Fallback-Methode für Fälle, in denen Events nicht funktionieren.

**Alternative Sensoren (Balldrucksensor):**
Der InputManager unterstützt alternative Eingabegeräte über den `'click'` Input-Typ, der Rechtsklick-Events (`contextmenu`) erfasst. Dies ermöglicht es, Hardware-Sensoren (wie einen Balldrucksensor) symbolisch durch Rechtsklick zu simulieren. Die Architektur ist so konzipiert, dass echte Hardware-Sensoren später ohne strukturellen Umbau durch einfachen Austausch des Event-Handlers integriert werden können.

**Konkrete Implementierung:**

Der `InputManager` (`src/core/application/InputManager.ts`) abstrahiert alle Eingabemethoden:

```typescript
export class InputManager {
  private config: InputManagerConfig
  private isActive = false
  private lastInputTime = 0
  private blinkEventListener: EventListener | null = null
  
  // Setup Blink Detection (Event-basiert)
  private setupBlinkDetection() {
    this.blinkEventListener = (event: Event) => {
      if (!this.isActive) return
      
      const customEvent = event as CustomEvent
      // Ignoriere Events von bestimmten Quellen (z.B. Header-Buttons)
      if (customEvent.detail?.source === 'fallback-interaction') {
        return
      }
      
      this.triggerInput('blink', 'face-recognition', customEvent.detail)
    }
    
    window.addEventListener('faceBlinkDetected', this.blinkEventListener)
  }
  
  // Setup Click Detection (Rechtsklick überall)
  private setupClickDetection() {
    this.clickHandler = (event: MouseEvent) => {
      if (!this.isActive) return
      
      // Nur normale Clicks, nicht auf interaktive Elemente
      const target = event.target as HTMLElement
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        return
      }
      
      event.preventDefault()
      event.stopPropagation()
      
      this.triggerInput('click', 'mouse', {
        button: event.button,
        clientX: event.clientX,
        clientY: event.clientY
      })
    }
    
    document.addEventListener('contextmenu', this.clickHandler, { passive: false })
  }
  
  // Erstellt ein Input-Event und ruft den Callback auf
  private triggerInput(type: InputType, source?: string, data?: any) {
    if (!this.checkCooldown()) {
      return  // Cooldown noch aktiv
    }
    
    const event: InputEvent = {
      type,
      timestamp: Date.now(),
      source,
      data
    }
    
    this.config.onSelect(event)
  }
}
```

Diese Implementierung stellt sicher, dass:
1. Alle Eingabemethoden über dieselbe Schnittstelle behandelt werden
2. Ein Cooldown-Mechanismus unbeabsichtigte Doppel-Auslösungen verhindert
3. Events korrekt bereinigt werden, wenn der InputManager gestoppt wird

### 6.3.2 Input-Cooldown-Mechanismus

Ein Cooldown-Mechanismus wurde implementiert, der verhindert, dass zu häufige Inputs verarbeitet werden. Nach jedem Input gibt es eine konfigurierbare Cooldown-Periode (Standard: 300ms), in der weitere Inputs ignoriert werden. Dies verhindert unbeabsichtigte Doppel-Auslösungen und verbessert die Benutzererfahrung erheblich.

### 6.3.3 Einheitliche Input-Behandlung

Alle Eingabemethoden werden über denselben Callback behandelt, was eine konsistente Benutzererfahrung gewährleistet. Ob ein Benutzer blinzelt, klickt oder tippt, die Reaktion der Anwendung ist identisch. Dies vereinfacht die Code-Logik erheblich und macht die Anwendung robuster.

### 6.3.4 Alternative Sensoren und Hardware-Integration

**Balldrucksensor-Simulation:**
Der InputManager unterstützt alternative Eingabegeräte über den `'click'` Input-Typ, der Rechtsklick-Events (`contextmenu`) erfasst. Dies ermöglicht es, Hardware-Sensoren (wie einen Balldrucksensor) symbolisch durch Rechtsklick zu simulieren. Die Architektur ist so konzipiert, dass echte Hardware-Sensoren später ohne strukturellen Umbau durch einfachen Austausch des Event-Handlers integriert werden können.

**Erweiterbarkeit:**
Der InputManager ist erweiterbar für zukünftige Input-Typen wie `'voice'` und `'gesture'`. Die Map-basierte Input-Setup-Struktur ermöglicht es, neue Input-Typen einfach hinzuzufügen, ohne die bestehende Architektur zu ändern.

### 6.3.5 Blinzel-Shortcuts: Einzelne Augen-Blinzeln

Eine innovative Funktionalität ist die Unterstützung für einzelne Augen-Blinzeln als Shortcuts. Das System erkennt separat, ob das linke oder rechte Auge zwinkert, und kann verschiedene Aktionen auslösen.

**Linkes Auge zwinkern**: Kann für eine spezifische Aktion konfiguriert werden (z.B. Navigation zum Warngeräusch)
**Rechtes Auge zwinkern**: Kann für eine andere Aktion konfiguriert werden (z.B. Navigation zum Hauptmenü)
**Beide Augen zwinkern**: Standard-Blinzeln für die Hauptaktion (z.B. Auswählen)

Die Erkennung einzelner Augen-Blinzeln basiert auf der separaten Berechnung des Augen-Status für jedes Auge. Das System verwendet MediaPipe Face Mesh Landmarks, um die Augenlider-Position für jedes Auge separat zu berechnen. Wenn ein Auge geschlossen ist, während das andere offen ist, wird dies als einzelnes Augen-Blinzeln erkannt.

Das `useSingleEyeBlinkHandler` Composable bietet eine saubere Schnittstelle für die Verwendung einzelner Augen-Blinzeln als Shortcuts. Es unterstützt konfigurierbare Callbacks für linkes und rechtes Auge sowie einen Cooldown-Mechanismus, um zu häufige Auslösungen zu verhindern.

### 6.3.6 Event-basierte Blinzel-Erkennung

Die Blinzel-Erkennung verwendet ein Event-basiertes System. Wenn ein Blinzeln erkannt wird, wird ein `faceBlinkDetected` Event ausgelöst, das von allen interessierten Komponenten gehört werden kann. Dies ermöglicht eine lose Kopplung zwischen der Face Recognition und den Komponenten, die auf Blinzeln reagieren.

Für einzelne Augen-Blinzeln wird ein separates `faceSingleEyeBlinkDetected` Event ausgelöst, das Informationen über das blinzelnde Auge enthält. Dies ermöglicht es Komponenten, gezielt auf einzelne Augen-Blinzeln zu reagieren.

### 6.3.7 Migration von useBlinkInput() zu InputManager

Alle Views wurden von der alten `useBlinkInput()` Implementierung auf den zentralen `InputManager` umgestellt. Dies gewährleistet:
- **Konsistente Input-Behandlung** über alle Views hinweg
- **Einheitliche API** für alle Eingabemethoden
- **Einfachere Wartbarkeit** durch zentrale Verwaltung
- **Erweiterbarkeit** für neue Input-Typen

Die alte `useBlinkInput()` Implementierung wird nur noch in `useVirtualKeyboard` für die Introduction-Phase verwendet und ist nicht mehr das primäre Input-System.

## 6.4 Face Recognition Service

### 6.4.1 Modulare Face Recognition

Die Gesichtserkennung wurde als vollständig modulares Service implementiert, das unabhängig von anderen Features funktioniert. Der Face Recognition Service verwendet MediaPipe Face Mesh und bietet eine saubere, testbare Schnittstelle für die Gesichts- und Blinzel-Erkennung.

Der Service ist als Composable (`useFaceRecognition`) implementiert und kann in jedem Feature verwendet werden. Er bietet Methoden zum Starten und Stoppen der Gesichtserkennung sowie reaktive Variablen für den Augen-Status und den Aktivitäts-Status.

### 6.4.2 Präzise Blinzel-Erkennung

Die Blinzel-Erkennung basiert auf der Berechnung des Abstands zwischen den Augenlidern im Verhältnis zur Gesichtsgröße. Das System berücksichtigt sowohl die vertikale als auch die horizontale Orientierung des Gesichts und passt die Berechnung entsprechend an.

Die Erkennung verwendet mehrere Landmark-Punkte pro Auge (Links: 387, 386, 374, 373; Rechts: 160, 159, 144, 145) für robuste Erkennung. Wenn beide Augen über eine konfigurierbare Anzahl von Frames geschlossen sind, wird ein Blinzel-Event ausgelöst.

**Konkrete Implementierung:**

Die Blinzel-Erkennung (`src/features/face-recognition/composables/useFaceRecognition.ts`) verwendet MediaPipe Face Mesh Landmarks:

```typescript
function detectEyesOpenOldVersion(landmarks: any[]): void {
  // Bestimme Gesichtsgröße
  let faceheight = landmarks[152].y - landmarks[10].y
  let facewidth = landmarks[10].x - landmarks[152].x
  let facesize = Math.max(faceheight, facewidth)
  
  // Abstände der Augen (rechts und links)
  let eye_right_one = Math.abs(landmarks[159].y - landmarks[145].y)
  let eye_right_two = Math.abs(landmarks[160].y - landmarks[144].y)
  let eye_left_one = Math.abs(landmarks[386].y - landmarks[374].y)
  let eye_left_two = Math.abs(landmarks[387].y - landmarks[373].y)
  
  let right_eye = "0"  // rechtes Auge ist offen
  let left_eye = "0"   // linkes Auge ist offen
  
  // Berechnung ob Augen zu sind anhand der Gesichtsgröße und einem 
  // experimentellen Faktor. Zur Sicherheit: zwei Abstände pro Auge
  if ((eye_right_one * config.faceFactor < facesize) && 
      (eye_right_two * config.faceFactor < facesize)) {
    right_eye = "1"  // rechtes Auge ist geschlossen
  }
  
  if ((eye_left_one * config.faceFactor < facesize) && 
      (eye_left_two * config.faceFactor < facesize)) {
    left_eye = "1"  // linkes Auge ist geschlossen
  }
  
  // Wenn beide Augen geschlossen sind, werden die Frames hochgezählt
  if ((right_eye == "1") && (left_eye == "1")) {
    closed_frames = closed_frames + 1
  } else {
    closed_frames = 0
    eyes_closed = false
  }
  
  // Wenn beide Augen entsprechend lange zu waren, führe die Klick-Aktion aus
  const currentTimeClosed = config.time_closed()  // Dynamisch aus Settings
  const requiredFrames = Math.ceil(currentTimeClosed * 30)  // 30 FPS
  if ((closed_frames >= requiredFrames) && (!eyes_closed)) {
    eyes_closed = true  // Verhindert mehrfache Auslösung
    
    // Dispatch Blinzel-Event
    const blinkEvent = new CustomEvent('faceBlinkDetected', {
      detail: {
        timestamp: Date.now(),
        source: 'face-recognition',
        closed_frames: closed_frames,
        time_closed: currentTimeClosed,
        required_frames: requiredFrames
      }
    })
    window.dispatchEvent(blinkEvent)
  }
}
```

Diese Implementierung stellt sicher, dass:
1. Die Blinzeldauer dynamisch aus den Settings gelesen wird
2. Mehrere Landmark-Punkte pro Auge für robuste Erkennung verwendet werden
3. Ein Flag (`eyes_closed`) mehrfache Auslösungen verhindert
4. Events mit detaillierten Informationen über den Blinzel-Vorgang ausgelöst werden

### 6.4.3 Einzelne Augen-Blinzel-Erkennung

Eine besondere Raffinesse ist die Erkennung einzelner Augen-Blinzeln. Das System trackt separat den Status jedes Auges und erkennt, wenn nur ein Auge geschlossen ist, während das andere offen bleibt. Dies ermöglicht es, einzelne Augen-Blinzeln als separate Eingaben zu behandeln.

Die Erkennung einzelner Augen-Blinzeln verwendet eine separate Dauer von 1,5 Sekunden (statt der normalen Blinzeldauer), um versehentliche Auslösungen zu vermeiden. Wenn ein Auge für 1,5 Sekunden geschlossen bleibt, während das andere offen ist, wird ein `faceSingleEyeBlinkDetected` Event ausgelöst.

### 6.4.4 Reaktiver Augen-Status

Der Augen-Status wird als reaktive Variable bereitgestellt, die kontinuierlich aktualisiert wird. Dies ermöglicht es anderen Komponenten, auf Änderungen im Augen-Status zu reagieren, ohne Polling durchführen zu müssen. Der Status enthält Informationen über beide Augen separat, was präzise Kontrolle ermöglicht.

### 6.4.5 iPhone Kamera-Unterstützung

Spezielle Unterstützung für iPhone-Kameras wurde implementiert, um sicherzustellen, dass die Gesichtserkennung auch auf iOS-Geräten optimal funktioniert. Die Kamera-Konfiguration berücksichtigt iOS-spezifische Anforderungen und verwendet Safari-kompatible Constraints.

Die Implementierung erkennt automatisch Safari-Browser und passt die Kamera-Initialisierung entsprechend an. Es werden mehrere Fallback-Strategien verwendet, um sicherzustellen, dass die Kamera auch auf verschiedenen iOS-Versionen funktioniert.

## 6.5 Timer Management und AutoMode System

### 6.5.1 Unified Timer Management (TimerManager)

Ein zentraler `TimerManager` wurde implementiert, der alle Timer-Operationen (`setTimeout`, `setInterval`, `requestAnimationFrame`) vereinheitlicht und automatisch trackt. Dies eliminiert Timer-Duplikate, verhindert Memory Leaks und Race Conditions.

**Konkrete Implementierung:**

Der `TimerManager` (`src/shared/utils/TimerManager.ts`) bietet eine typisierte API für alle Timer-Operationen:

```typescript
export interface TimerHandle {
  readonly id: TimerId
  cancel(): void
  readonly cancelled: boolean
}

export class TimerManager {
  private timers = new Map<TimerId, TimerEntry>()

  /**
   * Erstellt einen Timeout-Timer
   */
  setTimeout(callback: () => void, delay: number): TimerHandle {
    const id = this.createId()
    const handle = setTimeout(() => {
      const entry = this.timers.get(id)
      if (entry && !entry.cancelled) {
        this.timers.delete(id)
        callback()
      }
    }, delay)

    this.timers.set(id, {
      id,
      handle,
      type: 'timeout',
      cancelled: false
    })

    return this.createHandle(id)
  }

  /**
   * Erstellt einen Promise-basierten Delay
   */
  delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      this.setTimeout(() => resolve(), ms)
    })
  }

  /**
   * Stoppt alle Timer
   */
  cancelAll(): void {
    this.timers.forEach(entry => {
      if (entry.type === 'timeout') {
        clearTimeout(entry.handle as ReturnType<typeof setTimeout>)
      } else if (entry.type === 'interval') {
        clearInterval(entry.handle as ReturnType<typeof setInterval>)
      } else if (entry.type === 'animationFrame') {
        cancelAnimationFrame(entry.handle as ReturnType<typeof requestAnimationFrame>)
      }
    })
    this.timers.clear()
  }
}

// Singleton-Instanz
export const timerManager = new TimerManager()
```

**Vorteile:**
1. **Automatisches Tracking**: Alle Timer werden automatisch getrackt
2. **Typisierte Handles**: `TimerHandle` statt `number` für bessere Typsicherheit
3. **Einfache Cancellation**: `handle.cancel()` statt `clearTimeout(id)`
4. **Memory Leak Prevention**: Automatische Bereinigung beim Cleanup
5. **Race Condition Prevention**: Timer können nicht mehrfach ausgelöst werden

### 6.5.2 Wiederverwendbares AutoMode-System

Ein vollständig wiederverwendbares AutoMode-System wurde implementiert, das in allen Dialogen verwendet werden kann. Das System verwendet eine flache, zyklische Schleife, die deutlich wartbarer und vorhersagbarer ist als tief verschachtelte Rekursionen.

Das AutoMode-System wurde als Composable (`useAutoMode`) implementiert, das konfigurierbare Parameter für Timing, Items und Callbacks akzeptiert. Es nutzt den `TimerManager` für alle Timer-Operationen.

**Konkrete Implementierung:**

Das `useAutoMode` Composable (`src/shared/composables/useAutoMode.ts`) verwendet `TimerManager`:

```typescript
import { timerManager } from '../utils/TimerManager'
import type { TimerHandle } from '../utils/TimerManager'

export function useAutoMode(config: AutoModeConfig) {
  const { speak, getItems, getTitle } = config
  const running = ref(false)
  const index = ref(0)
  let timer: TimerHandle | null = null
  let initialTimer: TimerHandle | null = null
  
  // Startet den AutoMode
  async function start(skipTitle = false) {
    stop()  // Stoppe alle laufenden Timer
    
    const items = getItems()
    if (!items || !items.length) return
    
    running.value = true
    index.value = 0
    
    if (!skipTitle) {
      const title = getTitle()
      await speak(title)
      
      if (!running.value) return
      
      // Nutze TimerManager für Timer
      initialTimer = timerManager.setTimeout(() => {
        if (running.value) {
          index.value = 0
          loop()
        }
      }, 3000)
    } else {
      initialTimer = timerManager.setTimeout(() => {
        if (running.value) {
          index.value = 0
          loop()
        }
      }, 3000)
    }
  }
  
  // Haupt-Loop: Spricht aktuelles Item, wartet, geht zum nächsten
  function loop() {
    if (!running.value) return
    
    const items = getItems()
    if (!items || !items.length) {
      running.value = false
      return
    }
    
    const item = items[index.value]
    const itemTitle = item.title || item.name || String(item)
    
    // Spreche Titel des aktuellen Items
    speak(itemTitle).then(() => {
      if (!running.value) return
      
      // Nutze TimerManager für Timer
      timer = timerManager.setTimeout(() => {
        if (!running.value) return
        
        index.value = (index.value + 1) % items.length
        
        if (running.value) {
          loop()
        }
      }, 3000)
    })
  }
  
  // Stoppt den AutoMode und alle Timer
  function stop() {
    running.value = false
    
    if (timer) {
      timer.cancel()  // Nutze TimerHandle.cancel()
      timer = null
    }
    
    if (initialTimer) {
      initialTimer.cancel()
      initialTimer = null
    }
  }
  
  return { start, stop, index, running: computed(() => running.value) }
}
```

Diese Implementierung stellt sicher, dass:
1. Alle Timer über `TimerManager` verwaltet werden
2. Timer-Handles typisiert sind (`TimerHandle` statt `number`)
3. Timer automatisch getrackt und bereinigt werden können
4. Keine Memory Leaks durch vergessene Timer
5. Race Conditions durch automatische Cancellation verhindert werden

### 6.5.3 Race Condition Guards

Umfassende Guards wurden implementiert, die Race Conditions verhindern. Das System prüft kontinuierlich, ob AutoMode noch aktiv ist, bevor es Aktionen ausführt. Wenn AutoMode während einer TTS-Ausgabe gestoppt wird, wird der nächste Zyklus nicht ausgeführt.

Zusätzliche Guards prüfen, ob Items noch verfügbar sind und ob der aktuelle Index noch gültig ist. Wenn sich der State ändert, während AutoMode läuft, wird AutoMode sicher gestoppt und neu gestartet.

### 6.5.4 TTS-Synchronisation

Das AutoMode-System synchronisiert sich präzise mit TTS. Es wartet, bis die Sprachausgabe vollständig abgeschlossen ist, bevor es zum nächsten Item wechselt. Dies gewährleistet, dass Benutzer genug Zeit haben, um jedes Item zu hören und zu verstehen.

Die Synchronisation erfolgt über Promise-basierte Callbacks. Wenn AutoMode ein Item spricht, wartet es auf das TTS-Promise, bevor es eine Wartezeit einlegt und dann zum nächsten Item wechselt.

### 6.5.5 Dialog Timer Tracking mit UnifiedCleanup

Das `useDialogTimerTracking` Composable wurde refactored, um `TimerManager` und `UnifiedCleanup` zu nutzen. Dies vereinfacht die Implementierung erheblich und eliminiert Code-Duplikation.

**Konkrete Implementierung:**

Das `useDialogTimerTracking` Composable (`src/shared/composables/useDialogTimerTracking.ts`) nutzt jetzt `TimerManager` und `useCleanup`:

```typescript
import { timerManager } from '../utils/TimerManager'
import type { TimerHandle } from '../utils/TimerManager'
import { useCleanup } from '../utils/UnifiedCleanup'

export function useDialogTimerTracking(config: DialogTimerTrackingConfig = {}) {
  const { onCleanup, dialogName = 'Dialog' } = config
  
  // Flag: Verhindert, dass AutoMode gestartet wird, wenn der Dialog verlassen wurde
  const isActive = ref(true)
  
  // Unified Cleanup für automatisches Timer-Management
  const cleanup = useCleanup(dialogName)
  
  // Registriere onCleanup callback
  if (onCleanup) {
    cleanup.register(onCleanup, 'onCleanup')
  }
  
  /**
   * Erstellt Timer mit automatischer Registrierung
   */
  function scheduleTimer(callback: () => void, delay: number): TimerHandle | null {
    // Atomic check
    if (!isActive.value) {
      console.log(`${dialogName}: Inactive - timer not created`)
      return null
    }
    
    // Nutze TimerManager für Timer
    const handle = timerManager.setTimeout(() => {
      // Double-check für Race Conditions
      if (!isActive.value) {
        console.log(`${dialogName}: Dialog left - callback not executed`)
        return
      }
      
      try {
        callback()
      } catch (error) {
        console.error(`${dialogName}: Timer callback error:`, error)
      }
    }, delay)
    
    // Registriere für automatisches Cleanup
    cleanup.registerTimer(handle, `timer_${delay}ms`)
    
    return handle
  }
  
  /**
   * Stoppt alle Timer und führt Cleanup aus
   */
  async function executeCleanup(): Promise<void> {
    if (!isActive.value) {
      console.warn(`${dialogName}: Cleanup already called`)
      return
    }
    
    console.log(`${dialogName}: Cleanup - stopping all timers`)
    isActive.value = false
    
    await cleanup.execute()
  }
  
  return {
    isActive,
    scheduleTimer,
    cleanup: executeCleanup,
    checkIsActive: () => isActive.value
  }
}
```

**Vorteile der neuen Implementierung:**
1. **Automatisches Timer-Tracking**: `useCleanup` trackt alle Timer automatisch
2. **Vereinfachte API**: Keine manuelle Timer-Liste mehr nötig
3. **Automatisches Cleanup**: Timer werden automatisch beim Component-Unmount bereinigt
4. **Konsistente Patterns**: Nutzt die gleichen Utilities wie der Rest der Anwendung
5. **Weniger Code**: ~50 Zeilen Code reduziert

## 6.6 Router-basierte Navigation

### 6.6.1 Vue Router Integration

Die Navigation wurde vollständig auf Vue Router umgestellt, was eine saubere, deklarative Navigation ermöglicht. Jeder Dialog hat seine eigene Route, was die Navigation vorhersagbar und testbar macht.

Der Router verwendet History Mode für saubere URLs ohne Hash. Die Routen sind klar strukturiert und folgen einem konsistenten Namensschema.

**Aktuelle Routes:**
- `/` - StartView (Startseite)
- `/app` - HomeView (Hauptmenü)
- `/warning` - WarningView (Warngeräusch)
- `/communication` - CommunicationView (Virtuelles Keyboard)
- `/pain-dialog` - PainDialogView (Schmerz-Assessment)
- `/self-dialog` - SelfDialogView (Ich-Ausdrücke)
- `/environment-dialog` - EnvironmentDialogView (Umgebungs-Ausdrücke)
- `/settings` - SettingsDialogView (Einstellungen)

### 6.6.2 Navigation Guards mit Cleanup

Eine besondere Raffinesse ist die Implementierung von Navigation Guards, die sicherstellen, dass alle laufenden Prozesse korrekt gestoppt werden, wenn zwischen Routen navigiert wird. Wenn ein Benutzer eine Route verlässt, werden automatisch alle laufenden TTS-Ausgaben, AutoMode-Zyklen und Timer gestoppt.

Die Navigation Guards rufen auch View-spezifische Cleanup-Funktionen auf, die in `window` gespeichert sind. Dies ermöglicht es jedem View, seine eigenen Ressourcen zu bereinigen, wenn er verlassen wird.

### 6.6.3 Route-basierte State-Verwaltung

Jede Route verwaltet ihren eigenen State unabhängig. Wenn ein Benutzer zu einer Route navigiert, wird der State für diese Route initialisiert. Wenn der Benutzer die Route verlässt, wird der State bereinigt. Dies verhindert State-Leaks zwischen verschiedenen Dialogen.

### 6.6.4 Globaler Service-Stopp

Die `App.vue` Komponente bietet eine zentrale `stopAllServices()` Funktion, die alle laufenden Services stoppt. Diese Funktion wird vor jeder Navigation aufgerufen und stellt sicher, dass keine Services im Hintergrund weiterlaufen.

Die Funktion stoppt:
- Alle TTS-Ausgaben (SimpleFlowController und Browser API)
- Alle AutoMode-Zyklen
- Alle Timer
- Alle View-spezifischen Cleanup-Funktionen

## 6.7 Dialog-basierte Architektur und hierarchische Satzbildung

### 6.7.1 Dialog-Systeme vs. andere Views

Die Anwendung unterscheidet zwischen **Dialog-Systemen** (mit hierarchischer Satzbildung) und **anderen Views** (ohne Dialog-Struktur):

**Dialog-Systeme** (mit State Machines und hierarchischer Satzbildung):
- **PainDialogView** (`/pain-dialog`) - Schmerz-Assessment mit hierarchischer Navigation
- **SelfDialogView** (`/self-dialog`) - Ich-Ausdrücke mit Kategorien und Unterkategorien
- **EnvironmentDialogView** (`/environment-dialog`) - Umgebungs-Ausdrücke mit Objekten und Verben
- **SettingsDialogView** (`/settings`) - Einstellungen mit konsolidiertem Dialog-System

**Andere Views** (ohne Dialog-Struktur):
- **StartView** (`/`) - Startseite der Anwendung
- **HomeView** (`/app`) - Hauptmenü/Navigation (kein Dialog-System)
- **WarningView** (`/warning`) - Warngeräusch-Funktionalität
- **CommunicationView** (`/communication`) - Virtuelles Keyboard für freie Kommunikation

### 6.7.2 Einheitliche Dialog-Systeme

Die Anwendung verwendet einheitliche Dialog-Systeme für die Hauptfunktionen mit hierarchischer Satzbildung. Statt individueller Views für jeden Menüpunkt wurden zentrale Dialog-Systeme implementiert, die alle Schritte eines Dialogs in einer einzigen View handhaben.

Die Dialog-Systeme verwenden State Machines, um den Flow durch die verschiedenen Schritte zu verwalten. Jeder Dialog hat klare States (z.B. `mainView`, `subRegionView`, `painScaleView`, `confirmation`), die den aktuellen Schritt im Dialog repräsentieren.

**Hierarchische Satzbildung:**

Die Navigation durch die Dialog-Systeme erfolgt über ein hierarchisches System, das eine vollständige Satzbildung ermöglicht. Statt einzelner Wörter oder kurzer Befehle können Nutzer vollständige, grammatikalisch korrekte Sätze bilden, indem sie schrittweise durch Kategorien und Unterkategorien navigieren. Dies unterscheidet Ratatosk fundamental von herkömmlichen Assistenzsystemen.

**Beispiel: Schmerz-Dialog**
- **Schritt 1 (mainView)**: Auswahl der Hauptregion (z.B. "Kopf")
- **Schritt 2 (subRegionView)**: Auswahl der Unterregion (z.B. "Stirn")
- **Schritt 3 (painScaleView)**: Auswahl des Schmerzlevels (z.B. "6")
- **Schritt 4 (confirmation)**: Generierter Satz: "Der Patient hat Stirnschmerzen Level 6, mäßig bis stark."

Jeder Dialog verfügt über eine konsistente Struktur und nutzt das gleiche CSS-Grundgerüst (`DialogBase.css`), was die Wartbarkeit erheblich verbessert. Die Navigation zwischen den Dialogen wird über Vue Router realisiert, wobei jeder Dialog seine eigene Route erhält. Dies ermöglicht eine URL-basierte Navigation und direkte Verlinkbarkeit.

### 6.7.3 State Machine Pattern

Jeder Dialog verwendet eine State Machine, die den Flow durch die verschiedenen Schritte verwaltet. Die State Machine ist vollständig typisiert und bietet Methoden zum Wechseln zwischen States.

Die State Machine ist als Composable implementiert. Es gibt zwei Arten von Dialog-Machines:
- **Spezifische Dialog-Machines**: `usePainDialogMachine` (für Pain Dialog mit spezieller Pain Scale Logik)
- **Shared Dialog Machine**: `useDialogMachine` (wiederverwendbare Basis für SelfDialog und EnvironmentDialog)
- **Spezifische Implementierungen**: `useSelfDialogMachine` und `useEnvironmentDialogMachine` nutzen `useDialogMachine` als Basis

Dies macht die Dialog-Logik testbar und wartbar, während Code-Duplikation durch das shared `useDialogMachine` Composable vermieden wird.

**Konkrete Implementierung:**

**Shared Dialog Machine (`useDialogMachine`):**
Das shared Composable (`src/shared/composables/useDialogMachine.ts`) wird von SelfDialog und EnvironmentDialog verwendet und bietet eine wiederverwendbare Basis für Dialog-State-Machines. Es kapselt:
- Cancellation Token Support
- AutoMode-Koordination
- Navigation-Handling
- Confirmation-Flow
- Timer-Tracking

**Spezifische Dialog Machines:**
Die Pain Dialog State Machine (`src/features/pain-assessment/composables/usePainDialogMachine.ts`) implementiert einen klaren State-Flow:

```typescript
export type PainDialogState = 'mainView' | 'subRegionView' | 'painScaleView' | 'confirmation'

export function usePainDialogMachine() {
  // State
  const state = ref<PainDialogState>('mainView')
  const mainRegionId = ref<string | null>(null)
  const subRegionId = ref<string | null>(null)
  const painLevel = ref<number | null>(null)
  
  // Computed: Aktuelle Items basierend auf State
  const items = computed(() => {
    if (state.value === 'mainView') return dict.mainRegions
    if (state.value === 'subRegionView') return dict.getSubRegions(mainRegionId.value)
    if (state.value === 'painScaleView') return dict.painLevels
    return []
  })
  
  // Computed: Aktueller Titel basierend auf State
  const title = computed(() => {
    switch (state.value) {
      case 'mainView':
        return 'Wo haben Sie Schmerzen?'
      case 'subRegionView':
        return dict.getSubRegionViewTitle(mainRegionId.value)
      case 'painScaleView':
        return 'Wie stark sind Ihre Schmerzen?'
      case 'confirmation':
        return 'Bestätigung'
      default:
        return ''
    }
  })
  
  // Hauptregion auswählen
  async function selectMainRegion(id: string) {
    if (id === 'zurueck') return  // Blockiere "zurueck" in mainView
    
    autoMode.stop()
    mainRegionId.value = id
    state.value = 'subRegionView'
    autoMode.index.value = 0  // Index explizit auf 0 setzen
    
    await tts.speak(title.value)
    
    // Starte AutoMode nach 3 Sekunden
    scheduleTimer(() => {
      if (state.value === 'subRegionView') {
        autoMode.index.value = 0
        autoMode.start(true)  // skipTitle = true, da Titel bereits gesprochen
      }
    }, 3000)
  }
  
  // Unterregion auswählen
  async function selectSubRegion(id: string) {
    autoMode.stop()
    
    if (id === 'zurueck') {
      mainRegionId.value = null
      state.value = 'mainView'
      autoMode.index.value = 0
      await tts.speak(title.value)
      scheduleTimer(() => {
        if (state.value === 'mainView') {
          autoMode.index.value = 0
          autoMode.start(true)
        }
      }, 3000)
      return
    }
    
    subRegionId.value = id
    state.value = 'painScaleView'
    autoMode.index.value = 0
    
    await tts.speak(title.value)
    scheduleTimer(() => {
      if (state.value === 'painScaleView') {
        autoMode.index.value = 0
        autoMode.start(true)
      }
    }, 3000)
  }
  
  // Schmerzlevel auswählen
  async function selectPainLevel(level: number) {
    autoMode.stop()
    painLevel.value = level
    state.value = 'confirmation'
    
    const textToSpeak = confirmationText.value || 'Ihre Angabe wurde gespeichert.'
    await tts.speak(textToSpeak)
    
    // Nach 5 Sekunden zurück zum Start
    scheduleTimer(() => {
      state.value = 'mainView'
      mainRegionId.value = null
      subRegionId.value = null
      painLevel.value = null
      autoMode.index.value = 0
      
      tts.speak(title.value)
      scheduleTimer(() => {
        if (state.value === 'mainView') {
          autoMode.index.value = 0
          autoMode.start(true)
        }
      }, 3000)
    }, 5000)
  }
  
  return {
    state: computed(() => state.value),
    items,
    title,
    selectMainRegion,
    selectSubRegion,
    selectPainLevel,
    // ...
  }
}
```

Diese Implementierung stellt sicher, dass:
1. Der State-Flow klar und vorhersagbar ist
2. Jeder State-Transition explizit den Index auf 0 setzt
3. AutoMode nur gestartet wird, wenn der Dialog noch aktiv ist
4. Alle Timer korrekt getrackt und beim Cleanup gestoppt werden

### 6.7.4 Konsistente Dialog-Navigation

Alle Dialoge verwenden die gleiche Navigationslogik. Wenn ein Benutzer eine Auswahl trifft, wird der State aktualisiert, TTS spricht den neuen Titel, und AutoMode startet für die neuen Items. Dies gewährleistet eine konsistente Benutzererfahrung über alle Dialoge hinweg.

### 6.7.5 Dialog-Dictionary-System und Grammatik-System

Ein Dictionary-System wurde implementiert, das alle Texte und Grammatik-Regeln für jeden Dialog kapselt. Jeder Dialog hat sein eigenes Dictionary (z.B. `usePainDictionary`, `useIchDictionary`, `useUmgebungDictionary`), das Methoden zum Generieren von Titeln, Bestätigungstexten und anderen dynamischen Texten bietet.

Das Dictionary-System ermöglicht es, Texte zentral zu verwalten und einfach anzupassen. Es unterstützt auch komplexe Grammatik-Regeln, wie z.B. die Generierung von Bestätigungstexten basierend auf ausgewählten Regionen und Schmerzleveln.

**Konkrete Implementierung:**

Das Pain Dictionary (`src/features/pain-assessment/composables/usePainDictionary.ts`) kapselt alle Texte und Grammatik-Regeln:

```typescript
export function usePainDictionary() {
  // Gibt die Sub-Region für eine Main-Region-ID zurück
  function getSubRegions(mainRegionId: string | null) {
    if (!mainRegionId) return []
    return subRegionMap[mainRegionId] ?? []
  }
  
  // Generiert Bestätigungstext mit korrekter Grammatik
  function generateConfirmation(subRegionId: string | null, painLevel: number | null): string {
    if (!subRegionId || painLevel === null) return 'Ihre Angabe wurde gespeichert.'
    
    const subRegion = findSubRegion(subRegionId)
    const painLevelObj = findPainLevel(painLevel)
    
    if (!subRegion || !painLevelObj) return 'Ihre Angabe wurde gespeichert.'
    
    // Verwende Grammatik-Service für korrekte Textgenerierung
    return generatePainConfirmationText(
      subRegionId,
      subRegion.title,
      painLevel,
      painLevelObj.description
    )
  }
  
  // Gibt den Titel für eine Sub-Region-View zurück (mit korrekter Grammatik)
  function getSubRegionViewTitle(mainRegionId: string | null): string {
    if (!mainRegionId) return 'Wählen Sie einen Bereich aus.'
    
    const region = findMainRegion(mainRegionId)
    if (!region) return 'Wählen Sie einen Bereich aus.'
    
    // ✅ Korrekte deutsche Grammatik für Singular/Plural
    const pluralRegions = ['beine', 'arme']  // Plural-Regionen
    const isPlural = pluralRegions.includes(mainRegionId)
    
    if (isPlural) {
      // Plural-Form: "an den Beinen", "an den Armen"
      const pluralForm = mainRegionId === 'beine' ? 'Beinen' : 'Armen'
      return `Wählen Sie einen Bereich an den ${pluralForm} aus.`
    } else {
      // Singular-Form: "im Kopf", "im Torso"
      return `Wählen Sie einen Bereich im ${region.title} aus.`
    }
  }
  
  return {
    mainRegions,
    painLevels,
    subRegionMap,
    getSubRegions,
    findSubRegion,
    findPainLevel,
    findMainRegion,
    generateConfirmation,
    getSubRegionViewTitle,
  }
}
```

Diese Implementierung stellt sicher, dass:
1. Alle Texte zentral verwaltet werden
2. Grammatik-Regeln korrekt angewendet werden (Singular/Plural)
3. Bestätigungstexte dynamisch generiert werden
4. Die UI-Logik von der Daten- und Sprachlogik getrennt ist

**Grammatik-System:**

Das grammatikalische System generiert aus den Nutzerauswahlen natürliche deutsche Sätze. Jedes Dialog-Feature verfügt über ein eigenes Grammar-System, das in separaten Dateien organisiert ist (z.B. `painAssessmentGrammar.ts`, `ichGrammar.ts`, `umgebungGrammar.ts`). Das System berücksichtigt Artikel, Präpositionen, Genus, Numerus und Satzstruktur.

**Beispiel: Grammatik-Regeln im Pain Dialog**
- Singular/Plural-Unterscheidung: "im Kopf" vs. "an den Beinen"
- Korrekte Präpositionen: "im Torso" vs. "an den Armen"
- Dynamische Satzgenerierung: "Stirn Schmerzlevel 6 - mäßig bis stark"

### 6.7.6 Timer-Tracking in Dialogen

Alle Dialoge verwenden das `useDialogTimerTracking` Composable, um Timer zu tracken und automatisch zu bereinigen. Dies verhindert, dass Timer im Hintergrund weiterlaufen, wenn ein Dialog verlassen wird, und gewährleistet eine saubere Ressourcenverwaltung.

## 6.8 Responsive Design und UI/UX

### 6.8.1 Umfassendes Responsive Design

Die Anwendung wurde mit einem umfassenden Responsive Design implementiert, das auf allen Gerätegrößen optimal funktioniert. Das Design verwendet CSS Grid und Flexbox für flexible Layouts, die sich automatisch an verschiedene Bildschirmgrößen anpassen.

Responsive Breakpoints wurden für Desktop (1200px+), Tablet (1024px), Mobile (600px) und Small Mobile (480px) definiert. Jeder Breakpoint hat optimierte Layouts, Schriftgrößen und Abstände.

### 6.8.2 CSS Custom Properties für Theming

Ein umfassendes Theme-System wurde mit CSS Custom Properties implementiert. Alle Farben, Abstände und Schriftgrößen werden als CSS-Variablen definiert, die einfach geändert werden können.

Das Theme-System unterstützt Light Mode und Dark Mode mit automatischem Wechsel basierend auf Systemeinstellungen. Alle Komponenten verwenden die Theme-Variablen, was eine konsistente Darstellung gewährleistet.

### 6.8.3 Modulare CSS-Architektur

Die CSS-Architektur ist vollständig modular organisiert. Jedes Feature hat seine eigenen Styles, und gemeinsame Styles werden in `shared/styles/` gespeichert. Die zentrale `DialogBase.css` enthält alle gemeinsamen Styles für Dialoge, was Konsistenz und Wiederverwendbarkeit gewährleistet.

Die CSS-Struktur verwendet BEM-ähnliche Namenskonventionen für bessere Wartbarkeit. Styles sind in logische Abschnitte unterteilt (Grundlegende Styles, Grid Container, Tile Styles, etc.), was die Navigation im Code erleichtert.

### 6.8.4 3D-Karussell-System

Ein innovatives 3D-Karussell-System wurde für mobile Geräte implementiert. Das Karussell verwendet CSS 3D-Transforms, um Items in einem 3D-Raum anzuzeigen, was eine moderne, ansprechende Benutzererfahrung bietet.

Das Karussell-System ist vollständig responsive und wechselt automatisch zwischen Desktop-Grid und Mobile-Karussell basierend auf der Bildschirmgröße. Es unterstützt Touch-Gesten für Swipe-Navigation und Auto-Scroll für automatische Navigation.

### 6.8.5 Konsistente Kachel-Designs

Alle Dialoge verwenden konsistente Kachel-Designs mit einheitlichen Größen, Abständen und Styling. Die Kacheln verwenden SVG-Icons für scharfe Darstellung auf allen Auflösungen und unterstützen sowohl Light als auch Dark Mode.

Die Kacheln haben sanfte Transitions für Hover- und Active-States, die die Benutzererfahrung verbessern, ohne ablenkend zu sein. Die aktive Kachel wird visuell hervorgehoben, um dem Benutzer zu zeigen, welches Item gerade ausgewählt ist.

### 6.8.6 Pain Scale Visualisierung

Eine innovative Pain Scale Visualisierung wurde implementiert, die Schmerzlevel visuell darstellt. Die Pain Scale Bar ist 290% breit und perfekt zentriert, mit schwarzen aktiven Zahlen, die deutlich sichtbar sind.

Die Pain Scale verwendet eine Progress Bar mit Zahlen, die den aktuellen Schmerzlevel anzeigen. Die Zahlen sind 50% größer als der Standard-Text und werden in Schwarz dargestellt, wenn sie aktiv sind, was hohen Kontrast und gute Lesbarkeit gewährleistet.

### 6.8.7 Screen-Fit und Viewport-Optimierung

Die Anwendung wurde für optimalen Screen-Fit optimiert. Alle Layouts passen sich automatisch an die verfügbare Viewport-Größe an, ohne Scrollbalken zu erzeugen. Dies gewährleistet, dass die gesamte Anwendung auf einem Bildschirm sichtbar ist, ohne dass der Benutzer scrollen muss.

Die Viewport-Optimierung verwendet `clamp()` Funktionen für responsive Größen, die sich automatisch an verschiedene Bildschirmgrößen anpassen. Dies gewährleistet, dass die Anwendung auf allen Geräten optimal aussieht.

## 6.9 State Management mit Pinia

### 6.9.1 Zentralisierter Settings Store

Ein zentralisierter Settings Store wurde mit Pinia implementiert, der alle Anwendungseinstellungen verwaltet. Der Store ist vollständig typisiert und bietet reaktive Getter und Actions für alle Einstellungen.

Der Settings Store persistiert automatisch alle Einstellungen in localStorage, sodass Benutzereinstellungen zwischen Sitzungen erhalten bleiben. Der Store bietet Methoden zum Aktualisieren, Zurücksetzen und Laden von Einstellungen.

### 6.9.2 Reaktive Einstellungen

Alle Einstellungen sind vollständig reaktiv und aktualisieren die Anwendung automatisch, wenn sie geändert werden. Wenn z.B. das Theme geändert wird, aktualisiert sich die gesamte Anwendung sofort.

Der Store bietet computed Properties für abgeleitete Werte, wie z.B. `isDarkMode`, das basierend auf dem Theme-Wert berechnet wird. Dies ermöglicht es Komponenten, einfach auf Einstellungsänderungen zu reagieren.

### 6.9.3 Einstellungs-Kategorien

Einstellungen sind in logische Kategorien organisiert (Theme, Keyboard, Blink, AutoMode, Accessibility, etc.), was die Verwaltung erleichtert. Jede Kategorie hat ihre eigenen Standardwerte und Validierungsregeln.

## 6.10 Performance-Optimierungen

### 6.10.1 Lazy Loading von Komponenten

Komponenten werden lazy geladen, um die initiale Ladezeit zu reduzieren. Nur die Komponenten, die für die aktuelle Route benötigt werden, werden geladen, was die Performance erheblich verbessert.

### 6.10.2 Optimierte Animationen

Alle Animationen verwenden CSS Transforms und Opacity, die von der GPU beschleunigt werden. Dies gewährleistet flüssige Animationen auch auf leistungsschwächeren Geräten.

Die Animationen verwenden `will-change` und `backface-visibility` für optimale Performance. Transitions sind kurz und präzise, um eine schnelle, responsive Benutzererfahrung zu gewährleisten.

### 6.10.3 Effiziente Reaktivität

Vue's Reaktivitätssystem wird effizient genutzt, um unnötige Re-Renderings zu vermeiden. Computed Properties werden nur neu berechnet, wenn ihre Abhängigkeiten sich ändern, was die Performance verbessert.

### 6.10.4 Memory Management

Umfassendes Memory Management wurde implementiert, um Memory Leaks zu vermeiden. Alle Event Listener, Timer und Subscriptions werden korrekt bereinigt, wenn Komponenten unmounted werden.

Das Lifecycle-Management ist vollständig in Vue's Lifecycle Hooks integriert. `onUnmounted` wird verwendet, um alle Ressourcen zu bereinigen, die während des Component Lifecycles erstellt wurden.

### 6.10.5 Timer-Cleanup-System

Das `useDialogTimerTracking` Composable stellt sicher, dass alle Timer korrekt getrackt und beim Cleanup gestoppt werden. Dies verhindert Memory Leaks, die durch laufende Timer verursacht werden können.

## 6.11 Accessibility und Barrierefreiheit

### 6.11.1 Hoher Kontrast

Die Anwendung verwendet hohe Kontrastverhältnisse für alle Texte und UI-Elemente, was die Lesbarkeit für Benutzer mit Sehbehinderungen verbessert. Das Theme-System unterstützt einen High-Contrast-Modus, der noch höhere Kontraste bietet.

### 6.11.2 Große, lesbare Schriftarten

Alle Schriftarten sind groß und lesbar, mit einer Mindestgröße von 1rem. Die Schriftgrößen skalieren responsiv, bleiben aber immer über dem Minimum für gute Lesbarkeit.

### 6.11.3 Keyboard Navigation

Die Anwendung unterstützt vollständige Keyboard-Navigation für Benutzer, die keine Maus oder Touch verwenden können. Alle interaktiven Elemente sind über die Tastatur erreichbar und können mit Enter oder Leertaste aktiviert werden.

Die Keyboard-Navigation ist vollständig in alle Dialoge integriert. Benutzer können mit den Pfeiltasten zwischen Items navigieren und mit Enter oder Leertaste eine Auswahl treffen. Die Escape-Taste navigiert zurück zur vorherigen Ansicht.

### 6.11.4 Screen Reader Support

Die Anwendung ist vollständig mit Screen Readern kompatibel. Alle UI-Elemente haben aussagekräftige Labels und ARIA-Attribute, die Screen Readern helfen, die Anwendung zu verstehen.

### 6.11.5 Reduced Motion Support

Die Anwendung respektiert die `prefers-reduced-motion` Media Query und reduziert Animationen für Benutzer, die empfindlich auf Bewegung reagieren. Wenn Reduced Motion aktiviert ist, werden Animationen vereinfacht oder deaktiviert.

### 6.11.6 Multiple Eingabemethoden

Die Anwendung unterstützt mehrere Eingabemethoden, um verschiedenen Benutzerbedürfnissen gerecht zu werden:
- **Blinzeln**: Primäre Eingabemethode für Benutzer mit eingeschränkter Bewegungsfähigkeit
- **Mausklick**: Alternative Eingabemethode für Benutzer mit Mauszugang
- **Touch**: Native Touch-Events für mobile Geräte
- **Keyboard**: Vollständige Keyboard-Navigation

## 6.12 Browser-Kompatibilität

### 6.12.1 Cross-Browser Testing

Die Anwendung wurde umfassend auf verschiedenen Browsern getestet, einschließlich Chrome, Firefox, Safari und Edge. Browser-spezifische Unterschiede wurden identifiziert und behoben.

### 6.12.2 Feature Detection

Umfassende Feature Detection wurde implementiert, um sicherzustellen, dass die Anwendung auch auf Browsern funktioniert, die nicht alle Features unterstützen. Wenn ein Feature nicht verfügbar ist, fällt die Anwendung elegant auf alternative Methoden zurück.

### 6.12.3 Safari-spezifische Optimierungen

Spezielle Optimierungen für Safari wurden implementiert, da Safari besondere Anforderungen an Kamera-Zugriff und Video-Initialisierung hat. Die Implementierung erkennt automatisch Safari und verwendet Safari-kompatible Constraints und Initialisierungsmethoden.

### 6.12.4 iPhone Kamera-Unterstützung

Spezielle Unterstützung für iPhone-Kameras wurde implementiert, um sicherzustellen, dass die Gesichtserkennung auch auf iOS-Geräten optimal funktioniert. Die Kamera-Konfiguration berücksichtigt iOS-spezifische Anforderungen und verwendet Safari-kompatible Constraints.

Die Implementierung verwendet mehrere Fallback-Strategien, um sicherzustellen, dass die Kamera auch auf verschiedenen iOS-Versionen funktioniert. Es werden verschiedene Constraint-Kombinationen ausprobiert, bis eine funktionierende Konfiguration gefunden wird.

## 6.13 Code-Qualität und Wartbarkeit

### 6.13.1 Konsistente Code-Struktur

Die gesamte Codebasis folgt einer konsistenten Struktur und Namenskonventionen. Alle Dateien sind logisch organisiert und haben klare, aussagekräftige Namen.

### 6.13.2 Umfassende Dokumentation

Alle wichtigen Funktionen und Komponenten sind umfassend dokumentiert. JSDoc-Kommentare erklären Parameter, Rückgabewerte und Verwendung. Komplexe Logik ist mit Inline-Kommentaren erklärt.

### 6.13.3 TypeScript für bessere Code-Qualität

TypeScript wird konsequent verwendet, um Typsicherheit zu gewährleisten und Fehler zur Compile-Zeit zu finden. Alle Funktionen, Interfaces und Types sind vollständig typisiert.

### 6.13.4 Testbare Architektur

Die Architektur ist so gestaltet, dass alle Komponenten und Services einfach testbar sind. Composables können isoliert getestet werden, und Services haben klare Interfaces, die Mocking ermöglichen.

## 6.14 Besondere Raffinessen und Alleinstellungsmerkmale

### 6.14.1 Einzelne Augen-Blinzeln als Shortcuts

Eine innovative Funktionalität ist die Unterstützung für einzelne Augen-Blinzeln als Shortcuts. Das System erkennt separat, ob das linke oder rechte Auge zwinkert, und kann verschiedene Aktionen auslösen. Dies ermöglicht es Benutzern, schnell zwischen verschiedenen Funktionen zu navigieren, ohne beide Augen schließen zu müssen.

Die Implementierung verwendet eine separate Dauer von 1,5 Sekunden für einzelne Augen-Blinzeln, um versehentliche Auslösungen zu vermeiden. Das `useSingleEyeBlinkHandler` Composable bietet eine saubere Schnittstelle für die Verwendung dieser Funktionalität.

### 6.14.2 Event-Konstanten (EVENTS) und Timing-Konstanten (TIMING)

Ein zentrales Event-Konstanten-System wurde implementiert, das alle Magic Strings im Codebase eliminiert. Statt String-Literale wie `'faceBlinkDetected'` werden jetzt typisierte Konstanten verwendet.

Zusätzlich wurden Timing-Konstanten implementiert, die alle Magic Numbers für Delays, Timeouts und Intervalle zentralisieren.

**Konkrete Implementierung:**

Die `EVENTS` Konstanten (`src/shared/constants/events.ts`) definieren alle Event-Namen:

```typescript
export const EVENTS = {
  /**
   * Face Recognition Events
   */
  FACE_BLINK_DETECTED: 'faceBlinkDetected',
  FACE_SINGLE_EYE_BLINK_DETECTED: 'faceSingleEyeBlinkDetected',
  
  /**
   * Input Events
   */
  INPUT_SELECT: 'inputSelect',
  INPUT_CANCEL: 'inputCancel',
  
  /**
   * TTS Events
   */
  TTS_START: 'ttsStart',
  TTS_END: 'ttsEnd',
  TTS_ERROR: 'ttsError',
  
  /**
   * AutoMode Events
   */
  AUTO_MODE_START: 'autoModeStart',
  AUTO_MODE_STOP: 'autoModeStop',
} as const

// Typisierte Event-Namen
export type EventName = typeof EVENTS[keyof typeof EVENTS]
```

**Verwendung:**

```typescript
// Statt Magic String
window.addEventListener('faceBlinkDetected', handler)

// Jetzt mit Konstanten
import { EVENTS } from '../shared/constants/events'
window.addEventListener(EVENTS.FACE_BLINK_DETECTED, handler)
```

**Timing-Konstanten:**

Die `TIMING` Konstanten (`src/shared/constants/timing.ts`) definieren alle Timing-Werte:

```typescript
export const TIMING = {
  TTS: {
    DEFAULT_TIMEOUT: 10000,
    RETRY_DELAY: 1000,
    MAX_RETRIES: 3,
    EMPTY_TEXT_DELAY: 500
  },
  AUTO_MODE: {
    INITIAL_DELAY: 3000,
    CYCLE_DELAY: 3000,
    RETRY_DELAY: 100
  },
  INPUT: {
    BLINK_COOLDOWN: 300,
    SINGLE_EYE_COOLDOWN: 500,
    TOUCH_SWIPE_THRESHOLD: 50,
    TOUCH_DURATION_MAX: 500
  },
  DIALOG: {
    CONFIRMATION_RESET_DELAY: 3000,
    AUTO_MODE_START_DELAY: 3000,
    TRANSITION_DELAY: 300
  }
} as const
```

**Vorteile:**
1. **Typsicherheit**: TypeScript kann Event-Namen und Timing-Werte validieren
2. **Refactoring-sicher**: Umbenennungen werden automatisch überall aktualisiert
3. **Keine Tippfehler**: Compiler fängt falsche Event-Namen und Magic Numbers ab
4. **Zentrale Verwaltung**: Alle Event-Namen und Timing-Werte an einem Ort
5. **Konsistenz**: Einheitliche Timing-Werte im gesamten Codebase

### 6.14.3 Dialog Timer Tracking mit TimerManager

Das Dialog Timer Tracking System nutzt jetzt `TimerManager` und `UnifiedCleanup` für vereinfachte Implementierung und automatisches Cleanup. Dies verhindert Memory Leaks und gewährleistet, dass keine Timer im Hintergrund weiterlaufen, wenn ein Dialog verlassen wird.

### 6.14.4 Router Guards mit automatischem Cleanup

Navigation Guards wurden implementiert, die automatisch alle laufenden Services stoppen, wenn zwischen Routen navigiert wird. Dies verhindert, dass Views im Hintergrund weiterlaufen und stellt sicher, dass alle Ressourcen korrekt bereinigt werden.

Die Guards rufen auch View-spezifische Cleanup-Funktionen auf, die in `window` gespeichert sind. Dies ermöglicht es jedem View, seine eigenen Ressourcen zu bereinigen.

### 6.14.5 Zentrale Service-Verwaltung

Die `App.vue` Komponente bietet eine zentrale `stopAllServices()` Funktion, die alle laufenden Services stoppt. Diese Funktion wird vor jeder Navigation aufgerufen und stellt sicher, dass keine Services im Hintergrund weiterlaufen.

Die Funktion stoppt:
- Alle TTS-Ausgaben (SimpleFlowController und Browser API)
- Alle AutoMode-Zyklen
- Alle Timer
- Alle View-spezifischen Cleanup-Funktionen

### 6.14.6 Präzise TTS-AutoMode-Synchronisation

Die präzise Synchronisation zwischen TTS und AutoMode ist ein Alleinstellungsmerkmal. Das System wartet, bis die Sprachausgabe vollständig abgeschlossen ist, bevor es zum nächsten Item wechselt, was eine flüssige, vorhersagbare Benutzererfahrung gewährleistet.

### 6.14.7 Einheitliche Dialog-Architektur

Die einheitliche Dialog-Architektur mit State Machines ist ein Alleinstellungsmerkmal. Alle Dialoge verwenden die gleiche Struktur und Logik, was eine konsistente Benutzererfahrung und einfache Wartbarkeit gewährleistet.

### 6.14.8 Modulares Service- und Composable-System

Das modulare System besteht aus zentralen Services und wiederverwendbaren Composables:

**Zentrale Services:**
- **TTSService**: Zentrale TTS-Logik für alle Komponenten (SpeechSynthesis API)
- **TimerManager**: Vereinheitlichtes Timer-Management
- **SimpleFlowController**: Zentrale Flow-Verwaltung für HomeView-Navigation
- **InputManager**: Zentrale Input-Abstraktion für alle Eingabemethoden
- **ViewCleanupRegistry**: View-scoped Cleanup für Navigation

**Composables:**
- **useAutoMode**: Wiederverwendbares AutoMode-System
- **useInputManager**: Vue Composable für InputManager (wird in allen Views verwendet)
- **useFaceRecognition**: Gesichtserkennung
- **useSingleEyeBlinkHandler**: Einzelne Augen-Blinzeln
- **useDialogTimerTracking**: Dialog Timer Tracking
- **useCleanup**: Component-scoped Cleanup

Diese Services und Composables können in jedem Feature verwendet werden, ohne Code zu duplizieren. Die zentralen Services eliminieren Duplikation, während die Composables wiederverwendbare Logik kapseln.

### 6.14.9 3D-Karussell für Mobile

Das innovative 3D-Karussell-System für mobile Geräte bietet eine moderne, ansprechende Benutzererfahrung. Das Karussell verwendet CSS 3D-Transforms für realistische 3D-Effekte und unterstützt Touch-Gesten für intuitive Navigation.

### 6.14.10 Zentrale Input-Abstraktion mit InputManager

Die zentrale Input-Abstraktion über den **InputManager** ermöglicht es, alle Eingabemethoden (Blinzeln, Mausklick, Touch, alternative Sensoren) über eine einheitliche Schnittstelle zu behandeln. **Alle Views** nutzen den InputManager, was eine konsistente Input-Behandlung gewährleistet. Dies vereinfacht die Code-Logik erheblich und macht die Anwendung robuster.

**Alternative Sensoren:**
Der InputManager unterstützt alternative Eingabegeräte (wie Balldrucksensor) über den Rechtsklick-Mechanismus. Die Architektur ermöglicht es, Hardware-Sensoren später ohne strukturellen Umbau zu integrieren.

### 6.14.11 Dictionary-System für dynamische Texte

Das Dictionary-System ermöglicht es, alle Texte und Grammatik-Regeln zentral zu verwalten. Jeder Dialog hat sein eigenes Dictionary, das Methoden zum Generieren von Titeln, Bestätigungstexten und anderen dynamischen Texten bietet.

### 6.14.12 Theme-System mit CSS Custom Properties

Das umfassende Theme-System mit CSS Custom Properties ermöglicht es, das gesamte Design einfach anzupassen. Alle Farben, Abstände und Schriftgrößen werden als CSS-Variablen definiert, die einfach geändert werden können.

### 6.14.13 Zentrale Service-Architektur

Die Anwendung nutzt eine zentrale Service-Architektur mit mehreren Ebenen:

**Core Services:**
- **TTSService**: Zentrale TTS-Logik (SpeechSynthesis API, ersetzt duplizierte TTS-Implementierungen)
- **TimerManager**: Vereinheitlichtes Timer-Management (ersetzt `setTimeout`/`setInterval` überall)
- **SimpleFlowController**: Zentrale Queue-Verwaltung für HomeView-Navigation (Singleton)
- **InputManager**: Zentrale Input-Abstraktion (wird in allen Views verwendet, unterstützt alternative Sensoren)

**Utilities:**
- **UnifiedCleanup**: Vereinheitlichtes Cleanup-System (CleanupCoordinator + ViewCleanupRegistry)
- **EVENTS**: Event-Konstanten (eliminiert Magic Strings)
- **TIMING**: Timing-Konstanten (eliminiert Magic Numbers)

Diese Architektur gewährleistet:
1. **Keine Code-Duplikation**: TTS, Timer, Cleanup sind zentralisiert
2. **Konsistente Patterns**: Alle Komponenten nutzen die gleichen Utilities
3. **Typsicherheit**: Alle Services sind vollständig typisiert
4. **Einfache Wartbarkeit**: Änderungen an einem zentralen Ort wirken sich überall aus
5. **Memory Leak Prevention**: Automatisches Tracking und Cleanup

## 6.15 Unified Cleanup System

### 6.15.1 Zentrale Cleanup-Architektur

Ein umfassendes `UnifiedCleanup` System wurde implementiert, das alle Cleanup-Patterns vereinheitlicht. Das System besteht aus:

1. **CleanupCoordinator**: Basis-Implementierung für scoped Cleanup
2. **ViewCleanupRegistry**: View-scoped Cleanup für Navigation
3. **useCleanup**: Vue Composable für Component-scoped Cleanup

**Konkrete Implementierung:**

Das `UnifiedCleanup` System (`src/shared/utils/UnifiedCleanup.ts`) bietet drei Ebenen:

```typescript
/**
 * CleanupCoordinator - Basis für alle Cleanup-Operationen
 */
export class CleanupCoordinator implements CleanupScope {
  private cleanups = new Map<string, CleanupFunction>()
  private cleanedUp = false

  /**
   * Registriert Cleanup-Funktion
   */
  register(cleanup: CleanupFunction, name?: string): void {
    if (this.cleanedUp) {
      console.warn(`${this.context}: Already cleaned up, ignoring registration`)
      return
    }
    const cleanupName = name ?? `cleanup_${++this.cleanupCount}`
    this.cleanups.set(cleanupName, cleanup)
  }

  /**
   * Führt alle Cleanups aus
   */
  async execute(): Promise<void> {
    if (this.cleanedUp) return
    
    this.cleanedUp = true
    const errors: Array<{ name: string; error: unknown }> = []
    
    // Führe alle Cleanups parallel mit Timeout aus
    const cleanupPromises = Array.from(this.cleanups.entries()).map(
      async ([name, cleanup]) => {
        try {
          await this.executeWithTimeout(cleanup, name, 1000)
        } catch (error) {
          errors.push({ name, error })
        }
      }
    )
    
    await Promise.allSettled(cleanupPromises)
    this.cleanups.clear()
  }

  /**
   * Shortcuts für häufige Cleanup-Typen
   */
  registerTimer(handle: TimerHandle, name?: string): void {
    this.register(() => handle.cancel(), name ?? 'timer')
  }

  registerEventListener(
    target: EventTarget,
    event: string,
    handler: EventListener,
    name?: string
  ): void {
    this.register(
      () => target.removeEventListener(event, handler),
      name ?? `event_${event}`
    )
  }
}

/**
 * ViewCleanupRegistry - View-scoped Cleanup für Navigation
 */
class ViewCleanup {
  private coordinators = new Map<string, CleanupCoordinator>()

  register(viewName: string, cleanup: CleanupFunction): void {
    const coordinator = this.getOrCreate(viewName)
    coordinator.register(cleanup, `${viewName}-cleanup`)
  }

  async cleanup(viewName: string): Promise<void> {
    const coordinator = this.coordinators.get(viewName)
    if (!coordinator) return
    
    await coordinator.execute()
    this.coordinators.delete(viewName)
  }
}

/**
 * Vue Composable für Component-scoped Cleanup
 */
export function useCleanup(context: string = 'Component'): CleanupScope {
  const coordinator = new CleanupCoordinator(context)

  onUnmounted(() => {
    // onUnmounted kann nicht async sein - führe Cleanup im Hintergrund aus
    coordinator.execute().catch(error => {
      console.error(`${context}: Cleanup error in onUnmounted:`, error)
    })
  })

  return coordinator
}

export const ViewCleanupRegistry = new ViewCleanup()
```

### 6.15.2 Verwendung in Views

Alle Views registrieren ihre Cleanup-Funktionen in `onMounted`:

```typescript
// WarningView.vue
onMounted(async () => {
  const cleanupEventListeners = await setupWarningSystem()
  
  // Registriere Cleanup in UnifiedCleanup
  ViewCleanupRegistry.register('warning', async () => {
    if (cleanupEventListeners) {
      cleanupEventListeners()
    }
    cleanup()
  })
})

onUnmounted(() => {
  // Fallback-Cleanup (Router-Guard räumt normalerweise auf)
  if (ViewCleanupRegistry.hasCleanup('warning')) {
    ViewCleanupRegistry.cleanup('warning').catch(error => {
      console.error('WarningView: Cleanup error:', error)
    })
  }
})
```

### 6.15.3 Router Guards mit UnifiedCleanup

Der Router nutzt `ViewCleanupRegistry` für automatisches Cleanup:

```typescript
router.beforeEach(async (to, from, next) => {
  if (from.name && from.name !== to.name) {
    // View räumt sich selbst auf via UnifiedCleanup
    const fromName = String(from.name)
    await ViewCleanupRegistry.cleanup(fromName)
    
    // Global State zurücksetzen
    simpleFlowController.setActiveView('')
    
    next()
  } else {
    next()
  }
})
```

### 6.15.4 Component-scoped Cleanup

Composables nutzen `useCleanup` für automatisches Cleanup:

```typescript
// useDialogTimerTracking.ts
export function useDialogTimerTracking(config: DialogTimerTrackingConfig = {}) {
  const cleanup = useCleanup(dialogName)
  
  // Timer automatisch registrieren
  const handle = timerManager.setTimeout(callback, delay)
  cleanup.registerTimer(handle, `timer_${delay}ms`)
  
  // Event Listener automatisch registrieren
  cleanup.registerEventListener(window, 'resize', handler, 'resize')
}
```

**Vorteile:**
1. **Einheitliches Pattern**: Alle Cleanup-Operationen nutzen die gleiche API
2. **Automatisches Tracking**: Timer, Event Listener, etc. werden automatisch getrackt
3. **Fehlerbehandlung**: Timeouts und Error-Handling sind eingebaut
4. **Memory Leak Prevention**: Automatische Bereinigung beim Component-Unmount
5. **View-scoped Cleanup**: Router-Guards können Views automatisch aufräumen

## 6.16 Stumm-Modus (Mute-Funktionalität)

### 6.16.1 Globale Mute-Funktionalität

Eine globale Mute-Funktionalität wurde implementiert, die es ermöglicht, TTS systemweit zu deaktivieren, ohne die Funktionalität zu beeinträchtigen. Der Mute-Button befindet sich im AppHeader und ist von jeder Seite aus erreichbar.

Wenn TTS stumm geschaltet ist, werden alle TTS-Aufrufe mit Volume 0 ausgeführt. Dies bedeutet, dass die Synchronisation mit AutoMode aufrechterhalten wird, ohne hörbare Ausgabe zu erzeugen. Dies ist wichtig, da AutoMode auf TTS-Promises wartet, um zum nächsten Item zu wechseln.

### 6.16.2 SimpleFlowController Mute-Integration

Der SimpleFlowController bietet eine `setTTSMuted()` Methode, die den Mute-Status systemweit setzt. Wenn TTS stumm geschaltet ist, werden alle neuen TTS-Aufrufe mit Volume 0 erstellt.

Zusätzlich stoppt `setTTSMuted(true)` alle laufenden TTS-Ausgaben sofort. Dies gewährleistet, dass wenn ein Benutzer TTS stumm schaltet, alle laufenden Ausgaben sofort beendet werden.

### 6.16.3 Persistenz des Mute-Status

Der Mute-Status wird im SimpleFlowController gespeichert und zwischen Sitzungen erhalten. Wenn ein Benutzer TTS stumm schaltet, bleibt dieser Status auch nach einem Neuladen der Seite erhalten.

### 6.16.4 Visuelles Feedback

Der Volume-Button im AppHeader zeigt visuelles Feedback für den aktuellen Mute-Status:
- **Aktiv**: Lautsprecher-Icon mit Wellen
- **Stumm**: Lautsprecher-Icon mit durchgestrichenen Wellen

Der Button hat auch einen `active` CSS-Klassenzustand, der visuell anzeigt, ob TTS aktiviert oder deaktiviert ist.

## 6.17 Keyboard Shortcuts und Tastatur-Navigation

### 6.17.1 Umfassende Keyboard-Unterstützung

Die Anwendung bietet umfassende Keyboard-Navigation für Benutzer, die keine Maus oder Touch verwenden können. Alle interaktiven Elemente sind über die Tastatur erreichbar und können mit Enter oder Leertaste aktiviert werden.

Die Keyboard-Navigation ist vollständig in alle Dialoge integriert. Benutzer können mit den Pfeiltasten zwischen Items navigieren und mit Enter oder Leertaste eine Auswahl treffen. Die Escape-Taste navigiert zurück zur vorherigen Ansicht.

### 6.17.2 Keyboard Shortcuts im HomeView

Im HomeView sind folgende Keyboard Shortcuts implementiert:
- **Pfeiltasten (↑/↓)**: Navigation zwischen Menü-Items
- **Enter/Leertaste**: Auswahl des aktuellen Items
- **Escape**: Zurück zur Startseite

Die Keyboard-Navigation ist vollständig mit dem AutoMode-System synchronisiert. Wenn ein Benutzer die Tastatur verwendet, wird AutoMode automatisch pausiert, um Konflikte zu vermeiden.

### 6.17.3 Keyboard-Navigation in Dialogen

Alle Dialoge unterstützen Keyboard-Navigation. Die Pfeiltasten navigieren zwischen den verfügbaren Optionen, und Enter/Leertaste bestätigt die Auswahl. Die Navigation ist konsistent über alle Dialoge hinweg.

### 6.17.4 TTS-Aktivierung durch Keyboard-Interaktion

Die Anwendung erkennt Keyboard-Interaktionen und aktiviert automatisch TTS, wenn ein Benutzer die Tastatur verwendet. Dies gewährleistet, dass TTS auch dann funktioniert, wenn es durch Browser-Policies zunächst blockiert wurde.

Ein globaler Event Listener überwacht Keyboard-Events (`keydown`) und aktiviert TTS bei der ersten Interaktion. Dies ist besonders wichtig für Browser, die TTS nur nach Benutzerinteraktion erlauben.

## 6.18 Dialog-spezifische Features

### 6.18.1 Pain Dialog Features

Der Pain Dialog bietet folgende spezifische Features:

**Hierarchische Navigation**: Drei Ebenen (Hauptregion → Unterregion → Schmerzlevel) mit klarer State Machine.

**Pain Scale Visualisierung**: Eine innovative Pain Scale Bar mit 290% Breite und perfekt zentrierten Zahlen.

**Dynamische Bestätigungstexte**: Das Dictionary-System generiert Bestätigungstexte basierend auf ausgewählten Regionen und Schmerzleveln (z.B. "Stirn Schmerzlevel 6 - mäßig bis stark").

**Auto-Reset**: Nach Bestätigung kehrt der Dialog automatisch zum Start zurück.

**Timer-Tracking**: Verwendet `useDialogTimerTracking` für sauberes Cleanup aller Timer.

### 6.18.2 Ich Dialog Features

Der Ich Dialog bietet folgende spezifische Features:

**Fünf Hauptkategorien**: Ernährung, Gefühle, Kleidung, Hygiene, Bewegung mit jeweils eigenen Unterkategorien.

**Grammatik-basierte Texte**: Das Dictionary-System generiert grammatisch korrekte Texte basierend auf ausgewählten Kategorien.

**Emoji-Unterstützung**: Emojis werden für visuelle Darstellung verwendet, wo passend.

**Timer-Tracking**: Verwendet `useDialogTimerTracking` für sauberes Cleanup.

### 6.18.3 Umgebung Dialog Features

Der Umgebung Dialog bietet folgende spezifische Features:

**Drei Ebenen**: Hauptkategorien → Unterkategorien → Verben mit hierarchischer Navigation.

**Verb-Integration**: Verben werden dynamisch mit Objekten kombiniert, um vollständige Sätze zu generieren.

**Flexible Grammatik**: Das Dictionary-System unterstützt komplexe Grammatik-Regeln für natürliche Satzgenerierung.

**Timer-Tracking**: Verwendet `useDialogTimerTracking` für sauberes Cleanup.

### 6.18.4 Settings Dialog Features

Der Settings Dialog bietet folgende spezifische Features:

**Konsolidiertes Dialog-System**: Alle Einstellungen in einem einheitlichen 3-Phasen-Dialog (Kategorie → Option → Bestätigung).

**Live-Anzeige aktueller Werte**: Jede Option zeigt den aktuellen Wert an (z.B. "Aktuell: 3 Sekunden").

**Emoji-Icons**: Alle Optionen haben Emoji-Icons für visuelle Darstellung.

**Persistenz**: Alle Einstellungen werden automatisch in localStorage gespeichert.

**Theme-Toggle**: Direkter Toggle zwischen Light und Dark Mode.

**Timer-Tracking**: Verwendet `useDialogTimerTracking` für sauberes Cleanup.

### 6.18.5 Warning View Features

Die Warning View bietet folgende spezifische Features:

**Warngeräusch**: Kontinuierliches Warngeräusch, das durch Blinzeln/Klick aktiviert und deaktiviert werden kann.

**State Machine**: Klare States (Greeting → Bell Idle → Bell Playing → Back Active) mit präzisen Transitions.

**AudioContext Management**: Sauberes Management des Web Audio API AudioContext mit korrektem Cleanup.

**iOS Safari Audio-Entlockung**: Spezielle Implementierung für iOS Safari, die den AudioContext bei der ersten User-Interaktion "entlockt". iOS Safari erfordert eine explizite User-Interaktion, bevor Audio abgespielt werden kann. Die Implementierung wartet aktiv, bis der AudioContext den State "running" erreicht, und spielt einen sehr kurzen, leisen Sound ab, um Audio zu aktivieren.

**InputManager-Integration**: Die Warning View nutzt den zentralen InputManager (umgestellt von `useBlinkInput()`), was eine konsistente Input-Behandlung gewährleistet.

**Auto-Reset**: Nach 2 Sekunden Pause nach Stoppen des Warngeräuschs kehrt AutoMode automatisch zurück.

### 6.18.6 Communication View Features

Die Communication View bietet folgende spezifische Features:

**Virtual Keyboard**: Vollständig funktionales virtuelles Keyboard mit drei Layouts (Alphabetisch, QWERTZ, Häufigkeit).

**Scanning-Modus**: Automatisches Scannen durch Zeilen und Buchstaben mit konfigurierbarer Geschwindigkeit.

**Text-Speicherung**: Persistente Text-Speicherung mit Möglichkeit zum Löschen und Senden.

**TTS-Integration**: Vollständige TTS-Integration für alle Eingaben und Bestätigungen.

**Keyboard-Design-Auswahl**: Benutzer können zwischen verschiedenen Keyboard-Layouts wählen.

**InputManager-Integration**: Die Communication View nutzt den zentralen InputManager (umgestellt von `useBlinkInput()`), was eine konsistente Input-Behandlung gewährleistet.

## 6.19 Zusammenfassung

Die Implementierung von Ratatosk Version 2.0 stellt eine vollständige Neuentwicklung dar, die auf modernen Web-Technologien und Best Practices basiert. Die modulare, feature-basierte Architektur ermöglicht eine saubere Trennung von Concerns und erleichtert die Wartbarkeit und Erweiterbarkeit erheblich.

**Zentrale Architektur-Improvements:**

Die Anwendung nutzt eine zentrale Service-Architektur mit:
- **TTSService**: Eliminiert Code-Duplikation zwischen verschiedenen TTS-Implementierungen (SpeechSynthesis API)
- **TimerManager**: Vereinheitlichtes Timer-Management verhindert Memory Leaks und Race Conditions
- **SimpleFlowController**: Zentrale Flow-Verwaltung für HomeView-Navigation (Singleton)
- **InputManager**: Zentrale Input-Abstraktion für alle Eingabemethoden (wird in allen Views verwendet, unterstützt alternative Sensoren)
- **UnifiedCleanup**: Einheitliches Cleanup-System für Component- und View-scoped Ressourcen
- **EVENTS**: Event-Konstanten eliminieren Magic Strings im gesamten Codebase
- **TIMING**: Timing-Konstanten eliminieren Magic Numbers

Die Verwendung von TypeScript, Vue 3 Composition API, Pinia und Vue Router gewährleistet eine robuste, typsichere und wartbare Codebasis. Die zentrale Service-Architektur eliminiert Code-Duplikation und gewährleistet konsistente Patterns im gesamten Codebase.

**Vollständige InputManager-Migration:**
Alle Views nutzen jetzt den zentralen InputManager (inkl. WarningView und CommunicationView, die von `useBlinkInput()` migriert wurden). Dies gewährleistet eine konsistente Input-Behandlung über die gesamte Anwendung hinweg und ermöglicht die einfache Integration alternativer Sensoren (wie Balldrucksensor) ohne strukturellen Umbau.

Die umfassende TTS-Integration über `TTSService` (SpeechSynthesis API), das wiederverwendbare AutoMode-System mit `TimerManager`, die zentrale Input-Abstraktion über `InputManager` (mit Unterstützung für alternative Sensoren), der `SimpleFlowController` für zentrale Flow-Verwaltung und die innovativen Features wie einzelne Augen-Blinzeln als Shortcuts sind Alleinstellungsmerkmale, die die Benutzererfahrung erheblich verbessern.

**Besondere Implementierungen:**
- **iOS Safari Audio-Entlockung**: Spezielle Implementierung für iOS Safari im WarningView, die den AudioContext bei der ersten User-Interaktion aktiviert
- **Vollständige InputManager-Migration**: Alle Views nutzen jetzt den zentralen InputManager (inkl. WarningView und CommunicationView)
- **Alternative Sensoren**: Rechtsklick-Mechanismus ermöglicht Hardware-Sensor-Integration ohne strukturellen Umbau

Das responsive Design, das umfassende Accessibility-System und die Browser-Kompatibilität gewährleisten, dass die Anwendung auf allen Geräten und für alle Benutzer optimal funktioniert. Die besonderen Raffinessen wie das UnifiedCleanup-System, die Router Guards mit automatischem Cleanup, die präzise TTS-AutoMode-Synchronisation und das 3D-Karussell-System machen die Anwendung zu einer modernen, benutzerfreundlichen Lösung für assistive Kommunikation.

Die Implementierung folgt konsequent Clean Code Prinzipien und Best Practices, was eine hohe Code-Qualität und Wartbarkeit gewährleistet. Die umfassende Dokumentation, die TypeScript-Typsicherheit, die zentrale Service-Architektur und die testbare Struktur machen die Anwendung zu einer soliden Basis für zukünftige Entwicklungen.

