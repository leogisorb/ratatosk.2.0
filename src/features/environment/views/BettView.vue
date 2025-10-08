<script setup lang="ts">
import { useBettViewLogic } from './BettView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'

const {
  currentTileIndex,
  selectedBettItem,
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
  bettItems,
  speakText,
  toggleTTS,
  startAutoMode,
  pauseAutoMode,
  stopAutoMode,
  selectBettItem,
  handleBlink,
  handleRightClick,
  settingsStore,
  faceRecognition
} = useBettViewLogic()
</script>

<template>
  <div class="bett-app">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content - Zentriert -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- Ausgewähltes Bett-Item Anzeige -->
        <div class="selected-item-container">
          <h2 class="selected-item-title">
            Ausgewähltes Item:
          </h2>
          <div class="selected-item-text">
            {{ selectedBettItem || 'Wählen Sie einen Bett-Bereich aus' }}
          </div>
        </div>

        <!-- Bett-Items Grid - 2x2 Grid für 4 Items -->
        <div class="bett-items-grid">
          <button
            v-for="(item, index) in bettItems"
            :key="item.id"
            @click="selectBettItem(item.id)"
            class="bett-items-item"
            :class="currentTileIndex === index ? 'active' : 'inactive'"
          >
            <div v-if="item.emoji" class="bett-items-emoji">{{ item.emoji }}</div>
            <span class="bett-items-text">{{ item.text }}</span>
          </button>
        </div>

        <!-- Instructions -->
        <div class="instructions-container">
          <h3 class="instructions-title">Bedienung</h3>
          <p class="instructions-text">
            <strong>Kurz blinzeln ({{ settingsStore.settings.blinkSensitivity }}s):</strong> Bett-Bereich auswählen<br>
            <strong>Rechte Maustaste:</strong> Bett-Bereich auswählen<br>
            <strong>Auto-Modus:</strong> Automatischer Durchlauf durch alle Items
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import './BettView.css';
</style>