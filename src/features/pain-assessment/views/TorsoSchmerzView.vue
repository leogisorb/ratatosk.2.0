<script setup lang="ts">
import { useTorsoSchmerzViewLogic } from './TorsoSchmerzView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'

const {
  currentTileIndex,
  selectedTorsoBereich,
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
  torsoBereiche,
  speakText,
  startAutoMode,
  pauseAutoMode,
  stopAutoMode,
  selectTorsoBereich,
  handleBlink,
  handleRightClick,
  settingsStore,
  faceRecognition
} = useTorsoSchmerzViewLogic()
</script>

<template>
  <div class="torso-schmerz-app">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content - Zentriert -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- Ausgewähltes Torso-Bereich Item Anzeige -->
        <div class="selected-item-container">
          <div class="selected-item-text" style="font-size: 3.43rem; font-family: 'Source Code Pro', monospace; font-weight: 500;">
            Wählen Sie einen Torso-Bereich aus
          </div>
        </div>

        <!-- Torso-Bereiche Grid - 3 Zeilen à 4 Items -->
        <div class="torso-bereiche-grid">
          <!-- Zeile 1: Brust, Rücken, Schulterblatt, Wirbelsäule -->
          <div class="torso-bereiche-row">
            <button
              v-for="(item, index) in torsoBereiche.slice(0, 4)"
              :key="item.id"
              @click="selectTorsoBereich(item.id)"
              class="torso-bereiche-item"
              :class="currentTileIndex === index ? 'active' : 'inactive'"
            >
              <img v-if="item.icon" :src="`/ratatosk.2.0/${item.icon}`" :alt="item.text" class="torso-bereiche-icon" />
              <span class="torso-bereiche-text">{{ item.text }}</span>
            </button>
              </div>
              
          <!-- Zeile 2: Bauch, Lunge, Herz, Magen -->
          <div class="torso-bereiche-row">
            <button
              v-for="(item, index) in torsoBereiche.slice(4, 8)"
              :key="item.id"
              @click="selectTorsoBereich(item.id)"
              class="torso-bereiche-item"
              :class="currentTileIndex === index + 4 ? 'active' : 'inactive'"
            >
              <img v-if="item.icon" :src="`/ratatosk.2.0/${item.icon}`" :alt="item.text" class="torso-bereiche-icon" />
              <span class="torso-bereiche-text">{{ item.text }}</span>
            </button>
          </div>

          <!-- Zeile 3: Leber, Niere, Blase, Zurück -->
          <div class="torso-bereiche-row">
            <button
              v-for="(item, index) in torsoBereiche.slice(8, 12)"
              :key="item.id"
              @click="selectTorsoBereich(item.id)"
              class="torso-bereiche-item"
              :class="currentTileIndex === index + 8 ? 'active' : 'inactive'"
            >
              <img v-if="item.icon" :src="`/ratatosk.2.0/${item.icon}`" :alt="item.text" class="torso-bereiche-icon" />
              <span class="torso-bereiche-text">{{ item.text }}</span>
            </button>
          </div>
        </div>

        <!-- Instructions -->
        <div class="instructions-container">
          <h3 class="instructions-title">Bedienung</h3>
          <p class="instructions-text">
              <strong>Kurz blinzeln ({{ settingsStore.settings.blinkSensitivity }}s):</strong> Torso-Bereich auswählen<br>
              <strong>Rechte Maustaste:</strong> Torso-Bereich auswählen<br>
            <strong>Auto-Modus:</strong> Automatischer Durchlauf durch alle Items
            </p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import './TorsoSchmerzView.css';
</style>