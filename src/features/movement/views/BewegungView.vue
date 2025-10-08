<script setup lang="ts">
import { useBewegungViewLogic } from './BewegungView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'

const {
  currentTileIndex,
  selectedBewegung,
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
  bewegungItems,
  speakText,
  toggleTTS,
  startAutoMode,
  pauseAutoMode,
  stopAutoMode,
  selectBewegung,
  handleBlink,
  handleRightClick,
  settingsStore,
  faceRecognition
} = useBewegungViewLogic()
</script>

<template>
  <div class="bewegung-app">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content - Zentriert -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- Ausgewähltes Bewegung-Item Anzeige -->
        <div class="selected-item-container">
          <h2 class="selected-item-title">
            Ausgewähltes Item:
          </h2>
          <div class="selected-item-text">
            {{ selectedBewegung || 'Wählen Sie ein Bewegung-Item aus' }}
          </div>
        </div>

        <!-- Bewegung-Items Grid - 3 Zeilen à 4 Items -->
        <div class="bewegung-grid">
          <!-- Zeile 1: Gehen, Laufen, Fahrrad, Schwimmen -->
          <div class="bewegung-row">
            <button
              v-for="(item, index) in bewegungItems.slice(0, 4)"
              :key="item.id"
              @click="selectBewegung(item.id)"
              class="bewegung-item"
              :class="currentTileIndex === index ? 'active' : 'inactive'"
            >
              <div v-if="item.emoji" class="bewegung-emoji">{{ item.emoji }}</div>
              <span class="bewegung-text">{{ item.text }}</span>
            </button>
          </div>

          <!-- Zeile 2: Yoga, Tanzen, Sport, Spazieren -->
          <div class="bewegung-row">
            <button
              v-for="(item, index) in bewegungItems.slice(4, 8)"
              :key="item.id"
              @click="selectBewegung(item.id)"
              class="bewegung-item"
              :class="currentTileIndex === index + 4 ? 'active' : 'inactive'"
            >
              <div v-if="item.emoji" class="bewegung-emoji">{{ item.emoji }}</div>
              <span class="bewegung-text">{{ item.text }}</span>
            </button>
          </div>

          <!-- Zeile 3: Physiotherapie, Massage, Ruhe, Zurück -->
          <div class="bewegung-row">
            <button
              v-for="(item, index) in bewegungItems.slice(8, 12)"
              :key="item.id"
              @click="selectBewegung(item.id)"
              class="bewegung-item"
              :class="currentTileIndex === index + 8 ? 'active' : 'inactive'"
            >
              <div v-if="item.emoji" class="bewegung-emoji">{{ item.emoji }}</div>
              <span class="bewegung-text">{{ item.text }}</span>
            </button>
          </div>
        </div>

        <!-- Instructions -->
        <div class="instructions-container">
          <h3 class="instructions-title">Bedienung</h3>
          <p class="instructions-text">
            <strong>Kurz blinzeln ({{ settingsStore.settings.blinkSensitivity }}s):</strong> Bewegung-Item auswählen<br>
            <strong>Rechte Maustaste:</strong> Bewegung-Item auswählen<br>
            <strong>Auto-Modus:</strong> Automatischer Durchlauf durch alle Items
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import './BewegungView.css';
</style>