<script setup lang="ts">
import { useHygieneViewLogic } from './HygieneView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'

const {
  currentTileIndex,
  selectedHygiene,
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
  hygieneItems,
  speakText,
  toggleTTS,
  startAutoMode,
  pauseAutoMode,
  stopAutoMode,
  selectHygiene,
  handleBlink,
  handleRightClick,
  settingsStore,
  faceRecognition
} = useHygieneViewLogic()
</script>

<template>
  <div class="hygiene-app">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content - Zentriert -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- Ausgewähltes Hygiene-Item Anzeige -->
        <div class="selected-item-container">
          <h2 class="selected-item-title">
            Ausgewähltes Item:
          </h2>
          <div class="selected-item-text">
            {{ selectedHygiene || 'Wählen Sie ein Hygiene-Item aus' }}
          </div>
        </div>

        <!-- Hygiene-Items Grid - 3 Zeilen à 4 Items -->
        <div class="hygiene-grid">
          <!-- Zeile 1: Duschen, Baden, Zähneputzen, Händewaschen -->
          <div class="hygiene-row">
            <button
              v-for="(item, index) in hygieneItems.slice(0, 4)"
              :key="item.id"
              @click="selectHygiene(item.id)"
              class="hygiene-item"
              :class="currentTileIndex === index ? 'active' : 'inactive'"
            >
              <div v-if="item.emoji" class="hygiene-emoji">{{ item.emoji }}</div>
              <span class="hygiene-text">{{ item.text }}</span>
            </button>
          </div>

          <!-- Zeile 2: Haare waschen, Rasieren, Deo, Creme -->
          <div class="hygiene-row">
            <button
              v-for="(item, index) in hygieneItems.slice(4, 8)"
              :key="item.id"
              @click="selectHygiene(item.id)"
              class="hygiene-item"
              :class="currentTileIndex === index + 4 ? 'active' : 'inactive'"
            >
              <div v-if="item.emoji" class="hygiene-emoji">{{ item.emoji }}</div>
              <span class="hygiene-text">{{ item.text }}</span>
            </button>
          </div>

          <!-- Zeile 3: Toilette, Windel wechseln, Medikamente, Zurück -->
          <div class="hygiene-row">
            <button
              v-for="(item, index) in hygieneItems.slice(8, 12)"
              :key="item.id"
              @click="selectHygiene(item.id)"
              class="hygiene-item"
              :class="currentTileIndex === index + 8 ? 'active' : 'inactive'"
            >
              <div v-if="item.emoji" class="hygiene-emoji">{{ item.emoji }}</div>
              <span class="hygiene-text">{{ item.text }}</span>
            </button>
          </div>
        </div>

        <!-- Instructions -->
        <div class="instructions-container">
          <h3 class="instructions-title">Bedienung</h3>
          <p class="instructions-text">
            <strong>Kurz blinzeln ({{ settingsStore.settings.blinkSensitivity }}s):</strong> Hygiene-Item auswählen<br>
            <strong>Rechte Maustaste:</strong> Hygiene-Item auswählen<br>
            <strong>Auto-Modus:</strong> Automatischer Durchlauf durch alle Items
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import './HygieneView.css';
</style>