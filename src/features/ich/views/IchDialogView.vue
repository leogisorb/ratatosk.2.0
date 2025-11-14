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

          <!-- Desktop Grid -->
          <div class="grid-container desktop-grid" v-if="!isMobile">
            <!-- Dynamic Menu Tiles -->
            <div 
              v-for="(region, index) in items"
              :key="region.id"
              class="menu-tile"
              :class="[
                autoMode.index.value === index ? 'tile-active' : 'tile-inactive',
                region.id === dict.ID_BACK ? 'back-tile' : ''
              ]"
              @click="region.id === dict.ID_BACK ? goBack() : (autoMode.index.value === index ? selectMainRegion(String(region.id)) : null)"
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

          <!-- Mobile Vertical Carousel -->
          <div class="mobile-carousel" v-if="isMobile">
            <div 
              class="carousel-container" 
              :style="carouselStyle"
              @touchstart="handleTouchStart"
              @touchmove="handleTouchMove"
              @touchend="handleTouchEnd"
              role="listbox"
              aria-label="Hauptmenü"
              tabindex="0"
            >
              <div 
                v-for="(region, index) in items"
                :key="region.id"
                class="menu-tile"
                :class="[
                  autoMode.index.value === index ? 'tile-active' : 'tile-inactive',
                  region.id === dict.ID_BACK ? 'back-tile' : ''
                ]"
                :style="{ '--offset': index - autoMode.index.value }"
                @click="region.id === dict.ID_BACK ? goBack() : (autoMode.index.value === index ? selectMainRegion(String(region.id)) : null)"
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
                  :style="autoMode.index.value === index ? 'color: white !important;' : ''"
                >
                  {{ region.title }}
                </div>
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
                  @click="subRegion.id === dict.ID_BACK ? goBack() : (autoMode.index.value === index ? selectSubRegion(String(subRegion.id)) : null)"
                  @contextmenu.prevent="autoMode.index.value === index ? null : null"
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
import { computed, watch, onMounted, onUnmounted } from 'vue'
import { useIchDialogMachine } from '../composables/useIchDialogMachine'
import { useIchDictionary } from '../composables/useIchDictionary'
import { useTTS } from '../composables/useTTS'
import { useInputManager } from '../../../shared/composables/useInputManager'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import AppHeader from '../../../shared/components/AppHeader.vue'
import { useMobileDetection } from '../../../shared/composables/useMobileDetection'
import { useCarousel } from '../../navigation/composables/useCarousel'
import type { CarouselItem } from '../../navigation/config/carouselConfig'

// Dialog Machine
const machine = useIchDialogMachine()
const dict = useIchDictionary()
const tts = useTTS()
const faceRecognition = useFaceRecognition()

// Mobile Detection
const { isMobile } = useMobileDetection()

// Convert items to CarouselItem format for useCarousel
const carouselItems = computed<CarouselItem[]>(() => {
  if (machine.state.value !== 'mainView') return []
  return machine.items.value.map(item => ({
    id: item.id,
    title: item.title,
    icon: ('icon' in item && item.icon) ? String(item.icon) : '',
    route: '',
    category: 'main' as const
  }))
})

// Carousel Composable (only for mobile)
const {
  carouselStyle,
  position,
  handleCarouselTouchStart,
  handleCarouselTouchMove,
  handleCarouselTouchEnd,
  navigateToIndex,
  initializeCarousel,
  cleanup: cleanupCarousel,
  stopAutoScrollCompletely
} = useCarousel(carouselItems.value)

// Touch handlers
const handleTouchStart = (event: TouchEvent) => {
  if (isMobile.value && machine.state.value === 'mainView') {
    handleCarouselTouchStart(event)
  }
}

const handleTouchMove = (event: TouchEvent) => {
  if (isMobile.value && machine.state.value === 'mainView') {
    handleCarouselTouchMove(event)
  }
}

const handleTouchEnd = (event: TouchEvent) => {
  if (isMobile.value && machine.state.value === 'mainView') {
    handleCarouselTouchEnd(event)
  }
}

// Sync autoMode.index with carousel position
watch(() => position.currentIndex, (newIndex) => {
  if (isMobile.value && machine.state.value === 'mainView') {
    machine.autoMode.index.value = newIndex
  }
})

// Sync carousel position with autoMode.index
watch(() => machine.autoMode.index.value, (newIndex) => {
  if (isMobile.value && machine.state.value === 'mainView') {
    navigateToIndex(newIndex)
  }
})

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
  console.log('IchDialogView mounted')
  
  // Start Face Recognition (wichtig für Blink-Erkennung!)
  if (!faceRecognition.isActive.value) {
    faceRecognition.start()
  }
  
  // Initialize carousel if mobile
  if (isMobile.value && machine.state.value === 'mainView') {
    initializeCarousel()
    // Stop auto-scroll (we use autoMode instead)
    stopAutoScrollCompletely()
  }
  
  // ✅ Index explizit auf 0 setzen, bevor AutoMode startet (verhindert Springen)
  autoMode.index.value = 0
  
  // Start AutoMode (wie im PainDialogView)
  autoMode.start()
  
  // Start Input Manager (wie im PainDialogView)
  inputManager.start()
  
  // Cleanup-Funktion global verfügbar machen für Router-Guard
  ;(window as any).__ichDialogCleanup = () => {
    console.log('IchDialogView: Global cleanup aufgerufen (Router-Guard)')
    
    // Cleanup: Stoppe alle Timer und verhindere weitere AutoMode-Starts
    machine.cleanup()
    
    // Stoppe Input Manager
    inputManager.stop()
    
    // Face Recognition nicht stoppen (läuft seitenübergreifend)
    // if (faceRecognition.isActive.value) {
    //   faceRecognition.stop()
    // }
  }
})

onUnmounted(() => {
  console.log('IchDialogView unmounted - cleaning up')
  
  // Cleanup carousel
  if (isMobile.value) {
    cleanupCarousel()
  }
  
  // Stop AutoMode (stoppt auch alle Timer)
  autoMode.stop()
  
  // Stop Input Manager (entfernt alle Event-Listener)
  inputManager.stop()
  
  // Stop Face Recognition (wie im PainDialogView)
  if (faceRecognition.isActive.value) {
    faceRecognition.stop()
  }
  
  // Global cleanup-Funktion entfernen
  delete (window as any).__ichDialogCleanup
})
</script>

<style scoped>
@import '../../../shared/styles/DialogBase.css';

</style>
