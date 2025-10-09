<script setup lang="ts">
import { useBeineSchmerzViewLogic } from './BeineSchmerzView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'

const {
  currentTileIndex,
  selectedBeinBereich,
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
  beinBereiche,
  speakText,
  startAutoMode,
  pauseAutoMode,
  stopAutoMode,
  selectBeinBereich,
  handleBlink,
  handleRightClick,
  settingsStore,
  faceRecognition
} = useBeineSchmerzViewLogic()
</script>

<template>
  <div class="beine-schmerz-app">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content - Zentriert -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- Ausgewähltes Bein-Bereich Item Anzeige -->
        <div class="selected-item-container">
          <h2 class="selected-item-title">
            Ausgewähltes Item:
            </h2>
          <div class="selected-item-text">
            {{ selectedBeinBereich || 'Wählen Sie einen Bein-Bereich aus' }}
          </div>
        </div>

        <!-- Bein-Bereiche Grid - 3 Zeilen à 4 Items -->
        <div class="bein-bereiche-grid">
          <!-- Zeile 1: Oberschenkel, Knie, Unterschenkel, Knöchel -->
          <div class="bein-bereiche-row">
            <button
              v-for="(item, index) in beinBereiche.slice(0, 4)"
              :key="item.id"
              @click="selectBeinBereich(item.id)"
              class="bein-bereiche-item"
              :class="currentTileIndex === index ? 'active' : 'inactive'"
            >
              <img v-if="item.icon" :src="`/ratatosk.2.0/${item.icon}`" :alt="item.text" class="bein-bereiche-icon" />
              <span class="bein-bereiche-text">{{ item.text }}</span>
            </button>
              </div>
              
          <!-- Zeile 2: Fuß, Zehen, Hüfte, Wade -->
          <div class="bein-bereiche-row">
            <button
              v-for="(item, index) in beinBereiche.slice(4, 8)"
              :key="item.id"
              @click="selectBeinBereich(item.id)"
              class="bein-bereiche-item"
              :class="currentTileIndex === index + 4 ? 'active' : 'inactive'"
            >
              <img v-if="item.icon" :src="`/ratatosk.2.0/${item.icon}`" :alt="item.text" class="bein-bereiche-icon" />
              <span class="bein-bereiche-text">{{ item.text }}</span>
            </button>
          </div>

          <!-- Zeile 3: Leiste, Gesäß, Sprunggelenk, Zurück -->
          <div class="bein-bereiche-row">
            <button
              v-for="(item, index) in beinBereiche.slice(8, 12)"
              :key="item.id"
              @click="selectBeinBereich(item.id)"
              class="bein-bereiche-item"
              :class="currentTileIndex === index + 8 ? 'active' : 'inactive'"
            >
              <img v-if="item.icon" :src="`/ratatosk.2.0/${item.icon}`" :alt="item.text" class="bein-bereiche-icon" />
              <span class="bein-bereiche-text">{{ item.text }}</span>
            </button>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>

<style scoped>
@import './BeineSchmerzView.css';
</style>