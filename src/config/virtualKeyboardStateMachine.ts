/**
 * Technische Spezifikation: Virtuelle Tastatur State-Machine
 * Zustandslogik, Events, Transitions und Implementierungsdetails
 */

export enum VirtualKeyboardState {
  IDLE = 'idle',                    // Initialer Zustand
  INTRO = 'intro',                  // TTS-Einführung wird abgespielt
  ROW_SCANNING = 'row_scanning',    // Zeilen werden durchlaufen
  ROW_SELECTED = 'row_selected',    // Zeile wurde ausgewählt
  LETTER_SCANNING = 'letter_scanning', // Buchstaben werden durchlaufen
  LETTER_SELECTED = 'letter_selected', // Buchstabe wurde ausgewählt
  INACTIVITY = 'inactivity',        // Inaktivität erkannt
  ERROR = 'error'                   // Fehlerzustand
}

export enum VirtualKeyboardEvent {
  START = 'start',                  // Tastatur starten
  INTRO_COMPLETE = 'intro_complete', // Intro-TTS beendet
  ROW_TIMEOUT = 'row_timeout',      // Zeilen-Zeit abgelaufen
  LETTER_TIMEOUT = 'letter_timeout', // Buchstaben-Zeit abgelaufen
  USER_INPUT = 'user_input',        // Blinzeln oder Klick
  INACTIVITY_TIMEOUT = 'inactivity_timeout', // Inaktivitäts-Timeout
  RESET = 'reset',                  // Zurücksetzen
  ERROR_OCCURRED = 'error_occurred' // Fehler aufgetreten
}

export interface StateTransition {
  from: VirtualKeyboardState
  to: VirtualKeyboardState
  event: VirtualKeyboardEvent
  action?: () => Promise<void> | void
}

export interface KeyboardContext {
  currentRow: number
  currentLetter: number
  currentText: string
  hasHeardIntro: boolean
  lastActivity: number
  isTTSActive: boolean
  selectedRow: number | null
  selectedLetter: string | null
}

/**
 * State-Machine für virtuelle Tastatur
 */
export class VirtualKeyboardStateMachine {
  private currentState: VirtualKeyboardState = VirtualKeyboardState.IDLE
  private context: KeyboardContext
  private transitions: StateTransition[]
  private timers: Map<string, number> = new Map()
  private ttsController: any
  private onStateChange?: (state: VirtualKeyboardState, context: KeyboardContext) => void

  constructor(ttsController: any, onStateChange?: (state: VirtualKeyboardState, context: KeyboardContext) => void) {
    this.ttsController = ttsController
    this.onStateChange = onStateChange
    this.context = this.initializeContext()
    this.transitions = this.defineTransitions()
  }

  /**
   * Initialisiert den Kontext
   */
  private initializeContext(): KeyboardContext {
    return {
      currentRow: 0,
      currentLetter: 0,
      currentText: "Noch kein Text…",
      hasHeardIntro: this.checkIntroStatus(),
      lastActivity: Date.now(),
      isTTSActive: false,
      selectedRow: null,
      selectedLetter: null
    }
  }

  /**
   * Definiert alle möglichen Zustandsübergänge
   */
  private defineTransitions(): StateTransition[] {
    return [
      // IDLE → INTRO (beim Start)
      {
        from: VirtualKeyboardState.IDLE,
        to: VirtualKeyboardState.INTRO,
        event: VirtualKeyboardEvent.START,
        action: () => this.handleStart()
      },

      // INTRO → ROW_SCANNING (nach Intro)
      {
        from: VirtualKeyboardState.INTRO,
        to: VirtualKeyboardState.ROW_SCANNING,
        event: VirtualKeyboardEvent.INTRO_COMPLETE,
        action: () => this.handleIntroComplete()
      },

      // ROW_SCANNING → ROW_SCANNING (Zeit abgelaufen, nächste Zeile)
      {
        from: VirtualKeyboardState.ROW_SCANNING,
        to: VirtualKeyboardState.ROW_SCANNING,
        event: VirtualKeyboardEvent.ROW_TIMEOUT,
        action: () => this.handleRowTimeout()
      },

      // ROW_SCANNING → ROW_SELECTED (Benutzer wählt Zeile)
      {
        from: VirtualKeyboardState.ROW_SCANNING,
        to: VirtualKeyboardState.ROW_SELECTED,
        event: VirtualKeyboardEvent.USER_INPUT,
        action: () => this.handleRowSelection()
      },

      // ROW_SELECTED → LETTER_SCANNING (Zeile bestätigt)
      {
        from: VirtualKeyboardState.ROW_SELECTED,
        to: VirtualKeyboardState.LETTER_SCANNING,
        event: VirtualKeyboardEvent.ROW_TIMEOUT,
        action: () => this.handleRowSelected()
      },

      // LETTER_SCANNING → LETTER_SCANNING (Zeit abgelaufen, nächster Buchstabe)
      {
        from: VirtualKeyboardState.LETTER_SCANNING,
        to: VirtualKeyboardState.LETTER_SCANNING,
        event: VirtualKeyboardEvent.LETTER_TIMEOUT,
        action: () => this.handleLetterTimeout()
      },

      // LETTER_SCANNING → LETTER_SELECTED (Benutzer wählt Buchstabe)
      {
        from: VirtualKeyboardState.LETTER_SCANNING,
        to: VirtualKeyboardState.LETTER_SELECTED,
        event: VirtualKeyboardEvent.USER_INPUT,
        action: () => this.handleLetterSelection()
      },

      // LETTER_SELECTED → ROW_SCANNING (Buchstabe verarbeitet)
      {
        from: VirtualKeyboardState.LETTER_SELECTED,
        to: VirtualKeyboardState.ROW_SCANNING,
        event: VirtualKeyboardEvent.ROW_TIMEOUT,
        action: () => this.handleLetterSelected()
      },

      // ROW_SCANNING → INACTIVITY (Inaktivität erkannt)
      {
        from: VirtualKeyboardState.ROW_SCANNING,
        to: VirtualKeyboardState.INACTIVITY,
        event: VirtualKeyboardEvent.INACTIVITY_TIMEOUT,
        action: () => this.handleInactivity()
      },

      // LETTER_SCANNING → INACTIVITY (Inaktivität erkannt)
      {
        from: VirtualKeyboardState.LETTER_SCANNING,
        to: VirtualKeyboardState.INACTIVITY,
        event: VirtualKeyboardEvent.INACTIVITY_TIMEOUT,
        action: () => this.handleInactivity()
      },

      // INACTIVITY → ROW_SCANNING (nach Inaktivitäts-Hinweis)
      {
        from: VirtualKeyboardState.INACTIVITY,
        to: VirtualKeyboardState.ROW_SCANNING,
        event: VirtualKeyboardEvent.ROW_TIMEOUT,
        action: () => this.handleInactivityComplete()
      },

      // Jeder Zustand → IDLE (Reset)
      {
        from: VirtualKeyboardState.INTRO,
        to: VirtualKeyboardState.IDLE,
        event: VirtualKeyboardEvent.RESET,
        action: () => this.handleReset()
      },
      {
        from: VirtualKeyboardState.ROW_SCANNING,
        to: VirtualKeyboardState.IDLE,
        event: VirtualKeyboardEvent.RESET,
        action: () => this.handleReset()
      },
      {
        from: VirtualKeyboardState.LETTER_SCANNING,
        to: VirtualKeyboardState.IDLE,
        event: VirtualKeyboardEvent.RESET,
        action: () => this.handleReset()
      },

      // Jeder Zustand → ERROR (Fehler)
      {
        from: VirtualKeyboardState.INTRO,
        to: VirtualKeyboardState.ERROR,
        event: VirtualKeyboardEvent.ERROR_OCCURRED,
        action: () => this.handleError()
      },
      {
        from: VirtualKeyboardState.ROW_SCANNING,
        to: VirtualKeyboardState.ERROR,
        event: VirtualKeyboardEvent.ERROR_OCCURRED,
        action: () => this.handleError()
      },
      {
        from: VirtualKeyboardState.LETTER_SCANNING,
        to: VirtualKeyboardState.ERROR,
        event: VirtualKeyboardEvent.ERROR_OCCURRED,
        action: () => this.handleError()
      }
    ]
  }

  /**
   * Verarbeitet ein Event und führt Zustandsübergang durch
   */
  public async processEvent(event: VirtualKeyboardEvent): Promise<void> {
    console.log(`StateMachine: Processing event ${event} in state ${this.currentState}`)
    
    const transition = this.findTransition(this.currentState, event)
    if (!transition) {
      console.warn(`StateMachine: No transition found for ${event} in state ${this.currentState}`)
      return
    }

    // Aktuelle Timers stoppen
    this.clearAllTimers()

    // Zustand wechseln
    const oldState = this.currentState
    this.currentState = transition.to
    console.log(`StateMachine: Transition ${oldState} → ${this.currentState}`)

    // Aktion ausführen
    if (transition.action) {
      try {
        await transition.action()
      } catch (error) {
        console.error('StateMachine: Error in transition action:', error)
        await this.processEvent(VirtualKeyboardEvent.ERROR_OCCURRED)
        return
      }
    }

    // State-Change Callback aufrufen
    if (this.onStateChange) {
      this.onStateChange(this.currentState, { ...this.context })
    }
  }

  /**
   * Findet passende Transition
   */
  private findTransition(from: VirtualKeyboardState, event: VirtualKeyboardEvent): StateTransition | undefined {
    return this.transitions.find(t => t.from === from && t.event === event)
  }

  /**
   * Event-Handler Implementierungen
   */
  private async handleStart(): Promise<void> {
    console.log('StateMachine: Handling START')
    console.log('StateMachine: hasHeardIntro:', this.context.hasHeardIntro)
    console.log('StateMachine: TTS Controller available:', !!this.ttsController)
    
    if (!this.context.hasHeardIntro) {
      console.log('StateMachine: Playing intro TTS...')
      // Intro-TTS abspielen
      this.context.isTTSActive = true
      try {
        await this.ttsController.speak(
          "Willkommen in der virtuellen Tastatur. Blinzeln Sie eine Zeile Ihrer Wahl an. Nachdem Sie eine Zeile ausgewählt haben, laufen die Buchstaben dieser Zeile automatisch durch. Blinzeln Sie erneut, um einen Buchstaben auszuwählen. So können Sie Schritt für Schritt Wörter und Sätze bilden. Die Tastatur läuft in einer Endlosschleife, damit Sie jederzeit weiterschreiben können."
        )
        console.log('StateMachine: Intro TTS completed')
      } catch (error) {
        console.error('StateMachine: Error playing intro TTS:', error)
      }
      this.context.isTTSActive = false
      this.markIntroAsHeard()
      
      // Nach Intro → ROW_SCANNING
      setTimeout(() => {
        this.processEvent(VirtualKeyboardEvent.INTRO_COMPLETE)
      }, 500)
    } else {
      console.log('StateMachine: Intro already heard, skipping to row scanning')
      // Direkt zu ROW_SCANNING
      await this.processEvent(VirtualKeyboardEvent.INTRO_COMPLETE)
    }
  }

  private async handleIntroComplete(): Promise<void> {
    console.log('StateMachine: Handling INTRO_COMPLETE')
    this.startRowScanning()
  }

  private async handleRowTimeout(): Promise<void> {
    console.log('StateMachine: Handling ROW_TIMEOUT, current state:', this.currentState)
    
    if (this.currentState === VirtualKeyboardState.ROW_SCANNING) {
      // Nächste Zeile
      this.context.currentRow = (this.context.currentRow + 1) % 6 // 6 Zeilen
      this.announceCurrentRow()
      // Timer wird automatisch durch setInterval weitergeführt
    } else if (this.currentState === VirtualKeyboardState.INACTIVITY) {
      // Inaktivität beendet → zurück zu ROW_SCANNING
      console.log('StateMachine: Returning from inactivity to row scanning')
      this.startRowScanning()
    }
    // ROW_SELECTED und LETTER_SELECTED werden jetzt in ihren eigenen Handler-Methoden behandelt
  }

  private async handleLetterTimeout(): Promise<void> {
    console.log('StateMachine: Handling LETTER_TIMEOUT')
    console.log('StateMachine: Current letter index:', this.context.currentLetter)
    
    // Nächster Buchstabe
    const row = this.getCurrentRowLetters()
    console.log('StateMachine: Current row letters:', row)
    this.context.currentLetter = (this.context.currentLetter + 1) % row.length
    console.log('StateMachine: New letter index:', this.context.currentLetter)
    this.announceCurrentLetter()
    // Timer wird automatisch durch setInterval weitergeführt
  }

  private async handleRowSelection(): Promise<void> {
    console.log('StateMachine: Handling ROW_SELECTION')
    
    this.context.lastActivity = Date.now()
    this.context.isTTSActive = true
    await this.ttsController.speak("Zeile ausgewählt")
    this.context.isTTSActive = false
    
    // Nach 1 Sekunde → ROW_SELECTED
    this.setTimer('row_selection', 1000, () => {
      this.processEvent(VirtualKeyboardEvent.ROW_TIMEOUT)
    })
  }

  private async handleLetterSelection(): Promise<void> {
    console.log('StateMachine: Handling LETTER_SELECTION')
    
    this.context.lastActivity = Date.now()
    const row = this.getCurrentRowLetters()
    const letter = row[this.context.currentLetter]
    
    // Buchstabe zum Text hinzufügen
    this.addLetterToText(letter)
    
    // TTS-Bestätigung
    this.context.isTTSActive = true
    const ttsText = this.getTTSLabel(letter)
    await this.ttsController.speak(ttsText)
    this.context.isTTSActive = false
    
    // Nach 3 Sekunden → LETTER_SELECTED
    this.setTimer('letter_selection', 3000, () => {
      this.processEvent(VirtualKeyboardEvent.ROW_TIMEOUT)
    })
  }

  private async handleRowSelected(): Promise<void> {
    console.log('StateMachine: Handling ROW_SELECTED')
    // Zeile bestätigt → LETTER_SCANNING
    this.context.selectedRow = this.context.currentRow
    this.context.currentLetter = 0
    console.log('StateMachine: Starting letter scanning for row:', this.context.selectedRow)
    this.startLetterScanning()
  }

  private async handleLetterSelected(): Promise<void> {
    console.log('StateMachine: Handling LETTER_SELECTED')
    // Buchstabe verarbeitet → zurück zu ROW_SCANNING
    this.context.selectedRow = null
    this.context.selectedLetter = null
    this.startRowScanning()
  }

  private async handleInactivity(): Promise<void> {
    console.log('StateMachine: Handling INACTIVITY')
    
    this.context.isTTSActive = true
    await this.ttsController.speak("Keine Eingabe erkannt. Zurück zur Zeilenauswahl.")
    this.context.isTTSActive = false
    
    // Nach 1 Sekunde → zurück zu ROW_SCANNING
    this.setTimer('inactivity', 1000, () => {
      this.processEvent(VirtualKeyboardEvent.ROW_TIMEOUT)
    })
  }

  private async handleReset(): Promise<void> {
    console.log('StateMachine: Handling RESET')
    this.clearAllTimers()
    this.context = this.initializeContext()
  }

  private async handleError(): Promise<void> {
    console.log('StateMachine: Handling ERROR')
    this.clearAllTimers()
    // Fehlerbehandlung implementieren
  }

  /**
   * Timer-Management
   */
  private startRowTimer(): void {
    this.setIntervalTimer('row', 2000, () => {
      this.processEvent(VirtualKeyboardEvent.ROW_TIMEOUT)
    })
  }

  private startLetterTimer(): void {
    this.setIntervalTimer('letter', 1500, () => {
      this.processEvent(VirtualKeyboardEvent.LETTER_TIMEOUT)
    })
  }

  private startInactivityTimer(): void {
    this.setTimer('inactivity', 10000, () => {
      this.processEvent(VirtualKeyboardEvent.INACTIVITY_TIMEOUT)
    })
  }

  private setTimer(name: string, delay: number, callback: () => void): void {
    this.clearTimer(name)
    const timer = window.setTimeout(callback, delay)
    this.timers.set(name, timer)
  }

  private setIntervalTimer(name: string, delay: number, callback: () => void): void {
    this.clearTimer(name)
    const timer = window.setInterval(callback, delay)
    this.timers.set(name, timer)
  }

  private clearTimer(name: string): void {
    const timer = this.timers.get(name)
    if (timer) {
      clearTimeout(timer)
      clearInterval(timer)
      this.timers.delete(name)
    }
  }

  private clearAllTimers(): void {
    this.timers.forEach(timer => {
      clearTimeout(timer)
      clearInterval(timer)
    })
    this.timers.clear()
  }

  /**
   * Hilfsmethoden
   */
  private startRowScanning(): void {
    console.log('StateMachine: Starting row scanning')
    this.context.currentRow = 0
    this.announceCurrentRow()
    this.startRowTimer()
    this.startInactivityTimer()
    console.log('StateMachine: Row scanning started')
  }

  private startLetterScanning(): void {
    console.log('StateMachine: Starting letter scanning')
    this.context.currentLetter = 0
    this.announceCurrentLetter()
    this.startLetterTimer()
    this.startInactivityTimer()
    console.log('StateMachine: Letter scanning started')
  }

  private announceCurrentRow(): void {
    const rowDescriptions = [
      'Zeile eins – Buchstaben A bis K',
      'Zeile zwei – Buchstaben L bis V', 
      'Zeile drei – Buchstaben W bis Fragezeichen',
      'Zeile vier – Silben und Lautkombinationen',
      'Zeile fünf – kurze Wörter',
      'Zeile sechs – Steuerungstasten'
    ]
    const rowDescription = rowDescriptions[this.context.currentRow]
    console.log('StateMachine: Announcing row:', rowDescription)
    this.ttsController.speak(rowDescription)
  }

  private announceCurrentLetter(): void {
    const row = this.getCurrentRowLetters()
    const letter = row[this.context.currentLetter]
    const ttsText = this.getTTSLabel(letter)
    console.log('StateMachine: Announcing letter:', ttsText, 'at index:', this.context.currentLetter)
    this.ttsController.speak(ttsText)
  }

  private getCurrentRowLetters(): string[] {
    const keyboardLayout = [
      // Buchstaben von A–Z (inkl. ß und Umlaute)
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'],
      ['L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V'],
      ['W', 'X', 'Y', 'Z', 'Ä', 'Ö', 'Ü', 'ß', '.', ',', '?'],
      // Häufige Silben und Lautkombinationen
      ['SCH', 'CH', 'EI', 'IE', 'AU', 'EU', 'ÄU', 'PF', 'PH', 'CK', 'NK'],
      // Kurze Wörter
      ['JA', 'NEIN', 'ICH', 'DU', 'ES', 'IST', 'BIN'],
      // Steuerung
      ['LEERZEICHEN', 'LÖSCHEN', 'ZURÜCK']
    ]
    return keyboardLayout[this.context.selectedRow || 0]
  }

  private getTTSLabel(letter: string): string {
    const ttsLabels: Record<string, string> = {
      'ß': 'scharfes S',
      'Ü': 'U Umlaut',
      'Ä': 'Ä Umlaut',
      'Ö': 'Ö Umlaut',
      '?': 'Fragezeichen',
      ',': 'Komma',
      '.': 'Punkt',
      'LEERZEICHEN': 'Leerzeichen',
      'LÖSCHEN': 'Löschen',
      'ZURÜCK': 'Zurück'
    }
    
    if (letter.length === 1 && /[A-Z]/.test(letter)) {
      return `Buchstabe ${letter}`
    } else if (['SCH', 'CH', 'EI', 'AU', 'EU', 'IE', 'ÄU', 'PF', 'PH', 'CK', 'NK'].includes(letter)) {
      return `Silbe ${letter}`
    } else if (['JA', 'NEIN', 'ICH', 'DU', 'ES', 'IST', 'BIN'].includes(letter)) {
      return `Wort ${letter}`
    } else {
      return ttsLabels[letter] || letter
    }
  }

  private addLetterToText(letter: string): void {
    if (letter === 'LEERZEICHEN') {
      if (this.context.currentText === "Noch kein Text…") {
        this.context.currentText = ' '
      } else {
        this.context.currentText += ' '
      }
    } else if (letter === 'LÖSCHEN') {
      if (this.context.currentText === "Noch kein Text…") {
        // Nichts zu löschen
        return
      }
      this.context.currentText = this.context.currentText.slice(0, -1)
      // Wenn Text leer wird, zurück zu "Noch kein Text…"
      if (this.context.currentText === '') {
        this.context.currentText = "Noch kein Text…"
      }
    } else if (letter === 'ZURÜCK') {
      // Navigation zurück
      console.log('Navigation: Going back')
    } else {
      // Ersten Buchstaben hinzufügen
      if (this.context.currentText === "Noch kein Text…") {
        this.context.currentText = letter
      } else {
        this.context.currentText += letter
      }
    }
    console.log('StateMachine: Text updated to:', this.context.currentText)
  }

  private checkIntroStatus(): boolean {
    return localStorage.getItem('virtualKeyboard_hasHeardIntro') === 'true'
  }

  private markIntroAsHeard(): void {
    localStorage.setItem('virtualKeyboard_hasHeardIntro', 'true')
    this.context.hasHeardIntro = true
  }

  /**
   * Public API
   */
  public getCurrentState(): VirtualKeyboardState {
    return this.currentState
  }

  public getContext(): KeyboardContext {
    return { ...this.context }
  }

  public start(): void {
    this.processEvent(VirtualKeyboardEvent.START)
  }

  public stop(): void {
    this.processEvent(VirtualKeyboardEvent.RESET)
  }

  public handleUserInput(): void {
    this.processEvent(VirtualKeyboardEvent.USER_INPUT)
  }
}

export default VirtualKeyboardStateMachine
