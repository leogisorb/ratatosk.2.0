<template>
  <div id="app" class="pain-dialog">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content -->
    <main class="main-content">
      <div class="content-wrapper">
        
        <!-- Main View: Body Region Selection -->
        <div v-if="state === 'mainView'">
          <div class="main-title">
            {{ title }}
          </div>

          <!-- Desktop Grid -->
          <GridView
            v-if="!isMobile"
            :items="items"
            :current-index="autoMode.index.value"
            :back-id="'zurueck'"
            :on-item-click="(item, index) => {
              if (item.id === 'zurueck') {
                goBack()
              } else if (autoMode.index.value === index) {
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
            :back-id="'zurueck'"
            :on-item-click="(item, index) => {
              if (item.id === 'zurueck') {
                goBack()
              } else if (autoMode.index.value === index) {
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
              if (item.id === 'zurueck') {
                goBack()
              } else if (autoMode.index.value === index) {
                selectSubRegion(String(item.id))
              }
            }"
            :on-context-menu="(item, index) => {
              // Context menu handling if needed
            }"
          />
        </div>

        <!-- Pain Scale View -->
        <div v-if="state === 'painScaleView'"
             @touchstart="handlePainScaleTouch"
             @click="handlePainScaleClick">
          <div class="pain-scale-display">
            <div class="pain-scale-title">
              {{ title }}
            </div>
            <div class="pain-scale-level-combined">
              {{ getCurrentPainLevelCombined }}
            </div>
          </div>

          <div class="pain-scale-bar"
               @touchstart="handlePainScaleTouch"
               @click="handlePainScaleClick">
            <div class="pain-scale-progress"
              :style="{ width: `${((getCurrentPainLevel || 1) - 1) * 10 + 5}%` }"
            ></div>
            
            <div class="pain-scale-numbers">
              <span 
                v-for="(level, index) in items" 
                :key="level.id"
                class="pain-scale-number"
                :class="{ 'active': autoMode.index.value === index }"
                :style="{ left: `${(index * 10) + 5}%` }"
                @touchstart="'level' in level ? selectPainLevel(level.level) : null"
                @click="'level' in level ? selectPainLevel(level.level) : null"
              >
                {{ 'level' in level ? level.level : level.id }}
              </span>
            </div>
          </div>
        </div>

        <!-- Confirmation View -->
        <div v-if="state === 'confirmation'">
          <div class="confirmation-container">
            <div class="confirmation-title">Schmerz erfasst</div>
            <div class="confirmation-text">{{ confirmationText }}</div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from 'vue'
import { usePainDialogMachine } from '../composables/usePainDialogMachine'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useInputManager } from '../../../shared/composables/useInputManager'
import type { InputEvent } from '../../../core/application/InputManager'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'
import AppHeader from '../../../shared/components/AppHeader.vue'
import CarouselView from '../../../shared/components/CarouselView.vue'
import GridView from '../../../shared/components/GridView.vue'
import MobileCarouselView from '../../../shared/components/MobileCarouselView.vue'
import { useMobileDetection } from '../../../shared/composables/useMobileDetection'
import { useCarousel } from '../../navigation/composables/useCarousel'
import type { CarouselItem } from '../../navigation/config/carouselConfig'

// ✅ Neue modulare Architektur
const machine = usePainDialogMachine()
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
    category: 'pain' as const
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

// ✅ Destructure für Template
const {
  state,
  items,
  title,
  confirmationText,
  autoMode,
  selectMainRegion,
  selectSubRegion,
  selectPainLevel,
  goBack,
  handleBlink,
  findSubRegion,
  findPainLevel,
} = machine

// ✅ Helper Functions für Template
const getCurrentPainLevel = computed(() => {
  const currentItem = items.value[autoMode.index.value]
  return ('level' in currentItem && typeof currentItem.level === 'number') ? currentItem.level : null
})

const getCurrentPainLevelCombined = computed(() => {
  const currentItem = items.value[autoMode.index.value]
  if (!currentItem) return ''
  
  const level = ('level' in currentItem && typeof currentItem.level === 'number') ? currentItem.level : null
  const description = ('description' in currentItem && typeof currentItem.description === 'string') ? currentItem.description : ''
  
  if (level === null || !description) return ''
  
  // Format: "3, leicht"
  return `${level}, ${description}`
})

// ✅ goBack wird jetzt von der Machine bereitgestellt


// ✅ Pain Scale Touch/Click Handler (spezifisch für Pain Scale Bar)
const handlePainScaleTouch = (event: TouchEvent) => {
  event.preventDefault()
  const target = event.target as HTMLElement
  const level = parseInt(target.textContent || '0')
  if (level > 0 && level <= 10) {
    selectPainLevel(level)
  }
}

const handlePainScaleClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  const level = parseInt(target.textContent || '0')
  if (level > 0 && level <= 10) {
    selectPainLevel(level)
  }
}

// ✅ Input Manager - Zentrale Abstraktion für alle Eingabemedien
// ✅ Nur Blinzeln und Rechtsklick (contextmenu)
const inputManager = useInputManager({
  onSelect: (event: InputEvent) => {
    console.log('PainDialogView: InputManager - Input detected', event.type, event.source, {
      currentState: state.value,
      currentIndex: autoMode.index.value,
      currentItem: items.value[autoMode.index.value]
    })
    // ✅ Einheitlicher Callback für Blink und Rechtsklick
    try {
    handleBlink()
    } catch (error) {
      console.error('PainDialogView: Fehler in handleBlink()', error)
    }
  },
  enabledInputs: ['blink', 'click'], // ✅ Blinzeln und Rechtsklick (contextmenu)
  cooldown: 300 // ✅ Verhindert zu häufige Inputs
})

// ✅ Lifecycle
onMounted(() => {
  console.log('PainDialogView mounted')
  
  // Start Face Recognition
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
  
  // Start AutoMode
  autoMode.start()
  
  // ✅ Start Input Manager - alle Handler werden automatisch registriert!
  inputManager.start()
  
  // Cleanup-Funktion global verfügbar machen für Router-Guard
  ;(window as any).__painDialogCleanup = () => {
    console.log('PainDialogView: Global cleanup aufgerufen (Router-Guard)')
    
    // Stoppe Input Manager zuerst (verhindert weitere Blinzel-Events)
    inputManager.stop()
    
    // Cleanup: Stoppe alle Timer und verhindere weitere AutoMode-Starts
    machine.cleanup()
    
    // Stoppe TTS komplett (SimpleFlowController)
    simpleFlowController.stopTTS()
    
    // Stoppe alle TTS (auch außerhalb SimpleFlowController)
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    
    // Stoppe Auto-Mode komplett (SimpleFlowController)
    simpleFlowController.stopAutoMode()
    
    // Face Recognition NICHT stoppen (läuft seitenübergreifend)
    // if (faceRecognition.isActive.value) {
    //   faceRecognition.stop()
    // }
    
    console.log('PainDialogView: Global cleanup abgeschlossen')
  }
})

onUnmounted(() => {
  console.log('PainDialogView unmounted - cleaning up')
  
  // Cleanup carousel
  if (isMobile.value) {
    cleanupCarousel()
  }
  
  // Stoppe Input Manager zuerst (verhindert weitere Blinzel-Events)
  inputManager.stop()
  
  // Cleanup: Stoppe alle Timer und verhindere weitere AutoMode-Starts
  machine.cleanup()
  
  // Stoppe TTS komplett (SimpleFlowController)
  simpleFlowController.stopTTS()
  
  // Stoppe alle TTS (auch außerhalb SimpleFlowController)
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
  
  // Stoppe Auto-Mode komplett (SimpleFlowController)
  simpleFlowController.stopAutoMode()
  
  // Face Recognition NICHT stoppen (läuft seitenübergreifend)
  // Die Face Recognition läuft global und sollte nicht gestoppt werden
  
  // Global cleanup-Funktion entfernen
  delete (window as any).__painDialogCleanup
  
  console.log('PainDialogView: Cleanup abgeschlossen')
})
</script>

<style scoped>
@import '../../../shared/styles/DialogBase.css';
</style>
