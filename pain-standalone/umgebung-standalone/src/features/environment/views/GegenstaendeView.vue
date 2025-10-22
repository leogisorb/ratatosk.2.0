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
  handleFaceBlink,
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
          <div class="selected-item-text" style="font-size: 3.43rem; font-family: 'Source Code Pro', monospace; font-weight: 500;">
            Wählen Sie einen Gegenstand aus
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

      </div>
    </main>
  </div>
</template>

<style scoped>
@import './GegenstaendeView.css';
</style>
