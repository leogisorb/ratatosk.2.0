import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { keyboardLayout, getOriginalLetter } from '../data/keyboardLayout'
import { useSpeech } from './useSpeech'
import { useTimers } from './useTimers'
import { useBlinkInput } from './useBlinkInput'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'
import { useSettingsStore } from '../../settings/stores/settings'

/**
 * Composable für die virtuelle Tastatur mit TTS und Blinzelsteuerung
 * Enthält die komplette State Machine und Logik für die drei Phasen
 */
export function useVirtualKeyboard() {
  const router = useRouter()
  const { isTTSActive, isTTSReady, initializeTTS, speakText, delay, stopTTS } = useSpeech()
  const { clearAllTimers, setTimer } = useTimers()
  const { isIntroductionActive, startIntroduction, endIntroduction } = useBlinkInput()
  const settingsStore = useSettingsStore()
  
  // Settings-Werte für Anzeigeintervall (leuchtdauer in Sekunden → Millisekunden)
  const SETTINGS_TO_MS_MULTIPLIER = 1000
  const displayInterval = computed(() => settingsStore.settings.leuchtdauer * SETTINGS_TO_MS_MULTIPLIER)
  
  // TTS Muted State als computed für bessere Performance
  const isTTSMuted = computed(() => simpleFlowController.getTTSMuted())

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
  let isCancelled = false
  let isProcessingInput = false // Verhindert gleichzeitige Input-Verarbeitung
  let inputDebounceTimer: ReturnType<typeof setTimeout> | null = null
  let needsUserGesture = true // iOS Safari: TTS benötigt User-Geste

  const newScanSession = () => {
    scanSessionId++
    console.log("🔄 Neue Scan-Session gestartet:", scanSessionId)
    return scanSessionId
  }

  const checkCancelled = () => {
    if (isCancelled) {
      throw new Error('VirtualKeyboard cancelled')
    }
  }

  // ===== PHASE 1: INITIALIZATION =====
  const startPhase1 = async () => {
    try {
      console.log('Phase 1: Starting initialization')
      checkCancelled()
      currentPhase.value = VirtualKeyboardPhase.INIT
      clearAllTimers()
      
      // Prüfe ob TTS stumm ist - wenn ja, Begrüßungstexte komplett überspringen
      if (isTTSMuted.value) {
        console.log('Phase 1: TTS is muted - skipping greeting texts and going directly to Phase 2')
        // Keine Begrüßungstexte anzeigen oder sprechen
        // Direkt zu Phase 2 springen
        startPhase2()
        return
      }
      
      // TTS ist nicht stumm - initialisiere TTS falls noch nicht geschehen
      if (!isTTSReady.value) {
        console.log('Phase 1: TTS not ready - initializing TTS')
        await initializeTTS()
        needsUserGesture = false // TTS ist jetzt initialisiert
      }
      
      // TTS ist nicht stumm - normale Begrüßung durchführen
      startIntroduction() // Einführung aktiv - Input ignorieren
      
      // Begrüßungstext anzeigen
      statusText.value = "Ich lese Ihnen jetzt nacheinander die Zeilen vor. Blinzeln oder klicken Sie, um eine Zeile auszuwählen."
      
      // TTS-Begrüßung mit Callbacks
      checkCancelled()
      await speakText("Hallo.", () => { statusText.value = "Hallo." })
      checkCancelled()
      await delay(displayInterval.value)
      
      checkCancelled()
      await speakText("Ich helfe Ihnen, Wörter und Sätze zu schreiben.", () => { statusText.value = "Ich helfe Ihnen, Wörter und Sätze zu schreiben." })
      checkCancelled()
      await delay(displayInterval.value)
      
      checkCancelled()
      await speakText("Dazu sehen Sie jetzt verschiedene Zeilen mit Buchstaben und Wörtern.", () => { statusText.value = "Dazu sehen Sie jetzt verschiedene Zeilen mit Buchstaben und Wörtern." })
      checkCancelled()
      await delay(displayInterval.value)
      
      checkCancelled()
      await speakText("Wenn Sie eine Zeile auswählen möchten, blinzeln oder tippen Sie bitte einmal", () => { statusText.value = "Wenn Sie eine Zeile auswählen möchten, blinzeln oder tippen Sie bitte einmal" })
      checkCancelled()
      await delay(displayInterval.value)
      
      checkCancelled()
      await speakText("Wählen Sie jetzt zuerst eine Zeile aus, die einen Buchstaben Ihrer Wahl enthält.", () => { statusText.value = "Wählen Sie jetzt zuerst eine Zeile aus, die einen Buchstaben Ihrer Wahl enthält." })
      
      checkCancelled()
      // Nach TTS-Ende + Anzeigeintervall → Phase 2
      await delay(displayInterval.value)
      if (!isCancelled) {
        endIntroduction() // Einführung beendet - Input wieder erlaubt
        startPhase2()
      }
    } catch (error) {
      if (isCancelled) {
        console.log('Phase 1: Cancelled')
        return
      }
      console.error('Phase 1: Error', error)
    }
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
    if (isCancelled) return
    
    const rowDescriptions = [
      "Erste Zeile, Buchstaben A bis K.",
      "Zweite Zeile, Buchstaben L bis V.",
      "Dritte Zeile, Buchstaben W bis Fragezeichen.",
      "Vierte Zeile, Silben.",
      "Fünfte Zeile, Kurzwörter.",
      "Sechste Zeile, Steuerungstasten."
    ]
    
    console.log('🎯 Scanning row:', currentRowIndex.value, rowDescriptions[currentRowIndex.value])
    
    // Prüfe ob TTS stumm ist
    if (isTTSMuted.value) {
      // TTS ist stumm - nur visuelle Hervorhebung, schneller Durchlauf
      statusText.value = rowDescriptions[currentRowIndex.value]
      console.log('Row highlighted (muted):', currentRowIndex.value, 'Status-Text:', statusText.value)
      // Wartezeit für visuelle Wahrnehmung (Anzeigeintervall aus Settings)
      await delay(displayInterval.value)
    } else {
      // TTS ist aktiv - normale Logik mit TTS
      checkCancelled()
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
      checkCancelled()
      // Nach TTS-Ende + Anzeigeintervall → nächste Zeile
      await delay(displayInterval.value)
    }
    
    // Prüfen, ob Session, Phase oder Cancellation sich geändert haben
    if (sessionId !== scanSessionId || 
        currentPhase.value !== VirtualKeyboardPhase.ROW_SCANNING || 
        isCancelled) return
    
    currentRowIndex.value = (currentRowIndex.value + 1) % keyboardLayout.length
    scanNextRow(sessionId) // rekursiver Aufruf nur, wenn gültig
  }

  // ===== PHASE 3: LETTER SCANNING =====
  const startPhase3 = async () => {
    try {
      console.log('Phase 3: Starting letter scanning')
      checkCancelled()
      currentPhase.value = VirtualKeyboardPhase.LETTER_SCANNING
      clearAllTimers()
      const mySession = newScanSession() // ⬅️ eigene Lauf-ID merken
      currentLetterIndex.value = 0
      letterCycleCount.value = 0
      
      // Anzeige und TTS - angepasst an die ausgewählte Zeile
      const rowDescriptions = [
        "Wählen Sie jetzt einen Buchstaben aus.",
        "Wählen Sie jetzt einen Buchstaben aus.",
        "Wählen Sie jetzt einen Buchstaben aus.",
        "Wählen Sie jetzt eine Silbe aus, um diese zu schreiben.",
        "Wählen Sie jetzt ein Kurzwort aus, um dieses zu schreiben.",
        "Wählen Sie jetzt eine Steuerungstaste aus, um diese zu verwenden."
      ]
      
      const selectedRow = selectedRowIndex.value || 0
      const description = rowDescriptions[selectedRow]
      
      statusText.value = description
      
      // Prüfe ob TTS stumm ist
      if (isTTSMuted.value) {
        // TTS ist stumm - Wartezeit (Anzeigeintervall aus Settings)
        checkCancelled()
        await delay(displayInterval.value)
      } else {
        // TTS ist aktiv - normale Logik
        checkCancelled()
        await speakText(description)
        checkCancelled()
        await delay(displayInterval.value)
      }
      
      checkCancelled()
      // Starte Buchstabendurchlauf
      scanNextLetter(mySession)
    } catch (error) {
      if (isCancelled) {
        console.log('Phase 3: Cancelled')
        return
      }
      console.error('Phase 3: Error', error)
    }
  }

  const scanNextLetter = async (sessionId: number) => {
    if (sessionId !== scanSessionId) return // Abbruch, wenn Session ungültig
    if (currentPhase.value !== VirtualKeyboardPhase.LETTER_SCANNING || selectedRowIndex.value === null) return
    if (isCancelled) return
    
    const row = keyboardLayout[selectedRowIndex.value]
    const letter = row.letters[currentLetterIndex.value]
    
    console.log('🎯 Scanning letter:', letter)
    
    // Prüfe ob TTS stumm ist
    if (isTTSMuted.value) {
      // TTS ist stumm - nur visuelle Hervorhebung, schneller Durchlauf
      statusText.value = letter
      console.log('Letter highlighted (muted):', letter)
      // Wartezeit für visuelle Wahrnehmung (Anzeigeintervall aus Settings)
      await delay(displayInterval.value)
    } else {
      // TTS ist aktiv - normale Logik mit TTS
      checkCancelled()
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
      checkCancelled()
      // Nach TTS-Ende + Anzeigeintervall → nächster Buchstabe
      await delay(displayInterval.value)
    }
    
    // Prüfen, ob Session, Phase oder Cancellation sich geändert haben
    if (sessionId !== scanSessionId || 
        currentPhase.value !== VirtualKeyboardPhase.LETTER_SCANNING || 
        selectedRowIndex.value === null ||
        isCancelled) return
    
    const currentRow = keyboardLayout[selectedRowIndex.value]
    currentLetterIndex.value = (currentLetterIndex.value + 1) % currentRow.letters.length
    
    // Prüfe ob wir am Ende der Zeile angekommen sind
    if (currentLetterIndex.value === 0) {
      letterCycleCount.value++
      console.log('Completed cycle', letterCycleCount.value, 'for row', selectedRowIndex.value)
      
      // Nach 2 Durchläufen zurück zu Phase 2
      const MAX_LETTER_CYCLES = 2
      if (letterCycleCount.value >= MAX_LETTER_CYCLES) {
        console.log('Reached', MAX_LETTER_CYCLES, 'cycles - returning to row scanning')
        handleNoLetterSelected()
        return
      }
    }
    
    scanNextLetter(sessionId) // rekursiver Aufruf nur, wenn gültig
  }

  // ===== USER INTERACTION HANDLING =====
  const handleUserInput = async () => {
    // iOS Safari: Initialisiere TTS beim ersten User-Input (User-Geste erforderlich)
    if (needsUserGesture && !isTTSReady.value) {
      console.log('TTS: Initializing on first user input (iOS Safari requirement)')
      await initializeTTS()
      needsUserGesture = false
    }
    
    // Ignoriere User Input während der Einführung
    if (isIntroductionActive.value) {
      console.log('User input ignored during introduction phase')
      return
    }
    
    // Verhindere gleichzeitige Verarbeitung
    if (isProcessingInput) {
      console.log('User input ignored - already processing')
      return
    }
    
    // Debouncing: Lösche vorherigen Timer und setze neuen
    if (inputDebounceTimer) {
      clearTimeout(inputDebounceTimer)
    }
    
    // Warte 200ms bevor Input verarbeitet wird (Debouncing)
    inputDebounceTimer = setTimeout(async () => {
      // Prüfe nochmal, ob bereits verarbeitet wird
      if (isProcessingInput) {
        console.log('User input ignored - already processing (debounced)')
        return
      }
      
      isProcessingInput = true
      
      try {
        console.log('User input detected in phase:', currentPhase.value)
        
        // Stoppe alle Timer und TTS
        clearAllTimers()
        stopTTS() // Verwende stopTTS aus useSpeech
        simpleFlowController.stopTTS()
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
      } finally {
        // Warte zusätzlich 300ms bevor nächster Input verarbeitet werden kann (Throttling)
        await delay(300)
        isProcessingInput = false
      }
    }, 200)
  }

  const handleRowSelection = async () => {
    try {
      console.log('Row selected:', currentRowIndex.value)
      checkCancelled()
      selectedRowIndex.value = currentRowIndex.value
      
      // Status-Text aktualisieren
      statusText.value = `Zeile ${currentRowIndex.value + 1} ausgewählt.`
      
      // Prüfe ob TTS stumm ist
      if (isTTSMuted.value) {
        // TTS ist stumm - Wartezeit (Anzeigeintervall aus Settings)
        checkCancelled()
        await delay(displayInterval.value)
      } else {
        // TTS ist aktiv - normale Logik
        checkCancelled()
        await speakText(`Zeile ${currentRowIndex.value + 1} ausgewählt.`)
        checkCancelled()
        await delay(displayInterval.value)
      }
      
      checkCancelled()
      // Wechsel zu Phase 3
      startPhase3()
    } catch (error) {
      if (isCancelled) {
        console.log('Row selection: Cancelled')
        return
      }
      console.error('Row selection: Error', error)
    }
  }

  const handleLetterSelection = async () => {
    try {
      if (selectedRowIndex.value === null) return
      checkCancelled()
      
      const row = keyboardLayout[selectedRowIndex.value]
      const letter = row.letters[currentLetterIndex.value]
      console.log('Letter selected:', letter)
      
      // Buchstabe zum Text hinzufügen
      addLetterToText(letter)
      
      // Status-Text aktualisieren und Letter Display aktivieren
      statusText.value = `${letter} gewählt.`
      isLetterDisplay.value = true
      
      // Prüfe ob TTS stumm ist
      if (isTTSMuted.value) {
        // TTS ist stumm - Wartezeit (Anzeigeintervall aus Settings)
        checkCancelled()
        await delay(displayInterval.value)
      } else {
        // TTS ist aktiv - normale Logik
        checkCancelled()
        await speakText(`${letter} gewählt.`)
        checkCancelled()
        await delay(displayInterval.value)
      }
      
      checkCancelled()
      // Letter Display deaktivieren und zurück zu Phase 2
      isLetterDisplay.value = false
      startPhase2()
    } catch (error) {
      if (isCancelled) {
        console.log('Letter selection: Cancelled')
        return
      }
      console.error('Letter selection: Error', error)
    }
  }

  const handleNoLetterSelected = async () => {
    try {
      console.log('No letter selected after 2 cycles')
      checkCancelled()
      
      // Status-Text aktualisieren
      statusText.value = "Keine Eingabe erkannt."
      
      // Prüfe ob TTS stumm ist
      if (isTTSMuted.value) {
        // TTS ist stumm - Wartezeit (Anzeigeintervall aus Settings)
        checkCancelled()
        await delay(displayInterval.value)
      } else {
        // TTS ist aktiv - normale Logik
        checkCancelled()
        await speakText("Keine Eingabe erkannt.")
        checkCancelled()
        await delay(displayInterval.value)
      }
      
      checkCancelled()
      // Zurück zu Phase 2 (Zeile 1)
      startPhase2()
    } catch (error) {
      if (isCancelled) {
        console.log('No letter selected: Cancelled')
        return
      }
      console.error('No letter selected: Error', error)
    }
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
      // Navigation zurück zur HomeView (/app) mit sauberem Reset
      console.log('UnterhaltenView: ZURÜCK Button - Stoppe alle Services und navigiere zu /app')
      
      // Stoppe alle Services
      simpleFlowController.stopTTS()
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      simpleFlowController.stopAutoMode()
      simpleFlowController.setActiveView('')
      
      // Stoppe alle Timer
      clearAllTimers()
      
      // Navigiere zu /app (Home-View)
      router.push('/app').then(() => {
        console.log('UnterhaltenView: Navigation zu /app erfolgreich - alle Services gestoppt')
      }).catch((error) => {
        console.error('UnterhaltenView: Navigation zu /app fehlgeschlagen:', error)
      })
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
    // Reset cancellation flag when starting
    isCancelled = false
    startPhase1()
  }

  const cleanup = () => {
    console.log('Cleaning up virtual keyboard')
    
    // 1. Cancellation Flag SOFORT setzen
    // Alle async Operationen stoppen automatisch (weil sie isCancelled checken)
    isCancelled = true
    
    // 2. Stoppe alle Timer
    clearAllTimers()
    
    // 3. Stoppe Debounce-Timer
    if (inputDebounceTimer) {
      clearTimeout(inputDebounceTimer)
      inputDebounceTimer = null
    }
    
    // 4. Reset Input-Processing Flag
    isProcessingInput = false
    
    // 5. Stoppe alle laufenden TTS (mehrfach für Sicherheit)
    stopTTS() // Verwende stopTTS aus useSpeech
    simpleFlowController.stopTTS()
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    
    // 6. Neue Session starten (stoppt alle laufenden Scans)
    newScanSession()
    
    // 7. Reset States für nächsten Start
    currentPhase.value = VirtualKeyboardPhase.INIT
    currentRowIndex.value = 0
    currentLetterIndex.value = 0
    selectedRowIndex.value = null
    letterCycleCount.value = 0
    isLetterDisplay.value = false
    statusText.value = "Virtuelle Tastatur bereit"
    needsUserGesture = true // Reset für nächsten Start
    
    // 8. End Introduction falls aktiv
    if (isIntroductionActive.value) {
      endIntroduction()
    }
    
    console.log('Virtual keyboard cleanup complete')
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