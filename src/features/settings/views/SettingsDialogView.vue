<template>
  <div id="app" class="settings-dialog">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content -->
    <main class="main-content">
      <div class="content-wrapper">
        
        <!-- Main Title - IMMER sichtbar (wie HomeView) -->
        <h1 class="main-title">{{ title }}</h1>
        
        <!-- ===== MAIN VIEW ===== -->
        <template v-if="state === 'mainView'">
          <!-- Desktop Grid - DIREKT im content-wrapper (wie HomeView) -->
          <div v-if="!isMobile" class="desktop-grid">
            <div class="grid-container">
              <div
                v-for="(item, index) in items"
                :key="item.id"
                class="menu-tile"
                :class="{
                  'tile-active': index === autoMode.index.value,
                  'tile-inactive': index !== autoMode.index.value
                }"
                @click="handleItemClick(item, index)"
                @contextmenu.prevent="handleContextMenu(item, index)"
              >
                <div class="tile-icon-container">
                  <img
                    v-if="item.icon"
                    :src="item.icon"
                    :alt="item.title"
                    class="tile-icon"
                  />
                </div>
                <div class="tile-text">{{ item.title }}</div>
              </div>
            </div>
          </div>

          <!-- Mobile Carousel - DIREKT im content-wrapper (wie HomeView) -->
          <div v-if="isMobile" class="mobile-carousel">
            <div 
              class="carousel-container"
              @touchstart="handleTouchStart"
              @touchmove="handleTouchMove"
              @touchend="handleTouchEnd"
            >
              <div
                v-for="(item, index) in items"
                :key="item.id"
                class="menu-tile"
                :class="{
                  'tile-active': index === autoMode.index.value,
                  'tile-inactive': index !== autoMode.index.value
                }"
                :style="{
                  '--offset': index - autoMode.index.value
                }"
                @click="handleItemClick(item, index)"
              >
                <div class="tile-icon-container">
                  <img
                    v-if="item.icon"
                    :src="item.icon"
                    :alt="item.title"
                    class="tile-icon"
                  />
                </div>
                <div class="tile-text">{{ item.title }}</div>
              </div>
            </div>
          </div>
        </template>

        <!-- ===== OPTIONS VIEW ===== -->
        <template v-if="state === 'optionsView'">
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

          <!-- Normales horizontales Karussell für andere Einstellungen -->
          <div v-else class="carousel-wrapper subview">
            <div class="carousel-container">
              <div
                v-for="(item, index) in items"
                :key="item.id"
                class="carousel-item menu-tile"
                :class="{
                  'tile-active': index === autoMode.index.value,
                  'tile-inactive': index !== autoMode.index.value
                }"
                :style="{
                  '--offset': index - autoMode.index.value
                }"
                @click="handleItemClick(item, index)"
              >
                <div class="tile-icon-container">
                  <div v-if="'emoji' in item && item.emoji" class="tile-emoji">{{ item.emoji }}</div>
                  <img
                    v-else-if="'icon' in item && item.icon"
                    :src="item.icon"
                    :alt="item.title"
                    class="tile-icon"
                  />
                </div>
                <div class="tile-text">
                  <div class="tile-title">{{ item.title }}</div>
                  <div v-if="'description' in item && item.description" class="tile-description">{{ item.description }}</div>
                </div>
              </div>
            </div>
            
            <!-- Karussell Indikatoren -->
            <div class="carousel-indicators">
              <button
                v-for="(item, index) in items"
                :key="`indicator-${item.id}`"
                class="carousel-indicator"
                :class="{
                  'carousel-indicator-active': index === autoMode.index.value,
                  'carousel-indicator-inactive': index !== autoMode.index.value
                }"
                :aria-label="`Go to item ${index + 1}: ${item.title}`"
                :aria-current="index === autoMode.index.value ? 'true' : 'false'"
                @click="handleItemClick(item, index)"
              >
              </button>
            </div>
          </div>
        </template>

        <!-- ===== CONFIRMATION VIEW ===== -->
        <template v-if="state === 'confirmation'">
          <div class="confirmation-container">
            <p class="confirmation-text">{{ confirmationText }}</p>
          </div>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted, ref, nextTick } from 'vue'
import { useSettingsDialogMachine } from '../composables/useSettingsDialogMachine'
import { useSettingsDictionary } from '../composables/useSettingsDictionary'
import { useInputManager } from '../../../shared/composables/useInputManager'
import { useSettingsStore } from '../stores/settings'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useMobileDetection } from '../../../shared/composables/useMobileDetection'
import AppHeader from '../../../shared/components/AppHeader.vue'
import { debug, debugComponent, debugAutoMode } from '../../../shared/utils/debug'

// ===== COMPOSABLES =====
const machine = useSettingsDialogMachine()
const dict = useSettingsDictionary()
const settingsStore = useSettingsStore()
const faceRecognition = useFaceRecognition()
const { isMobile } = useMobileDetection()

// ===== STATE & COMPUTED =====
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

// ===== TOUCH HANDLING =====
let touchStartY = 0
let touchStartTime = 0

const handleTouchStart = (event: TouchEvent) => {
  if (!isMobile.value || state.value !== 'mainView') return
  
  touchStartY = event.touches[0].clientY
  touchStartTime = Date.now()
  debug.log('SettingsDialog', 'Touch start', { y: touchStartY })
}

const handleTouchMove = (event: TouchEvent) => {
  if (!isMobile.value || state.value !== 'mainView') return
  // Verhindere Default-Scroll-Verhalten
  event.preventDefault()
}

const handleTouchEnd = (event: TouchEvent) => {
  if (!isMobile.value || state.value !== 'mainView') return
  
  const touchEndY = event.changedTouches[0].clientY
  const touchDuration = Date.now() - touchStartTime
  const deltaY = touchEndY - touchStartY
  
  // Swipe-Erkennung: mindestens 50px und maximal 500ms
  if (Math.abs(deltaY) > 50 && touchDuration < 500) {
    if (deltaY > 0) {
      // Swipe nach unten = vorherige Karte
      const newIndex = Math.max(0, autoMode.index.value - 1)
      autoMode.index.value = newIndex
      debug.log('SettingsDialog', 'Swipe down', { newIndex })
    } else {
      // Swipe nach oben = nächste Karte
      const newIndex = Math.min(items.value.length - 1, autoMode.index.value + 1)
      autoMode.index.value = newIndex
      debug.log('SettingsDialog', 'Swipe up', { newIndex })
    }
  }
}

// ===== ITEM INTERACTION =====
const handleItemClick = (item: any, index: number) => {
  debug.log('SettingsDialog', 'Item clicked', { 
    itemId: item.id, 
    index,
    state: state.value,
    isBackButton: item.id === dict.ID_BACK,
    isActive: index === autoMode.index.value
  })

  // Aktiviere User-Interaktion für TTS
  enableTTSOnInteraction()

  // Zurück-Button ist immer klickbar (auch wenn nicht im AutoMode aktiv)
  if (item.id === dict.ID_BACK) {
    handleBackButton()
    return
  }

  // Alle anderen Buttons sind nur klickbar, wenn sie im AutoMode aktiv sind
  if (autoMode.index.value === index) {
    handleItemSelection(item)
  }
}

const handleContextMenu = (item: any, index: number) => {
  debug.log('SettingsDialog', 'Context menu', { 
    itemId: item.id, 
    index,
    state: state.value 
  })
  // Context menu handling if needed
}

const handleBackButton = () => {
  switch (state.value) {
    case 'optionsView':
      selectOption(dict.ID_BACK)
      break
    case 'mainView':
    default:
      goBack()
      break
  }
}

const handleItemSelection = (item: any) => {
  switch (state.value) {
    case 'mainView':
      selectCategory(String(item.id))
      break
    case 'optionsView':
      selectOption(String(item.id))
      break
    default:
      debug.warn('SettingsDialog', 'Item selection in unexpected state', { 
        state: state.value 
      })
      break
  }
}

// ===== TTS ACTIVATION =====
const enableTTSOnInteraction = () => {
  // Aktiviere TTS bei User-Interaktion
  if (typeof (window as any).__enableTTS === 'function') {
    (window as any).__enableTTS()
  }
}

// ===== INPUT MANAGER =====
const inputManager = useInputManager({
  onSelect: (event) => {
    debug.log('SettingsDialog', 'Input detected', {
      type: event.type,
      source: event.source,
      state: state.value,
      currentIndex: autoMode.index.value
    })
    handleBlink()
  },
  enabledInputs: ['blink', 'click'],
  cooldown: 300
})

// ===== KAMERA-FUNKTIONEN =====
const cameraVideo = ref<HTMLVideoElement | null>(null)
const brightness = ref(settingsStore.settings.cameraBrightness || 50)
const zoom = ref(settingsStore.settings.cameraZoom || 1)

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

// ===== WATCHERS =====
watch(() => state.value, (newState, oldState) => {
  if (oldState !== undefined) {
    debug.log('SettingsDialog', 'State changed', {
      from: oldState,
      to: newState,
      itemsCount: items.value.length,
      title: title.value
    })
  }
})

watch(() => autoMode.index.value, (newIndex, oldIndex) => {
  if (oldIndex !== undefined) {
    debugAutoMode.indexChange(newIndex, items.value.length)
  }
})

// ===== LIFECYCLE =====
onMounted(() => {
  debugComponent.lifecycle('SettingsDialogView', 'mounted')
  debugComponent.props('SettingsDialogView', { isMobile: isMobile.value })
  
  // Start Face Recognition
  if (!faceRecognition.isActive.value) {
    debug.log('SettingsDialog', 'Starting face recognition')
    faceRecognition.start()
  }
  
  // Reset index
  autoMode.index.value = 0
  
  // Start AutoMode
  debugAutoMode.start(false)
  autoMode.start()
  
  // Start Input Manager
  debug.log('SettingsDialog', 'Starting Input Manager')
  inputManager.start()
  
  // Kamera initialisieren wenn Kamera-Kategorie aktiv
  if (categoryId.value === 'kamera') {
    nextTick(() => {
      initializeCamera()
    })
  }
  
  // Cleanup sofort verfügbar machen (bevor Services starten)
  ;(window as any).__settingsDialogCleanup = () => {
    debug.log('SettingsDialog', 'Global cleanup called')
    machine.cleanup()
    inputManager.stop()
  }
  
  // Start Services NACH Cleanup-Registrierung
})

onUnmounted(() => {
  debugComponent.lifecycle('SettingsDialogView', 'unmounted')
  
  // Stop AutoMode
  debugAutoMode.stop()
  autoMode.stop()
  
  // Stop Input Manager
  debug.log('SettingsDialog', 'Stopping Input Manager')
  inputManager.stop()
  
  // Stop Face Recognition
  // Kamera-Settings sollten Face Recognition nicht stoppen, da es global genutzt wird
  // if (faceRecognition.isActive.value && categoryId.value !== 'kamera') {
  //   debug.log('SettingsDialog', 'Stopping Face Recognition')
  //   faceRecognition.stop()
  // }
  
  // Remove global cleanup
  delete (window as any).__settingsDialogCleanup
})
</script>

<!-- DialogBase.css Import - NICHT scoped, da globale Styles -->
<style>
@import '../../../shared/styles/DialogBase.css';
</style>

<!-- Spezifische Styles für diese Komponente - scoped -->
<style scoped>
/* Emoji Styles für Options */
.tile-emoji {
  font-size: clamp(3rem, 10vw, 6rem);
  line-height: 1;
}

/* Tile Text Styles für Options mit Beschreibung */
.tile-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.tile-title {
  font-size: inherit;
  font-weight: inherit;
}

.tile-description {
  font-size: 0.85em;
  opacity: 0.8;
  font-weight: 400;
}

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

/* Confirmation View Styles */
.confirmation-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  animation: fadeInScale 0.5s ease-out;
}

.confirmation-icon {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
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

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .confirmation-icon {
    width: 80px;
    height: 80px;
    font-size: 2.5rem;
  }

  .tile-emoji {
    font-size: clamp(2.5rem, 8vw, 4rem);
  }
}
</style>
