<script setup lang="ts">
// Import external JavaScript logic
import { useUnterhaltenViewLogic } from './UnterhaltenView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'

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
  isTTSEnabled,
  keyboardLayout,
  currentRowIndex,
  currentLetterIndex,
  currentStage,
  letterPassCount,
  speakText,
  handleBlink,
  startKeyboard,
  stopKeyboard,
  speakCurrentRow,
  speakCurrentLetter,
  isCurrentRow,
  isCurrentLetter,
  selectCurrentElement,
  speakSelectedText,
  testFunction,
  startKeyboardNavigation,
  settingsStore,
  keyboardDesignStore,
  faceRecognition
} = useUnterhaltenViewLogic()
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
                  : '#ffffff',
                borderColor: (currentStage === 'rows' && isCurrentRow(rowIndex)) || (currentStage === 'letters' && isCurrentLetter(letter, rowIndex))
                  ? keyboardDesignStore.activeKeyBorder
                  : '#d1d5db',
                borderWidth: '2px',
                color: (currentStage === 'rows' && isCurrentRow(rowIndex)) || (currentStage === 'letters' && isCurrentLetter(letter, rowIndex))
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
@import './UnterhaltenView.css';
</style>