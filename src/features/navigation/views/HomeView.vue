<script setup lang="ts">
// Import external JavaScript logic
import { useHomeViewLogic } from './HomeView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'

// Import Assets
import bellIcon from '@/assets/icons/bell.svg'
import commentDotsIcon from '@/assets/icons/comment-dots.svg'
import userIcon from '@/assets/icons/user.svg'
import headacheIcon from '@/assets/icons/headache.svg'
import houseChimneyIcon from '@/assets/icons/house-chimney.svg'
import settingsSlidersIcon from '@/assets/icons/settings-sliders.svg'

// Use the composable function
const {
  currentMenu,
  currentTileIndex,
  isAutoMode,
  userInteracted,
  // Mobile Carousel State
  isMobile,
  currentItem,
  itemCount,
  autoScrollState,
  touchState,
  isSwipe,
  swipeDirection,
  // TTS functions
  speakText,
  menuItems,
  appClasses,
  startAutoMode,
  stopAutoMode,
  // Mobile Carousel functions
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  // Karussell-Navigation
  navigateToIndex,
  navigateNext,
  navigatePrevious,
  // Keyboard Navigation
  handleKeyboardNavigation,
  selectMenu,
  formatTime,
  handleFaceBlink,
  handleRightClick,
  handleVolumeToggle,
  settingsStore,
  communicationStore,
  faceRecognition
} = useHomeViewLogic()
</script>

<template>
  <div id="app" :class="appClasses" class="home-view">
    <!-- App Header -->
    <AppHeader />

    <!-- Hauptinhalt -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- Desktop Layout (3×2 Grid) - wird auf Desktop und Landscape angezeigt -->
        <div class="grid-container desktop-grid" v-if="!isMobile">
          <!-- WARNGERÄUSCH -->
          <div 
            class="menu-tile"
            :class="currentTileIndex === 0 ? 'tile-active' : 'tile-inactive'"
            @click="currentTileIndex === 0 ? selectMenu('warning') : null"
            @contextmenu="currentTileIndex === 0 ? handleRightClick : null"
          >
            <div class="tile-icon-container">
              <img 
                :src="bellIcon" 
                alt="WARNGERÄUSCH" 
                class="tile-icon"
                :class="currentTileIndex === 0 ? 'icon-inverted' : ''"
              />
            </div>
            <div class="tile-text">
              WARNGERÄUSCH
            </div>
          </div>

          <!-- UNTERHALTEN -->
          <div 
            class="menu-tile"
            :class="currentTileIndex === 1 ? 'tile-active' : 'tile-inactive'"
            @click="currentTileIndex === 1 ? selectMenu('communication') : null"
            @contextmenu="currentTileIndex === 1 ? handleRightClick : null"
          >
            <div class="tile-icon-container">
              <img 
                :src="commentDotsIcon" 
                alt="UNTERHALTEN" 
                class="tile-icon"
                :class="currentTileIndex === 1 ? 'icon-inverted' : ''"
              />
            </div>
            <div class="tile-text">
              UNTERHALTEN
            </div>
          </div>

          <!-- ICH -->
          <div 
            class="menu-tile"
            :class="currentTileIndex === 2 ? 'tile-active' : 'tile-inactive'"
            @click="currentTileIndex === 2 ? selectMenu('ich') : null"
            @contextmenu="currentTileIndex === 2 ? handleRightClick : null"
          >
            <div class="tile-icon-container">
              <img 
                :src="userIcon" 
                alt="ICH" 
                class="tile-icon"
                :class="currentTileIndex === 2 ? 'icon-inverted' : ''"
              />
            </div>
            <div class="tile-text">
              ICH
            </div>
          </div>

          <!-- SCHMERZEN -->
          <div 
            class="menu-tile"
            :class="currentTileIndex === 3 ? 'tile-active' : 'tile-inactive'"
            @click="currentTileIndex === 3 ? selectMenu('pain') : null"
            @contextmenu="currentTileIndex === 3 ? handleRightClick : null"
          >
            <div class="tile-icon-container">
              <img 
                :src="headacheIcon" 
                alt="SCHMERZEN" 
                class="tile-icon"
                :class="currentTileIndex === 3 ? 'icon-inverted' : ''"
              />
            </div>
            <div class="tile-text">
              SCHMERZEN
            </div>
          </div>

          <!-- UMGEBUNG -->
          <div 
            class="menu-tile"
            :class="currentTileIndex === 4 ? 'tile-active' : 'tile-inactive'"
            @click="currentTileIndex === 4 ? selectMenu('environment') : null"
            @contextmenu="currentTileIndex === 4 ? handleRightClick : null"
          >
            <div class="tile-icon-container">
              <img 
                :src="houseChimneyIcon" 
                alt="UMGEBUNG" 
                class="tile-icon"
                :class="currentTileIndex === 4 ? 'icon-inverted' : ''"
              />
            </div>
            <div class="tile-text">
              UMGEBUNG
            </div>
          </div>

          <!-- EINSTELLUNGEN -->
          <div 
            class="menu-tile"
            :class="currentTileIndex === 5 ? 'tile-active' : 'tile-inactive'"
            @click="currentTileIndex === 5 ? selectMenu('settings') : null"
            @contextmenu="currentTileIndex === 5 ? handleRightClick : null"
          >
            <div class="tile-icon-container">
              <img 
                :src="settingsSlidersIcon" 
                alt="EINSTELLUNGEN" 
                class="tile-icon"
                :class="currentTileIndex === 5 ? 'icon-inverted' : ''"
              />
            </div>
            <div class="tile-text">
              EINSTELLUNGEN
            </div>
          </div>
        </div>

        <!-- Mobile Layout (Vertical Carousel) - wird nur auf Mobile Portrait angezeigt -->
        <div class="mobile-carousel" v-else>
          <div 
            class="carousel-container" 
            @touchstart="handleTouchStart"
            @touchmove="handleTouchMove"
            @touchend="handleTouchEnd"
            role="listbox"
            aria-label="Hauptmenü"
            tabindex="0"
            @keydown="handleKeyboardNavigation"
          >
            <!-- WARNGERÄUSCH -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 0 ? 'tile-active' : 'tile-inactive'"
              :style="{ '--offset': 0 - currentTileIndex }"
              @click="currentTileIndex === 0 ? selectMenu('warning') : null"
              @contextmenu="currentTileIndex === 0 ? handleRightClick : null"
            >
              <div class="tile-icon-container">
                <img 
                  :src="bellIcon" 
                  alt="WARNGERÄUSCH" 
                  class="tile-icon"
                  :class="currentTileIndex === 0 ? 'icon-inverted' : ''"
                />
              </div>
              <div class="tile-text">
                WARNGERÄUSCH
              </div>
            </div>

            <!-- UNTERHALTEN -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 1 ? 'tile-active' : 'tile-inactive'"
              :style="{ '--offset': 1 - currentTileIndex }"
              @click="currentTileIndex === 1 ? selectMenu('communication') : null"
              @contextmenu="currentTileIndex === 1 ? handleRightClick : null"
            >
              <div class="tile-icon-container">
                <img 
                  :src="commentDotsIcon" 
                  alt="UNTERHALTEN" 
                  class="tile-icon"
                  :class="currentTileIndex === 1 ? 'icon-inverted' : ''"
                />
              </div>
              <div class="tile-text">
                UNTERHALTEN
              </div>
            </div>

            <!-- ICH -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 2 ? 'tile-active' : 'tile-inactive'"
              :style="{ '--offset': 2 - currentTileIndex }"
              @click="currentTileIndex === 2 ? selectMenu('ich') : null"
              @contextmenu="currentTileIndex === 2 ? handleRightClick : null"
            >
              <div class="tile-icon-container">
                <img 
                  :src="userIcon" 
                  alt="ICH" 
                  class="tile-icon"
                  :class="currentTileIndex === 2 ? 'icon-inverted' : ''"
                />
              </div>
              <div class="tile-text">
                ICH
              </div>
            </div>

            <!-- SCHMERZEN -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 3 ? 'tile-active' : 'tile-inactive'"
              :style="{ '--offset': 3 - currentTileIndex }"
              @click="currentTileIndex === 3 ? selectMenu('pain') : null"
              @contextmenu="currentTileIndex === 3 ? handleRightClick : null"
            >
              <div class="tile-icon-container">
                <img 
                  :src="headacheIcon" 
                  alt="SCHMERZEN" 
                  class="tile-icon"
                  :class="currentTileIndex === 3 ? 'icon-inverted' : ''"
                />
              </div>
              <div class="tile-text">
                SCHMERZEN
              </div>
            </div>

            <!-- UMGEBUNG -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 4 ? 'tile-active' : 'tile-inactive'"
              :style="{ '--offset': 4 - currentTileIndex }"
              @click="currentTileIndex === 4 ? selectMenu('environment') : null"
              @contextmenu="currentTileIndex === 4 ? handleRightClick : null"
            >
              <div class="tile-icon-container">
                <img 
                  :src="houseChimneyIcon" 
                  alt="UMGEBUNG" 
                  class="tile-icon"
                  :class="currentTileIndex === 4 ? 'icon-inverted' : ''"
                />
              </div>
              <div class="tile-text">
                UMGEBUNG
              </div>
            </div>

            <!-- EINSTELLUNGEN -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 5 ? 'tile-active' : 'tile-inactive'"
              :style="{ '--offset': 5 - currentTileIndex }"
              @click="currentTileIndex === 5 ? selectMenu('settings') : null"
              @contextmenu="currentTileIndex === 5 ? handleRightClick : null"
            >
              <div class="tile-icon-container">
                <img 
                  :src="settingsSlidersIcon" 
                  alt="EINSTELLUNGEN" 
                  class="tile-icon"
                  :class="currentTileIndex === 5 ? 'icon-inverted' : ''"
                />
              </div>
              <div class="tile-text">
                EINSTELLUNGEN
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import './HomeView.css';
</style>