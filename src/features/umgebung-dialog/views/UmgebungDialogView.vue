<template>
  <div id="app" class="umgebung-dialog">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content -->
    <main class="main-content">
      <div class="content-wrapper">
        
        <!-- Main View: Umgebung Region Selection -->
        <div v-if="state === 'mainView'">
          <div class="main-title">
            {{ title }}
          </div>

          <div class="grid-container">
            <!-- Dynamic Menu Tiles -->
            <div 
              v-for="(region, index) in items"
              :key="region.id"
              class="menu-tile"
              :class="[
                autoMode.index.value === index ? 'tile-active' : 'tile-inactive',
                region.id === dict.ID_BACK ? 'back-tile' : ''
              ]"
              @click="autoMode.index.value === index ? (region.id === dict.ID_BACK ? goBack() : selectMainRegion(String(region.id))) : null"
              @contextmenu.prevent="autoMode.index.value === index ? null : null"
            >
              <div 
                class="tile-icon-container"
                :class="autoMode.index.value === index ? 'icon-active' : 'icon-inactive'"
              >
                <img 
                  v-if="'icon' in region && region.icon" 
                  :src="String(region.icon)" 
                  :alt="region.title" 
                  class="tile-icon"
                  :class="autoMode.index.value === index ? 'icon-inverted' : ''"
                />
              </div>
              <div 
                class="tile-text"
                :class="autoMode.index.value === index ? 'text-active' : 'text-inactive'"
              >
                {{ region.title }}
              </div>
            </div>
          </div>
        </div>

        <!-- Sub Region View -->
        <div v-if="state === 'subRegionView'">
          <div class="main-title">
            {{ title }}
          </div>

          <!-- Karussell Wrapper für vertikale Zentrierung -->
          <div class="carousel-wrapper">
            <!-- Karussell Container -->
            <div class="carousel-container">
              <!-- Karussell Content -->
              <div class="carousel-content">
                <div 
                  v-for="(subRegion, index) in items"
                  :key="subRegion.id"
                  class="carousel-item"
                  :class="autoMode.index.value === index ? 'carousel-item-active' : 'carousel-item-inactive'"
                  :style="{
                    '--offset': index - autoMode.index.value,
                    '--rotation': (index < autoMode.index.value ? -20 : index > autoMode.index.value ? 20 : 0) + 'deg'
                  }"
                  @click="autoMode.index.value === index ? selectSubRegion(String(subRegion.id)) : null"
                  @contextmenu.prevent="autoMode.index.value === index ? null : null"
                >
                  <div class="carousel-item-content">
                    <div 
                      class="tile-icon-container"
                      :class="autoMode.index.value === index ? 'icon-active' : 'icon-inactive'"
                    >
                      <img 
                        v-if="'icon' in subRegion && subRegion.icon && !subRegion.emoji" 
                        :src="String(subRegion.icon)" 
                        :alt="subRegion.title" 
                        class="tile-icon"
                        :class="autoMode.index.value === index ? 'icon-inverted' : ''"
                      />
                      <div 
                        v-if="'emoji' in subRegion && subRegion.emoji" 
                        class="tile-emoji"
                        :class="autoMode.index.value === index ? 'emoji-active' : 'emoji-inactive'"
                      >
                        {{ subRegion.emoji }}
                      </div>
                    </div>
                    <div 
                      class="tile-text"
                      :class="autoMode.index.value === index ? 'text-active' : 'text-inactive'"
                    >
                      {{ subRegion.title }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Karussell Indicators -->
          <div class="carousel-indicators">
            <button 
              v-for="(subRegion, index) in items"
              :key="`indicator-${subRegion.id}`"
              class="carousel-indicator"
              :class="autoMode.index.value === index ? 'carousel-indicator-active' : 'carousel-indicator-inactive'"
            >
            </button>
          </div>
        </div>

        <!-- Sub-Sub Region View (Verben) -->
        <div v-if="state === 'subSubRegionView'">
          <div class="main-title">
            {{ title }}
          </div>

          <!-- Karussell Wrapper für vertikale Zentrierung -->
          <div class="carousel-wrapper">
            <!-- Karussell Container -->
            <div class="carousel-container">
              <!-- Karussell Content -->
              <div class="carousel-content">
                <div 
                  v-for="(subSubRegion, index) in items"
                  :key="subSubRegion.id"
                  class="carousel-item"
                  :class="autoMode.index.value === index ? 'carousel-item-active' : 'carousel-item-inactive'"
                  :style="{
                    '--offset': index - autoMode.index.value,
                    '--rotation': (index < autoMode.index.value ? -20 : index > autoMode.index.value ? 20 : 0) + 'deg'
                  }"
                  @click="autoMode.index.value === index ? selectSubSubRegion(String(subSubRegion.id)) : null"
                  @contextmenu.prevent="autoMode.index.value === index ? null : null"
                >
                  <div class="carousel-item-content">
                    <div 
                      class="tile-icon-container"
                      :class="autoMode.index.value === index ? 'icon-active' : 'icon-inactive'"
                    >
                      <img 
                        v-if="'icon' in subSubRegion && subSubRegion.icon && !subSubRegion.emoji" 
                        :src="String(subSubRegion.icon)" 
                        :alt="subSubRegion.title" 
                        class="tile-icon"
                        :class="autoMode.index.value === index ? 'icon-inverted' : ''"
                      />
                      <div 
                        v-if="'emoji' in subSubRegion && subSubRegion.emoji" 
                        class="tile-emoji"
                        :class="autoMode.index.value === index ? 'emoji-active' : 'emoji-inactive'"
                      >
                        {{ subSubRegion.emoji }}
                      </div>
                    </div>
                    <div 
                      class="tile-text"
                      :class="autoMode.index.value === index ? 'text-active' : 'text-inactive'"
                    >
                      {{ subSubRegion.title }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Karussell Indicators -->
          <div class="carousel-indicators">
            <button 
              v-for="(subSubRegion, index) in items"
              :key="`indicator-${subSubRegion.id}`"
              class="carousel-indicator"
              :class="autoMode.index.value === index ? 'carousel-indicator-active' : 'carousel-indicator-inactive'"
            >
            </button>
          </div>
        </div>

        <!-- Confirmation View -->
        <div v-if="state === 'confirmation'">
          <div class="confirmation-container">
            <div class="confirmation-title">{{ title }}</div>
            <div class="confirmation-text">{{ confirmationText }}</div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useUmgebungDialogMachine } from '../composables/useUmgebungDialogMachine'
import { useUmgebungDictionary } from '../composables/useUmgebungDictionary'
import { useTTS } from '../composables/useTTS'
import { useInputManager } from '../../../shared/composables/useInputManager'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import AppHeader from '../../../shared/components/AppHeader.vue'

// Dialog Machine
const machine = useUmgebungDialogMachine()
const dict = useUmgebungDictionary()
const tts = useTTS()
const faceRecognition = useFaceRecognition()

// State & Computed
const {
  state,
  mainRegionId,
  subRegionId,
  subSubRegionId,
  items,
  title,
  confirmationText,
  autoMode,
  selectMainRegion,
  selectSubRegion,
  selectSubSubRegion,
  resetToMainView,
  goBack,
  handleBlink
} = machine

// Input Manager
const inputManager = useInputManager({
  onSelect: (event) => {
    console.log('Input detected:', event.type, event.source)
    handleBlink()
  },
  enabledInputs: ['blink', 'click'],
  cooldown: 300
})

// Lifecycle
onMounted(() => {
  console.log('UmgebungDialogView mounted')
  
  // Start Face Recognition (wichtig für Blink-Erkennung!)
  if (!faceRecognition.isActive.value) {
    faceRecognition.start()
  }
  
  // Start AutoMode (wie im pain-dialog)
  autoMode.start()
  
  // Start Input Manager (wie im pain-dialog)
  inputManager.start()
})

onUnmounted(() => {
  console.log('UmgebungDialogView unmounted')
  
  // Stop AutoMode (stoppt auch alle Timer)
  autoMode.stop()
  
  // Stop Input Manager (entfernt alle Event-Listener)
  inputManager.stop()
  
  // Stop Face Recognition (wie im pain-dialog)
  if (faceRecognition.isActive.value) {
    faceRecognition.stop()
  }
})
</script>

<style scoped>
@import '../../../shared/styles/DialogBase.css';
</style>
