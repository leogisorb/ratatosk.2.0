<script setup lang="ts">
import AppHeader from '../../../shared/components/AppHeader.vue'
import { onMounted, onUnmounted } from 'vue'
import { useWarningViewLogic } from './WarningView'

// ===== WARNING VIEW LOGIC =====
const {
  currentState,
  statusText,
  isTTSActive,
  isAlarmActive,
  handleUserInput,
  setupWarningSystem,
  cleanup,
  settingsStore
} = useWarningViewLogic()

// ===== LIFECYCLE =====
onMounted(async () => {
  console.log('WarningView mounted - starting warning system')
  const cleanupEventListeners = await setupWarningSystem()
  
  // Cleanup-Funktion für onUnmounted speichern
  ;(window as any).__cleanupEventListeners = cleanupEventListeners
})

onUnmounted(() => {
  console.log('WarningView unmounted - cleaning up')
  
  // Event Listener entfernen
  const cleanupEventListeners = (window as any).__cleanupEventListeners
  if (cleanupEventListeners) {
    cleanupEventListeners()
  }
  
  // System aufräumen
  cleanup()
})
</script>

<template>
  <div class="page-container">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content -->
    <main class="main-content">
      <!-- 1. Status-Anzeige (Begrüßungstext) -->
      <div class="sentence-display-container">
        <div class="sentence-display">
          <div class="sentence-item sentence-active">
            {{ statusText }}
          </div>
        </div>
        <!-- TTS-Indikator -->
        <div class="tts-indicator" :class="{ 'tts-active': isTTSActive }">
          🔊
        </div>
      </div>

      <!-- 2. Glocken-Symbol (SVG) -->
      <div class="bell-container">
        <button
          @click="handleUserInput"
          class="bell-button"
          :class="[
            currentState === 'bell_idle' ? 'bell-active' : '',
            currentState === 'bell_playing' ? 'bell-playing' : '',
            isAlarmActive ? 'bell-alarm' : ''
          ]"
        >
          <img
            src="/bell.svg"
            alt="WARNGERÄUSCH"
            class="bell-icon"
          />
        </button>
      </div>

      <!-- 3. Zurück-Button -->
      <div class="back-section">
        <button
          @click="handleUserInput"
          class="back-action-button"
          :class="currentState === 'back_active' ? 'back-active' : ''"
        >
          ZURÜCK ZUM HAUPTMENÜ
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import './WarningView.css';
</style>
