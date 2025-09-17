<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '@/composables/useFaceRecognition'
import { useSettingsStore } from '@/stores/settings'

// Router
const router = useRouter()

// Stores
const settingsStore = useSettingsStore()

// Face Recognition
const faceRecognition = useFaceRecognition()

// State - Robuster und weniger sensibel
const closedFrames = ref(0)
const eyesClosed = ref(false)
const blinkThreshold = computed(() => Math.ceil(settingsStore.settings.blinkSensitivity * 10)) // Konvertiere Sekunden zu Frames (10 FPS)
const lastBlinkTime = ref(0)
const blinkCooldown = 1500 // 1.5 Sekunden Cooldown zwischen Blinks

// Keyboard State
const isKeyboardActive = ref(false)
const keyboardInterval = ref<number | null>(null)
const selectedText = ref('')
const isTTSEnabled = ref(true)

// Erweiterte Tastatur mit Silben und Sonderzeichen
const keyboardLayout = [
  ['Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O', 'P', 'Ü'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ö', 'Ä'],
  ['Y', 'X', 'C', 'V', 'B', 'N', 'M', 'ß'],
  ['SCH', 'CH', 'EI', 'AU', 'EU', 'IE', 'ÄU'],
  [' ', 'LÖSCHEN'], // Leerzeichen und Löschen-Button
  ['ZURÜCK'] // Zurück-Button als eigene Zeile
]

// Flache Liste aller Zeichen für den Durchlauf
const alphabet = keyboardLayout.flat()

// Zwei-Stufen-System: Erst Zeilen, dann Buchstaben
const currentStage = ref<'rows' | 'letters'>('rows')
const currentRowIndex = ref(0)
const currentLetterIndex = ref(0)

// Text-to-Speech
const speechSynthesis = window.speechSynthesis

const speakText = (text: string) => {
  console.log('UnterhaltenView speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value, 'speechSynthesis:', speechSynthesis)
  
  if (!isTTSEnabled.value || !speechSynthesis) {
    console.log('UnterhaltenView TTS disabled or speechSynthesis not available')
    return
  }
  
  speechSynthesis.cancel()
  
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'de-DE'
  utterance.rate = 0.8
  utterance.pitch = 1.0
  utterance.volume = 0.8
  
  console.log('UnterhaltenView Speaking:', text)
  speechSynthesis.speak(utterance)
}

// Keyboard Functions - Zwei-Stufen-System
const startKeyboard = () => {
  if (isKeyboardActive.value) return
  
  isKeyboardActive.value = true
  currentStage.value = 'rows'
  currentRowIndex.value = 0
  currentLetterIndex.value = 0
  console.log('Starting virtual keyboard - Stage: rows')
  
  // Spreche die erste Zeile vor
  speakCurrentRow()
  
  // Starte den Durchlauf
  keyboardInterval.value = window.setInterval(() => {
    if (isKeyboardActive.value) {
      if (currentStage.value === 'rows') {
        currentRowIndex.value = (currentRowIndex.value + 1) % keyboardLayout.length
        speakCurrentRow()
      } else {
        const currentRow = keyboardLayout[currentRowIndex.value]
        currentLetterIndex.value = (currentLetterIndex.value + 1) % currentRow.length
        speakCurrentLetter()
      }
    }
  }, 2000) // 2 Sekunden pro Element
}

const stopKeyboard = () => {
  isKeyboardActive.value = false
  if (keyboardInterval.value) {
    clearInterval(keyboardInterval.value)
    keyboardInterval.value = null
  }
  speechSynthesis.cancel()
  console.log('Stopping virtual keyboard')
}

const speakCurrentRow = () => {
  const rowNames = ['Erste Zeile', 'Zweite Zeile', 'Dritte Zeile', 'Silben', 'Leerzeichen und Löschen', 'Zurück']
  const rowName = rowNames[currentRowIndex.value] || `Zeile ${currentRowIndex.value + 1}`
  speakText(rowName)
}

const speakCurrentLetter = () => {
  const currentRow = keyboardLayout[currentRowIndex.value]
  const currentLetter = currentRow[currentLetterIndex.value]
  
  // Konvertiere Großbuchstaben zu Kleinbuchstaben für bessere Sprachausgabe
  let letterToSpeak = currentLetter.toLowerCase()
  
  // Spezielle Behandlung für deutsche Umlaute und Silben
  if (currentLetter === 'Ä') letterToSpeak = 'ä'
  else if (currentLetter === 'Ö') letterToSpeak = 'ö'
  else if (currentLetter === 'Ü') letterToSpeak = 'ü'
  else if (currentLetter === 'ß') letterToSpeak = 'ß'
  else if (currentLetter === 'SCH') letterToSpeak = 'sch'
  else if (currentLetter === 'CH') letterToSpeak = 'ch'
  else if (currentLetter === 'EI') letterToSpeak = 'ei'
  else if (currentLetter === 'AU') letterToSpeak = 'au'
  else if (currentLetter === 'EU') letterToSpeak = 'eu'
  else if (currentLetter === 'IE') letterToSpeak = 'ie'
  else if (currentLetter === 'ÄU') letterToSpeak = 'äu'
  else if (currentLetter === ' ') letterToSpeak = 'Leerzeichen'
  
  speakText(letterToSpeak)
}

// Prüfe ob eine Zeile die aktuelle ist
const isCurrentRow = (rowIndex: number) => {
  return currentRowIndex.value === rowIndex
}

// Prüfe ob ein Buchstabe der aktuelle ist
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
  } else {
    // Buchstabe auswählen
    const currentRow = keyboardLayout[currentRowIndex.value]
    const currentLetter = currentRow[currentLetterIndex.value]
    
    if (currentLetter === 'ZURÜCK') {
      // Zurück-Navigation
      console.log('Zurück-Button selected - going back')
      stopKeyboard()
      goBack()
      return
    } else if (currentLetter === 'LÖSCHEN') {
      // Text löschen
      console.log('Löschen-Button selected - clearing text')
      selectedText.value = ''
      speakText('Text gelöscht')
    } else if (currentLetter === ' ') {
      selectedText.value += ' '
      speakText('Leerzeichen hinzugefügt')
    } else {
      selectedText.value += currentLetter
      speakText(`${currentLetter} hinzugefügt`)
    }
    
    console.log('Selected letter:', currentLetter, 'Text:', selectedText.value)
    
    // Zurück zu Zeilen-Modus nach Auswahl
    currentStage.value = 'rows'
    currentLetterIndex.value = 0
  }
}

const speakSelectedText = () => {
  if (selectedText.value.trim()) {
    speakText(`Ihr Text: ${selectedText.value}`)
  } else {
    speakText('Kein Text vorhanden')
  }
}

const clearText = () => {
  selectedText.value = ''
  speakText('Text gelöscht')
}

const finishText = () => {
  if (selectedText.value.trim()) {
    speakText(`Fertig. Ihr Text: ${selectedText.value}`)
  } else {
    speakText('Kein Text vorhanden')
  }
  stopKeyboard()
}

// Blink Detection - Robuster und weniger sensibel
const handleBlink = () => {
  const now = Date.now()
  
  if (faceRecognition.isBlinking()) {
    closedFrames.value++
    
    // Nur verarbeiten wenn genug Zeit seit letztem Blink vergangen ist
    if (now - lastBlinkTime.value < blinkCooldown) {
      return
    }
    
    // Buchstaben-Auswahl bei kurzem Blinzeln (mindestens 5 Frames = 0.5 Sekunden)
    if (closedFrames.value >= blinkThreshold.value && !eyesClosed.value && isKeyboardActive.value) {
      console.log('Element selection blink detected - frames:', closedFrames.value, 'threshold:', blinkThreshold)
      selectCurrentElement()
      eyesClosed.value = true
      lastBlinkTime.value = now
      // Reset frames after successful detection
      closedFrames.value = 0
    }
  } else {
    // Reset nur wenn Augen wirklich offen sind
    if (closedFrames.value > 0) {
      closedFrames.value = 0
      eyesClosed.value = false
    }
  }
}

// Rechte Maustaste als Blinzeln-Ersatz
const handleRightClick = (event: MouseEvent) => {
  event.preventDefault() // Verhindert Kontextmenü
  console.log('Right click detected - treating as blink')
  selectCurrentElement()
}

// Lifecycle
onMounted(() => {
  // Ensure face recognition is active
  if (!faceRecognition.isActive.value) {
    faceRecognition.start()
  }
  
  // Start keyboard automatically
  startKeyboard()
  
  // Watch for blinks
  const blinkCheckInterval = setInterval(() => {
    handleBlink()
  }, 100) // Check every 100ms
  
  // Add right click listener
  document.addEventListener('contextmenu', handleRightClick)
  
  // Cleanup interval on unmount
  onUnmounted(() => {
    clearInterval(blinkCheckInterval)
    document.removeEventListener('contextmenu', handleRightClick)
    stopKeyboard()
  })
})

// Zurück zur Hauptseite
const goBack = () => {
  router.push('/app')
}
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
    <!-- Header -->
    <header class="bg-gray-200 dark:bg-gray-800 shadow-2xl flex-shrink-0" style="box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <!-- Zurück Button (oben links) -->
          <button
            @click="goBack"
            class="p-2 rounded-lg bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
            title="Zurück zur Hauptseite"
          >
            <svg class="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          
          <div class="flex items-center space-x-4">
            <h1 class="text-2xl font-bold text-black dark:text-white" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
              UNTERHALTEN
            </h1>
            <img src="/rattenkopf.svg" alt="Ratatosk Logo" class="w-12 h-12" />
            <div class="w-2.5 h-1.5 bg-[#00796B]"></div>
          </div>
          
          <!-- Platzhalter für zentrierte Ausrichtung -->
          <div class="w-10 h-10"></div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col items-center justify-center p-8">
      <!-- Titel -->
      <div class="text-center mb-8">
        <h2 class="text-4xl font-bold text-gray-900 dark:text-white mb-4" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
          VIRTUELLE TASTATUR
        </h2>
        <p class="text-xl text-gray-600 dark:text-gray-300 mb-4" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
          <span v-if="currentStage === 'rows'">
            Blinzeln Sie, um eine Zeile auszuwählen
          </span>
          <span v-else>
            Blinzeln Sie, um einen Buchstaben auszuwählen
          </span>
        </p>
      </div>

      <!-- Virtuelle Tastatur -->
      <div class="mb-8">
        <div class="text-center mb-4">
          
          <p class="text-lg text-gray-600 dark:text-gray-300 mb-2" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
            <span v-if="currentStage === 'rows'">
              Aktuelle Zeile: <span class="font-bold text-blue-600 dark:text-blue-400">{{ currentRowIndex + 1 }}</span>
            </span>
            <span v-else>
              Aktueller Buchstabe: <span class="font-bold text-blue-600 dark:text-blue-400">{{ keyboardLayout[currentRowIndex][currentLetterIndex] }}</span>
            </span>
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
            {{ currentStage === 'rows' ? 'Wählen Sie eine Zeile aus' : 'Wählen Sie einen Buchstaben aus' }}
          </p>
        </div>
        
        <!-- Tastatur-Layout -->
        <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 border-2 border-gray-300 dark:border-gray-600">
          <div class="space-y-2">
            <!-- Zeile 1: Q W E R T Z U I O P Ü -->
            <div class="flex justify-center space-x-1">
              <div 
                v-for="(letter, index) in keyboardLayout[0]" 
                :key="letter"
                class="w-12 h-12 flex items-center justify-center rounded-lg border-2 transition-all duration-300"
                :class="(currentStage === 'rows' && isCurrentRow(0)) || (currentStage === 'letters' && isCurrentLetter(letter, 0))
                  ? 'bg-blue-500 border-blue-600 text-white shadow-lg scale-110' 
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600'"
              >
                <span class="text-lg font-bold" style="font-family: 'Source Code Pro', monospace;">
                  {{ letter }}
                </span>
              </div>
            </div>
            
            <!-- Zeile 2: A S D F G H J K L Ö Ä -->
            <div class="flex justify-center space-x-1">
              <div 
                v-for="(letter, index) in keyboardLayout[1]" 
                :key="letter"
                class="w-12 h-12 flex items-center justify-center rounded-lg border-2 transition-all duration-300"
                :class="(currentStage === 'rows' && isCurrentRow(1)) || (currentStage === 'letters' && isCurrentLetter(letter, 1))
                  ? 'bg-blue-500 border-blue-600 text-white shadow-lg scale-110' 
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600'"
              >
                <span class="text-lg font-bold" style="font-family: 'Source Code Pro', monospace;">
                  {{ letter }}
                </span>
              </div>
            </div>
            
            <!-- Zeile 3: Y X C V B N M ß -->
            <div class="flex justify-center space-x-1">
              <div 
                v-for="(letter, index) in keyboardLayout[2]" 
                :key="letter"
                class="w-12 h-12 flex items-center justify-center rounded-lg border-2 transition-all duration-300"
                :class="(currentStage === 'rows' && isCurrentRow(2)) || (currentStage === 'letters' && isCurrentLetter(letter, 2))
                  ? 'bg-blue-500 border-blue-600 text-white shadow-lg scale-110' 
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600'"
              >
                <span class="text-lg font-bold" style="font-family: 'Source Code Pro', monospace;">
                  {{ letter }}
                </span>
              </div>
            </div>
            
            <!-- Zeile 4: Silben -->
            <div class="flex justify-center space-x-1">
              <div 
                v-for="(syllable, index) in keyboardLayout[3]" 
                :key="syllable"
                class="w-12 h-12 flex items-center justify-center rounded-lg border-2 transition-all duration-300"
                :class="(currentStage === 'rows' && isCurrentRow(3)) || (currentStage === 'letters' && isCurrentLetter(syllable, 3))
                  ? 'bg-green-500 border-green-600 text-white shadow-lg scale-110' 
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600'"
              >
                <span class="text-lg font-bold" style="font-family: 'Source Code Pro', monospace;">
                  {{ syllable }}
                </span>
              </div>
            </div>
            
            <!-- Zeile 5: Leerzeichen und Löschen -->
            <div class="flex justify-center space-x-4">
              <!-- Leerzeichen -->
              <div 
                class="w-48 h-12 flex items-center justify-center rounded-lg border-2 transition-all duration-300"
                :class="(currentStage === 'rows' && isCurrentRow(4)) || (currentStage === 'letters' && isCurrentLetter(' ', 4))
                  ? 'bg-blue-500 border-blue-600 text-white shadow-lg scale-110' 
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600'"
              >
                <span class="text-lg font-bold" style="font-family: 'Source Code Pro', monospace;">
                  LEERZEICHEN
                </span>
              </div>
              
              <!-- Löschen -->
              <div 
                class="w-48 h-12 flex items-center justify-center rounded-lg border-2 transition-all duration-300"
                :class="(currentStage === 'rows' && isCurrentRow(4)) || (currentStage === 'letters' && isCurrentLetter('LÖSCHEN', 4))
                  ? 'bg-orange-500 border-orange-600 text-white shadow-lg scale-110' 
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600'"
              >
                <span class="text-lg font-bold" style="font-family: 'Source Code Pro', monospace;">
                  LÖSCHEN
                </span>
              </div>
            </div>
            
            <!-- Zeile 6: Zurück -->
            <div class="flex justify-center">
              <div 
                class="w-96 h-12 flex items-center justify-center rounded-lg border-2 transition-all duration-300"
                :class="(currentStage === 'rows' && isCurrentRow(5)) || (currentStage === 'letters' && isCurrentLetter('ZURÜCK', 5))
                  ? 'bg-red-500 border-red-600 text-white shadow-lg scale-110' 
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600'"
              >
                <span class="text-lg font-bold" style="font-family: 'Source Code Pro', monospace;">
                  ← ZURÜCK
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Ausgewählter Text -->
      <div class="mb-8 w-full max-w-2xl">
        <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 border-2 border-gray-300 dark:border-gray-600">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
            Ihr Text:
          </h3>
          <div class="min-h-[60px] p-4 bg-white dark:bg-gray-700 rounded border">
            <p class="text-2xl text-gray-900 dark:text-white break-words" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
              {{ selectedText || 'Noch kein Text...' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Anweisungen -->
      <div class="text-center">
        <div class="grid grid-cols-1 gap-4 mb-6">
          <div class="bg-green-100 dark:bg-green-900 rounded-lg p-4">
            <p class="text-green-800 dark:text-green-200" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
              <strong>Kurz blinzeln (0.5s):</strong><br>
              <span v-if="currentStage === 'rows'">Zeile auswählen</span>
              <span v-else>Buchstabe auswählen</span>
            </p>
          </div>
        </div>
        
        <!-- Status Anzeige -->
        <div class="inline-flex items-center px-4 py-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
          <div class="w-3 h-3 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
          <span style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
            {{ isKeyboardActive ? 'TASTATUR AKTIV' : 'TASTATUR GESTOPPT' }}
          </span>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Custom animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Dark mode styles */
.dark {
  color-scheme: dark;
}
</style>