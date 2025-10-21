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
      <!-- Grid Container - 3x2 Grid wie HomeView -->
      <div class="grid-container">
        <!-- Dynamic Menu Tiles -->
        <div 
          v-for="(item, index) in schmerzItems"
          :key="item.id"
          class="menu-tile"
          :class="currentTileIndex === index ? 'tile-active' : 'tile-inactive'"
          @click="selectSchmerz(item.id)"
        >
          <div 
            class="tile-icon-container"
            :class="currentTileIndex === index ? 'icon-active' : 'icon-inactive'"
          >
            <img 
              :src="item.icon" 
              :alt="item.title" 
              class="tile-icon"
              :class="currentTileIndex === index ? 'icon-inverted' : ''"
            />
          </div>
          <div 
            class="tile-text"
            :class="currentTileIndex === index ? 'text-active' : 'text-inactive'"
            :style="currentTileIndex === index ? 'color: white !important;' : ''"
          >
            {{ item.title }}
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import './SchmerzView.css';
</style>
