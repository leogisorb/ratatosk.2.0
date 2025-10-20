<script setup lang="ts">
import { useHygieneViewLogic } from './HygieneView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'

const {
  currentTileIndex,
  selectedHygiene,
  feedbackText,
  isAutoMode,
  closedFrames,
  eyesClosed,
  blinkThreshold,
  lastBlinkTime,
  blinkCooldown,
  hygieneItems,
  speakText,
  enableTTSOnInteraction,
  selectHygiene,
  handleFaceBlink,
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
        <!-- Haupttext -->
        <div class="main-text-container">
          <h1 class="main-text">Was möchten Sie für Ihre Hygiene tun?</h1>
        </div>

        <!-- Orange Rückmeldung -->
        <div class="feedback-text-container">
          <div class="feedback-text" :class="{ show: feedbackText && feedbackText.length > 0 }">
            {{ feedbackText }}
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

      </div>
    </main>
  </div>
</template>

<style scoped>
@import './HygieneView.css';
</style>