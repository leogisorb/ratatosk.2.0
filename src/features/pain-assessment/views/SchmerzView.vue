<script setup lang="ts">
import { useSchmerzViewLogic } from './SchmerzView.ts'
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
  schmerzItems,
  speakText,
  startAutoMode,
  pauseAutoMode,
  stopAutoMode,
  selectSchmerz,
  handleBlink,
  handleRightClick,
  settingsStore,
  faceRecognition
} = useSchmerzViewLogic()
</script>

<template>
  <div id="app">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content -->
    <main class="main-content">
      <!-- Grid Container - 3x2 Grid wie Ich-View -->
      <div class="grid-container">
        <!-- Kopf -->
        <div 
          class="menu-tile"
          :class="currentTileIndex === 0 ? 'tile-active' : 'tile-inactive'"
          @click="selectSchmerz('kopf')"
        >
          <div 
            class="tile-icon-container"
            :class="currentTileIndex === 0 ? 'icon-active' : 'icon-inactive'"
          >
            <img 
              src="/head.png" 
              alt="KOPF" 
              class="tile-icon"
              :class="currentTileIndex === 0 ? 'icon-inverted' : ''"
            />
          </div>
          <div 
            class="tile-text"
            :class="currentTileIndex === 0 ? 'text-active' : 'text-inactive'"
            :style="currentTileIndex === 0 ? 'color: white !important;' : ''"
          >
            KOPF
          </div>
        </div>

        <!-- Beine -->
        <div 
          class="menu-tile"
          :class="currentTileIndex === 1 ? 'tile-active' : 'tile-inactive'"
          @click="selectSchmerz('beine')"
        >
          <div 
            class="tile-icon-container"
            :class="currentTileIndex === 1 ? 'icon-active' : 'icon-inactive'"
          >
            <img 
              src="/leg.png" 
              alt="BEINE" 
              class="tile-icon"
              :class="currentTileIndex === 1 ? 'icon-inverted' : ''"
            />
          </div>
          <div 
            class="tile-text"
            :class="currentTileIndex === 1 ? 'text-active' : 'text-inactive'"
            :style="currentTileIndex === 1 ? 'color: white !important;' : ''"
          >
            BEINE
          </div>
        </div>

        <!-- Arme -->
        <div 
          class="menu-tile"
          :class="currentTileIndex === 2 ? 'tile-active' : 'tile-inactive'"
          @click="selectSchmerz('arme')"
        >
          <div 
            class="tile-icon-container"
            :class="currentTileIndex === 2 ? 'icon-active' : 'icon-inactive'"
          >
            <img 
              src="/elbow-2.png" 
              alt="ARME" 
              class="tile-icon"
              :class="currentTileIndex === 2 ? 'icon-inverted' : ''"
            />
          </div>
          <div 
            class="tile-text"
            :class="currentTileIndex === 2 ? 'text-active' : 'text-inactive'"
            :style="currentTileIndex === 2 ? 'color: white !important;' : ''"
          >
            ARME
          </div>
        </div>

        <!-- Torso -->
        <div 
          class="menu-tile"
          :class="currentTileIndex === 3 ? 'tile-active' : 'tile-inactive'"
          @click="selectSchmerz('torso')"
        >
          <div 
            class="tile-icon-container"
            :class="currentTileIndex === 3 ? 'icon-active' : 'icon-inactive'"
          >
            <img 
              src="/living.png" 
              alt="TORSO" 
              class="tile-icon"
              :class="currentTileIndex === 3 ? 'icon-inverted' : ''"
            />
          </div>
          <div 
            class="tile-text"
            :class="currentTileIndex === 3 ? 'text-active' : 'text-inactive'"
            :style="currentTileIndex === 3 ? 'color: white !important;' : ''"
          >
            TORSO
          </div>
        </div>

        <!-- Zurück -->
        <div 
          class="menu-tile"
          :class="currentTileIndex === 4 ? 'tile-active' : 'tile-inactive'"
          @click="selectSchmerz('zurueck')"
        >
          <div 
            class="tile-icon-container"
            :class="currentTileIndex === 4 ? 'icon-active' : 'icon-inactive'"
          >
            <img 
              src="/Goback.svg" 
              alt="ZURÜCK" 
              class="tile-icon"
              :class="currentTileIndex === 4 ? 'icon-inverted' : ''"
            />
          </div>
          <div 
            class="tile-text"
            :class="currentTileIndex === 4 ? 'text-active' : 'text-inactive'"
            :style="currentTileIndex === 4 ? 'color: white !important;' : ''"
          >
            ZURÜCK
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import './SchmerzView.css';
</style>