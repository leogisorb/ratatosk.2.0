<script setup lang="ts">
// Import external JavaScript logic
import { useUnterhaltenViewLogic } from './UnterhaltenView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'
import { ref, onMounted, onUnmounted, watch } from 'vue'

// Satz-für-Satz Anzeige Daten
const welcomeSentences = [
  "Willkommen in der virtuellen Tastatur.",
  "Blinzeln Sie eine Zeile Ihrer Wahl an.",
  "Nachdem Sie eine Zeile ausgewählt haben, laufen die Buchstaben dieser Zeile automatisch durch.",
  "Blinzeln Sie erneut, um einen Buchstaben auszuwählen.",
  "So können Sie Schritt für Schritt Wörter und Sätze bilden.",
  "Die Tastatur läuft in einer Endlosschleife, damit Sie jederzeit weiterschreiben können."
]

const currentSentenceIndex = ref(0)
let sentenceInterval: number | null = null

// Satz-Rotation starten
const startSentenceRotation = () => {
  console.log('Starting sentence rotation')
  sentenceInterval = setInterval(() => {
    currentSentenceIndex.value = (currentSentenceIndex.value + 1) % welcomeSentences.length
    console.log('Sentence changed to index:', currentSentenceIndex.value, 'Text:', welcomeSentences[currentSentenceIndex.value])
  }, 6000) // 6 Sekunden pro Satz (halb so schnell)
}

// Satz-Rotation stoppen
const stopSentenceRotation = () => {
  console.log('Stopping sentence rotation')
  if (sentenceInterval) {
    clearInterval(sentenceInterval)
    sentenceInterval = null
  }
}

// Lifecycle
onMounted(() => {
  startSentenceRotation()
})

onUnmounted(() => {
  stopSentenceRotation()
})

// Use the composable function
const {
  closedFrames,
  eyesClosed,
  blinkThreshold,
  lastBlinkTime,
  blinkCooldown,
  isKeyboardActive,
  keyboardInterval,
  selectedText,
  keyboardLayout,
  currentRowIndex,
  currentLetterIndex,
  currentStage,
  letterPassCount,
  handleBlink,
  startKeyboard,
  stopKeyboard,
  isCurrentRow,
  isCurrentLetter,
  selectCurrentElement,
  testFunction,
  startKeyboardNavigation,
  settingsStore,
  keyboardDesignStore,
  faceRecognition,
  // New virtual keyboard properties
  currentText,
  currentState,
  activeRowIndex,
  activeLetterIndex,
  isTTSActive,
  showCurrentText,
  isRowActive,
  isLetterActive,
  isRowSelected,
  isLetterSelected,
  initializeVirtualKeyboard,
  stopVirtualKeyboard,
  handleClick,
  clearText,
  readCurrentText,
  isRowHighlighted,
  isLetterHighlighted,
  isRowSelectedState,
  getRowClass,
  getLetterClass,
  getTTSIndicatorClass,
  resetIntroStatus
} = useUnterhaltenViewLogic()

// Pausiere Satz-Rotation wenn TTS aktiv ist oder Tastatur aktiv ist
watch([isTTSActive, isKeyboardActive], ([ttsActive, keyboardActive]) => {
  console.log('Watch triggered - TTS:', ttsActive, 'Keyboard:', keyboardActive)
  if (ttsActive) {
    console.log('Stopping sentence rotation due to TTS')
    stopSentenceRotation()
  } else if (!keyboardActive) {
    console.log('Starting sentence rotation')
    startSentenceRotation()
  }
}, { immediate: false })
</script>

<template>
  <div class="page-container">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content -->
    <main class="main-content">
      <!-- 1. Satz-für-Satz Anzeige -->
      <div class="sentence-display-container">
        <div class="sentence-display" :class="{ 'sentence-paused': isTTSActive }">
          <div 
            v-for="(sentence, index) in welcomeSentences" 
            :key="index"
            class="sentence-item"
            :class="{ 'sentence-active': index === currentSentenceIndex }"
          >
            {{ sentence }}
          </div>
        </div>
      </div>

      <!-- 2. Textfeld -->
      <div class="text-display-container">
        <div class="text-display-box">
          <p class="text-display-text">
            {{ currentText || 'Noch kein Text...' }}
          </p>
        </div>
        <!-- TTS-Indikator -->
        <div class="tts-indicator" :class="getTTSIndicatorClass()">
          <span v-if="isTTSActive">🔊</span>
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
            :class="getRowClass(rowIndex)"
          >
            <div
              v-for="(letter, letterIndex) in row"
              :key="letter"
              class="keyboard-key"
              :class="getLetterClass(rowIndex, letterIndex)"
              :style="{
                width: keyboardDesignStore.keyWidth + 'px',
                height: keyboardDesignStore.keyHeight + 'px',
                borderRadius: keyboardDesignStore.borderRadius + 'px',
                backgroundColor: isRowHighlighted(rowIndex) || isLetterHighlighted(rowIndex, letterIndex)
                  ? keyboardDesignStore.activeKeyBackground
                  : '#ffffff',
                borderColor: isRowHighlighted(rowIndex) || isLetterHighlighted(rowIndex, letterIndex)
                  ? keyboardDesignStore.activeKeyBorder
                  : '#d1d5db',
                borderWidth: '2px',
                color: isRowHighlighted(rowIndex) || isLetterHighlighted(rowIndex, letterIndex)
                  ? keyboardDesignStore.activeKeyText
                  : '#374151'
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

      <!-- Bedienungsanleitung entfernt - wird durch TTS ersetzt -->
    </main>
  </div>
</template>

<style scoped>
@import './UnterhaltenView.css';
</style>