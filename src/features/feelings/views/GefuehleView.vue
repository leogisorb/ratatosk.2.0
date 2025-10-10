<script setup lang="ts">
import { useGefuehleViewLogic } from './GefuehleView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'

const {
  currentTileIndex,
  selectedGefuehl,
  isAutoMode,
  closedFrames,
  eyesClosed,
  blinkThreshold,
  lastBlinkTime,
  blinkCooldown,
  gefuehleItems,
  speakText,
  enableTTSOnInteraction,
  selectGefuehl,
  handleBlink,
  handleRightClick,
  settingsStore,
  faceRecognition
} = useGefuehleViewLogic()
</script>

<template>
  <div class="gefuehle-app">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content - Zentriert -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- Ausgewähltes Gefühl-Item Anzeige -->
        <div class="selected-item-container">
          <h2 class="selected-item-title">
            Ausgewähltes Item:
          </h2>
          <div class="selected-item-text">
            {{ selectedGefuehl || 'Wählen Sie ein Gefühl-Item aus' }}
          </div>
        </div>

        <!-- Gefühle-Items Grid - 3 Zeilen à 4 Items -->
        <div class="gefuehle-grid">
          <!-- Zeile 1: Glücklich, Froh, Erleichtert, Traurig -->
          <div class="gefuehle-row">
            <button
              v-for="(item, index) in gefuehleItems.slice(0, 4)"
              :key="item.id"
              @click="selectGefuehl(item.id)"
              class="gefuehle-item"
              :class="currentTileIndex === index ? 'active' : 'inactive'"
            >
              <div v-if="item.emoji" class="gefuehle-emoji">{{ item.emoji }}</div>
              <span class="gefuehle-text">{{ item.text }}</span>
            </button>
          </div>

          <!-- Zeile 2: Wütend, Einsam, Ängstlich, Gelangweilt -->
          <div class="gefuehle-row">
            <button
              v-for="(item, index) in gefuehleItems.slice(4, 8)"
              :key="item.id"
              @click="selectGefuehl(item.id)"
              class="gefuehle-item"
              :class="currentTileIndex === index + 4 ? 'active' : 'inactive'"
            >
              <div v-if="item.emoji" class="gefuehle-emoji">{{ item.emoji }}</div>
              <span class="gefuehle-text">{{ item.text }}</span>
            </button>
          </div>

          <!-- Zeile 3: Aufgeregt, Müde, Gestresst, Zurück -->
          <div class="gefuehle-row">
            <button
              v-for="(item, index) in gefuehleItems.slice(8, 12)"
              :key="item.id"
              @click="selectGefuehl(item.id)"
              class="gefuehle-item"
              :class="currentTileIndex === index + 8 ? 'active' : 'inactive'"
            >
              <div v-if="item.emoji" class="gefuehle-emoji">{{ item.emoji }}</div>
              <span class="gefuehle-text">{{ item.text }}</span>
            </button>
          </div>
        </div>

        <!-- Instructions -->
        <div class="instructions-container">
          <h3 class="instructions-title">Bedienung</h3>
          <p class="instructions-text">
            <strong>Kurz blinzeln ({{ settingsStore.settings.blinkSensitivity }}s):</strong> Gefühl-Item auswählen<br>
            <strong>Rechte Maustaste:</strong> Gefühl-Item auswählen<br>
            <strong>Auto-Modus:</strong> Automatischer Durchlauf durch alle Items
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import './GefuehleView.css';
</style>