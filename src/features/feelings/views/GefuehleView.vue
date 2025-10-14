<script setup lang="ts">
import { useGefuehleViewLogic } from './GefuehleView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'

const {
  currentTileIndex,
  selectedGefuehl,
  feedbackText,
  isAutoMode,
  gefuehleItems,
  speakText,
  enableTTSOnInteraction,
  selectGefuehl,
  handleFaceBlink,
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
        <!-- Haupttext -->
        <div class="main-text-container">
          <h1 class="main-text">Wie fühlen Sie sich?</h1>
        </div>

        <!-- Orange Rückmeldung -->
        <div class="feedback-text-container">
          <div class="feedback-text" :class="{ show: feedbackText && feedbackText.length > 0 }">
            {{ feedbackText }}
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

      </div>
    </main>
  </div>
</template>

<style scoped>
@import './GefuehleView.css';
</style>