<script setup lang="ts">
import { useKopfSchmerzViewLogic } from './KopfSchmerzView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'

const {
  currentTileIndex,
  selectedKopfBereich,
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
  kopfBereiche,
  speakText,
  toggleTTS,
  startAutoMode,
  pauseAutoMode,
  stopAutoMode,
  selectKopfBereich,
  handleBlink,
  handleRightClick,
  settingsStore,
  faceRecognition
} = useKopfSchmerzViewLogic()
</script>

<template>
  <div class="kopf-schmerz-app">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content - Zentriert -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- Ausgewähltes Kopf-Bereich Item Anzeige -->
        <div class="selected-item-container">
          <h2 class="selected-item-title">
            Ausgewähltes Item:
            </h2>
          <div class="selected-item-text">
              {{ selectedKopfBereich || 'Wählen Sie einen Kopf-Bereich aus' }}
          </div>
        </div>

        <!-- Kopf-Bereiche Grid - 3 Zeilen à 4 Items -->
        <div class="kopf-bereiche-grid">
          <!-- Zeile 1: Stirn, Hinterkopf, Schläfe, Nacken -->
          <div class="kopf-bereiche-row">
            <button
              v-for="(item, index) in kopfBereiche.slice(0, 4)"
              :key="item.id"
              @click="selectKopfBereich(item.id)"
              class="kopf-bereiche-item"
              :class="currentTileIndex === index ? 'active' : 'inactive'"
            >
              <img v-if="item.icon" :src="`/ratatosk.2.0/${item.icon}`" :alt="item.text" class="kopf-bereiche-icon" />
              <span class="kopf-bereiche-text">{{ item.text }}</span>
            </button>
          </div>

          <!-- Zeile 2: Kiefer, Nebenhöhlen, Hals, Auge -->
          <div class="kopf-bereiche-row">
            <button
              v-for="(item, index) in kopfBereiche.slice(4, 8)"
              :key="item.id"
              @click="selectKopfBereich(item.id)"
              class="kopf-bereiche-item"
              :class="currentTileIndex === index + 4 ? 'active' : 'inactive'"
            >
              <img v-if="item.icon" :src="`/ratatosk.2.0/${item.icon}`" :alt="item.text" class="kopf-bereiche-icon" />
              <span class="kopf-bereiche-text">{{ item.text }}</span>
            </button>
          </div>

          <!-- Zeile 3: Nase, Mund, Speiseröhre, Zurück -->
          <div class="kopf-bereiche-row">
            <button
              v-for="(item, index) in kopfBereiche.slice(8, 12)"
              :key="item.id"
              @click="selectKopfBereich(item.id)"
              class="kopf-bereiche-item"
              :class="currentTileIndex === index + 8 ? 'active' : 'inactive'"
            >
              <img v-if="item.icon" :src="`/ratatosk.2.0/${item.icon}`" :alt="item.text" class="kopf-bereiche-icon" />
              <span class="kopf-bereiche-text">{{ item.text }}</span>
            </button>
          </div>
        </div>

        <!-- Instructions -->
        <div class="instructions-container">
          <h3 class="instructions-title">Bedienung</h3>
          <p class="instructions-text">
              <strong>Kurz blinzeln ({{ settingsStore.settings.blinkSensitivity }}s):</strong> Kopf-Bereich auswählen<br>
              <strong>Rechte Maustaste:</strong> Kopf-Bereich auswählen<br>
            <strong>Auto-Modus:</strong> Automatischer Durchlauf durch alle Items
            </p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import './KopfSchmerzView.css';
</style>