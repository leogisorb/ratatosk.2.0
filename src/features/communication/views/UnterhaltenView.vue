<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'
import { useKeyboardDesignStore } from '../stores/keyboardDesign'
import AppHeader from '../../../shared/components/AppHeader.vue'

// ========================================
// TASTATUR-DESIGN KONFIGURATION
// ========================================
// Alle Styling-Einstellungen werden jetzt direkt im Template definiert
// für bessere Performance und Zuverlässigkeit

// Router
const router = useRouter()

// Stores
const settingsStore = useSettingsStore()
const keyboardDesignStore = useKeyboardDesignStore()

// Face Recognition
const faceRecognition = useFaceRecognition()

// Safari-Erkennung
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)


// State - Robuster und weniger sensibel
const closedFrames = ref(0)
const eyesClosed = ref(false)
const blinkThreshold = computed(() => Math.ceil(settingsStore.settings.blinkSensitivity * 10)) // Konvertiere Sekunden zu Frames (10 FPS)
const lastBlinkTime = ref(0)
const blinkCooldown = computed(() => settingsStore.settings.blinkSensitivity * 1000)

// Keyboard State
const isKeyboardActive = ref(false)
const keyboardInterval = ref<number | null>(null)
const selectedText = ref('')
const isTTSEnabled = ref(true)

// Erweiterte Tastatur mit Silben und Sonderzeichen
const keyboardLayout = [
  ['Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O', 'P', 'Ü'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ö', 'Ä'],
  ['Y', 'X', 'C', 'V', 'B', 'N', 'M', 'ß', '1', '2', '3'],
  ['SCH', 'CH', 'EI', 'AU', 'EU', 'IE', 'ÄU', 'PF', 'PH', 'CK', 'NK'],
  ['JA', 'NEIN', 'ICH', 'DU', 'WO', 'IST', 'BIN'],
  ['LEERZEICHEN', 'LÖSCHEN','ZURÜCK'], // Leerzeichen und Löschen-Button
]

// Navigation State
const currentRowIndex = ref(0)
const currentLetterIndex = ref(0)
const currentStage = ref<'rows' | 'letters'>('rows')
const letterPassCount = ref(0)

// Text-to-Speech
const speechSynthesis = window.speechSynthesis

// Text-to-Speech Funktion - Browser-safe
const speakText = (text: string) => {
  console.log('UnterhaltenView speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value)
  
  if (!isTTSEnabled.value || !speechSynthesis) {
    console.log('UnterhaltenView TTS disabled or speechSynthesis not available')
    return
  }
  
  // Warte länger und verwende try-catch
  setTimeout(() => {
    try {
      speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'de-DE'
      utterance.rate = 0.8
      utterance.pitch = 1.0
      utterance.volume = 1.0
      
      // Event Listener für Debugging
      utterance.onstart = () => console.log('UnterhaltenView: Speech started:', text)
      utterance.onend = () => console.log('UnterhaltenView: Speech ended:', text)
      utterance.onerror = (event) => {
        console.log('UnterhaltenView: Speech error:', event)
        // Versuche es nochmal nach Fehler
        setTimeout(() => {
          console.log('UnterhaltenView: Retrying TTS...')
          speechSynthesis.speak(utterance)
        }, 500)
      }
      
      console.log('UnterhaltenView Speaking:', text)
      speechSynthesis.speak(utterance)
    } catch (error) {
      console.log('UnterhaltenView: TTS Error:', error)
    }
  }, 200)
}

// Blink Detection
const handleBlink = () => {
  const now = Date.now()
  if (now - lastBlinkTime.value < blinkCooldown.value) {
    return // Zu schnell nach letztem Blink
  }
  
  lastBlinkTime.value = now
  console.log('Blink detected!')
  
  if (isKeyboardActive.value) {
    selectCurrentElement()
  }
}

// Face Recognition Events - Disabled for now
// onMounted(() => {
//   faceRecognition.start()
//   
//   faceRecognition.onBlink(() => {
//     handleBlink()
//   })
//   
//   faceRecognition.onEyesClosed(() => {
//     closedFrames.value++
//     if (closedFrames.value >= blinkThreshold.value && !eyesClosed.value) {
//       eyesClosed.value = true
//       handleBlink()
//     }
//   })
//   
//   faceRecognition.onEyesOpen(() => {
//     closedFrames.value = 0
//     eyesClosed.value = false
//   })
// })

onUnmounted(() => {
  // faceRecognition.stop() // Disabled for now
  stopKeyboard()
})

// Keyboard Functions
const startKeyboard = () => {
  console.log('startKeyboard called, isKeyboardActive:', isKeyboardActive.value)
  
  if (isKeyboardActive.value) {
    console.log('Keyboard already active, returning')
    return
  }
  
  isKeyboardActive.value = true
  currentStage.value = 'rows'
  currentRowIndex.value = 0
  currentLetterIndex.value = 0
  letterPassCount.value = 0
  
  console.log('Keyboard started successfully')
  speakText('Tastatur gestartet')
  speakCurrentRow()
}

const stopKeyboard = () => {
  if (!isKeyboardActive.value) return
  
  isKeyboardActive.value = false
  if (keyboardInterval.value) {
    clearTimeout(keyboardInterval.value)
    keyboardInterval.value = null
  }
  
  console.log('Keyboard stopped')
  speakText('Tastatur gestoppt')
}

const speakCurrentRow = () => {
  if (currentStage.value === 'rows') {
    const rowNumber = currentRowIndex.value + 1
    speakText(`Zeile ${rowNumber}`)
  }
}

const speakCurrentLetter = () => {
  if (currentStage.value === 'letters') {
    const currentRow = keyboardLayout[currentRowIndex.value]
    const currentLetter = currentRow[currentLetterIndex.value]
    speakText(currentLetter)
  }
}

// Navigation Functions
const isCurrentRow = (rowIndex: number) => {
  return currentStage.value === 'rows' && currentRowIndex.value === rowIndex
}

const isCurrentLetter = (letter: string, rowIndex: number) => {
  return currentStage.value === 'letters' && 
         currentRowIndex.value === rowIndex && 
         keyboardLayout[rowIndex][currentLetterIndex.value] === letter
}

const selectCurrentElement = () => {
  if (currentStage.value === 'rows') {
    // Zeile auswählen - wechsle zu Buchstaben-Modus
    currentStage.value = 'letters'
    currentLetterIndex.value = 0
    console.log(`Selected row ${currentRowIndex.value}, switching to letters mode`)
    speakText('Buchstaben-Modus aktiviert')
    speakCurrentLetter()
    
    // Reset Zähler für neue Zeilen-Auswahl
    letterPassCount.value = 0
  } else {
    // Buchstabe auswählen
    const currentRow = keyboardLayout[currentRowIndex.value]
    const currentLetter = currentRow[currentLetterIndex.value]
    
    if (currentLetter === 'ZURÜCK') {
      // Zurück-Navigation - sofort zurück
      console.log('Zurück-Button selected - going back immediately')
      stopKeyboard()
      router.push('/app')
      return
    } else if (currentLetter === 'LÖSCHEN') {
      // Text löschen
      console.log('Löschen-Button selected - clearing text')
      selectedText.value = ''
      speakText('Text gelöscht')
    } else if (currentLetter === 'LEERZEICHEN') {
      selectedText.value += ' '
      speakText('Leerzeichen hinzugefügt')
    } else {
      selectedText.value += currentLetter
      speakText(`${currentLetter} hinzugefügt`)
    }
    
    console.log('Selected letter:', currentLetter, 'Text:', selectedText.value)
    
    // Reset Zähler und gehe zurück zu Zeilen-Modus
    letterPassCount.value = 0
    currentStage.value = 'rows'
    currentLetterIndex.value = 0
  }
}


const speakSelectedText = () => {
  if (selectedText.value.trim()) {
    speakText(`Ihr Text: ${selectedText.value}`)
  } else {
    speakText('Noch kein Text eingegeben')
  }
}

// Test Funktion
const testFunction = () => {
  console.log('Test button clicked!')
  speakText('Test Button funktioniert')
  selectedText.value += 'TEST '
}

// Keyboard Auto-Navigation
const startKeyboardNavigation = () => {
  console.log('startKeyboardNavigation called, isKeyboardActive:', isKeyboardActive.value)
  
  if (!isKeyboardActive.value) {
    console.log('Keyboard not active, stopping navigation')
    return
  }
  
  // Sofortiger Start ohne setTimeout
  const navigate = () => {
    console.log('Auto-navigation step, currentStage:', currentStage.value, 'currentRowIndex:', currentRowIndex.value)
    
    if (currentStage.value === 'rows') {
      currentRowIndex.value = (currentRowIndex.value + 1) % keyboardLayout.length
      console.log('Moving to row:', currentRowIndex.value)
      speakCurrentRow()
    } else {
      const currentRow = keyboardLayout[currentRowIndex.value]
      currentLetterIndex.value = (currentLetterIndex.value + 1) % currentRow.length
      console.log('Moving to letter:', currentLetterIndex.value, 'in row:', currentRowIndex.value)
      speakCurrentLetter()
    }
    
    // Nächster Schritt nach 2 Sekunden
    keyboardInterval.value = window.setTimeout(navigate, 2000)
  }
  
  // Starte sofort
  navigate()
}

// Event Listeners
onMounted(() => {
  console.log('Component mounted, starting keyboard...')
  
  // Starte Tastatur sofort
  setTimeout(() => {
    console.log('Starting keyboard...')
    startKeyboard()
  }, 500)
  
  // Starte Auto-Navigation nach kurzer Verzögerung
  setTimeout(() => {
    console.log('Starting navigation...')
    startKeyboardNavigation()
  }, 1000)
  
  // Rechtsklick für manuelle Auswahl
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    console.log('Right click detected')
    if (isKeyboardActive.value) {
      selectCurrentElement()
    }
  })
})

onUnmounted(() => {
  stopKeyboard()
})
</script>

<template>
  <div class="page-container">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content -->
    <main class="main-content">
      <!-- 1. Überschrift -->
      <h1 class="page-title">
        Virtuelle Tastatur
      </h1>

      <!-- 2. Textfeld -->
      <div class="text-display-container">
        <div class="text-display-box">
          <p class="text-display-text">
            {{ selectedText || 'Noch kein Text...' }}
          </p>
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
          >
            <div 
              v-for="(letter, letterIndex) in row" 
              :key="letter"
              class="keyboard-key"
              :class="(currentStage === 'rows' && isCurrentRow(rowIndex)) || (currentStage === 'letters' && isCurrentLetter(letter, rowIndex)) ? 'keyboard-key-active' : 'keyboard-key-inactive'"
              :style="{
                width: keyboardDesignStore.keyWidth + 'px',
                height: keyboardDesignStore.keyHeight + 'px',
                borderRadius: keyboardDesignStore.borderRadius + 'px',
                backgroundColor: (currentStage === 'rows' && isCurrentRow(rowIndex)) || (currentStage === 'letters' && isCurrentLetter(letter, rowIndex))
                  ? keyboardDesignStore.activeKeyBackground
                  : keyboardDesignStore.inactiveKeyBackground,
                borderColor: (currentStage === 'rows' && isCurrentRow(rowIndex)) || (currentStage === 'letters' && isCurrentLetter(letter, rowIndex))
                  ? keyboardDesignStore.activeKeyBorder
                  : keyboardDesignStore.inactiveKeyBorder,
                borderWidth: '2px',
                color: (currentStage === 'rows' && isCurrentRow(rowIndex)) || (currentStage === 'letters' && isCurrentLetter(letter, rowIndex))
                  ? keyboardDesignStore.activeKeyText
                  : keyboardDesignStore.inactiveKeyText
              }"
            >
              <span class="keyboard-key-text" :style="{ fontSize: (keyboardDesignStore.fontSize * 1.5) + 'px' }">
                {{ letter }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 6. Abstandshalter nach der Tastatur -->
      <div class="spacer"></div>

      <!-- 7. Statusanzeigen (untereinander) -->
      <div class="status-section">
        <div class="status-item">
          <div class="status-indicator" :class="isKeyboardActive ? 'status-active' : 'status-inactive'"></div>
          <span class="status-text">
            {{ isKeyboardActive ? 'Tastatur aktiv' : 'Tastatur aus' }}
          </span>
        </div>
        
        <div class="status-item">
          <div class="status-indicator" :class="faceRecognition.isActive.value ? 'status-active' : 'status-inactive'"></div>
          <span class="status-text">
            {{ faceRecognition.isActive.value ? 'Kamera aktiv' : 'Kamera aus' }}
          </span>
        </div>
      </div>

      <!-- Test Button -->
      <div class="test-section">
        <button @click="testFunction" class="test-button">Test Button</button>
        <p class="test-text">Status: {{ isKeyboardActive ? 'Aktiv' : 'Inaktiv' }}</p>
      </div>

      <!-- 8. Bedienungsanleitung -->
      <div class="instructions-section">
        <h3 class="instructions-title">Bedienung</h3>
        <p class="instructions-text">
          <strong>Kurz blinzeln ({{ settingsStore.settings.blinkSensitivity }}s):</strong> Aktion auswählen<br>
          <strong>Rechte Maustaste:</strong> Aktion auswählen<br>
          <strong>Auto-Modus:</strong> Automatischer Durchlauf durch alle Aktionen
        </p>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* UnterhaltenView verwendet jetzt globale CSS-Klassen aus main.css */

/* Spezifische UnterhaltenView Styles - Vertikales Layout */
.main-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
}

.page-title {
  font-size: 3.125rem;
  font-weight: bold;
  color: #1f2937;
  font-family: 'Source Code Pro', monospace;
  font-weight: 300;
  margin: 0 0 1.5rem 0;
  text-align: center;
}

.text-display-container {
  width: 100%;
  max-width: 1760px;
  margin: 0 auto;
}

.text-display-box {
  background-color: #f3f4f6;
  border-radius: 0.5rem;
  padding: 1.5rem;
  border: 2px solid #d1d5db;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-display-text {
  font-size: 1.875rem;
  color: #1f2937;
  font-family: 'Source Code Pro', monospace;
  font-weight: 300;
  margin: 0;
  word-break: break-word;
  text-align: center;
}

.instructions-section {
  text-align: center;
  width: 100%;
  max-width: 600px;
}

.instructions-text {
  font-size: 1.25rem;
  color: #4b5563;
  font-family: 'Source Code Pro', monospace;
  font-weight: 300;
  margin: 0;
}

.spacer {
  height: 2rem;
  width: 100%;
}

.keyboard-container {
  margin: 0;
  width: 100%;
  max-width: 2200px;
  margin-left: auto;
  margin-right: auto;
}

.keyboard-vertical {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  width: 100%;
}

.keyboard-row {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: nowrap;
  width: 100%;
  max-width: 2200px;
  overflow-x: auto;
}

.keyboard-key {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid #d1d5db;
  font-family: 'Source Code Pro', monospace;
  font-weight: bold;
  min-width: 80px;
  min-height: 60px;
  flex-shrink: 0;
}

/* Spezielle Breite für die letzte Zeile (LEERZEICHEN, LÖSCHEN, ZURÜCK) */
.keyboard-row:last-child .keyboard-key {
  min-width: 180px;
  flex: 1;
  max-width: 300px;
}

.keyboard-key:hover {
  transform: scale(1.05);
}

.keyboard-key-active {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  /* transform: scale(1.1); entfernt - Tasten bleiben gleich groß */
}

.keyboard-key-inactive {
  background-color: white;
  color: #374151;
}

.keyboard-key-text {
  font-family: 'Source Code Pro', monospace;
  font-weight: bold;
}

.status-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.status-section {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  width: 100%;
  max-width: 600px;
  margin-top: 0.5rem;
}

.status-item {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  background-color: #dbeafe;
  color: #1e40af;
}

.status-indicator {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.status-active {
  background-color: #10b981;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.status-inactive {
  background-color: #ef4444;
}

.status-text {
  font-family: 'Source Code Pro', monospace;
  font-weight: 400;
  font-size: 0.875rem;
}

.instructions-box {
  background-color: transparent;
  color: #374151;
  padding: 1rem;
  max-width: 600px;
  width: 100%;
  text-align: center;
}

.instructions-title {
  font-size: 1.25rem;
  font-weight: bold;
  margin: 0 0 1rem 0;
  color: #1f2937;
}

.instructions-text {
  margin: 0;
  line-height: 1.6;
  color: #374151;
  font-size: 1rem;
}

.instructions-text strong {
  font-weight: bold;
  color: #1f2937;
}

.test-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin: 1rem 0;
}

.test-button {
  padding: 1rem 2rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1.2rem;
  cursor: pointer;
  font-family: 'Source Code Pro', monospace;
}

.test-button:hover {
  background-color: #2563eb;
}

.test-text {
  font-size: 1.2rem;
  color: #1f2937;
  font-family: 'Source Code Pro', monospace;
  margin: 0;
}

.tts-status {
  font-size: 1rem;
  color: #6b7280;
  font-family: 'Source Code Pro', monospace;
  margin: 0.5rem 0 0 0;
  font-style: italic;
}

/* Custom animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .letter-display {
    font-size: 4rem;
  }
  
  .keyboard-row {
    gap: 0.5rem;
  }
  
  .keyboard-key {
    min-width: 40px;
    min-height: 40px;
  }
}
</style>