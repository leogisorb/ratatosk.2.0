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
  getTTSIndicatorClass
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