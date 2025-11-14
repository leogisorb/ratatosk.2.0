<template>
  <div id="app" class="settings-dialog">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content -->
    <main class="main-content">
      <div class="content-wrapper">
        
        <!-- Main View: Settings Categories -->
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
              } else if (autoMode.index.value === index) {
                selectCategory(String(item.id))
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
              } else if (autoMode.index.value === index) {
                selectCategory(String(item.id))
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

        <!-- Settings Options View -->
        <div v-if="state === 'optionsView'">
          <div class="main-title">
            {{ title }}
          </div>

          <!-- Spezielles Kamera-Interface -->
          <div v-if="categoryId === 'kamera'" class="camera-settings-view">
            <!-- Kamerabild -->
            <div class="camera-preview-wrapper">
              <video 
                ref="cameraVideo"
                class="camera-preview"
                autoplay 
                muted 
                playsinline
                :style="{
                  filter: `brightness(${brightness}%)`,
                  transform: `scale(${zoom})`
                }"
              ></video>
            </div>

            <!-- Helligkeits-Slider -->
            <div class="camera-control-slider">
              <label class="slider-label">
                Helligkeit: {{ brightness }}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                :value="brightness"
                @input="updateBrightness"
                class="slider-input"
              />
            </div>

            <!-- Zoom-Slider -->
            <div class="camera-control-slider">
              <label class="slider-label">
                Zoom: {{ zoom }}x
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="0.1"
                :value="zoom"
                @input="updateZoom"
                class="slider-input"
              />
            </div>
          </div>

          <!-- Normales Karussell für andere Einstellungen -->
          <template v-else>
            <CarouselView
              :items="items"
              :current-index="autoMode.index.value"
              :on-item-click="(item, index) => {
                if (item.id === dict.ID_BACK) {
                  goBack()
                } else if (autoMode.index.value === index) {
                  selectOption(String(item.id))
                }
              }"
              :on-context-menu="(item, index) => {
                // Context menu handling if needed
              }"
            />
          </template>
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
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import { useSettingsDialogMachine } from '../composables/useSettingsDialogMachine'
import { useSettingsDictionary } from '../composables/useSettingsDictionary'
import { useTTS } from '../composables/useTTS'
import { useInputManager } from '../../../shared/composables/useInputManager'
import { useSettingsStore } from '../stores/settings'
import { useFaceRecognition } from '../../../features/face-recognition/composables/useFaceRecognition'
import AppHeader from '../../../shared/components/AppHeader.vue'
import CarouselView from '../../../shared/components/CarouselView.vue'
import GridView from '../../../shared/components/GridView.vue'
import MobileCarouselView from '../../../shared/components/MobileCarouselView.vue'
import { useMobileDetection } from '../../../shared/composables/useMobileDetection'
import { useCarousel } from '../../navigation/composables/useCarousel'
import type { CarouselItem } from '../../navigation/config/carouselConfig'

// Dialog Machine
const machine = useSettingsDialogMachine()
const dict = useSettingsDictionary()
const tts = useTTS()
const settingsStore = useSettingsStore()
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
    category: 'settings' as const
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

// Kamera-spezifische State
const cameraVideo = ref<HTMLVideoElement | null>(null)
const brightness = ref(settingsStore.settings.cameraBrightness || 50)
const zoom = ref(settingsStore.settings.cameraZoom || 1)

// State & Computed
const {
  state,
  categoryId,
  optionId,
  items,
  title,
  confirmationText,
  autoMode,
  selectCategory,
  selectOption,
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

// Kamera-Funktionen
async function initializeCamera() {
  if (categoryId.value !== 'kamera' || !cameraVideo.value) return
  
  try {
    // Hole den Kamera-Stream von Face Recognition
    if (!faceRecognition.isActive.value) {
      await faceRecognition.start()
    }
    
    // Warte auf Video-Element und setze den Stream
    await nextTick()
    
    // Finde das Video-Element von Face Recognition
    const faceRecognitionVideo = document.querySelector('video') as HTMLVideoElement
    if (faceRecognitionVideo && faceRecognitionVideo.srcObject && cameraVideo.value) {
      cameraVideo.value.srcObject = faceRecognitionVideo.srcObject as MediaStream
      await cameraVideo.value.play()
    }
  } catch (error) {
    console.error('Kamera-Initialisierung fehlgeschlagen:', error)
  }
}

function updateBrightness(event: Event) {
  const target = event.target as HTMLInputElement
  const value = parseInt(target.value)
  brightness.value = value
  settingsStore.updateSettings({ cameraBrightness: value })
}

function updateZoom(event: Event) {
  const target = event.target as HTMLInputElement
  const value = parseFloat(target.value)
  zoom.value = value
  settingsStore.updateSettings({ cameraZoom: value })
}

// Watch für Kamera-Kategorie
watch([categoryId, cameraVideo], ([newCategoryId]) => {
  if (newCategoryId === 'kamera' && cameraVideo.value) {
    initializeCamera()
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  console.log('SettingsDialogView mounted')
  
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
  
  // Start AutoMode (wie im pain-dialog)
  autoMode.start()
  
  // Start Input Manager (wie im pain-dialog)
  inputManager.start()
  
  // Kamera initialisieren wenn Kamera-Kategorie aktiv
  if (categoryId.value === 'kamera') {
    nextTick(() => {
      initializeCamera()
    })
  }
  
  // Cleanup-Funktion global verfügbar machen für Router-Guard
  ;(window as any).__settingsDialogCleanup = () => {
    console.log('SettingsDialogView: Global cleanup aufgerufen (Router-Guard)')
    
    // Cleanup: Stoppe alle Timer und verhindere weitere AutoMode-Starts
    machine.cleanup()
    
    // Stoppe Input Manager
    inputManager.stop()
    
    // Kamera-Settings sollten Face Recognition nicht stoppen, da es global genutzt wird
  }
})

onUnmounted(() => {
  console.log('SettingsDialogView unmounted - cleaning up')
  
  // Cleanup carousel
  if (isMobile.value) {
    cleanupCarousel()
  }
  
  // Stop AutoMode (stoppt auch alle Timer)
  autoMode.stop()
  
  // Stop Input Manager (entfernt alle Event-Listener)
  inputManager.stop()
  
  // Stop Face Recognition (wie im pain-dialog)
  // Kamera-Settings sollten Face Recognition nicht stoppen, da es global genutzt wird
  // if (faceRecognition.isActive.value && categoryId.value !== 'kamera') {
  //   faceRecognition.stop()
  // }
  
  // Global cleanup-Funktion entfernen
  delete (window as any).__settingsDialogCleanup
})
</script>

<style scoped>
@import '../../../shared/styles/DialogBase.css';

/* Kamera-Interface Styles */
.camera-settings-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  height: 100%;
}

.camera-preview-wrapper {
  width: 100%;
  max-width: 640px;
  aspect-ratio: 4/3;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform-origin: center center;
}

.camera-control-slider {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.slider-label {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary, #333);
  text-align: center;
}

.slider-input {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: #ddd;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--primary-color, #007bff);
  cursor: pointer;
}

.slider-input::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--primary-color, #007bff);
  cursor: pointer;
  border: none;
}

/* Dark Mode Support */
.dark-mode .slider-label {
  color: var(--text-primary-dark, #fff);
}

.dark-mode .slider-input {
  background: #555;
}

.dark-mode .slider-input::-webkit-slider-thumb {
  background: var(--primary-color-dark, #4da3ff);
}

.dark-mode .slider-input::-moz-range-thumb {
  background: var(--primary-color-dark, #4da3ff);
}
</style>
