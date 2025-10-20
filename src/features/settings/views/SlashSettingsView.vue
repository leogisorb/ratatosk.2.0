<script setup lang="ts">
// Import external JavaScript logic
import { useSlashSettingsLogic } from './SlashSettingsView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'

// Use the composable function
const {
  currentTileIndex,
  isAutoMode,
  closedFrames,
  eyesClosed,
  blinkThreshold,
  lastBlinkTime,
  blinkCooldown,
  userInteracted,
  // TTS functions
  speakText,
  settingsItems,
  appClasses,
  startAutoMode,
  stopAutoMode,
  selectSetting,
  formatTime,
  handleFaceBlink,
  handleRightClick,
  handleVolumeToggle,
  settingsStore,
  faceRecognition
} = useSlashSettingsLogic()
</script>

<template>
  <div id="app" :class="appClasses">
    <!-- App Header -->
    <AppHeader />

    <!-- Hauptinhalt -->
    <main class="main-content">
        
        <!-- Desktop Layout (3×2 Grid) - wird auf allen Bildschirmen angezeigt -->
        <div class="grid-container">
            <!-- LEUCHTDAUER -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 0 ? 'tile-active' : 'tile-inactive'"
              @click="selectSetting('leuchtdauer')"
            >
              <div 
                class="tile-icon-container"
                :class="currentTileIndex === 0 ? 'icon-active' : 'icon-inactive'"
              >
                <img 
                  src="/settings-sliders.svg" 
                  alt="LEUCHTDAUER" 
                  class="tile-icon"
                  :class="currentTileIndex === 0 ? 'icon-inverted' : ''"
                />
              </div>
              <div 
                class="tile-text"
                :class="currentTileIndex === 0 ? 'text-active' : 'text-inactive'"
                :style="currentTileIndex === 0 ? 'color: white !important;' : ''"
              >
                LEUCHTDAUER
              </div>
            </div>

            <!-- BLITZDAUER -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 1 ? 'tile-active' : 'tile-inactive'"
              @click="selectSetting('blitzdauer')"
            >
              <div 
                class="tile-icon-container"
                :class="currentTileIndex === 1 ? 'icon-active' : 'icon-inactive'"
              >
                <img 
                  src="/settings-sliders.svg" 
                  alt="BLITZDAUER" 
                  class="tile-icon"
                  :class="currentTileIndex === 1 ? 'icon-inverted' : ''"
                />
              </div>
              <div 
                class="tile-text"
                :class="currentTileIndex === 1 ? 'text-active' : 'text-inactive'"
                :style="currentTileIndex === 1 ? 'color: white !important;' : ''"
              >
                BLITZDAUER
              </div>
            </div>

            <!-- FARBMODUS -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 2 ? 'tile-active' : 'tile-inactive'"
              @click="selectSetting('farbmodus')"
            >
              <div 
                class="tile-icon-container"
                :class="currentTileIndex === 2 ? 'icon-active' : 'icon-inactive'"
              >
                <img 
                  src="/settings-sliders.svg" 
                  alt="FARBMODUS" 
                  class="tile-icon"
                  :class="currentTileIndex === 2 ? 'icon-inverted' : ''"
                />
              </div>
              <div 
                class="tile-text"
                :class="currentTileIndex === 2 ? 'text-active' : 'text-inactive'"
                :style="currentTileIndex === 2 ? 'color: white !important;' : ''"
              >
                FARBMODUS
              </div>
            </div>

            <!-- KAMERA -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 3 ? 'tile-active' : 'tile-inactive'"
              @click="selectSetting('kamera')"
            >
              <div 
                class="tile-icon-container"
                :class="currentTileIndex === 3 ? 'icon-active' : 'icon-inactive'"
              >
                <img 
                  src="/settings-sliders.svg" 
                  alt="KAMERA" 
                  class="tile-icon"
                  :class="currentTileIndex === 3 ? 'icon-inverted' : ''"
                />
              </div>
              <div 
                class="tile-text"
                :class="currentTileIndex === 3 ? 'text-active' : 'text-inactive'"
                :style="currentTileIndex === 3 ? 'color: white !important;' : ''"
              >
                KAMERA
              </div>
            </div>

            <!-- KAMERAPOSITIONEN -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 4 ? 'tile-active' : 'tile-inactive'"
              @click="selectSetting('kamerapositionen')"
            >
              <div 
                class="tile-icon-container"
                :class="currentTileIndex === 4 ? 'icon-active' : 'icon-inactive'"
              >
                <img 
                  src="/settings-sliders.svg" 
                  alt="KAMERAPOSITIONEN" 
                  class="tile-icon"
                  :class="currentTileIndex === 4 ? 'icon-inverted' : ''"
                />
              </div>
              <div 
                class="tile-text"
                :class="currentTileIndex === 4 ? 'text-active' : 'text-inactive'"
                :style="currentTileIndex === 4 ? 'color: white !important;' : ''"
              >
                KAMERAPOSITIONEN
              </div>
            </div>

            <!-- IMPRESSUM -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 5 ? 'tile-active' : 'tile-inactive'"
              @click="selectSetting('impressum')"
            >
              <div 
                class="tile-icon-container"
                :class="currentTileIndex === 5 ? 'icon-active' : 'icon-inactive'"
              >
                <img 
                  src="/settings-sliders.svg" 
                  alt="IMPRESSUM" 
                  class="tile-icon"
                  :class="currentTileIndex === 5 ? 'icon-inverted' : ''"
                />
              </div>
              <div 
                class="tile-text"
                :class="currentTileIndex === 5 ? 'text-active' : 'text-inactive'"
                :style="currentTileIndex === 5 ? 'color: white !important;' : ''"
              >
                IMPRESSUM
              </div>
            </div>
        </div>

    </main>
  </div>
</template>

<style scoped>
/* Verwende die globalen Styles aus main.css */
</style>
