<template>
  <div id="app" class="ich-dialog">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content -->
    <main class="main-content">
      <div class="content-wrapper">
        
        <!-- Main View: Main Region Selection -->
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
                :style="autoMode.index.value === index ? 'color: white !important;' : ''"
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
                >
                  <div class="carousel-item-content">
                    <div 
                      class="tile-icon-container"
                      :class="autoMode.index.value === index ? 'icon-active' : 'icon-inactive'"
                    >
                      <span 
                        v-if="'emoji' in subRegion && subRegion.emoji" 
                        class="tile-emoji"
                      >
                        {{ subRegion.emoji }}
                      </span>
                      <img 
                        v-else-if="'icon' in subRegion && subRegion.icon" 
                        :src="String(subRegion.icon)" 
                        :alt="subRegion.title" 
                        class="tile-icon"
                        :class="autoMode.index.value === index ? 'icon-inverted' : ''"
                      />
                    </div>
                    <div 
                      class="tile-text"
                      :class="autoMode.index.value === index ? 'text-active' : 'text-inactive'"
                      :style="autoMode.index.value === index ? 'color: white !important;' : ''"
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
              @click="goToIndex(index)"
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
import { onMounted, onUnmounted, ref } from 'vue'
import { useIchDialogMachine } from '../composables/useIchDialogMachine'
import { useIchDictionary } from '../composables/useIchDictionary'
import { useTTS } from '../composables/useTTS'
import { useInputManager } from '../../../shared/composables/useInputManager'
import AppHeader from '../../../shared/components/AppHeader.vue'

// Dialog Machine
const machine = useIchDialogMachine()
const dict = useIchDictionary()
const tts = useTTS()

// State & Computed
const {
  state,
  mainRegionId,
  subRegionId,
  items,
  title,
  confirmationText,
  autoMode,
  selectMainRegion,
  selectSubRegion,
  resetToMainView,
  goBack,
  handleBlink,
  goToIndex
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

// Lifecycle - Timer für Cleanup
const mountedTimers = ref<number[]>([])

onMounted(() => {
  console.log('IchDialogView mounted')
  
  // Input Manager starten
  inputManager.start()
  
  // Initial greeting - Titel sprechen, dann AutoMode starten (skipTitle = true, da Titel bereits gesprochen)
  const timer1 = window.setTimeout(async () => {
    await tts.speak(title.value)
    const timer2 = window.setTimeout(() => {
      if (autoMode) {
        autoMode.start(true) // skipTitle = true, da Titel bereits gesprochen
      }
    }, 3000)
    mountedTimers.value.push(timer2)
  }, 1000)
  mountedTimers.value.push(timer1)
})

onUnmounted(() => {
  console.log('IchDialogView unmounted')
  
  // Alle Timer löschen
  mountedTimers.value.forEach(timer => clearTimeout(timer))
  mountedTimers.value = []
  
  // AutoMode stoppen (stoppt auch alle Timer)
  autoMode.stop()
  
  // TTS stoppen
  tts.cancel()
  
  // Input Manager stoppen (entfernt alle Event-Listener)
  inputManager.stop()
})
</script>

<style scoped>
@import '../../../shared/styles/DialogBase.css';

</style>
