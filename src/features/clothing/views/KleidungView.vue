<script setup lang="ts">
import { useKleidungViewLogic } from './KleidungView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'

const {
  currentTileIndex,
  selectedKleidung,
  feedbackText,
  isAutoMode,
  isTTSActive,
  kleidungItems,
  speakText,
  enableTTSOnInteraction,
  selectKleidung,
  handleFaceBlink,
  handleRightClick,
  handleKleidungRightClick,
  goToKleidung,
  getTileClass,
  getIconClass,
  getTextClass,
  getIndicatorClass,
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

        <!-- Kleidung-Items 3D Karussell -->
        <div class="carousel-container">
          <!-- Karussell Content -->
          <div class="carousel-content">
            <div 
              v-for="(item, index) in kleidungItems"
              :key="item.id"
              class="carousel-item"
              :class="currentTileIndex === index ? 'carousel-item-active' : 'carousel-item-inactive'"
              :style="{
                '--offset': index - currentTileIndex,
                '--rotation': (index < currentTileIndex ? -20 : index > currentTileIndex ? 20 : 0) + 'deg'
              }"
              @click="selectKleidung(item.id)"
              @contextmenu.prevent="handleKleidungRightClick($event, item.id)"
            >
              <div class="carousel-item-content">
                <div 
                  class="tile-icon-container"
                  :class="getIconClass(index)"
                >
                  <div v-if="item.emoji" class="tile-emoji">{{ item.emoji }}</div>
                </div>
                <div 
                  class="tile-text"
                  :class="getTextClass(index)"
                >
                  {{ item.text }}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>

    <!-- Separater Container für Indikatoren - Komplett getrennt -->
    <div class="indicators-container">
      <div class="carousel-indicators-separate">
        <button 
          v-for="(item, index) in kleidungItems"
          :key="`indicator-${item.id}`"
          class="carousel-indicator"
          :class="getIndicatorClass(index)"
          @click="goToKleidung(index)"
          :title="`Index: ${index}, Current: ${currentTileIndex}, Active: ${currentTileIndex === index}`"
        >
        </button>
      </div>
    </div>

    <!-- TTS-Indikator -->
    <div class="tts-indicator" :class="{ 'tts-active': isTTSActive }">
      🔊
    </div>
  </div>
</template>

<style scoped>
@import './KleidungView.css';
</style>