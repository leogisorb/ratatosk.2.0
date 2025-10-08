<script setup lang="ts">
// Import external JavaScript logic
import { useHomeViewLogic } from './HomeView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'

// Use the composable function
const {
  currentMenu,
  currentTileIndex,
  isAutoMode,
  autoModeInterval,
  closedFrames,
  eyesClosed,
  isAutoModePaused,
  blinkThreshold,
  lastBlinkTime,
  blinkCooldown,
  isTTSEnabled,
  isVolumeEnabled,
  isSpeaking,
  menuItems,
  appClasses,
  speakText,
  startAutoMode,
  pauseAutoMode,
  resumeAutoMode,
  stopAutoMode,
  enableTTSOnInteraction,
  selectMenu,
  formatTime,
  handleBlink,
  handleRightClick,
  handleVolumeToggle,
  settingsStore,
  communicationStore,
  faceRecognition,
  ttsBlockedByBrowser
} = useHomeViewLogic()
</script>

<template>
  <div id="app" :class="appClasses">
    <!-- App Header -->
    <AppHeader />

    <!-- Hauptinhalt -->
    <main class="main-content">
        
        <!-- TTS Status Indicator -->
        <div v-if="ttsBlockedByBrowser" class="tts-status-indicator">
          <div class="tts-status-content">
            <span class="tts-status-icon">🔇</span>
            <span class="tts-status-text">TTS blockiert - Klicken Sie irgendwo um Audio zu aktivieren</span>
          </div>
        </div>
        
        <!-- Desktop Layout (3×2 Grid) - wird auf allen Bildschirmen angezeigt -->
        <div class="grid-container">
            <!-- WARNGERÄUSCH -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 0 ? 'tile-active' : 'tile-inactive'"
              @click="selectMenu('warning')"
            >
              <div 
                class="tile-icon-container"
                :class="currentTileIndex === 0 ? 'icon-active' : 'icon-inactive'"
              >
                <img 
                  src="/bell.svg" 
                  alt="WARNGERÄUSCH" 
                  class="tile-icon"
                  :class="currentTileIndex === 0 ? 'icon-inverted' : ''"
                />
              </div>
              <div 
                class="tile-text"
                :class="currentTileIndex === 0 ? 'text-active' : 'text-inactive'"
                :style="currentTileIndex === 0 ? 'color: white !important;' : ''"
              >
                WARNGERÄUSCH
              </div>
            </div>

            <!-- UNTERHALTEN -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 1 ? 'tile-active' : 'tile-inactive'"
              @click="selectMenu('communication')"
            >
              <div 
                class="tile-icon-container"
                :class="currentTileIndex === 1 ? 'icon-active' : 'icon-inactive'"
              >
                <img 
                  src="/comment-dots.svg" 
                  alt="UNTERHALTEN" 
                  class="tile-icon"
                  :class="currentTileIndex === 1 ? 'icon-inverted' : ''"
                />
              </div>
              <div 
                class="tile-text"
                :class="currentTileIndex === 1 ? 'text-active' : 'text-inactive'"
                :style="currentTileIndex === 1 ? 'color: white !important;' : ''"
              >
                UNTERHALTEN
              </div>
            </div>

            <!-- ICH -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 2 ? 'tile-active' : 'tile-inactive'"
              @click="selectMenu('profile')"
            >
              <div 
                class="tile-icon-container"
                :class="currentTileIndex === 2 ? 'icon-active' : 'icon-inactive'"
              >
                <img 
                  src="/user.svg" 
                  alt="ICH" 
                  class="tile-icon"
                  :class="currentTileIndex === 2 ? 'icon-inverted' : ''"
                />
              </div>
              <div 
                class="tile-text"
                :class="currentTileIndex === 2 ? 'text-active' : 'text-inactive'"
                :style="currentTileIndex === 2 ? 'color: white !important;' : ''"
              >
                ICH
              </div>
            </div>

            <!-- SCHMERZEN -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 3 ? 'tile-active' : 'tile-inactive'"
              @click="selectMenu('pain')"
            >
              <div 
                class="tile-icon-container"
                :class="currentTileIndex === 3 ? 'icon-active' : 'icon-inactive'"
              >
                <img 
                  src="/headache.svg" 
                  alt="SCHMERZEN" 
                  class="tile-icon"
                  :class="currentTileIndex === 3 ? 'icon-inverted' : ''"
                />
              </div>
              <div 
                class="tile-text"
                :class="currentTileIndex === 3 ? 'text-active' : 'text-inactive'"
                :style="currentTileIndex === 3 ? 'color: white !important;' : ''"
              >
                SCHMERZEN
              </div>
            </div>

            <!-- UMGEBUNG -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 4 ? 'tile-active' : 'tile-inactive'"
              @click="selectMenu('environment')"
            >
              <div 
                class="tile-icon-container"
                :class="currentTileIndex === 4 ? 'icon-active' : 'icon-inactive'"
              >
                <img 
                  src="/house-chimney.svg" 
                  alt="UMGEBUNG" 
                  class="tile-icon"
                  :class="currentTileIndex === 4 ? 'icon-inverted' : ''"
                />
              </div>
              <div 
                class="tile-text"
                :class="currentTileIndex === 4 ? 'text-active' : 'text-inactive'"
                :style="currentTileIndex === 4 ? 'color: white !important;' : ''"
              >
                UMGEBUNG
              </div>
            </div>

            <!-- EINSTELLUNGEN -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 5 ? 'tile-active' : 'tile-inactive'"
              @click="selectMenu('settings')"
            >
              <div 
                class="tile-icon-container"
                :class="currentTileIndex === 5 ? 'icon-active' : 'icon-inactive'"
              >
                <img 
                  src="/settings-sliders.svg" 
                  alt="EINSTELLUNGEN" 
                  class="tile-icon"
                  :class="currentTileIndex === 5 ? 'icon-inverted' : ''"
                />
              </div>
              <div 
                class="tile-text"
                :class="currentTileIndex === 5 ? 'text-active' : 'text-inactive'"
                :style="currentTileIndex === 5 ? 'color: white !important;' : ''"
              >
                EINSTELLUNGEN
              </div>
            </div>
        </div>


    </main>
  </div>
</template>

<style scoped>
@import './HomeView.css';
</style>