<script setup lang="ts">
import { useKleidungViewLogic } from './KleidungView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'

const {
  currentTileIndex,
  selectedKleidung,
  feedbackText,
  isAutoMode,
  closedFrames,
  eyesClosed,
  blinkThreshold,
  lastBlinkTime,
  blinkCooldown,
  kleidungItems,
  speakText,
  enableTTSOnInteraction,
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
        <!-- Haupttext -->
        <div class="main-text-container">
          <h1 class="main-text">Was möchten Sie anziehen?</h1>
        </div>

        <!-- Orange Rückmeldung -->
        <div class="feedback-text-container">
          <div class="feedback-text" :class="{ show: feedbackText && feedbackText.length > 0 }">
            {{ feedbackText }}
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

      </div>
    </main>
  </div>
</template>

<style scoped>
@import './KleidungView.css';
</style>