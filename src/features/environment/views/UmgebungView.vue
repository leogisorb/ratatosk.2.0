<script setup lang="ts">
import { useUmgebungViewLogic } from './UmgebungView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'

const {
  currentTileIndex,
  isAutoMode,
  autoModeInterval,
  closedFrames,
  eyesClosed,
  isAutoModePaused,
  blinkThreshold,
  lastBlinkTime,
  blinkCooldown,
  speechSynthesis,
  isTTSEnabled,
  umgebungItems,
  speakText,
  toggleTTS,
  startAutoMode,
  pauseAutoMode,
  stopAutoMode,
  selectUmgebungItem,
  handleBlink,
  handleRightClick,
  settingsStore,
  faceRecognition
} = useUmgebungViewLogic()
</script>

<template>
  <div id="app">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content -->
    <main class="main-content">
      <!-- Grid Container - 3x2 Grid wie SchmerzView -->
      <div class="grid-container">
        <!-- Bett -->
        <div 
          class="menu-tile"
          :class="currentTileIndex === 0 ? 'tile-active' : 'tile-inactive'"
          @click="selectUmgebungItem('bett')"
        >
          <div 
            class="tile-icon-container"
            :class="currentTileIndex === 0 ? 'icon-active' : 'icon-inactive'"
          >
            <img 
              src="/Schmerz.svg" 
              alt="BETT" 
              class="tile-icon"
              :class="currentTileIndex === 0 ? 'icon-inverted' : ''"
            />
          </div>
          <div 
            class="tile-text"
            :class="currentTileIndex === 0 ? 'text-active' : 'text-inactive'"
            :style="currentTileIndex === 0 ? 'color: white !important;' : ''"
          >
            BETT
          </div>
        </div>

        <!-- Zimmer -->
        <div 
          class="menu-tile"
          :class="currentTileIndex === 1 ? 'tile-active' : 'tile-inactive'"
          @click="selectUmgebungItem('zimmer')"
        >
          <div 
            class="tile-icon-container"
            :class="currentTileIndex === 1 ? 'icon-active' : 'icon-inactive'"
          >
            <img 
              src="/Umgebung.svg" 
              alt="ZIMMER" 
              class="tile-icon"
              :class="currentTileIndex === 1 ? 'icon-inverted' : ''"
            />
          </div>
          <div 
            class="tile-text"
            :class="currentTileIndex === 1 ? 'text-active' : 'text-inactive'"
            :style="currentTileIndex === 1 ? 'color: white !important;' : ''"
          >
            ZIMMER
          </div>
        </div>

        <!-- Gegenstände -->
        <div 
          class="menu-tile"
          :class="currentTileIndex === 2 ? 'tile-active' : 'tile-inactive'"
          @click="selectUmgebungItem('gegenstaende')"
        >
          <div 
            class="tile-icon-container"
            :class="currentTileIndex === 2 ? 'icon-active' : 'icon-inactive'"
          >
            <img 
              src="/house-chimney.svg" 
              alt="GEGENSTÄNDE" 
              class="tile-icon"
              :class="currentTileIndex === 2 ? 'icon-inverted' : ''"
            />
          </div>
          <div 
            class="tile-text"
            :class="currentTileIndex === 2 ? 'text-active' : 'text-inactive'"
            :style="currentTileIndex === 2 ? 'color: white !important;' : ''"
          >
            GEGENSTÄNDE
          </div>
        </div>

        <!-- Zurück -->
        <div 
          class="menu-tile"
          :class="currentTileIndex === 3 ? 'tile-active' : 'tile-inactive'"
          @click="selectUmgebungItem('zurueck')"
        >
          <div 
            class="tile-icon-container"
            :class="currentTileIndex === 3 ? 'icon-active' : 'icon-inactive'"
          >
            <img 
              src="/Goback.svg" 
              alt="ZURÜCK" 
              class="tile-icon"
              :class="currentTileIndex === 3 ? 'icon-inverted' : ''"
            />
          </div>
          <div 
            class="tile-text"
            :class="currentTileIndex === 3 ? 'text-active' : 'text-inactive'"
            :style="currentTileIndex === 3 ? 'color: white !important;' : ''"
          >
            ZURÜCK
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import './UmgebungView.css';
</style>
