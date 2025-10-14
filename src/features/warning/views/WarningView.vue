<script setup lang="ts">
// Import external JavaScript logic
import { useWarningViewLogic } from './WarningView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'

// Use the composable function
const {
  closedFrames,
  eyesClosed,
  currentTileIndex,
  isAutoMode,
  autoModeInterval,
  isAutoModePaused,
  warningTiles,
  blinkThreshold,
  lastBlinkTime,
  blinkCooldown,
  audioContext,
  isPlayingSound,
  isAlarmActive,
  alarmInterval,
  isTTSEnabled,
  speakText,
  startAutoMode,
  pauseAutoMode,
  stopAutoMode,
  selectWarningTile,
  playSingleAlarmSound,
  startContinuousAlarm,
  stopContinuousAlarm,
  handleFaceBlink,
  handleRightClick,
  settingsStore,
  faceRecognition
} = useWarningViewLogic()
</script>

<template>
  <div class="page-container">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content - Zentriert -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- Großes Glocken Icon - Zentriert -->
        <div class="bell-container">
          <button
            @click="selectWarningTile('glocke')"
            class="bell-button"
            :class="currentTileIndex === 0 ? 'bell-active' : ''"
          >
            <img 
              src="/bell.svg" 
              alt="WARNGERÄUSCH" 
              class="bell-icon"
            />
          </button>
        </div>

        <!-- Zurück Button - Zentriert -->
        <div class="back-section">
          <button
            @click="selectWarningTile('zurueck')"
            class="back-action-button"
            :class="currentTileIndex === 1 ? 'back-active' : ''"
          >
            ZURÜCK
          </button>
        </div>

        <!-- Instructions - Zentriert -->
        <div class="instructions-container">
          <div class="instructions-box">
            <h3 class="instructions-title">Bedienung</h3>
            <p class="instructions-text">
              <strong>Kurz blinzeln ({{ settingsStore.settings.blinkSensitivity }}s):</strong> Aktion auswählen<br>
              <strong>Rechte Maustaste:</strong> Aktion auswählen<br>
              <strong>Auto-Modus:</strong> Automatischer Durchlauf durch alle Aktionen
            </p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import './WarningView.css';
</style>