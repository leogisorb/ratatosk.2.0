<script setup lang="ts">
import AppHeader from '../../../shared/components/AppHeader.vue'
import { onMounted, onUnmounted } from 'vue'
import { useKeyboardDesignStore } from '../stores/keyboardDesign'
import { useVirtualKeyboard } from '../composables/useVirtualKeyboard'
import { useBlinkInput } from '../composables/useBlinkInput'
import { cleanupRegistry } from '../../../shared/utils/cleanupRegistry'

// ===== STORES =====
const keyboardDesignStore = useKeyboardDesignStore()

// ===== VIRTUAL KEYBOARD COMPOSABLE =====
const {
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
  handleUserInput,
  start,
  cleanup
} = useVirtualKeyboard()

// ===== BLINK INPUT COMPOSABLE =====
const { setupEventListeners } = useBlinkInput()

// ===== LIFECYCLE =====
onMounted(() => {
  console.log('UnterhaltenView mounted - starting virtual keyboard')
  
  // Event Listener für Blink- und Klick-Erkennung einrichten
  const cleanupEventListeners = setupEventListeners(handleUserInput)
  
  // Keyboard starten
  start()
  
  // Register cleanup in registry (replaces window globals)
  cleanupRegistry.register('communication', async () => {
    console.log('UnterhaltenView: Cleanup called via registry')
    if (cleanupEventListeners) {
      cleanupEventListeners()
    }
    cleanup()
  })
})

onUnmounted(() => {
  console.log('UnterhaltenView unmounted - cleaning up')
  
  // Keyboard aufräumen
  cleanup()
  
  // Face Recognition nicht stoppen (läuft seitenübergreifend)
  console.log('Face Recognition continues running for other views')
  
  // Unregister cleanup from registry
  cleanupRegistry.unregister('communication')
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
@import './CommunicationView.css';
</style>  