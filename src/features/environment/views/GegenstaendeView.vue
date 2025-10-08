<script setup lang="ts">
import { useGegenstaendeViewLogic } from './GegenstaendeView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'

const {
  currentTileIndex,
  selectedGegenstaendeItem,
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
  gegenstaendeItems,
  speakText,
  toggleTTS,
  startAutoMode,
  pauseAutoMode,
  stopAutoMode,
  selectGegenstaendeItem,
  handleBlink,
  handleRightClick,
  settingsStore,
  faceRecognition
} = useGegenstaendeViewLogic()
</script>

<template>
  <div class="gegenstaende-app">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content - Zentriert -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- Ausgewähltes Gegenstand-Item Anzeige -->
        <div class="selected-item-container">
          <h2 class="selected-item-title">
            Ausgewähltes Item:
          </h2>
          <div class="selected-item-text">
            {{ selectedGegenstaendeItem || 'Wählen Sie einen Gegenstand aus' }}
          </div>
        </div>

        <!-- Gegenstand-Items Grid - 3x3 Grid für 9 Items -->
        <div class="gegenstaende-items-grid">
          <button
            v-for="(item, index) in gegenstaendeItems"
            :key="item.id"
            @click="selectGegenstaendeItem(item.id)"
            class="gegenstaende-items-item"
            :class="currentTileIndex === index ? 'active' : 'inactive'"
          >
            <div v-if="item.emoji" class="gegenstaende-items-emoji">{{ item.emoji }}</div>
            <span class="gegenstaende-items-text">{{ item.text }}</span>
          </button>
        </div>

        <!-- Instructions -->
        <div class="instructions-container">
          <h3 class="instructions-title">Bedienung</h3>
          <p class="instructions-text">
            <strong>Kurz blinzeln ({{ settingsStore.settings.blinkSensitivity }}s):</strong> Gegenstand auswählen<br>
            <strong>Rechte Maustaste:</strong> Gegenstand auswählen<br>
            <strong>Auto-Modus:</strong> Automatischer Durchlauf durch alle Items
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import './GegenstaendeView.css';
</style>
