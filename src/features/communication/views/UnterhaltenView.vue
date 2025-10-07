<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'
import { useKeyboardDesignStore } from '../stores/keyboardDesign'
import GlobalHeader from '../../../shared/components/GlobalHeader.vue'

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
  [' ', 'LÖSCHEN','ZURÜCK'], // Leerzeichen und Löschen-Button
]

// Flache Liste aller Zeichen für den Durchlauf
const alphabet = keyboardLayout.flat()

// Zwei-Stufen-System: Erst Zeilen, dann Buchstaben
const currentStage = ref<'rows' | 'letters'>('rows')
const currentRowIndex = ref(0)
const currentLetterIndex = ref(0)

// Zähler für Durchläufe der aktuellen Zeile
const letterPassCount = ref(0)

// Tastendesign wird über Store verwaltet

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
        
        // Prüfe ob wir am Ende der Zeile sind (zurück zum Anfang)
        if (currentLetterIndex.value === 0) {
          letterPassCount.value++
          console.log(`Letter pass count: ${letterPassCount.value}`)
          
          // Nach dem 2. Durchlauf zurück zu Zeilen
          if (letterPassCount.value >= 2) {
            console.log('2nd pass completed - returning to rows')
            speakText('Zeit abgelaufen, zurück zu Zeilen-Modus')
            currentStage.value = 'rows'
            currentLetterIndex.value = 0
            letterPassCount.value = 0
            return
          }
        }
        
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
  const rowNames = ['Erste Zeile', 'Zweite Zeile', 'Dritte Zeile', 'Silben', 'Kurzwörter', 'Befehle']
  const rowName = rowNames[currentRowIndex.value] || `Zeile ${currentRowIndex.value + 1}`
  speakText(rowName)
}

const speakCurrentLetter = () => {
  const currentRow = keyboardLayout[currentRowIndex.value]
  const currentLetter = currentRow[currentLetterIndex.value]
  
  // Spezielle Behandlung für Wörter und Sonderzeichen
  let letterToSpeak = currentLetter
  
  // Behandlung für Wörter (Zeile 5)
  if (currentLetter === 'JA') letterToSpeak = 'Ja'
  else if (currentLetter === 'NEIN') letterToSpeak = 'Nein'
  else if (currentLetter === 'ICH') letterToSpeak = 'Ich'
  else if (currentLetter === 'DU') letterToSpeak = 'Du'
  else if (currentLetter === 'WO') letterToSpeak = 'Wo'
  else if (currentLetter === 'IST') letterToSpeak = 'Ist'
  else if (currentLetter === 'BIN') letterToSpeak = 'Bin'
  // Behandlung für Sonderzeichen (Zeile 6)
  else if (currentLetter === ' ') letterToSpeak = 'Leerzeichen'
  else if (currentLetter === 'LÖSCHEN') letterToSpeak = 'Löschen'
  else if (currentLetter === 'ZURÜCK') letterToSpeak = 'Zurück'
  // Behandlung für Silben (Zeile 4)
  else if (currentLetter === 'SCH') letterToSpeak = 'sch'
  else if (currentLetter === 'CH') letterToSpeak = 'ch'
  else if (currentLetter === 'EI') letterToSpeak = 'ei'
  else if (currentLetter === 'AU') letterToSpeak = 'au'
  else if (currentLetter === 'EU') letterToSpeak = 'eu'
  else if (currentLetter === 'IE') letterToSpeak = 'ie'
  else if (currentLetter === 'ÄU') letterToSpeak = 'äu'
  else if (currentLetter === 'PF') letterToSpeak = 'pf'
  else if (currentLetter === 'PH') letterToSpeak = 'ph'
  else if (currentLetter === 'CK') letterToSpeak = 'ck'
  else if (currentLetter === 'NK') letterToSpeak = 'nk'
  // Behandlung für deutsche Umlaute und Sonderzeichen
  else if (currentLetter === 'Ä') letterToSpeak = 'ä'
  else if (currentLetter === 'Ö') letterToSpeak = 'ö'
  else if (currentLetter === 'Ü') letterToSpeak = 'ü'
  else if (currentLetter === 'ß') letterToSpeak = 'ß'
  // Für alle anderen Buchstaben: Konvertiere zu Kleinbuchstaben
  else letterToSpeak = currentLetter.toLowerCase()
  
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
    if (now - lastBlinkTime.value < blinkCooldown.value) {
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
onMounted(async () => {
  console.log('UnterhaltenView onMounted - Starte Kamera-Initialisierung')
  
  try {
    // Safari-spezifische Kamera-Initialisierung mit Retry-Logik
    let cameraStarted = false
    let retryCount = 0
    const maxRetries = 3
    
    while (!cameraStarted && retryCount < maxRetries) {
      try {
        console.log(`Kamera-Initialisierung Versuch ${retryCount + 1}/${maxRetries}`)
        
        // Ensure face recognition is active
        if (!faceRecognition.isActive.value) {
          await faceRecognition.start()
        }
        
        // Warten auf Kamera-Initialisierung
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Kamera-Initialisierung Timeout'))
          }, 10000) // 10 Sekunden Timeout
          
          const checkInterval = setInterval(() => {
            if (faceRecognition.isActive.value) {
              clearTimeout(timeout)
              clearInterval(checkInterval)
              cameraStarted = true
              resolve(true)
            }
          }, 500)
        })
        
        console.log('Kamera erfolgreich initialisiert')
        
      } catch (err) {
        console.warn(`Kamera-Initialisierung fehlgeschlagen (Versuch ${retryCount + 1}):`, err)
        retryCount++
        
        if (retryCount < maxRetries) {
          console.log('Warte 2 Sekunden vor nächstem Versuch...')
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
    }
    
    if (!cameraStarted) {
      console.error('Kamera konnte nach', maxRetries, 'Versuchen nicht gestartet werden')
      // Fallback: Starte ohne Kamera
      console.log('Starte ohne Kamera-Unterstützung')
      
      // Informiere den Benutzer über den Fallback-Modus
      if (isSafari) {
        speakText('Kamera konnte nicht gestartet werden. Sie können die Tastatur mit Rechtsklick verwenden.')
      } else {
        speakText('Kamera konnte nicht gestartet werden. Bitte erlauben Sie den Kamera-Zugriff oder verwenden Sie Rechtsklick.')
      }
    }
    
  } catch (err) {
    console.error('Kamera-Initialisierung komplett fehlgeschlagen:', err)
    // Fallback: Starte ohne Kamera
    console.log('Starte ohne Kamera-Unterstützung')
    
    // Informiere den Benutzer über den Fehler
    if (isSafari) {
      speakText('Safari-Kamera-Fehler. Bitte erlauben Sie den Kamera-Zugriff oder verwenden Sie Rechtsklick für die Tastatur.')
    } else {
      speakText('Kamera-Fehler aufgetreten. Bitte erlauben Sie den Kamera-Zugriff oder verwenden Sie Rechtsklick.')
    }
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
    <!-- Global Header -->
    <GlobalHeader>
      <div class="flex items-center space-x-4">
        <button @click="goBack" class="p-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition-colors">
          <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-2xl font-bold text-black font-source-code font-light">
          UNTERHALTEN
        </h1>
      </div>
      
      <!-- TTS Toggle Button -->
      <button
        @click="isTTSEnabled = !isTTSEnabled"
        class="p-2 rounded-lg transition-colors"
        :class="isTTSEnabled ? 'bg-green-300 hover:bg-green-400' : 'bg-gray-300 hover:bg-gray-400'"
        :title="isTTSEnabled ? 'Sprachausgabe deaktivieren' : 'Sprachausgabe aktivieren'"
      >
        <svg
          v-if="isTTSEnabled"
          class="w-6 h-6 text-green-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
          />
        </svg>
        <svg
          v-else
          class="w-6 h-6 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
          />
        </svg>
      </button>
    </GlobalHeader>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col items-center justify-center p-8">
      <!-- Titel -->
      <div class="text-center mb-12">
        <h2 class="text-4xl font-bold text-gray-900 dark:text-white mb-8" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
          VIRTUELLE TASTATUR
        </h2>
       
      </div>

      <!-- Ausgewählter Text -->
      <div class="mb-8 w-full px-4 mx-auto" style="max-width: 95.75%;">
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

      <!-- Abstandshalter für konsistenten Abstand -->
      <div class="mb-8">
        <div class="text-center mb-6">
          <!-- Fester Platzhalter für Buchstaben-Anzeige -->
          <p class="text-xl text-gray-600 dark:text-gray-300 mb-4" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
          <span v-if="currentStage === 'rows'">
            Blinzeln Sie, oder drücken sie den Ball um eine Zeile auszuwählen
          </span>
          <span v-else>
            Blinzeln Sie, oder drücken sie den Ball um einen Buchstaben auszuwählen
          </span>
        </p>
          <div class="mb-4" style="min-height: 120px;">
            <div v-if="currentStage === 'letters'" class="text-8xl font-black text-blue-600 dark:text-blue-400 mb-4" style="font-family: 'Source Code Pro', monospace; font-weight: 900; font-size: 400%;">
              {{ keyboardLayout[currentRowIndex][currentLetterIndex] }}
            </div>
            
          </div>
        </div>
      </div>

      <!-- Virtuelle Tastatur -->
      <div class="mb-8">
        
        <!-- Tastatur-Layout -->
        <div class="rounded-lg p-24 border-2 border-gray-300 dark:border-gray-200 w-full max-w-8xl mx-auto" style="background-color: white !important;">
          <div class="space-y-4">
            <!-- Zeile 1: Q W E R T Z U I O P Ü -->
            <div class="flex justify-center gap-4">
              <div 
                v-for="(letter, index) in keyboardLayout[0]" 
                :key="letter"
                class="flex items-center justify-center transition-all duration-300"
                :class="(currentStage === 'rows' && isCurrentRow(0)) || (currentStage === 'letters' && isCurrentLetter(letter, 0))
                  ? 'shadow-xl scale-110'
                  : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'"
                :style="{
                  width: keyboardDesignStore.keyWidth + 'px',
                  height: keyboardDesignStore.keyHeight + 'px',
                  borderRadius: keyboardDesignStore.borderRadius + 'px',
                  backgroundColor: (currentStage === 'rows' && isCurrentRow(0)) || (currentStage === 'letters' && isCurrentLetter(letter, 0))
                    ? keyboardDesignStore.activeKeyBackground
                    : undefined,
                  borderColor: (currentStage === 'rows' && isCurrentRow(0)) || (currentStage === 'letters' && isCurrentLetter(letter, 0))
                    ? keyboardDesignStore.activeKeyBorder
                    : '#d1d5db',
                  borderWidth: '2px',
                  color: (currentStage === 'rows' && isCurrentRow(0)) || (currentStage === 'letters' && isCurrentLetter(letter, 0))
                    ? keyboardDesignStore.activeKeyText
                    : undefined
                }"
              >
                <span class="font-bold" style="font-family: 'Source Code Pro', monospace;" :style="{ fontSize: (keyboardDesignStore.fontSize * 1.5) + 'px' }">
                  {{ letter }}
                </span>
              </div>
            </div>
            
            <!-- Zeile 2: A S D F G H J K L Ö Ä -->
            <div class="flex justify-center gap-4">
              <div 
                v-for="(letter, index) in keyboardLayout[1]" 
                :key="letter"
                class="flex items-center justify-center transition-all duration-300"
                :class="(currentStage === 'rows' && isCurrentRow(1)) || (currentStage === 'letters' && isCurrentLetter(letter, 1))
                  ? 'shadow-xl scale-110'
                  : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'"
                :style="{
                  width: keyboardDesignStore.keyWidth + 'px',
                  height: keyboardDesignStore.keyHeight + 'px',
                  borderRadius: keyboardDesignStore.borderRadius + 'px',
                  backgroundColor: (currentStage === 'rows' && isCurrentRow(1)) || (currentStage === 'letters' && isCurrentLetter(letter, 1))
                    ? keyboardDesignStore.activeKeyBackground
                    : undefined,
                  borderColor: (currentStage === 'rows' && isCurrentRow(1)) || (currentStage === 'letters' && isCurrentLetter(letter, 1))
                    ? keyboardDesignStore.activeKeyBorder
                    : '#d1d5db',
                  borderWidth: '2px',
                  color: (currentStage === 'rows' && isCurrentRow(1)) || (currentStage === 'letters' && isCurrentLetter(letter, 1))
                    ? keyboardDesignStore.activeKeyText
                    : undefined
                }"
              >
                <span class="font-bold" style="font-family: 'Source Code Pro', monospace;" :style="{ fontSize: (keyboardDesignStore.fontSize * 1.5) + 'px' }">
                  {{ letter }}
                </span>
              </div>
            </div>
            
            <!-- Zeile 3: Y X C V B N M ß -->
            <div class="flex justify-center gap-4">
              <div 
                v-for="(letter, index) in keyboardLayout[2]" 
                :key="letter"
                class="flex items-center justify-center transition-all duration-300"
                :class="(currentStage === 'rows' && isCurrentRow(2)) || (currentStage === 'letters' && isCurrentLetter(letter, 2))
                  ? 'shadow-xl scale-110'
                  : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'"
                :style="{
                  width: keyboardDesignStore.keyWidth + 'px',
                  height: keyboardDesignStore.keyHeight + 'px',
                  borderRadius: keyboardDesignStore.borderRadius + 'px',
                  backgroundColor: (currentStage === 'rows' && isCurrentRow(2)) || (currentStage === 'letters' && isCurrentLetter(letter, 2))
                    ? keyboardDesignStore.activeKeyBackground
                    : undefined,
                  borderColor: (currentStage === 'rows' && isCurrentRow(2)) || (currentStage === 'letters' && isCurrentLetter(letter, 2))
                    ? keyboardDesignStore.activeKeyBorder
                    : '#d1d5db',
                  borderWidth: '2px',
                  color: (currentStage === 'rows' && isCurrentRow(2)) || (currentStage === 'letters' && isCurrentLetter(letter, 2))
                    ? keyboardDesignStore.activeKeyText
                    : undefined
                }"
              >
                <span class="font-bold" style="font-family: 'Source Code Pro', monospace;" :style="{ fontSize: (keyboardDesignStore.fontSize * 1.5) + 'px' }">
                  {{ letter }}
                </span>
              </div>
            </div>
            
            <!-- Zeile 4: Silben -->
            <div class="flex justify-center gap-4">
              <div 
                v-for="(syllable, index) in keyboardLayout[3]" 
                :key="syllable"
                class="flex items-center justify-center transition-all duration-300"
                :class="(currentStage === 'rows' && isCurrentRow(3)) || (currentStage === 'letters' && isCurrentLetter(syllable, 3))
                  ? 'shadow-xl scale-110'
                  : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'"
                :style="{
                  width: keyboardDesignStore.keyWidth + 'px',
                  height: keyboardDesignStore.keyHeight + 'px',
                  borderRadius: keyboardDesignStore.borderRadius + 'px',
                  backgroundColor: (currentStage === 'rows' && isCurrentRow(3)) || (currentStage === 'letters' && isCurrentLetter(syllable, 3))
                    ? keyboardDesignStore.activeKeyBackground
                    : undefined,
                  borderColor: (currentStage === 'rows' && isCurrentRow(3)) || (currentStage === 'letters' && isCurrentLetter(syllable, 3))
                    ? keyboardDesignStore.activeKeyBorder
                    : '#d1d5db',
                  borderWidth: '2px',
                  color: (currentStage === 'rows' && isCurrentRow(3)) || (currentStage === 'letters' && isCurrentLetter(syllable, 3))
                    ? keyboardDesignStore.activeKeyText
                    : undefined
                }"
              >
                <span class="font-bold" style="font-family: 'Source Code Pro', monospace;" :style="{ fontSize: (keyboardDesignStore.fontSize * 1.5) + 'px' }">
                  {{ syllable }}
                </span>
              </div>
            </div>
            
            <!-- Zeile 5: Wörter -->
            <div class="flex justify-center gap-4">
              <div 
                v-for="(word, index) in keyboardLayout[4]" 
                :key="word"
                class="flex items-center justify-center transition-all duration-300"
                :class="(currentStage === 'rows' && isCurrentRow(4)) || (currentStage === 'letters' && isCurrentLetter(word, 4))
                  ? 'shadow-xl scale-110'
                  : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'"
                :style="{
                  width: keyboardDesignStore.keyWidth + 'px',
                  height: keyboardDesignStore.keyHeight + 'px',
                  borderRadius: keyboardDesignStore.borderRadius + 'px',
                  backgroundColor: (currentStage === 'rows' && isCurrentRow(4)) || (currentStage === 'letters' && isCurrentLetter(word, 4))
                    ? keyboardDesignStore.activeKeyBackground
                    : undefined,
                  borderColor: (currentStage === 'rows' && isCurrentRow(4)) || (currentStage === 'letters' && isCurrentLetter(word, 4))
                    ? keyboardDesignStore.activeKeyBorder
                    : '#d1d5db',
                  borderWidth: '2px',
                  color: (currentStage === 'rows' && isCurrentRow(4)) || (currentStage === 'letters' && isCurrentLetter(word, 4))
                    ? keyboardDesignStore.activeKeyText
                    : undefined
                }"
              >
                <span class="font-bold" style="font-family: 'Source Code Pro', monospace;" :style="{ fontSize: (keyboardDesignStore.fontSize * 1.5) + 'px' }">
                  {{ word }}
                </span>
              </div>
            </div>
            
            <!-- Zeile 6: Leerzeichen, Löschen und Zurück -->
            <div class="flex justify-center gap-8">
              <!-- Leerzeichen -->
              <div 
                class="flex items-center justify-center transition-all duration-300"
                :class="(currentStage === 'rows' && isCurrentRow(5)) || (currentStage === 'letters' && isCurrentLetter(' ', 5))
                  ? 'shadow-lg'
                  : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'"
                :style="{
                  width: (keyboardDesignStore.keyWidth * 2) + 'px',
                  height: keyboardDesignStore.keyHeight + 'px',
                  borderRadius: keyboardDesignStore.borderRadius + 'px',
                  backgroundColor: (currentStage === 'rows' && isCurrentRow(5)) || (currentStage === 'letters' && isCurrentLetter(' ', 5))
                    ? keyboardDesignStore.spaceKeyBackground
                    : undefined,
                  borderColor: (currentStage === 'rows' && isCurrentRow(5)) || (currentStage === 'letters' && isCurrentLetter(' ', 5))
                    ? keyboardDesignStore.spaceKeyBorder
                    : '#d1d5db',
                  borderWidth: '2px',
                  color: (currentStage === 'rows' && isCurrentRow(5)) || (currentStage === 'letters' && isCurrentLetter(' ', 5))
                    ? '#ffffff'
                    : undefined
                }"
              >
                <span class="font-bold" style="font-family: 'Source Code Pro', monospace;" :style="{ fontSize: (keyboardDesignStore.fontSize * 1.5) + 'px' }">
                  LEERZEICHEN
                </span>
              </div>
              
              <!-- Löschen -->
              <div 
                class="flex items-center justify-center transition-all duration-300"
                :class="(currentStage === 'rows' && isCurrentRow(5)) || (currentStage === 'letters' && isCurrentLetter('LÖSCHEN', 5))
                  ? 'shadow-lg'
                  : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'"
                :style="{
                  width: (keyboardDesignStore.keyWidth * 2) + 'px',
                  height: keyboardDesignStore.keyHeight + 'px',
                  borderRadius: keyboardDesignStore.borderRadius + 'px',
                  backgroundColor: (currentStage === 'rows' && isCurrentRow(5)) || (currentStage === 'letters' && isCurrentLetter('LÖSCHEN', 5))
                    ? keyboardDesignStore.deleteKeyBackground
                    : undefined,
                  borderColor: (currentStage === 'rows' && isCurrentRow(5)) || (currentStage === 'letters' && isCurrentLetter('LÖSCHEN', 5))
                    ? keyboardDesignStore.deleteKeyBorder
                    : '#d1d5db',
                  borderWidth: '2px',
                  color: (currentStage === 'rows' && isCurrentRow(5)) || (currentStage === 'letters' && isCurrentLetter('LÖSCHEN', 5))
                    ? '#ffffff'
                    : undefined
                }"
              >
                <span class="font-bold" style="font-family: 'Source Code Pro', monospace;" :style="{ fontSize: (keyboardDesignStore.fontSize * 1.5) + 'px' }">
                  LÖSCHEN
                </span>
              </div>
              
              <!-- ZURÜCK -->
              <div 
                class="flex items-center justify-center transition-all duration-300"
                :class="(currentStage === 'rows' && isCurrentRow(5)) || (currentStage === 'letters' && isCurrentLetter('ZURÜCK', 5))
                  ? 'shadow-lg'
                  : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'"
                :style="{
                  width: (keyboardDesignStore.keyWidth * 2) + 'px',
                  height: keyboardDesignStore.keyHeight + 'px',
                  borderRadius: keyboardDesignStore.borderRadius + 'px',
                  backgroundColor: (currentStage === 'rows' && isCurrentRow(5)) || (currentStage === 'letters' && isCurrentLetter('ZURÜCK', 5))
                    ? keyboardDesignStore.backKeyBackground
                    : undefined,
                  borderColor: (currentStage === 'rows' && isCurrentRow(5)) || (currentStage === 'letters' && isCurrentLetter('ZURÜCK', 5))
                    ? keyboardDesignStore.backKeyBorder
                    : '#d1d5db',
                  borderWidth: '2px',
                  color: (currentStage === 'rows' && isCurrentRow(5)) || (currentStage === 'letters' && isCurrentLetter('ZURÜCK', 5))
                    ? '#ffffff'
                    : undefined
                }"
              >
                <span class="font-bold" style="font-family: 'Source Code Pro', monospace;" :style="{ fontSize: (keyboardDesignStore.fontSize * 1.5) + 'px' }">
                  ← ZURÜCK
                </span>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      <!-- Anweisungen -->
      <div class="text-center">
        <div class="grid grid-cols-1 gap-4 mb-6">
          <div class="bg-green-100 dark:bg-green-900 rounded-lg p-4">
            <p class="text-green-800 dark:text-green-200 mb-4" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
              <strong>Kurz blinzeln ({{ settingsStore.settings.blinkSensitivity }}s):</strong><br>
            </p>
          </div>
          
          <!-- Safari-spezifische Nachricht -->
          <div v-if="isSafari" class="bg-yellow-100 dark:bg-yellow-900 rounded-lg p-4">
            <p class="text-yellow-800 dark:text-yellow-200 mb-2" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
              <strong>Safari-Benutzer:</strong><br>
              Falls die Kamera nicht startet, erlauben Sie bitte den Kamera-Zugriff in den Safari-Einstellungen.<br>
              Sie können auch ohne Gesichtserkennung arbeiten - die Tastatur funktioniert auch mit Rechtsklick.
            </p>
          </div>
        </div>
        
        <!-- Status Anzeige -->
        <div class="inline-flex items-center px-1 py-1 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
          <div class="w-3 h-3 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
          <span style="font-family: 'Source Code Pro', monospace; font-weight: 400;">
            {{ isKeyboardActive ? 'TASTATUR AKTIV' : 'TASTATUR GESTOPPT' }}
          </span>
        </div>
        
        <!-- Kamera Status -->
        <div class="mt-2 inline-flex items-center px-1 py-1 rounded-lg" 
             :class="faceRecognition.isActive.value ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'">
          <div class="w-3 h-3 rounded-full mr-2" 
               :class="faceRecognition.isActive.value ? 'bg-green-500' : 'bg-red-500'"></div>
          <span style="font-family: 'Source Code Pro', monospace; font-weight: 400;">
            {{ faceRecognition.isActive.value ? 'KAMERA AKTIV' : 'KAMERA GESTOPPT' }}
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