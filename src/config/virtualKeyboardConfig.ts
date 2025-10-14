/**
 * Konfiguration für die virtuelle Tastatur mit Blinzelsteuerung
 * Steuerung, TTS und UI-Regeln für sprachbehinderte Nutzer
 */

export interface TTSAction {
  text: string
  delay: number // Pause nach TTS in Millisekunden
  action?: 'startRowScan' | 'startLetterScan' | 'returnToRowScan' | 'none'
}

export interface KeyboardRow {
  id: string
  letters: string[]
  ttsText: string
  displayTime: number // Zeit pro Zeile in Millisekunden
}

export interface KeyboardState {
  currentRow: number
  currentLetter: number
  isRowScanning: boolean
  isLetterScanning: boolean
  hasHeardIntro: boolean
  lastActivity: number
  currentText: string
}

export const VIRTUAL_KEYBOARD_CONFIG = {
  // TTS-Phasen und Texte
  tts: {
    // Einmaliger Intro-Text beim ersten Besuch
    intro: {
      text: "Willkommen in der virtuellen Tastatur. Blinzeln Sie eine Zeile Ihrer Wahl an. Nachdem Sie eine Zeile ausgewählt haben, laufen die Buchstaben dieser Zeile automatisch durch. Blinzeln Sie erneut, um einen Buchstaben auszuwählen. So können Sie Schritt für Schritt Wörter und Sätze bilden. Die Tastatur läuft in einer Endlosschleife, damit Sie jederzeit weiterschreiben können.",
      delay: 1000,
      action: 'startRowScan' as const
    },
    
    // Zeilenauswahl bestätigt
    rowSelected: {
      text: "Zeile ausgewählt. Buchstaben laufen.",
      delay: 2000,
      action: 'startLetterScan' as const
    },
    
    // Buchstabe ausgewählt
    letterSelected: (letter: string) => ({
      text: `${letter} gewählt.`,
      delay: 3000,
      action: 'returnToRowScan' as const
    }),
    
    // Inaktivität erkannt
    inactivity: {
      text: "Keine Eingabe erkannt. Zurück zur Zeilenauswahl.",
      delay: 1000,
      action: 'startRowScan' as const
    }
  },

  // Tastatur-Layout (6 Zeilen - neue alphabetische Reihenfolge)
  keyboard: [
    {
      id: 'row1',
      letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'],
      ttsText: 'Zeile eins – Buchstaben A bis K',
      displayTime: 2500  // 25% langsamer: 2000 * 1.25
    },
    {
      id: 'row2', 
      letters: ['L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V'],
      ttsText: 'Zeile zwei – Buchstaben L bis V',
      displayTime: 2500  // 25% langsamer: 2000 * 1.25
    },
    {
      id: 'row3',
      letters: ['W', 'X', 'Y', 'Z', 'Ä', 'Ö', 'Ü', 'ß', '.', ',', '?'],
      ttsText: 'Zeile drei – Buchstaben W bis Fragezeichen',
      displayTime: 2500  // 25% langsamer: 2000 * 1.25
    },
    {
      id: 'row4',
      letters: ['SCH', 'CH', 'EI', 'IE', 'AU', 'EU', 'ÄU', 'PF', 'PH', 'CK', 'NK'],
      ttsText: 'Zeile vier – Silben und Lautkombinationen',
      displayTime: 2500  // 25% langsamer: 2000 * 1.25
    },
    {
      id: 'row5',
      letters: ['JA', 'NEIN', 'ICH', 'DU', 'ES', 'IST', 'BIN'],
      ttsText: 'Zeile fünf – kurze Wörter',
      displayTime: 2500  // 25% langsamer: 2000 * 1.25
    },
    {
      id: 'row6',
      letters: ['LEERZEICHEN', 'LÖSCHEN', 'ZURÜCK'],
      ttsText: 'Zeile sechs – Steuerungstasten',
      displayTime: 2500  // 25% langsamer: 2000 * 1.25
    }
  ],

  // Zeitabstände (25% langsamer)
  timing: {
    rowDisplayTime: 5000,        // 5 Sekunden pro Zeile (25% langsamer: 4000 * 1.25)
    letterDisplayTime: 1875,     // 1,875 Sekunden pro Buchstabe (25% langsamer: 1500 * 1.25)
    inactivityTimeout: 37500,    // 37,5 Sekunden ohne Eingabe (25% langsamer: 30000 * 1.25)
    pauseAfterIntro: 1250,       // 1,25 Sekunden nach Intro (25% langsamer: 1000 * 1.25)
    pauseAfterRowSelection: 1250, // 1,25 Sekunden nach Zeilenauswahl (25% langsamer: 1000 * 1.25)
    pauseAfterLetterSelection: 3750 // 3,75 Sekunden nach Buchstabenauswahl (25% langsamer: 3000 * 1.25)
  },

  // UI-Standards
  ui: {
    defaultText: "Noch kein Text…",
    activeRowClass: "row-active",      // Orangefarbener Rahmen
    activeLetterClass: "letter-active", // Leuchtender Rahmen
    ttsIndicatorClass: "tts-active"     // Audio-Wellen-Animation
  },

  // Erweiterungsoptionen
  features: {
    localStorageKey: "virtualKeyboard_hasHeardIntro",
    quickWords: ["Ich", "Ja", "Nein", "Danke"], // Optional: Schnellwahl-Wörter
    enableTextReading: true // Optional: Text vorlesen
  }
} as const

/**
 * Zustandsmanager für die virtuelle Tastatur
 */
export class VirtualKeyboardController {
  private state: KeyboardState
  private rowScanInterval: number | null = null
  private letterScanInterval: number | null = null
  private inactivityTimeout: number | null = null
  private ttsController: any // SimpleFlowController

  constructor(ttsController: any) {
    this.ttsController = ttsController
    this.state = {
      currentRow: 0,
      currentLetter: 0,
      isRowScanning: false,
      isLetterScanning: false,
      hasHeardIntro: this.checkIntroStatus(),
      currentText: VIRTUAL_KEYBOARD_CONFIG.ui.defaultText,
      lastActivity: Date.now()
    }
  }

  /**
   * Startet die virtuelle Tastatur
   */
  public async start(): Promise<void> {
    console.log('VirtualKeyboard: Starting virtual keyboard')
    
    if (!this.state.hasHeardIntro) {
      await this.playIntro()
      this.markIntroAsHeard()
    }
    
    this.startRowScanning()
  }

  /**
   * Stoppt die virtuelle Tastatur
   */
  public stop(): void {
    console.log('VirtualKeyboard: Stopping virtual keyboard')
    this.clearAllIntervals()
  }

  /**
   * Behandelt Blinzel-/Klick-Eingabe
   */
  public async handleUserInput(): Promise<void> {
    console.log('VirtualKeyboard: User input detected')
    this.updateActivity()
    
    if (this.state.isRowScanning) {
      await this.selectCurrentRow()
    } else if (this.state.isLetterScanning) {
      await this.selectCurrentLetter()
    }
  }

  /**
   * Spielt den Intro-Text ab
   */
  private async playIntro(): Promise<void> {
    const intro = VIRTUAL_KEYBOARD_CONFIG.tts.intro
    await this.ttsController.speakForVirtualKeyboard(intro.text)
    await this.delay(intro.delay)
  }

  /**
   * Startet den Zeilendurchlauf
   */
  private startRowScanning(): void {
    console.log('VirtualKeyboard: Starting row scanning')
    this.state.isRowScanning = true
    this.state.isLetterScanning = false
    this.clearAllIntervals()
    
    this.rowScanInterval = window.setInterval(() => {
      this.scanNextRow()
    }, VIRTUAL_KEYBOARD_CONFIG.timing.rowDisplayTime)
    
    this.setInactivityTimeout()
  }

  /**
   * Startet den Buchstabenlauf in der aktuellen Zeile
   */
  private startLetterScanning(): void {
    console.log('VirtualKeyboard: Starting letter scanning for row', this.state.currentRow)
    this.state.isRowScanning = false
    this.state.isLetterScanning = true
    this.state.currentLetter = 0
    this.clearAllIntervals()
    
    this.letterScanInterval = window.setInterval(() => {
      this.scanNextLetter()
    }, VIRTUAL_KEYBOARD_CONFIG.timing.letterDisplayTime)
    
    this.setInactivityTimeout()
  }

  /**
   * Durchläuft die nächste Zeile
   */
  private async scanNextRow(): Promise<void> {
    const row = VIRTUAL_KEYBOARD_CONFIG.keyboard[this.state.currentRow]
    console.log('VirtualKeyboard: Scanning row', this.state.currentRow, row.ttsText)
    
    // TTS für aktuelle Zeile
    await this.ttsController.speakForVirtualKeyboard(row.ttsText)
    
    // UI-Update (aktive Zeile hervorheben)
    this.highlightActiveRow()
    
    // Nächste Zeile
    this.state.currentRow = (this.state.currentRow + 1) % VIRTUAL_KEYBOARD_CONFIG.keyboard.length
  }

  /**
   * Durchläuft den nächsten Buchstaben
   */
  private async scanNextLetter(): Promise<void> {
    const row = VIRTUAL_KEYBOARD_CONFIG.keyboard[this.state.currentRow]
    const letter = row.letters[this.state.currentLetter]
    console.log('VirtualKeyboard: Scanning letter', letter)
    
    // TTS für aktuellen Buchstaben
    await this.ttsController.speakForVirtualKeyboard(letter)
    
    // UI-Update (aktive Taste hervorheben)
    this.highlightActiveLetter()
    
    // Nächster Buchstabe
    this.state.currentLetter = (this.state.currentLetter + 1) % row.letters.length
  }

  /**
   * Wählt die aktuelle Zeile aus
   */
  private async selectCurrentRow(): Promise<void> {
    console.log('VirtualKeyboard: Row selected', this.state.currentRow)
    this.clearAllIntervals()
    
    const rowSelected = VIRTUAL_KEYBOARD_CONFIG.tts.rowSelected
    await this.ttsController.speakForVirtualKeyboard(rowSelected.text)
    await this.delay(rowSelected.delay)
    
    this.startLetterScanning()
  }

  /**
   * Wählt den aktuellen Buchstaben aus
   */
  private async selectCurrentLetter(): Promise<void> {
    const row = VIRTUAL_KEYBOARD_CONFIG.keyboard[this.state.currentRow]
    const letter = row.letters[this.state.currentLetter]
    console.log('VirtualKeyboard: Letter selected', letter)
    
    this.clearAllIntervals()
    
    // Buchstabe zum Text hinzufügen
    this.addLetterToText(letter)
    
    // TTS-Bestätigung
    const letterSelected = VIRTUAL_KEYBOARD_CONFIG.tts.letterSelected(letter)
    await this.ttsController.speakForVirtualKeyboard(letterSelected.text)
    await this.delay(letterSelected.delay)
    
    // Zurück zur Zeilenauswahl
    this.startRowScanning()
  }

  /**
   * Fügt einen Buchstaben zum aktuellen Text hinzu
   */
  private addLetterToText(letter: string): void {
    if (this.state.currentText === VIRTUAL_KEYBOARD_CONFIG.ui.defaultText) {
      this.state.currentText = letter
    } else {
      this.state.currentText += letter
    }
    console.log('VirtualKeyboard: Text updated to', this.state.currentText)
    this.updateTextDisplay()
  }

  /**
   * Setzt den Inaktivitäts-Timeout
   */
  private setInactivityTimeout(): void {
    this.clearInactivityTimeout()
    this.inactivityTimeout = window.setTimeout(() => {
      this.handleInactivity()
    }, VIRTUAL_KEYBOARD_CONFIG.timing.inactivityTimeout)
  }

  /**
   * Behandelt Inaktivität
   */
  private async handleInactivity(): Promise<void> {
    console.log('VirtualKeyboard: Inactivity detected')
    this.clearAllIntervals()
    
    const inactivity = VIRTUAL_KEYBOARD_CONFIG.tts.inactivity
    await this.ttsController.speakForVirtualKeyboard(inactivity.text)
    await this.delay(inactivity.delay)
    
    this.startRowScanning()
  }

  /**
   * Aktualisiert die Aktivitätszeit
   */
  private updateActivity(): void {
    this.state.lastActivity = Date.now()
  }

  /**
   * Prüft, ob Intro bereits gehört wurde
   */
  private checkIntroStatus(): boolean {
    return localStorage.getItem(VIRTUAL_KEYBOARD_CONFIG.features.localStorageKey) === 'true'
  }

  /**
   * Markiert Intro als gehört
   */
  private markIntroAsHeard(): void {
    localStorage.setItem(VIRTUAL_KEYBOARD_CONFIG.features.localStorageKey, 'true')
    this.state.hasHeardIntro = true
  }

  /**
   * UI-Update-Methoden (müssen je nach Framework angepasst werden)
   */
  private highlightActiveRow(): void {
    // TODO: Implementierung je nach UI-Framework
    console.log('VirtualKeyboard: Highlighting row', this.state.currentRow)
  }

  private highlightActiveLetter(): void {
    // TODO: Implementierung je nach UI-Framework
    console.log('VirtualKeyboard: Highlighting letter', this.state.currentLetter)
  }

  private updateTextDisplay(): void {
    // TODO: Implementierung je nach UI-Framework
    console.log('VirtualKeyboard: Updating text display to', this.state.currentText)
  }

  /**
   * Utility-Methoden
   */
  private clearAllIntervals(): void {
    this.clearRowScanInterval()
    this.clearLetterScanInterval()
    this.clearInactivityTimeout()
  }

  private clearRowScanInterval(): void {
    if (this.rowScanInterval) {
      clearInterval(this.rowScanInterval)
      this.rowScanInterval = null
    }
  }

  private clearLetterScanInterval(): void {
    if (this.letterScanInterval) {
      clearInterval(this.letterScanInterval)
      this.letterScanInterval = null
    }
  }

  private clearInactivityTimeout(): void {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout)
      this.inactivityTimeout = null
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Getter für aktuellen Zustand
   */
  public getState(): KeyboardState {
    return { ...this.state }
  }

  /**
   * Getter für aktuellen Text
   */
  public getCurrentText(): string {
    return this.state.currentText
  }
}

export default VIRTUAL_KEYBOARD_CONFIG
