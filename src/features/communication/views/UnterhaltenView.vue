<script setup lang="ts">
import AppHeader from '../../../shared/components/AppHeader.vue'
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useKeyboardDesignStore } from '../stores/keyboardDesign'
import { useSettingsStore } from '../../settings/stores/settings'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'

// ===== STORES & ROUTER =====
const keyboardDesignStore = useKeyboardDesignStore()
const settingsStore = useSettingsStore()
const faceRecognition = useFaceRecognition()
const router = useRouter()

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
const isTTSActive = ref(false)
const letterCycleCount = ref(0)
const isLetterDisplay = ref(false)
const isIntroductionActive = ref(false)

// ===== BLINK DETECTION =====
// Verwendet die gleiche Event-basierte Logik wie HomeView

// ===== CONTROL FLOW SAFETY =====
let scanSessionId = 0

const newScanSession = () => {
  scanSessionId++
  console.log("🔄 Neue Scan-Session gestartet:", scanSessionId)
  return scanSessionId
}

// ===== TIMER MANAGEMENT =====
let currentTimer: number | null = null
let rowScanInterval: number | null = null
let letterScanInterval: number | null = null

const clearAllTimers = () => {
  if (currentTimer) {
    clearTimeout(currentTimer)
    currentTimer = null
  }
  if (rowScanInterval) {
    clearInterval(rowScanInterval)
    rowScanInterval = null
  }
  if (letterScanInterval) {
    clearInterval(letterScanInterval)
    letterScanInterval = null
  }
}

// ===== UTILITY FUNCTIONS =====
/**
 * Gibt den originalen Buchstaben zurück (nicht die TTS-Aussprache)
 * @param letter Der Buchstabe oder die Buchstabenkombination
 * @returns Der originale Buchstabe für die Anzeige
 */
const getOriginalLetter = (letter: string): string => {
  // Für normale Buchstaben: Original zurückgeben
  if (letter.length === 1 && /[A-Z]/.test(letter)) {
    return letter // A, B, C, etc. bleiben A, B, C
  }
  
  // Für Sonderzeichen: Original zurückgeben
  const originalMap: Record<string, string> = {
    'ß': 'ß',
    'Ü': 'Ü',
    'Ä': 'Ä',
    'Ö': 'Ö',
    '?': '?',
    ',': ',',
    '.': '.',
    'LEERZEICHEN': ' ',
    'LÖSCHEN': '', // Wird separat behandelt
    'ZURÜCK': '', // Wird separat behandelt
    'SCH': 'sch',
    'CH': 'ch',
    'EI': 'ei',
    'IE': 'ie',
    'AU': 'au',
    'EU': 'eu',
    'ÄU': 'äu',
    'PF': 'pf',
    'PH': 'ph',
    'CK': 'ck',
    'NK': 'nk',
    'JA': 'ja',
    'NEIN': 'nein',
    'ICH': 'ich',
    'DU': 'du',
    'ES': 'es',
    'IST': 'ist',
    'BIN': 'bin'
  }
  
  return originalMap[letter] || letter
}

// ===== TTS FUNCTIONS =====
/**
 * Asynchrone TTS-Funktion mit Start/End-Callbacks
 * @param text Der zu sprechende Text
 * @param onStart Callback beim TTS-Start
 * @param onEnd Callback beim TTS-Ende
 * @returns Promise das resolved wenn TTS fertig ist
 */
const speakText = (text: string, onStart?: () => void, onEnd?: () => void): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log('TTS: Speaking:', text)
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'de-DE'
    utterance.rate = 0.8
    utterance.pitch = 1.0
    utterance.volume = 0.8

    utterance.onstart = () => {
      console.log('TTS: Started speaking')
      isTTSActive.value = true
      statusText.value = text
      if (onStart) onStart()
    }

    utterance.onend = () => {
      console.log('TTS: Finished speaking')
      isTTSActive.value = false
      if (onEnd) onEnd()
      resolve() // Promise erfüllt, wenn TTS fertig ist
    }

    utterance.onerror = (e) => {
      console.error('TTS Error:', e)
      isTTSActive.value = false
      reject(e)
    }

    speechSynthesis.speak(utterance)
  })
}

const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ===== PHASE 1: INITIALIZATION =====
const startPhase1 = async () => {
  console.log('Phase 1: Starting initialization')
  currentPhase.value = VirtualKeyboardPhase.INIT
  isIntroductionActive.value = true // Einführung aktiv - Input ignorieren
  clearAllTimers()
  
  // Begrüßungstext anzeigen
  statusText.value = "Ich lese Ihnen jetzt nacheinander die Zeilen vor. Blinzeln oder klicken Sie, um eine Zeile auszuwählen."
  
  // TTS-Begrüßung mit Callbacks
  await speakText("Hallo.")
  await delay(3000)
  
  await speakText("Ich helfe Ihnen, Wörter und Sätze zu schreiben.")
  await delay(3000)
  
  await speakText("Dazu sehen Sie jetzt verschiedene Zeilen mit Buchstaben und Wörtern.")
  await delay(3000)
  
 
  
  await speakText("Wählen Sie jetzt zuerst eine Zeile aus, die einen Buchstaben Ihrer Wahl enthält.")
  
  // Nach TTS-Ende + 4 Sekunden → Phase 2
  currentTimer = window.setTimeout(() => {
    isIntroductionActive.value = false // Einführung beendet - Input wieder erlaubt
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
      // onStart: Zeile hervorheben
      console.log('Row highlighted:', currentRowIndex.value)
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
      // onStart: Buchstabe hervorheben
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

// ===== BLINK DETECTION HANDLER =====
const handleBlink = (event: any) => {
  // Ignoriere Blinzeln während der Einführung
  if (isIntroductionActive.value) {
    console.log('👁️ Blink ignored during introduction phase')
    return
  }
  
  console.log('👁️ Blink detected in UnterhaltenView:', event.detail)
  handleUserInput()
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
  statusText.value = getOriginalLetter(letter)
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
  
  // TTS-Meldung
  await speakText("Keine Eingabe erkannt.")
  await delay(5000)
  
  // Zurück zu Phase 2 (Zeile 1)
  startPhase2()
}

// ===== KEYBOARD LAYOUT =====
const keyboardLayout = [
  { letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'] },
  { letters: ['L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V'] },
  { letters: ['W', 'X', 'Y', 'Z', 'Ä', 'Ö', 'Ü', 'ß', '.', ',', '?'] },
  { letters: ['SCH', 'CH', 'EI', 'IE', 'AU', 'EU', 'ÄU', 'PF', 'PH', 'CK', 'NK'] },
  { letters: ['JA', 'NEIN', 'ICH', 'DU', 'ES', 'IST', 'BIN'] },
  { letters: ['LEERZEICHEN', 'LÖSCHEN', 'ZURÜCK'] }
]

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


// ===== EVENT LISTENERS =====
const handleRightClick = (event: MouseEvent) => {
  // Ignoriere Rechtsklick während der Einführung
  if (isIntroductionActive.value) {
    console.log('Right click ignored during introduction phase')
    event.preventDefault()
    return
  }
  
  event.preventDefault()
  console.log('Right click detected')
  handleUserInput()
}

// ===== LIFECYCLE =====
onMounted(() => {
  console.log('UnterhaltenView mounted - starting virtual keyboard')
  
  // Event Listener für Rechtsklick (wie in HomeView)
  document.addEventListener('contextmenu', handleRightClick, { capture: true, passive: false })
  
  // Event Listener für Face Blinzel-Erkennung (wie in HomeView)
  window.addEventListener('faceBlinkDetected', handleBlink)
  console.log('UnterhaltenView: Face Recognition Event Listener registriert')
  
  // Starte Face Recognition (wie in HomeView)
  if (!faceRecognition.isActive.value) {
    console.log('UnterhaltenView: Face Recognition nicht aktiv - starte sie')
    faceRecognition.start()
  } else {
    console.log('UnterhaltenView: Face Recognition bereits aktiv - verwende bestehende Instanz')
  }
  
  // Starte mit Phase 1
  startPhase1()
})

onUnmounted(() => {
  console.log('UnterhaltenView unmounted - cleaning up')
  
  // Event Listener entfernen (wie in HomeView)
  document.removeEventListener('contextmenu', handleRightClick, { capture: true })
  window.removeEventListener('faceBlinkDetected', handleBlink)
  
  // Timer und TTS aufräumen
  clearAllTimers()
  speechSynthesis.cancel()
  
  // Face Recognition nicht stoppen (läuft seitenübergreifend)
  console.log('Face Recognition continues running for other views')
})
</script>

<template>
  <div class="page-container">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content -->
    <main class="main-content">
      <!-- 1. Status-Anzeige -->
      <div class="sentence-display-container">
        <div class="sentence-display">
          <div class="sentence-item sentence-active" :class="{ 'letter-display': isLetterDisplay }">
            {{ statusText }}
          </div>
        </div>
      </div>

      <!-- 2. Textfeld -->
      <div class="text-display-container">
        <div class="text-display-box">
          <p class="text-display-text">
            {{ currentText }}
          </p>
        </div>
        <!-- TTS-Indikator -->
        <div class="tts-indicator" :class="{ 'tts-active': isTTSActive }">
          🔊
        </div>
      </div>

      <!-- 4. Abstandshalter -->
      <div class="spacer"></div>

      <!-- 5. Tastaturblock -->
      <div class="keyboard-container">
        <div class="keyboard-vertical">
          <div
            v-for="(row, rowIndex) in keyboardLayout"
            :key="`row-${rowIndex}`"
            class="keyboard-row"
            :class="{ 
              'row-active': currentPhase === 'row_scanning' && currentRowIndex === rowIndex,
              'row-selected': selectedRowIndex === rowIndex
            }"
          >
            <div
              v-for="(letter, letterIndex) in row.letters"
              :key="letter"
              class="keyboard-key"
              :class="{ 
                'letter-active': currentPhase === 'letter_scanning' && 
                                selectedRowIndex === rowIndex && 
                                currentLetterIndex === letterIndex
              }"
              :style="{
                width: keyboardDesignStore.keyWidth + 'px',
                height: keyboardDesignStore.keyHeight + 'px',
                borderRadius: keyboardDesignStore.borderRadius + 'px',
                fontSize: (keyboardDesignStore.fontSize * 1.5) + 'px'
              }"
            >
              <span class="keyboard-key-text">
                {{ letter }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 6. Abstandshalter nach der Tastatur -->
      <div class="spacer"></div>
    </main>
  </div>
</template>

<style scoped>
@import './UnterhaltenView.css';
</style>