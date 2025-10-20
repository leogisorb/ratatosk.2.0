<script setup lang="ts">
import { useZimmerViewLogic } from './ZimmerView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'

const {
  currentTileIndex,
  selectedZimmerItem,
  isAutoMode,
  autoModeInterval,
  closedFrames,
  eyesClosed,
  isAutoModePaused,
  restartTimeout,
  blinkThreshold,
  lastBlinkTime,
  blinkCooldown,
  speechSynthesis,
  isTTSEnabled,
  zimmerItems,
  speakText,
  toggleTTS,
  startAutoMode,
  pauseAutoMode,
  stopAutoMode,
  selectZimmerItem,
  handleFaceBlink,
  handleRightClick,
  settingsStore,
  faceRecognition
} = useZimmerViewLogic()
</script>

<template>
  <div class="zimmer-app">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content - Zentriert -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- Ausgewähltes Zimmer-Item Anzeige -->
        <div class="selected-item-container">
          <div class="selected-item-text" style="font-size: 3.43rem; font-family: 'Source Code Pro', monospace; font-weight: 500;">
            Wählen Sie einen Zimmer-Bereich aus
          </div>
        </div>

        <!-- Zimmer-Items Grid - 2x2 Grid für 4 Items -->
        <div class="zimmer-items-grid">
          <button
            v-for="(item, index) in zimmerItems"
            :key="item.id"
            @click="selectZimmerItem(item.id)"
            class="zimmer-items-item"
            :class="currentTileIndex === index ? 'active' : 'inactive'"
          >
            <div v-if="item.emoji" class="zimmer-items-emoji">{{ item.emoji }}</div>
            <span class="zimmer-items-text">{{ item.text }}</span>
          </button>
        </div>

        <!-- Instructions -->
        <div class="instructions-container">
          <h3 class="instructions-title">Bedienung</h3>
          <p class="instructions-text">
            <strong>Kurz blinzeln ({{ settingsStore.settings.blinkSensitivity }}s):</strong> Zimmer-Bereich auswählen<br>
            <strong>Rechte Maustaste:</strong> Zimmer-Bereich auswählen<br>
            <strong>Auto-Modus:</strong> Automatischer Durchlauf durch alle Items
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import './ZimmerView.css';
</style>
