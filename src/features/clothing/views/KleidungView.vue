<script setup lang="ts">
import { useKleidungViewLogic } from './KleidungView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'

const {
  currentTileIndex,
  selectedKleidung,
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
  kleidungItems,
  speakText,
  toggleTTS,
  startAutoMode,
  pauseAutoMode,
  stopAutoMode,
  selectKleidung,
  handleBlink,
  handleRightClick,
  settingsStore,
  faceRecognition
} = useKleidungViewLogic()
</script>

<template>
  <div class="kleidung-app">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content - Zentriert -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- Ausgewähltes Kleidung-Item Anzeige -->
        <div class="selected-item-container">
          <h2 class="selected-item-title">
            Ausgewähltes Item:
          </h2>
          <div class="selected-item-text">
            {{ selectedKleidung || 'Wählen Sie ein Kleidung-Item aus' }}
          </div>
        </div>

        <!-- Kleidung-Items Grid - 3 Zeilen à 4 Items -->
        <div class="kleidung-grid">
          <!-- Zeile 1: Mütze, Ohrstöpsel, Schaal, Hemd -->
          <div class="kleidung-row">
            <button
              v-for="(item, index) in kleidungItems.slice(0, 4)"
              :key="item.id"
              @click="selectKleidung(item.id)"
              class="kleidung-item"
              :class="currentTileIndex === index ? 'active' : 'inactive'"
            >
              <div v-if="item.emoji" class="kleidung-emoji">{{ item.emoji }}</div>
              <span class="kleidung-text">{{ item.text }}</span>
            </button>
          </div>

          <!-- Zeile 2: T-Shirt, Pullover, Jacke, Hose -->
          <div class="kleidung-row">
            <button
              v-for="(item, index) in kleidungItems.slice(4, 8)"
              :key="item.id"
              @click="selectKleidung(item.id)"
              class="kleidung-item"
              :class="currentTileIndex === index + 4 ? 'active' : 'inactive'"
            >
              <div v-if="item.emoji" class="kleidung-emoji">{{ item.emoji }}</div>
              <span class="kleidung-text">{{ item.text }}</span>
            </button>
          </div>

          <!-- Zeile 3: Socken, Schuhe, Unterwäsche, Zurück -->
          <div class="kleidung-row">
            <button
              v-for="(item, index) in kleidungItems.slice(8, 12)"
              :key="item.id"
              @click="selectKleidung(item.id)"
              class="kleidung-item"
              :class="currentTileIndex === index + 8 ? 'active' : 'inactive'"
            >
              <div v-if="item.emoji" class="kleidung-emoji">{{ item.emoji }}</div>
              <span class="kleidung-text">{{ item.text }}</span>
            </button>
          </div>
        </div>

        <!-- Instructions -->
        <div class="instructions-container">
          <h3 class="instructions-title">Bedienung</h3>
          <p class="instructions-text">
            <strong>Kurz blinzeln ({{ settingsStore.settings.blinkSensitivity }}s):</strong> Kleidung-Item auswählen<br>
            <strong>Rechte Maustaste:</strong> Kleidung-Item auswählen<br>
            <strong>Auto-Modus:</strong> Automatischer Durchlauf durch alle Items
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import './KleidungView.css';
</style>