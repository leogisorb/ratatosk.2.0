<script setup lang="ts">
import { useArmeSchmerzViewLogic } from './ArmeSchmerzView.ts'
import AppHeader from '../../../shared/components/AppHeader.vue'

const {
  currentTileIndex,
  selectedArmBereich,
  isAutoMode,
  autoModeInterval,
  closedFrames,
  eyesClosed,
  isAutoModePaused,
  restartTimeout,
  blinkThreshold,
  lastBlinkTime,
  blinkCooldown,
  speechSynthesis,
  isTTSEnabled,
  armBereiche,
  speakText,
  startAutoMode,
  pauseAutoMode,
  stopAutoMode,
  selectArmBereich,
  handleFaceBlink,
  handleRightClick,
  settingsStore,
  faceRecognition
} = useArmeSchmerzViewLogic()
</script>

<template>
  <div class="arme-schmerz-app">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content - Zentriert -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- Ausgewähltes Arm-Bereich Item Anzeige -->
        <div class="selected-item-container">
          <div class="selected-item-text" style="font-size: 3.43rem; font-family: 'Source Code Pro', monospace; font-weight: 500;">
            Wählen Sie einen Arm-Bereich aus
          </div>
        </div>

        <!-- Arm-Bereiche Grid - 3 Zeilen à 4 Items -->
        <div class="arm-bereiche-grid">
          <!-- Zeile 1: Oberarm, Unterarm, Ellenbogen, Handgelenk -->
          <div class="arm-bereiche-row">
            <button
              v-for="(item, index) in armBereiche.slice(0, 4)"
              :key="item.id"
              @click="selectArmBereich(item.id)"
              class="arm-bereiche-item"
              :class="currentTileIndex === index ? 'active' : 'inactive'"
            >
              <img v-if="item.icon" :src="`/ratatosk.2.0/${item.icon}`" :alt="item.text" class="arm-bereiche-icon" />
              <span class="arm-bereiche-text">{{ item.text }}</span>
            </button>
              </div>
              
          <!-- Zeile 2: Hand, Finger, Schulter, Daumen -->
          <div class="arm-bereiche-row">
            <button
              v-for="(item, index) in armBereiche.slice(4, 8)"
              :key="item.id"
              @click="selectArmBereich(item.id)"
              class="arm-bereiche-item"
              :class="currentTileIndex === index + 4 ? 'active' : 'inactive'"
            >
              <img v-if="item.icon" :src="`/ratatosk.2.0/${item.icon}`" :alt="item.text" class="arm-bereiche-icon" />
              <span class="arm-bereiche-text">{{ item.text }}</span>
            </button>
          </div>

          <!-- Zeile 3: Achsel, Handrücken, Handfläche, Zurück -->
          <div class="arm-bereiche-row">
            <button
              v-for="(item, index) in armBereiche.slice(8, 12)"
              :key="item.id"
              @click="selectArmBereich(item.id)"
              class="arm-bereiche-item"
              :class="currentTileIndex === index + 8 ? 'active' : 'inactive'"
            >
              <img v-if="item.icon" :src="`/ratatosk.2.0/${item.icon}`" :alt="item.text" class="arm-bereiche-icon" />
              <span class="arm-bereiche-text">{{ item.text }}</span>
            </button>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>

<style scoped>
@import './ArmeSchmerzView.css';
</style>