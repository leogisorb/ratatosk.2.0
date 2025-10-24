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
  handleHygieneRightClick,
  goToHygiene,
  settingsStore,
  faceRecognition,
  
  // Mobile Karussell State
  isMobile,
  position,
  carouselStyle,
  currentItem,
  itemCount,
  autoScrollState,
  touchState,
  isSwipe,
  swipeDirection,
  
  // Mobile Karussell Methods
  navigateToIndex,
  navigateNext,
  navigatePrevious,
  handleCarouselTouchStart,
  handleCarouselTouchMove,
  handleCarouselTouchEnd,
  startAutoScrollWithCallback,
  stopAutoScrollCompletely,
  checkIsMobile
} = useHygieneViewLogic()
</script>

<template>
  <div class="hygiene-app">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content - Zentriert -->
    <main class="main-content">
      <!-- Desktop Layout (Grid) - wird auf Desktop angezeigt -->
      <div class="desktop-grid" v-if="!isMobile">
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

        <!-- Hygiene-Items Karussell -->
        <div class="carousel-container">
          <!-- Karussell Content -->
          <div class="carousel-content">
            <div 
              v-for="(item, index) in hygieneItems"
              :key="item.id"
              class="carousel-item"
              :class="currentTileIndex === index ? 'carousel-item-active' : 'carousel-item-inactive'"
              :style="{
                '--offset': index - currentTileIndex,
                '--rotation': (index < currentTileIndex ? -20 : index > currentTileIndex ? 20 : 0) + 'deg'
              }"
              @click="selectHygiene(item.id)"
              @contextmenu.prevent="handleHygieneRightClick($event, item.id)"
            >
              <div class="carousel-item-content">
                <div 
                  class="tile-icon-container"
                  :class="currentTileIndex === index ? 'icon-active' : 'icon-inactive'"
                >
                  <div v-if="item.emoji" class="tile-emoji">{{ item.emoji }}</div>
                </div>
                <div 
                  class="tile-text"
                  :class="currentTileIndex === index ? 'text-active' : 'text-inactive'"
                  :style="currentTileIndex === index ? 'color: white !important;' : ''"
                >
                  {{ item.text }}
                </div>
              </div>
            </div>
          </div>
        </div>


        <!-- TTS-Indikator -->
        <div class="tts-indicator" :class="{ 'tts-active': settingsStore.isTTSActive }">
          🔊
        </div>
      </div>
      </div>

      <!-- Separate Indicators Container - außerhalb des Desktop Grids -->
      <div class="indicators-container">
        <div class="carousel-indicators">
          <button
            v-for="(item, index) in hygieneItems"
            :key="`indicator-${item.id}`"
            class="carousel-indicator"
            :class="currentTileIndex === index ? 'carousel-indicator-active' : 'carousel-indicator-inactive'"
            @click="goToHygiene(index)"
            :title="`Index: ${index}, Current: ${currentTileIndex}, Active: ${currentTileIndex === index}`"
          >
          </button>
        </div>
      </div>

      <!-- Mobile Layout (Vertical Carousel) - wird nur auf Mobile angezeigt -->
      <div class="mobile-carousel" v-if="isMobile">
        <div 
          class="carousel-container" 
          :style="carouselStyle"
          @touchstart="handleCarouselTouchStart"
          @touchmove="handleCarouselTouchMove"
          @touchend="handleCarouselTouchEnd"
          role="listbox"
          aria-label="Hygiene-Menü"
          tabindex="0"
        >
          <!-- DUSCHEN -->
          <div 
            class="carousel-tile"
            :class="currentTileIndex === 0 ? 'tile-active' : 'tile-inactive'"
            @click="selectHygiene('duschen')"
          >
            <div 
              class="tile-icon-container"
              :class="currentTileIndex === 0 ? 'icon-active' : 'icon-inactive'"
            >
              <div class="tile-emoji">🚿</div>
            </div>
            <div 
              class="tile-text"
              :class="currentTileIndex === 0 ? 'text-active' : 'text-inactive'"
              :style="currentTileIndex === 0 ? 'color: white !important;' : ''"
            >
              DUSCHEN
            </div>
          </div>

          <!-- BADEN -->
          <div 
            class="carousel-tile"
            :class="currentTileIndex === 1 ? 'tile-active' : 'tile-inactive'"
            @click="selectHygiene('baden')"
          >
            <div 
              class="tile-icon-container"
              :class="currentTileIndex === 1 ? 'icon-active' : 'icon-inactive'"
            >
              <div class="tile-emoji">🛁</div>
            </div>
            <div 
              class="tile-text"
              :class="currentTileIndex === 1 ? 'text-active' : 'text-inactive'"
              :style="currentTileIndex === 1 ? 'color: white !important;' : ''"
            >
              BADEN
            </div>
          </div>

          <!-- ZÄHNEPUTZEN -->
          <div 
            class="carousel-tile"
            :class="currentTileIndex === 2 ? 'tile-active' : 'tile-inactive'"
            @click="selectHygiene('zaehneputzen')"
          >
            <div 
              class="tile-icon-container"
              :class="currentTileIndex === 2 ? 'icon-active' : 'icon-inactive'"
            >
              <div class="tile-emoji">🦷</div>
            </div>
            <div 
              class="tile-text"
              :class="currentTileIndex === 2 ? 'text-active' : 'text-inactive'"
              :style="currentTileIndex === 2 ? 'color: white !important;' : ''"
            >
              ZÄHNEPUTZEN
            </div>
          </div>

          <!-- HAARE WASCHEN -->
          <div 
            class="carousel-tile"
            :class="currentTileIndex === 3 ? 'tile-active' : 'tile-inactive'"
            @click="selectHygiene('haare_waschen')"
          >
            <div 
              class="tile-icon-container"
              :class="currentTileIndex === 3 ? 'icon-active' : 'icon-inactive'"
            >
              <div class="tile-emoji">🧴</div>
            </div>
            <div 
              class="tile-text"
              :class="currentTileIndex === 3 ? 'text-active' : 'text-inactive'"
              :style="currentTileIndex === 3 ? 'color: white !important;' : ''"
            >
              HAARE WASCHEN
            </div>
          </div>

          <!-- RASIEREN -->
          <div 
            class="carousel-tile"
            :class="currentTileIndex === 4 ? 'tile-active' : 'tile-inactive'"
            @click="selectHygiene('rasieren')"
          >
            <div 
              class="tile-icon-container"
              :class="currentTileIndex === 4 ? 'icon-active' : 'icon-inactive'"
            >
              <div class="tile-emoji">🪒</div>
            </div>
            <div 
              class="tile-text"
              :class="currentTileIndex === 4 ? 'text-active' : 'text-inactive'"
              :style="currentTileIndex === 4 ? 'color: white !important;' : ''"
            >
              RASIEREN
            </div>
          </div>

          <!-- ZURÜCK -->
          <div 
            class="carousel-tile"
            :class="currentTileIndex === 5 ? 'tile-active' : 'tile-inactive'"
            @click="goToHygiene('/ich')"
          >
            <div 
              class="tile-icon-container"
              :class="currentTileIndex === 5 ? 'icon-active' : 'icon-inactive'"
            >
              <img 
                src="/back.svg" 
                alt="ZURÜCK" 
                class="tile-icon"
                :class="currentTileIndex === 5 ? 'icon-inverted' : ''"
              />
            </div>
            <div 
              class="tile-text"
              :class="currentTileIndex === 5 ? 'text-active' : 'text-inactive'"
              :style="currentTileIndex === 5 ? 'color: white !important;' : ''"
            >
              ZURÜCK
            </div>
          </div>
        </div>

        <!-- TTS-Indikator für Mobile -->
        <div class="tts-indicator" :class="{ 'tts-active': settingsStore.isTTSActive }">
          🔊
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import './HygieneView.css';
</style>