import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { keyboardLayout, getOriginalLetter } from '../data/keyboardLayout'
import { useSpeech } from './useSpeech'
import { useTimers } from './useTimers'
import { useBlinkInput } from './useBlinkInput'

/**
 * Composable für die virtuelle Tastatur mit TTS und Blinzelsteuerung
 * Enthält die komplette State Machine und Logik für die drei Phasen
 */
export function useVirtualKeyboard() {
  const router = useRouter()
  const { isTTSActive, speakText, delay } = useSpeech()
  const { clearAllTimers, setTimer } = useTimers()
  const { isIntroductionActive, startIntroduction, endIntroduction } = useBlinkInput()

  // ===== STATE MACHINE =====
  enum VirtualKeyboardPhase {
    INIT = 'init',
    ROW_SCANNING = 'row_scanning',
    LETTER_SCANNING = 'letter_scanning'
  }

  // ===== STATE VARIABLES =====
  const currentPhase = ref<VirtualKeyboardPhase>(VirtualKeyboardPhase.INIT)
  const currentText = ref("Noch kein Text…")
  const statusText = ref("Virtuelle Tastatur bereit")
  const currentRowIndex = ref(0)
  const currentLetterIndex = ref(0)
  const selectedRowIndex = ref<number | null>(null)
  const letterCycleCount = ref(0)
  const isLetterDisplay = ref(false)

  // ===== CONTROL FLOW SAFETY =====
  let scanSessionId = 0

  const newScanSession = () => {
    scanSessionId++
    console.log("🔄 Neue Scan-Session gestartet:", scanSessionId)
    return scanSessionId
  }

  // ===== PHASE 1: INITIALIZATION =====
  const startPhase1 = async () => {
    console.log('Phase 1: Starting initialization')
    currentPhase.value = VirtualKeyboardPhase.INIT
    startIntroduction() // Einführung aktiv - Input ignorieren
    clearAllTimers()
    
    // Begrüßungstext anzeigen
    statusText.value = "Ich lese Ihnen jetzt nacheinander die Zeilen vor. Blinzeln oder klicken Sie, um eine Zeile auszuwählen."
    
    // TTS-Begrüßung mit Callbacks
    await speakText("Hallo.", () => { statusText.value = "Hallo." })
    await delay(3000)
    
    await speakText("Ich helfe Ihnen, Wörter und Sätze zu schreiben.", () => { statusText.value = "Ich helfe Ihnen, Wörter und Sätze zu schreiben." })
    await delay(3000)
    
    await speakText("Dazu sehen Sie jetzt verschiedene Zeilen mit Buchstaben und Wörtern.", () => { statusText.value = "Dazu sehen Sie jetzt verschiedene Zeilen mit Buchstaben und Wörtern." })
    await delay(3000)
    
    await speakText("Wenn Sie eine Zeile auswählen möchten, blinzeln oder tippen Sie bitte einmal", () => { statusText.value = "Wenn Sie eine Zeile auswählen möchten, blinzeln oder tippen Sie bitte einmal" })
    await delay(4000)
    
    await speakText("Wählen Sie jetzt zuerst eine Zeile aus, die einen Buchstaben Ihrer Wahl enthält.", () => { statusText.value = "Wählen Sie jetzt zuerst eine Zeile aus, die einen Buchstaben Ihrer Wahl enthält." })
    
    // Nach TTS-Ende + 4 Sekunden → Phase 2
    setTimer(() => {
      endIntroduction() // Einführung beendet - Input wieder erlaubt
      startPhase2()
    }, 4000)
  }

  // ===== PHASE 2: ROW SCANNING =====
  const startPhase2 = () => {
    console.log('Phase 2: Starting row scanning')
    currentPhase.value = VirtualKeyboardPhase.ROW_SCANNING
    clearAllTimers()
    const mySession = newScanSession() // ⬅️ eigene Lauf-ID merken
    currentRowIndex.value = 0
    selectedRowIndex.value = null
    
    // Status-Text für Zeilenmodus setzen
    statusText.value = "Ich lese Ihnen jetzt nacheinander die Zeilen vor. Blinzeln oder klicken Sie, um eine Zeile auszuwählen."
    
    // Starte Zeilendurchlauf
    scanNextRow(mySession)
  }

  const scanNextRow = async (sessionId: number) => {
    if (sessionId !== scanSessionId) return // Abbruch, wenn Session ungültig
    if (currentPhase.value !== VirtualKeyboardPhase.ROW_SCANNING) return
    
    const rowDescriptions = [
      "Erste Zeile, Buchstaben A bis K.",
      "Zweite Zeile, Buchstaben L bis V.",
      "Dritte Zeile, Buchstaben W bis Fragezeichen.",
      "Vierte Zeile, Silben.",
      "Fünfte Zeile, Kurzwörter.",
      "Sechste Zeile, Steuerungstasten."
    ]
    
    console.log('🎯 Scanning row:', currentRowIndex.value, rowDescriptions[currentRowIndex.value])
    
    // TTS mit visueller Hervorhebung
    await speakText(
      rowDescriptions[currentRowIndex.value],
      () => { 
        // onStart: Zeile hervorheben und Status-Text aktualisieren
        statusText.value = rowDescriptions[currentRowIndex.value]
        console.log('Row highlighted:', currentRowIndex.value, 'Status-Text:', statusText.value)
      },
      () => { 
        // onEnd: Zeile zurücksetzen
        console.log('Row unhighlighted:', currentRowIndex.value)
      }
    )
    
    // Nach TTS-Ende + 3 Sekunden → nächste Zeile
    await delay(3000)
    
    // Prüfen, ob Session oder Phase sich geändert haben
    if (sessionId !== scanSessionId || currentPhase.value !== VirtualKeyboardPhase.ROW_SCANNING) return
    
    currentRowIndex.value = (currentRowIndex.value + 1) % keyboardLayout.length
    scanNextRow(sessionId) // rekursiver Aufruf nur, wenn gültig
  }

  // ===== PHASE 3: LETTER SCANNING =====
  const startPhase3 = async () => {
    console.log('Phase 3: Starting letter scanning')
    currentPhase.value = VirtualKeyboardPhase.LETTER_SCANNING
    clearAllTimers()
    const mySession = newScanSession() // ⬅️ eigene Lauf-ID merken
    currentLetterIndex.value = 0
    letterCycleCount.value = 0
    
    // Anzeige und TTS
    statusText.value = "Wählen Sie jetzt einen Buchstaben aus, um diesen zu schreiben."
    await speakText("Wählen Sie jetzt einen Buchstaben aus, um diesen zu schreiben.")
    await delay(3000)
    
    // Starte Buchstabendurchlauf
    scanNextLetter(mySession)
  }

  const scanNextLetter = async (sessionId: number) => {
    if (sessionId !== scanSessionId) return // Abbruch, wenn Session ungültig
    if (currentPhase.value !== VirtualKeyboardPhase.LETTER_SCANNING || selectedRowIndex.value === null) return
    
    const row = keyboardLayout[selectedRowIndex.value]
    const letter = row.letters[currentLetterIndex.value]
    
    console.log('🎯 Scanning letter:', letter)
    
    // TTS mit visueller Hervorhebung
    await speakText(
      letter,
      () => { 
        // onStart: Buchstabe hervorheben und Status-Text aktualisieren
        statusText.value = letter
        console.log('Letter highlighted:', letter)
      },
      () => { 
        // onEnd: Buchstabe zurücksetzen
        console.log('Letter unhighlighted:', letter)
      }
    )
    
    // Nach TTS-Ende + 2 Sekunden → nächster Buchstabe
    await delay(2000)
    
    // Prüfen, ob Session oder Phase sich geändert haben
    if (sessionId !== scanSessionId || currentPhase.value !== VirtualKeyboardPhase.LETTER_SCANNING) return
    
    const currentRow = keyboardLayout[selectedRowIndex.value!]
    currentLetterIndex.value = (currentLetterIndex.value + 1) % currentRow.letters.length
    
    // Prüfe ob wir am Ende der Zeile angekommen sind
    if (currentLetterIndex.value === 0) {
      letterCycleCount.value++
      console.log('Completed cycle', letterCycleCount.value, 'for row', selectedRowIndex.value)
      
      // Nach 2 Durchläufen zurück zu Phase 2
      if (letterCycleCount.value >= 2) {
        console.log('Reached 2 cycles - returning to row scanning')
        handleNoLetterSelected()
        return
      }
    }
    
    scanNextLetter(sessionId) // rekursiver Aufruf nur, wenn gültig
  }

  // ===== USER INTERACTION HANDLING =====
  const handleUserInput = async () => {
    // Ignoriere User Input während der Einführung
    if (isIntroductionActive.value) {
      console.log('User input ignored during introduction phase')
      return
    }
    
    console.log('User input detected in phase:', currentPhase.value)
    
    // Stoppe alle Timer und TTS
    clearAllTimers()
    speechSynthesis.cancel()
    newScanSession() // ⬅️ ALLES sofort stoppen (alte Scans laufen nicht mehr weiter)
    
    switch (currentPhase.value) {
      case VirtualKeyboardPhase.ROW_SCANNING:
        await handleRowSelection()
        break
      case VirtualKeyboardPhase.LETTER_SCANNING:
        await handleLetterSelection()
        break
      default:
        console.log('User input ignored in phase:', currentPhase.value)
    }
  }

  const handleRowSelection = async () => {
    console.log('Row selected:', currentRowIndex.value)
    selectedRowIndex.value = currentRowIndex.value
    
    // Status-Text aktualisieren
    statusText.value = `Zeile ${currentRowIndex.value + 1} ausgewählt.`
    
    // TTS-Bestätigung
    await speakText(`Zeile ${currentRowIndex.value + 1} ausgewählt.`)
    await delay(5000)
    
    // Wechsel zu Phase 3
    startPhase3()
  }

  const handleLetterSelection = async () => {
    if (selectedRowIndex.value === null) return
    
    const row = keyboardLayout[selectedRowIndex.value]
    const letter = row.letters[currentLetterIndex.value]
    console.log('Letter selected:', letter)
    
    // Buchstabe zum Text hinzufügen
    addLetterToText(letter)
    
    // Status-Text aktualisieren und Letter Display aktivieren
    statusText.value = `${letter} gewählt.`
    isLetterDisplay.value = true
    
    // TTS-Bestätigung
    await speakText(`${letter} gewählt.`)
    await delay(3000)
    
    // Letter Display deaktivieren und zurück zu Phase 2
    isLetterDisplay.value = false
    startPhase2()
  }

  const handleNoLetterSelected = async () => {
    console.log('No letter selected after 2 cycles')
    
    // Status-Text aktualisieren
    statusText.value = "Keine Eingabe erkannt."
    
    // TTS-Meldung
    await speakText("Keine Eingabe erkannt.")
    await delay(5000)
    
    // Zurück zu Phase 2 (Zeile 1)
    startPhase2()
  }

  // ===== TEXT MANAGEMENT =====
  const addLetterToText = (letter: string) => {
    if (letter === 'LEERZEICHEN') {
      if (currentText.value === "Noch kein Text…") {
        currentText.value = ' '
      } else {
        currentText.value += ' '
      }
    } else if (letter === 'LÖSCHEN') {
      if (currentText.value === "Noch kein Text…") {
        return
      }
      currentText.value = currentText.value.slice(0, -1)
      if (currentText.value === '') {
        currentText.value = "Noch kein Text…"
      }
    } else if (letter === 'ZURÜCK') {
      // Navigation zurück zur HomeView
      console.log('Navigation: Going back to home')
      router.push('/')
    } else {
      // Für normale Buchstaben: Original-Buchstabe verwenden
      const originalLetter = getOriginalLetter(letter)
      if (currentText.value === "Noch kein Text…") {
        currentText.value = originalLetter
      } else {
        currentText.value += originalLetter
      }
    }
    console.log('Text updated to:', currentText.value)
  }

  // ===== LIFECYCLE =====
  const start = () => {
    console.log('Starting virtual keyboard')
    startPhase1()
  }

  const cleanup = () => {
    console.log('Cleaning up virtual keyboard')
    clearAllTimers()
    speechSynthesis.cancel()
  }

  return {
    // State
    currentPhase,
    currentText,
    statusText,
    currentRowIndex,
    currentLetterIndex,
    selectedRowIndex,
    isTTSActive,
    letterCycleCount,
    isLetterDisplay,
    isIntroductionActive,
    keyboardLayout,
    
    // Functions
    handleUserInput,
    addLetterToText,
    getOriginalLetter,
    start,
    cleanup
  }
}