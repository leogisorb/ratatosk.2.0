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
          <GridView
            v-if="!isMobile"
            :items="items"
            :current-index="autoMode.index.value"
            :back-id="dict.ID_BACK"
            :on-item-click="(item, index) => {
              if (item.id === dict.ID_BACK) {
                goBack()
              } else {
                selectMainRegion(String(item.id))
              }
            }"
            :on-context-menu="(item, index) => {
              // Context menu handling if needed
            }"
          />

          <!-- Mobile Vertical Carousel -->
          <MobileCarouselView
            v-if="isMobile"
            :items="items"
            :current-index="autoMode.index.value"
            :carousel-style="carouselStyle"
            :back-id="dict.ID_BACK"
            :on-item-click="(item, index) => {
              if (item.id === dict.ID_BACK) {
                goBack()
              } else {
                selectMainRegion(String(item.id))
              }
            }"
            :on-touch-start="handleTouchStart"
            :on-touch-move="handleTouchMove"
            :on-touch-end="handleTouchEnd"
            :on-context-menu="(item, index) => {
              // Context menu handling if needed
            }"
          />
        </div>

        <!-- Sub Region View -->
        <div v-if="state === 'subRegionView'">
          <div class="main-title">
            {{ title }}
          </div>

          <CarouselView
            :items="items"
            :current-index="autoMode.index.value"
            :on-item-click="(item, index) => {
              if (item.id === dict.ID_BACK) {
                goBack()
              } else {
                selectSubRegion(String(item.id))
              }
            }"
            :on-context-menu="(item, index) => {
              // Context menu handling if needed
            }"
          />
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
import CarouselView from '../../../shared/components/CarouselView.vue'
import GridView from '../../../shared/components/GridView.vue'
import MobileCarouselView from '../../../shared/components/MobileCarouselView.vue'
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

// Sync autoMode.index with carousel position (nur wenn AutoMode nicht läuft)
watch(() => position.currentIndex, (newIndex) => {
  if (isMobile.value && machine.state.value === 'mainView' && !machine.autoMode.running.value) {
    machine.autoMode.index.value = newIndex
  }
})

// Sync carousel position with autoMode.index (AutoMode hat Vorrang für sequenziellen Durchlauf)
watch(() => machine.autoMode.index.value, (newIndex) => {
  if (isMobile.value && machine.state.value === 'mainView') {
    // AutoMode läuft: Folge dem sequenziellen Durchlauf (0-1-2-3-4-5...)
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
