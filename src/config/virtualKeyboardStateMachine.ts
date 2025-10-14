/**
 * Technische Spezifikation: Virtuelle Tastatur State-Machine
 * Zustandslogik, Events, Transitions und Implementierungsdetails
 */

import { VIRTUAL_KEYBOARD_CONFIG } from './virtualKeyboardConfig'

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
  INACTIVITY_COMPLETE = 'inactivity_complete', // Inaktivität beendet
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
  private onNavigateBack?: () => void

  constructor(ttsController: any, onStateChange?: (state: VirtualKeyboardState, context: KeyboardContext) => void, onNavigateBack?: () => void) {
    this.ttsController = ttsController
    this.onStateChange = onStateChange
    this.onNavigateBack = onNavigateBack
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
        event: VirtualKeyboardEvent.INACTIVITY_COMPLETE,
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

    // NICHT alle Timer stoppen - nur bei State-Wechsel die alten Timer löschen
    // Die Intervall-Timer sollen weiterlaufen!
    // this.clearAllTimers() // <- ENTFERNT

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
      await this.ttsController.speakForVirtualKeyboard(VIRTUAL_KEYBOARD_CONFIG.tts.intro.text)
      this.context.isTTSActive = false
      this.markIntroAsHeard()
      
      // Nach Intro → ROW_SCANNING
      console.log('StateMachine: Intro TTS completed, starting row scanning in', VIRTUAL_KEYBOARD_CONFIG.tts.intro.delay, 'ms')
      setTimeout(() => {
        console.log('StateMachine: Triggering INTRO_COMPLETE event')
        this.processEvent(VirtualKeyboardEvent.INTRO_COMPLETE)
      }, VIRTUAL_KEYBOARD_CONFIG.tts.intro.delay)
    } else {
      console.log('StateMachine: Intro already heard, skipping to row scanning')
      // Direkt zu ROW_SCANNING
      await this.processEvent(VirtualKeyboardEvent.INTRO_COMPLETE)
    }
  }

  private async handleIntroComplete(): Promise<void> {
    console.log('StateMachine: Handling INTRO_COMPLETE')
    await this.startRowScanning()
  }

  private async handleRowTimeout(): Promise<void> {
    console.log('StateMachine: Handling ROW_TIMEOUT, current state:', this.currentState)
    console.log('StateMachine: Current row before change:', this.context.currentRow)
    console.log('StateMachine: Total keyboard rows:', VIRTUAL_KEYBOARD_CONFIG.keyboard.length)
    
    if (this.currentState === VirtualKeyboardState.ROW_SCANNING) {
      // Nächste Zeile
      const oldRow = this.context.currentRow
      this.context.currentRow = (this.context.currentRow + 1) % VIRTUAL_KEYBOARD_CONFIG.keyboard.length
      console.log(`StateMachine: Row changed from ${oldRow} to ${this.context.currentRow}`)
      console.log('StateMachine: New row data:', VIRTUAL_KEYBOARD_CONFIG.keyboard[this.context.currentRow])
      await this.announceCurrentRow()
      // Timer wird automatisch durch setInterval weitergeführt
    } else if (this.currentState === VirtualKeyboardState.INACTIVITY) {
      // Inaktivität beendet → zurück zu ROW_SCANNING
      console.log('StateMachine: Returning from inactivity to row scanning')
      await this.startRowScanning()
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
    await this.announceCurrentLetter()
    // Timer wird automatisch durch setInterval weitergeführt
  }

  private async handleRowSelection(): Promise<void> {
    console.log('StateMachine: Handling ROW_SELECTION')
    
    this.context.lastActivity = Date.now()
    this.context.isTTSActive = true
    await this.ttsController.speakForVirtualKeyboard(VIRTUAL_KEYBOARD_CONFIG.tts.rowSelected.text)
    this.context.isTTSActive = false
    
    // Nach 1 Sekunde → ROW_SELECTED
    this.setTimer('row_selection', VIRTUAL_KEYBOARD_CONFIG.tts.rowSelected.delay, () => {
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
    await this.ttsController.speakForVirtualKeyboard(ttsText)
    this.context.isTTSActive = false
    
    // Nach 3 Sekunden → LETTER_SELECTED
    this.setTimer('letter_selection', VIRTUAL_KEYBOARD_CONFIG.tts.letterSelected(letter).delay, () => {
      this.processEvent(VirtualKeyboardEvent.ROW_TIMEOUT)
    })
  }

  private async handleRowSelected(): Promise<void> {
    console.log('StateMachine: Handling ROW_SELECTED')
    // Zeile bestätigt → LETTER_SCANNING
    this.context.selectedRow = this.context.currentRow
    this.context.currentLetter = 0
    console.log('StateMachine: Starting letter scanning for row:', this.context.selectedRow)
    await this.startLetterScanning()
  }

  private async handleLetterSelected(): Promise<void> {
    console.log('StateMachine: Handling LETTER_SELECTED')
    // Buchstabe verarbeitet → zurück zu ROW_SCANNING
    this.context.selectedRow = null
    this.context.selectedLetter = null
    // Nach Tastenwahl zurück zu Zeile 1 (A-K) starten
    this.context.currentRow = 0
    await this.announceCurrentRow()
    this.startRowTimer()
    this.startInactivityTimer()
    console.log('StateMachine: Returning to row scanning, starting from row 1 (A-K)')
  }

  private async handleInactivity(): Promise<void> {
    console.log('StateMachine: Handling INACTIVITY')
    
    this.context.isTTSActive = true
    await this.ttsController.speakForVirtualKeyboard(VIRTUAL_KEYBOARD_CONFIG.tts.inactivity.text)
    this.context.isTTSActive = false
    
    // Nach 1 Sekunde → zurück zu ROW_SCANNING
    this.setTimer('inactivity', VIRTUAL_KEYBOARD_CONFIG.tts.inactivity.delay, () => {
      this.processEvent(VirtualKeyboardEvent.INACTIVITY_COMPLETE)
    })
  }

  private async handleInactivityComplete(): Promise<void> {
    console.log('StateMachine: Handling INACTIVITY_COMPLETE')
    // Zurück zu ROW_SCANNING ohne currentRow zurückzusetzen
    this.startRowTimer()
    // Inaktivitäts-Timer neu starten nach Inaktivität
    this.startInactivityTimer()
    console.log('StateMachine: Returning from inactivity to row scanning')
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
    console.log('StateMachine: Starting row timer with', VIRTUAL_KEYBOARD_CONFIG.timing.rowDisplayTime, 'ms interval')
    this.setIntervalTimer('row', VIRTUAL_KEYBOARD_CONFIG.timing.rowDisplayTime, () => {
      console.log('StateMachine: Row timer fired - processing ROW_TIMEOUT event')
      console.log('StateMachine: Current state when timer fires:', this.currentState)
      console.log('StateMachine: Current row when timer fires:', this.context.currentRow)
      this.processEvent(VirtualKeyboardEvent.ROW_TIMEOUT)
    })
  }

  private startLetterTimer(): void {
    this.setIntervalTimer('letter', VIRTUAL_KEYBOARD_CONFIG.timing.letterDisplayTime, () => {
      this.processEvent(VirtualKeyboardEvent.LETTER_TIMEOUT)
    })
  }

  private startInactivityTimer(): void {
    this.setTimer('inactivity', VIRTUAL_KEYBOARD_CONFIG.timing.inactivityTimeout, () => {
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
    console.log(`StateMachine: Set interval timer '${name}' with ${delay}ms delay, timer ID: ${timer}`)
  }

  private clearTimer(name: string): void {
    const timer = this.timers.get(name)
    if (timer) {
      console.log(`StateMachine: Clearing timer '${name}' with ID: ${timer}`)
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
  private async startRowScanning(): Promise<void> {
    console.log('StateMachine: Starting row scanning')
    console.log('StateMachine: Current row before scanning:', this.context.currentRow)
    console.log('StateMachine: Keyboard config length:', VIRTUAL_KEYBOARD_CONFIG.keyboard.length)
    
    // NICHT currentRow zurücksetzen - das stoppt den Durchlauf!
    // this.context.currentRow = 0  // <- ENTFERNT
    
    console.log('StateMachine: Announcing current row...')
    await this.announceCurrentRow()
    
    console.log('StateMachine: Starting row timer...')
    this.startRowTimer()
    
    // Inaktivitäts-Timer nur beim ersten Start, nicht bei jedem Zeilenwechsel!
    if (!this.timers.has('inactivity')) {
      console.log('StateMachine: Starting inactivity timer...')
      this.startInactivityTimer()
    } else {
      console.log('StateMachine: Inactivity timer already running')
    }
    
    console.log('StateMachine: Row scanning started successfully')
    console.log('StateMachine: Active timers:', Array.from(this.timers.keys()))
  }

  private async startLetterScanning(): Promise<void> {
    console.log('StateMachine: Starting letter scanning')
    this.context.currentLetter = 0
    await this.announceCurrentLetter()
    this.startLetterTimer()
    this.startInactivityTimer()
    console.log('StateMachine: Letter scanning started')
  }

  private async announceCurrentRow(): Promise<void> {
    try {
      console.log('StateMachine: announceCurrentRow called with currentRow:', this.context.currentRow)
      console.log('StateMachine: Keyboard config length:', VIRTUAL_KEYBOARD_CONFIG.keyboard.length)
      
      if (this.context.currentRow < 0 || this.context.currentRow >= VIRTUAL_KEYBOARD_CONFIG.keyboard.length) {
        console.log('StateMachine: Invalid currentRow for announcement:', this.context.currentRow)
        return
      }
      
      const row = VIRTUAL_KEYBOARD_CONFIG.keyboard[this.context.currentRow]
      console.log('StateMachine: Row object:', row)
      
      if (!row) {
        console.log('StateMachine: Row is null/undefined at index:', this.context.currentRow)
        return
      }
      
      const rowDescription = row.ttsText
      console.log('StateMachine: Announcing row:', rowDescription)
      
      this.context.isTTSActive = true
      await this.ttsController.speakForVirtualKeyboard(rowDescription)
      this.context.isTTSActive = false
    } catch (error) {
      console.log('StateMachine: Error in announceCurrentRow:', error)
      console.log('StateMachine: Error details:', error.message, error.stack)
    }
  }

  private async announceCurrentLetter(): Promise<void> {
    try {
      const row = this.getCurrentRowLetters()
      console.log('StateMachine: Current row letters:', row, 'currentLetter index:', this.context.currentLetter)
      
      if (!row || row.length === 0) {
        console.log('StateMachine: No letters in current row')
        return
      }
      
      if (this.context.currentLetter < 0 || this.context.currentLetter >= row.length) {
        console.log('StateMachine: Invalid letter index:', this.context.currentLetter, 'max:', row.length - 1)
        return
      }
      
      const letter = row[this.context.currentLetter]
      const ttsText = this.getTTSLabel(letter)
      console.log('StateMachine: Announcing letter:', ttsText, 'at index:', this.context.currentLetter)
      
      this.context.isTTSActive = true
      await this.ttsController.speakForVirtualKeyboard(ttsText)
      this.context.isTTSActive = false
    } catch (error) {
      console.log('StateMachine: Error in announceCurrentLetter:', error)
    }
  }

  private getCurrentRowLetters(): string[] {
    try {
      const rowIndex = this.context.selectedRow !== null ? this.context.selectedRow : this.context.currentRow
      console.log('StateMachine: Getting letters for row:', rowIndex, 'selectedRow:', this.context.selectedRow, 'currentRow:', this.context.currentRow)
      console.log('StateMachine: Keyboard config available:', !!VIRTUAL_KEYBOARD_CONFIG)
      console.log('StateMachine: Keyboard config length:', VIRTUAL_KEYBOARD_CONFIG.keyboard.length)
      
      if (rowIndex < 0 || rowIndex >= VIRTUAL_KEYBOARD_CONFIG.keyboard.length) {
        console.log('StateMachine: Invalid row index:', rowIndex, 'max:', VIRTUAL_KEYBOARD_CONFIG.keyboard.length - 1)
        return []
      }
      
      const row = VIRTUAL_KEYBOARD_CONFIG.keyboard[rowIndex]
      console.log('StateMachine: Row object at index', rowIndex, ':', row)
      
      if (!row) {
        console.log('StateMachine: Row is null/undefined at index:', rowIndex)
        return []
      }
      
      console.log('StateMachine: Row', rowIndex, 'contains letters:', row.letters)
      return row.letters || []
    } catch (error) {
      console.log('StateMachine: Error in getCurrentRowLetters:', error)
      console.log('StateMachine: Error details:', error.message, error.stack)
      return []
    }
  }

  private getTTSLabel(letter: string): string {
    try {
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
        // Verwende alternative Aussprache, um "Großbuchstabe" zu vermeiden
        const letterMap: Record<string, string> = {
          'A': 'ah',
          'B': 'beh', 
          'C': 'zeh',
          'D': 'deh',
          'E': 'eh',
          'F': 'eff',
          'G': 'geh',
          'H': 'hah',
          'I': 'ih',
          'J': 'jott',
          'K': 'kah',
          'L': 'ell',
          'M': 'emm',
          'N': 'enn',
          'O': 'oh',
          'P': 'peh',
          'Q': 'kuh',
          'R': 'err',
          'S': 'ess',
          'T': 'teh',
          'U': 'uh',
          'V': 'fau',
          'W': 'weh',
          'X': 'iks',
          'Y': 'üpsilon',
          'Z': 'zett'
        }
        return letterMap[letter] || letter
      } else if (['SCH', 'CH', 'EI', 'AU', 'EU', 'IE', 'ÄU', 'PF', 'PH', 'CK', 'NK'].includes(letter)) {
        return letter  // Nur die Silbe selbst, ohne "Silbe"
      } else if (['JA', 'NEIN', 'ICH', 'DU', 'ES', 'IST', 'BIN'].includes(letter)) {
        return letter  // Nur das Wort selbst, ohne "Wort"
      } else {
        return ttsLabels[letter] || letter
      }
    } catch (error) {
      console.log('StateMachine: Error in getTTSLabel for letter:', letter, error)
      return letter || 'unbekannt'
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
      if (this.onNavigateBack) {
        this.onNavigateBack()
      }
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
   * Setzt den Intro-Status zurück, damit der Begrüßungstext erneut gesprochen wird
   */
  public resetIntroStatus(): void {
    localStorage.removeItem('virtualKeyboard_hasHeardIntro')
    this.context.hasHeardIntro = false
    console.log('StateMachine: Intro status reset - welcome text will be spoken again')
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
