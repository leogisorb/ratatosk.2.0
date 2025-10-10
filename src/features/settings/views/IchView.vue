<script setup lang="ts">
// Import external JavaScript logic
import { useIchViewLogic } from './IchView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'

// Use the composable function
const {
  currentMenu,
  currentTileIndex,
  isAutoMode,
  closedFrames,
  eyesClosed,
  blinkThreshold,
  lastBlinkTime,
  blinkCooldown,
  menuItems,
  appClasses,
  speakText,
  selectMenu,
  formatTime,
  handleBlink,
  handleRightClick,
  settingsStore,
  faceRecognition
} = useIchViewLogic()
</script>

<template>
  <div id="app" :class="appClasses">
    <!-- App Header -->
    <AppHeader />

    <!-- Hauptinhalt -->
    <main class="main-content">
      <!-- Desktop Layout (3×2 Grid) - identisch mit HomeView -->
      <div class="grid-container">
        <!-- ERNÄHRUNG -->
        <div 
          class="menu-tile"
          :class="currentTileIndex === 0 ? 'tile-active' : 'tile-inactive'"
          @click="selectMenu('ernaehrung')"
        >
          <div 
            class="tile-icon-container"
            :class="currentTileIndex === 0 ? 'icon-active' : 'icon-inactive'"
            >
              <img 
                src="/hamburger-soda.svg" 
                alt="ERNÄHRUNG" 
              class="tile-icon"
              :class="currentTileIndex === 0 ? 'icon-inverted' : ''"
              />
            </div>
            <div 
            class="tile-text"
            :class="currentTileIndex === 0 ? 'text-active' : 'text-inactive'"
            :style="currentTileIndex === 0 ? 'color: white !important;' : ''"
            >
              ERNÄHRUNG
            </div>
          </div>

          <!-- GEFÜHLE -->
          <div 
          class="menu-tile"
          :class="currentTileIndex === 1 ? 'tile-active' : 'tile-inactive'"
            @click="selectMenu('gefuehle')"
          >
            <div 
            class="tile-icon-container"
            :class="currentTileIndex === 1 ? 'icon-active' : 'icon-inactive'"
            >
              <img 
                src="/face-smile-upside-down.svg" 
                alt="GEFÜHLE" 
              class="tile-icon"
              :class="currentTileIndex === 1 ? 'icon-inverted' : ''"
              />
            </div>
            <div 
            class="tile-text"
            :class="currentTileIndex === 1 ? 'text-active' : 'text-inactive'"
            :style="currentTileIndex === 1 ? 'color: white !important;' : ''"
            >
              GEFÜHLE
            </div>
          </div>

          <!-- KLEIDUNG -->
          <div 
          class="menu-tile"
          :class="currentTileIndex === 2 ? 'tile-active' : 'tile-inactive'"
            @click="selectMenu('kleidung')"
          >
            <div 
            class="tile-icon-container"
            :class="currentTileIndex === 2 ? 'icon-active' : 'icon-inactive'"
            >
              <img 
                src="/clothes-hanger.svg" 
                alt="KLEIDUNG" 
              class="tile-icon"
              :class="currentTileIndex === 2 ? 'icon-inverted' : ''"
              />
            </div>
            <div 
            class="tile-text"
            :class="currentTileIndex === 2 ? 'text-active' : 'text-inactive'"
            :style="currentTileIndex === 2 ? 'color: white !important;' : ''"
            >
              KLEIDUNG
            </div>
          </div>

          <!-- HYGIENE -->
          <div 
          class="menu-tile"
          :class="currentTileIndex === 3 ? 'tile-active' : 'tile-inactive'"
            @click="selectMenu('hygiene')"
          >
            <div 
            class="tile-icon-container"
            :class="currentTileIndex === 3 ? 'icon-active' : 'icon-inactive'"
            >
              <img 
                src="/bath.svg" 
                alt="HYGIENE" 
              class="tile-icon"
              :class="currentTileIndex === 3 ? 'icon-inverted' : ''"
              />
            </div>
            <div 
            class="tile-text"
            :class="currentTileIndex === 3 ? 'text-active' : 'text-inactive'"
            :style="currentTileIndex === 3 ? 'color: white !important;' : ''"
            >
              HYGIENE
            </div>
          </div>

          <!-- BEWEGUNG -->
          <div 
          class="menu-tile"
          :class="currentTileIndex === 4 ? 'tile-active' : 'tile-inactive'"
            @click="selectMenu('bewegung')"
          >
            <div 
            class="tile-icon-container"
            :class="currentTileIndex === 4 ? 'icon-active' : 'icon-inactive'"
            >
              <img 
                src="/barefoot.svg" 
                alt="BEWEGUNG" 
              class="tile-icon"
              :class="currentTileIndex === 4 ? 'icon-inverted' : ''"
              />
            </div>
            <div 
            class="tile-text"
            :class="currentTileIndex === 4 ? 'text-active' : 'text-inactive'"
            :style="currentTileIndex === 4 ? 'color: white !important;' : ''"
            >
              BEWEGUNG
            </div>
          </div>

          <!-- ZURÜCK -->
          <div 
          class="menu-tile"
          :class="currentTileIndex === 5 ? 'tile-active' : 'tile-inactive'"
            @click="selectMenu('zurueck')"
          >
            <div 
            class="tile-icon-container"
            :class="currentTileIndex === 5 ? 'icon-active' : 'icon-inactive'"
            >
              <img 
                src="/zurueck.svg" 
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
    </main>
  </div>
</template>

<style scoped>
@import './IchView.css';
</style>