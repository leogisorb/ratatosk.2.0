<script setup lang="ts">
import { useErnaehrungViewLogic } from './ErnaehrungView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'

const {
  currentTileIndex,
  selectedErnaehrung,
  feedbackText,
  isAutoMode,
  ernaehrungItems,
  speakText,
  enableTTSOnInteraction,
  selectErnaehrung,
  handleFaceBlink,
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
        <!-- Haupttext -->
        <div class="main-text-container">
          <h1 class="main-text">Was wollen Sie zu sich nehmen?</h1>
        </div>

        <!-- Orange Rückmeldung -->
        <div class="feedback-text-container">
          <div class="feedback-text" :class="{ show: feedbackText && feedbackText.length > 0 }">
            {{ feedbackText }}
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

      </div>
    </main>
  </div>
</template>

<style scoped>
@import './ErnaehrungView.css';
</style>