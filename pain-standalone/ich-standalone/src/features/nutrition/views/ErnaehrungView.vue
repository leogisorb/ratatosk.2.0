<script setup lang="ts">
import { useErnaehrungViewLogic } from './ErnaehrungView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'

const {
  currentTileIndex,
  selectedErnaehrung,
  feedbackText,
  isAutoMode,
  isTTSActive,
  ernaehrungItems,
  speakText,
  enableTTSOnInteraction,
  selectErnaehrung,
  handleFaceBlink,
  handleRightClick,
  handleErnaehrungRightClick,
  goToErnaehrung,
  getTileClass,
  getIconClass,
  getTextClass,
  getIndicatorClass,
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

        <!-- Ernährung-Items Karussell -->
        <div class="carousel-container">
          <!-- Karussell Content -->
          <div class="carousel-content">
            <div 
              v-for="(item, index) in ernaehrungItems"
              :key="item.id"
              class="carousel-item"
              :class="currentTileIndex === index ? 'carousel-item-active' : 'carousel-item-inactive'"
              :style="{
                '--offset': index - currentTileIndex,
                '--rotation': (index < currentTileIndex ? -20 : index > currentTileIndex ? 20 : 0) + 'deg'
              }"
              @click="selectErnaehrung(item.id)"
              @contextmenu.prevent="handleErnaehrungRightClick($event, item.id)"
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
          v-for="(item, index) in ernaehrungItems"
          :key="`indicator-${item.id}`"
          class="carousel-indicator"
          :class="getIndicatorClass(index)"
          @click="goToErnaehrung(index)"
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
@import './ErnaehrungView.css';
</style>