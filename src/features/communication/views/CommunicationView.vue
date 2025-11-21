<script setup lang="ts">
import AppHeader from '../../../shared/components/AppHeader.vue'
import { onMounted, onUnmounted } from 'vue'
import { useKeyboardDesignStore } from '../stores/keyboardDesign'
import { useVirtualKeyboard } from '../composables/useVirtualKeyboard'
import { useInputManager } from '../../../shared/composables/useInputManager'
import { ViewCleanupRegistry } from '../../../shared/utils/UnifiedCleanup'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'

// ===== STORES =====
const keyboardDesignStore = useKeyboardDesignStore()

// ===== FACE RECOGNITION =====
const faceRecognition = useFaceRecognition()

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

// ===== INPUT MANAGER =====
const inputManager = useInputManager({
  onSelect: (event) => {
    console.log('CommunicationView: Input detected', {
      type: event.type,
      source: event.source
    })
    handleUserInput()
  },
  enabledInputs: ['blink', 'click', 'touch'],
  cooldown: 300
})

// ===== LIFECYCLE =====
onMounted(async () => {
  console.log('UnterhaltenView mounted - starting virtual keyboard')
  
  // Stelle sicher, dass Face Recognition läuft (für Blink Detection)
  if (!faceRecognition.isActive.value) {
    console.log('Face Recognition nicht aktiv - starte sie')
    await faceRecognition.start()
  } else {
    console.log('Face Recognition bereits aktiv')
  }
  
  // Starte Input Manager ZUERST (wichtig für Event-Listener)
  inputManager.start()
  console.log('InputManager started, status:', inputManager.getStatus())
  
  // Keyboard starten
  start()
  
  // Registriere Cleanup in UnifiedCleanup (SYNCHRON, damit Router-Guard es findet)
  ViewCleanupRegistry.register('communication', async () => {
    console.log('UnterhaltenView: Cleanup called via UnifiedCleanup')
    inputManager.stop()
    cleanup()
  })
})

onUnmounted(() => {
  console.log('UnterhaltenView unmounted - cleaning up')
  
  // Fallback-Cleanup: Falls Router-Guard nicht aufgeräumt hat
  // Stoppe Input Manager explizit (zusätzlich zu useInputManager's onUnmounted)
  inputManager.stop()
  
  // Cleanup Virtual Keyboard (stoppt alle Timer, TTS, etc.)
  cleanup()
  
  // Cleanup via UnifiedCleanup (nur wenn noch nicht aufgeräumt)
  // Router-Guard räumt normalerweise auf, aber als Fallback hier auch
  if (ViewCleanupRegistry.hasCleanup('communication')) {
    ViewCleanupRegistry.cleanup('communication').catch(error => {
      console.error('CommunicationView: Cleanup error:', error)
    })
  } else {
    // Nur Registry aufräumen wenn kein Cleanup mehr registriert
    ViewCleanupRegistry.unregister('communication')
  }
  
  // Face Recognition nicht stoppen (läuft seitenübergreifend)
  console.log('Face Recognition continues running for other views')
})
</script>

<template>
  <div class="page-container">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content -->
    <main class="main-content" :class="{ 'intro-active': isIntroductionActive }">
      <!-- 1. Status-Anzeige (H1) -->
      <div class="status-display">
        <div class="status-text" :class="{ 'letter-display': isLetterDisplay }">
          {{ statusText }}
        </div>
      </div>

      <!-- 2. Textfeld -->
      <div class="text-display">
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

      <!-- 3. Abstandshalter -->
      <div class="spacer"></div>

      <!-- 4. Tastaturblock -->
      <div class="keyboard-container">
        <!-- Desktop Layout: Alle Zeilen sichtbar -->
        <div class="keyboard-vertical keyboard-desktop">
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

        <!-- Mobile Carousel Layout: Nur aktive Zeile sichtbar -->
        <div class="keyboard-carousel-wrapper">
          <div class="keyboard-carousel-container">
            <div
              v-for="(row, rowIndex) in keyboardLayout"
              :key="`carousel-row-${rowIndex}`"
              class="keyboard-carousel-item"
              :style="{
                '--offset': rowIndex - currentRowIndex
              }"
            >
              <div 
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
        </div>
      </div>

    </main>
  </div>
</template>

<style scoped>
@import './CommunicationView.css';
</style>  