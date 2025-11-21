<script setup lang="ts">
import AppHeader from '../../../shared/components/AppHeader.vue'
import { onMounted, onUnmounted } from 'vue'
import { useWarningViewLogic } from './WarningView'
import { ViewCleanupRegistry } from '../../../shared/utils/UnifiedCleanup'
import bellIcon from '@/assets/icons/bell.svg'

// ===== WARNING VIEW LOGIC =====
const {
  currentState,
  statusText,
  isAlarmActive,
  handleUserInput,
  setupWarningSystem,
  cleanup,
  settingsStore
} = useWarningViewLogic()

// ===== LIFECYCLE =====
onMounted(async () => {
  console.log('WarningView mounted - starting warning system')
  
  // Setup warning system
  const cleanupEventListeners = await setupWarningSystem()
  
  // Register cleanup in UnifiedCleanup (SYNCHRON, damit Router-Guard es findet)
  // Der Router-Guard räumt auf, nicht onUnmounted
  ViewCleanupRegistry.register('warning', async () => {
    console.log('WarningView: Cleanup called via UnifiedCleanup')
    if (cleanupEventListeners) {
      cleanupEventListeners()
    }
    cleanup()
  })
})

onUnmounted(() => {
  console.log('WarningView unmounted - cleaning up')
  
  // System aufräumen (setzt isCancelled = true)
  // WICHTIG: Router-Guard hat bereits aufgeräumt, aber wir räumen hier nochmal auf
  // für den Fall, dass die Komponente ohne Navigation unmounted wird
  cleanup()
  
  // Cleanup via UnifiedCleanup (nur wenn noch nicht aufgeräumt)
  // Router-Guard räumt normalerweise auf, aber als Fallback hier auch
  if (ViewCleanupRegistry.hasCleanup('warning')) {
    ViewCleanupRegistry.cleanup('warning').catch(error => {
      console.error('WarningView: Cleanup error:', error)
    })
  }
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
      </div>

      <!-- 2. Glocken-Symbol (SVG) -->
      <div class="bell-container">
        <button
          @click="(currentState === 'bell_idle' || currentState === 'bell_playing') ? handleUserInput : null"
          class="bell-button"
          :class="[
            currentState === 'bell_idle' ? 'bell-active' : '',
            currentState === 'bell_playing' ? 'bell-playing' : '',
            isAlarmActive ? 'bell-alarm' : ''
          ]"
        >
          <img
            :src="bellIcon"
            alt="WARNGERÄUSCH"
            class="bell-icon"
          />
        </button>
      </div>

      <!-- 3. Zurück-Button -->
      <div class="back-section">
        <button
          @click="currentState === 'back_active' ? handleUserInput : null"
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
