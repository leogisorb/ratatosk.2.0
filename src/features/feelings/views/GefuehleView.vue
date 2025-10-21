<script setup lang="ts">
import { useGefuehleViewLogic } from './GefuehleView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'

const {
  currentTileIndex,
  selectedGefuehl,
  feedbackText,
  isAutoMode,
  closedFrames,
  eyesClosed,
  blinkThreshold,
  lastBlinkTime,
  blinkCooldown,
  gefuehleItems,
  isMobile,
  position,
  carouselStyle,
  currentItem,
  itemCount,
  autoScrollState,
  touchState,
  isSwipe,
  swipeDirection,
  isTTSActive,
  speakText,
  enableTTSOnInteraction,
  selectGefuehl,
  handleBlink,
  handleRightClick,
  handleGefuehlRightClick,
  goToGefuehl,
  navigateToIndex,
  navigateNext,
  navigatePrevious,
  handleCarouselTouchStart,
  handleCarouselTouchMove,
  handleCarouselTouchEnd,
  startAutoScrollWithCallback,
  stopAutoScrollCompletely,
  checkIsMobile,
  settingsStore,
  faceRecognition
} = useGefuehleViewLogic()
</script>

<template>
  <div class="gefuehle-app">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content - Clean Layout -->
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

        <!-- 3D Karussell Container -->
        <div class="carousel-container">
          <div class="carousel-content" :style="carouselStyle">
            <div
              v-for="(item, index) in gefuehleItems"
              :key="item.id"
              class="carousel-item"
              :class="{
                'carousel-item-active': currentTileIndex === index,
                'carousel-item-inactive': currentTileIndex !== index
              }"
              :style="{ '--offset': index - currentTileIndex }"
              @click="selectGefuehl(item.id)"
              @contextmenu="handleGefuehlRightClick($event, item.id)"
            >
              <div class="carousel-item-content">
                <div class="tile-icon-container">
                  <div class="tile-emoji">{{ item.emoji }}</div>
                </div>
                <div class="tile-text">{{ item.text }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- TTS-Indikator -->
        <div class="tts-indicator" :class="{ 'tts-active': isTTSActive }">
          🔊
        </div>

      </div>
    </main>

    <!-- Karussell Indicators - Komplett außerhalb des content-wrapper -->
    <div class="carousel-indicators">
      <button
        v-for="(item, index) in gefuehleItems"
        :key="`indicator-${item.id}`"
        class="carousel-indicator"
        :class="{
          'carousel-indicator-active': currentTileIndex === index,
          'carousel-indicator-inactive': currentTileIndex !== index
        }"
        @click="goToGefuehl(index)"
      />
    </div>
  </div>
</template>

<style scoped>
@import './GefuehleView.css';
</style>