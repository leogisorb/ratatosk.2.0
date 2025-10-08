<script setup lang="ts">
import { useErnaehrungViewLogic } from './ErnaehrungView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'

const {
  currentTileIndex,
  selectedErnaehrung,
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
  ernaehrungItems,
  speakText,
  toggleTTS,
  startAutoMode,
  pauseAutoMode,
  stopAutoMode,
  selectErnaehrung,
  handleBlink,
  handleRightClick,
  settingsStore,
  faceRecognition
} = useErnaehrungViewLogic()
</script>

<template>
  <div class="ernaehrung-app">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content - Zentriert -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- Ausgewähltes Ernährung-Item Anzeige -->
        <div class="selected-item-container">
          <h2 class="selected-item-title">
            Ausgewähltes Item:
          </h2>
          <div class="selected-item-text">
            {{ selectedErnaehrung || 'Wählen Sie ein Ernährung-Item aus' }}
          </div>
        </div>

        <!-- Ernährung-Items Grid - 3 Zeilen à 5 Items -->
        <div class="ernaehrung-grid">
          <!-- Zeile 1: Essen, Trinken, süß, herzhaft, scharf -->
          <div class="ernaehrung-row">
            <button
              v-for="(item, index) in ernaehrungItems.slice(0, 5)"
              :key="item.id"
              @click="selectErnaehrung(item.id)"
              class="ernaehrung-item"
              :class="currentTileIndex === index ? 'active' : 'inactive'"
            >
              <div v-if="item.emoji" class="ernaehrung-emoji">{{ item.emoji }}</div>
              <span class="ernaehrung-text">{{ item.text }}</span>
            </button>
          </div>

          <!-- Zeile 2: kalt, warm, lauwarm, trocken, nass -->
          <div class="ernaehrung-row">
            <button
              v-for="(item, index) in ernaehrungItems.slice(5, 10)"
              :key="item.id"
              @click="selectErnaehrung(item.id)"
              class="ernaehrung-item"
              :class="currentTileIndex === index + 5 ? 'active' : 'inactive'"
            >
              <div v-if="item.emoji" class="ernaehrung-emoji">{{ item.emoji }}</div>
              <span class="ernaehrung-text">{{ item.text }}</span>
            </button>
          </div>

          <!-- Zeile 3: breiig, Wasser, Saft, Milch, Zurück -->
          <div class="ernaehrung-row">
            <button
              v-for="(item, index) in ernaehrungItems.slice(10, 15)"
              :key="item.id"
              @click="selectErnaehrung(item.id)"
              class="ernaehrung-item"
              :class="currentTileIndex === index + 10 ? 'active' : 'inactive'"
            >
              <div v-if="item.emoji" class="ernaehrung-emoji">{{ item.emoji }}</div>
              <span class="ernaehrung-text">{{ item.text }}</span>
            </button>
          </div>
        </div>

        <!-- Instructions -->
        <div class="instructions-container">
          <h3 class="instructions-title">Bedienung</h3>
          <p class="instructions-text">
            <strong>Kurz blinzeln ({{ settingsStore.settings.blinkSensitivity }}s):</strong> Ernährung-Item auswählen<br>
            <strong>Rechte Maustaste:</strong> Ernährung-Item auswählen<br>
            <strong>Auto-Modus:</strong> Automatischer Durchlauf durch alle Items
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import './ErnaehrungView.css';
</style>