<template>
  <div id="app" class="pain-dialog">
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
              @click="goToIndex(index)"
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
import { useUmgebungDialogMachine } from '../composables/useUmgebungDialogMachine'
import { useUmgebungDictionary } from '../composables/useUmgebungDictionary'
import { useTTS } from '../composables/useTTS'
import { useInputManager } from '../../../shared/composables/useInputManager'
import AppHeader from '../../../shared/components/AppHeader.vue'

// Dialog Machine
const machine = useUmgebungDialogMachine()
const dict = useUmgebungDictionary()
const tts = useTTS()

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
  console.log('UmgebungDialogView mounted')
  
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
  console.log('UmgebungDialogView unmounted')
  
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
