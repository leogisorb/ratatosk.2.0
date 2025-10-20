<script setup lang="ts">
import { useBewegungViewLogic } from './BewegungView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'

const {
  currentTileIndex,
  selectedBewegung,
  feedbackText,
  isAutoMode,
  closedFrames,
  eyesClosed,
  blinkThreshold,
  lastBlinkTime,
  blinkCooldown,
  bewegungItems,
  speakText,
  enableTTSOnInteraction,
  selectBewegung,
  handleFaceBlink,
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
        <!-- Haupttext -->
        <div class="main-text-container">
          <h1 class="main-text">Was möchten Sie machen?</h1>
        </div>

        <!-- Orange Rückmeldung -->
        <div class="feedback-text-container">
          <div class="feedback-text" :class="{ show: feedbackText && feedbackText.length > 0 }">
            {{ feedbackText }}
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

      </div>
    </main>
  </div>
</template>

<style scoped>
@import './BewegungView.css';
</style>