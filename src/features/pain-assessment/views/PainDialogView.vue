<template>
  <div id="app" class="pain-dialog">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content -->
    <main class="main-content">
      <div class="content-wrapper">
        
        <!-- Main Title - IMMER sichtbar (wie HomeView), außer bei Confirmation -->
        <h1 v-if="state !== 'confirmation'" class="main-title">{{ title }}</h1>
        
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
                    v-if="'icon' in item && item.icon"
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
                    v-if="'icon' in item && item.icon"
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

        <!-- ===== SUB REGION VIEW ===== -->
        <template v-if="state === 'subRegionView'">
          <!-- Horizontales Karussell für Sub-Regions -->
          <div class="carousel-wrapper subview">
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
                  <img
                    v-if="'icon' in item && item.icon"
                    :src="item.icon"
                    :alt="item.title"
                    class="tile-icon"
                  />
                  <div v-else-if="'emoji' in item && item.emoji" class="tile-emoji">{{ item.emoji }}</div>
                </div>
                <div class="tile-text">{{ item.title }}</div>
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

        <!-- ===== PAIN SCALE VIEW ===== -->
        <template v-if="state === 'painScaleView'">
          <!-- Horizontales Karussell für Schmerzskala -->
          <div class="carousel-wrapper subview">
            <div class="carousel-container">
              <div
                v-for="(item, index) in items"
                :key="item.id"
                class="carousel-item menu-tile pain-level-tile"
                :class="{
                  'tile-active': index === autoMode.index.value,
                  'tile-inactive': index !== autoMode.index.value
                }"
                :style="{
                  '--offset': index - autoMode.index.value,
                  '--pain-color': 'color' in item ? (item as any).color : '#f3f4f6'
                }"
                @click="handleItemClick(item, index)"
              >
                <div v-if="'description' in item" class="tile-description">
                  <span class="pain-level-number">{{ 'level' in item ? (item as any).level : (item as any).id }}</span>
                  <span class="pain-level-comma">,</span>
                  <span class="pain-level-desc">{{ (item as any).description }}</span>
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
import { computed, watch, onMounted, onUnmounted } from 'vue'
import { usePainDialogMachine } from '../composables/usePainDialogMachine'
import { useInputManager } from '../../../shared/composables/useInputManager'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useMobileDetection } from '../../../shared/composables/useMobileDetection'
import AppHeader from '../../../shared/components/AppHeader.vue'
import { debug, debugComponent, debugAutoMode } from '../../../shared/utils/debug'
import { cleanupRegistry } from '../../../shared/utils/cleanupRegistry'

// ===== COMPOSABLES =====
const machine = usePainDialogMachine()
const faceRecognition = useFaceRecognition()
const { isMobile } = useMobileDetection()

// ===== STATE & COMPUTED =====
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
  handleBlink
} = machine

// ===== TOUCH HANDLING =====
let touchStartY = 0
let touchStartTime = 0

const handleTouchStart = (event: TouchEvent) => {
  if (!isMobile.value || state.value !== 'mainView') return
  
  touchStartY = event.touches[0].clientY
  touchStartTime = Date.now()
  debug.log('PainDialog', 'Touch start', { y: touchStartY })
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
      debug.log('PainDialog', 'Swipe down', { newIndex })
    } else {
      // Swipe nach oben = nächste Karte
      const newIndex = Math.min(items.value.length - 1, autoMode.index.value + 1)
      autoMode.index.value = newIndex
      debug.log('PainDialog', 'Swipe up', { newIndex })
    }
  }
}

// ===== ITEM INTERACTION =====
const handleItemClick = (item: any, index: number) => {
  debug.log('PainDialog', 'Item clicked', { 
    itemId: item.id, 
    index,
    state: state.value,
    isBackButton: item.id === 'zurueck',
    isActive: index === autoMode.index.value
  })

  // Aktiviere User-Interaktion für TTS
  enableTTSOnInteraction()

  // Zurück-Button ist immer klickbar (auch wenn nicht im AutoMode aktiv)
  if (item.id === 'zurueck') {
    handleBackButton()
    return
  }

  // Alle anderen Buttons sind nur klickbar, wenn sie im AutoMode aktiv sind
  handleItemSelection(item, index)
}

const handleContextMenu = (item: any, index: number) => {
  debug.log('PainDialog', 'Context menu', { 
    itemId: item.id, 
    index,
    state: state.value 
  })
  // Context menu handling if needed
}

const handleBackButton = () => {
  switch (state.value) {
    case 'subRegionView':
      selectSubRegion('zurueck')
      break
    case 'painScaleView':
      selectSubRegion('zurueck')
      break
    case 'mainView':
    default:
      goBack()
      break
  }
}

const handleItemSelection = (item: any, index: number) => {
  // Prüfen ob das Item im AutoMode aktiv ist
  if (index !== autoMode.index.value) {
    debug.log('PainDialog', 'Item not active, ignoring click', { 
      itemId: item.id, 
      index,
      activeIndex: autoMode.index.value
    })
    return
  }

  switch (state.value) {
    case 'mainView':
      selectMainRegion(item.id)
      break
    case 'subRegionView':
      selectSubRegion(item.id)
      break
    case 'painScaleView':
      // Pain levels haben level property
      if ('level' in item && typeof (item as any).level === 'number') {
        selectPainLevel((item as any).level)
      } else if ('id' in item && typeof (item as any).id === 'number') {
        // Fallback: falls id als number verwendet wird
        selectPainLevel((item as any).id)
      }
      break
    default:
      debug.warn('PainDialog', 'Item selection in unexpected state', { 
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
    debug.log('PainDialog', 'Input detected', {
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

// ===== WATCHERS =====
watch(() => state.value, (newState, oldState) => {
  if (oldState !== undefined) {
    debug.log('PainDialog', 'State changed', {
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
  debugComponent.lifecycle('PainDialogView', 'mounted')
  debugComponent.props('PainDialogView', { isMobile: isMobile.value })
  
  // Register cleanup in registry (replaces window globals)
  cleanupRegistry.register('pain-dialog', async () => {
    debug.log('PainDialog', 'Cleanup called via registry')
    machine.cleanup()
    inputManager.stop()
  })
  
  // Start Services NACH Cleanup-Registrierung
  if (!faceRecognition.isActive.value) {
    debug.log('PainDialog', 'Starting face recognition')
    faceRecognition.start()
  }
  
  // Reset index
  autoMode.index.value = 0
  
  // Start AutoMode
  debugAutoMode.start(false)
  autoMode.start()
  
  // Start Input Manager
  debug.log('PainDialog', 'Starting Input Manager')
  inputManager.start()
})

onUnmounted(() => {
  debugComponent.lifecycle('PainDialogView', 'unmounted')
  
  // Stop AutoMode
  debugAutoMode.stop()
  autoMode.stop()
  
  // Stop Input Manager
  debug.log('PainDialog', 'Stopping Input Manager')
  inputManager.stop()
  
  // Stop Face Recognition
  if (faceRecognition.isActive.value) {
    debug.log('PainDialog', 'Stopping Face Recognition')
    faceRecognition.stop()
  }
  
  // Unregister cleanup from registry
  cleanupRegistry.unregister('pain-dialog')
})
</script>

<!-- DialogBase.css Import - NICHT scoped, da globale Styles -->
<style>
@import '../../../shared/styles/DialogBase.css';
</style>

<!-- Spezifische Styles für diese Komponente - scoped -->
<style scoped>
/* Icons im Main Grid 20% größer (nur mainView, nicht subRegionView oder painScaleView) */
/* Nur die Icons selbst vergrößern, nicht den Container oder die Kacheln */
.desktop-grid .tile-icon,
.mobile-carousel .tile-icon {
  transform: scale(1.2) !important;
}

/* Emoji Styles für Sub-Regions */
.tile-emoji {
  font-size: clamp(3rem, 10vw, 6rem);
  line-height: 1;
}

/* Pain Scale: Nur Level-Nummer und Beschreibung in einer Zeile - so groß wie h1 - immer weiß */
.pain-level-tile .tile-description {
  font-size: clamp(1.95rem, 5.2vw, 3.25rem) !important; /* Gleiche Größe wie .main-title */
  font-weight: 600 !important;
  color: #ffffff !important; /* Immer weiß */
  margin: 0;
  padding: 0;
  text-align: center;
  line-height: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  width: 100%;
  height: 100%;
}

.pain-level-tile .pain-level-number {
  font-weight: 700;
}

.pain-level-tile .pain-level-comma {
  font-weight: 600;
}

.pain-level-tile .pain-level-desc {
  font-weight: 600;
}

/* Alle anderen Elemente verstecken */
.pain-level-tile .tile-icon-container,
.pain-level-tile .tile-emoji,
.pain-level-tile .tile-text {
  display: none !important;
}

/* Pain Level Tiles: Individuelle Farben pro Kachel */
.pain-level-tile {
  background-color: var(--pain-color, #f3f4f6) !important;
  border-color: var(--pain-color, #e5e7eb) !important;
}

.pain-level-tile.tile-active {
  background-color: var(--pain-color, #667eea) !important;
  border-color: var(--pain-color, #667eea) !important;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3), 0 0 40px var(--pain-color, #667eea) !important;
}

.pain-level-tile.tile-inactive {
  background-color: var(--pain-color, #f3f4f6) !important;
  border-color: var(--pain-color, #e5e7eb) !important;
  opacity: 0.8;
}

/* Dark Mode: Pain Level Tiles */
.dark .pain-level-tile {
  background-color: var(--pain-color, #374151) !important;
  border-color: var(--pain-color, #4b5563) !important;
}

.dark .pain-level-tile.tile-active {
  background-color: var(--pain-color, #667eea) !important;
  border-color: var(--pain-color, #667eea) !important;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5), 0 0 40px var(--pain-color, #667eea) !important;
}

.dark .pain-level-tile.tile-inactive {
  background-color: var(--pain-color, #374151) !important;
  border-color: var(--pain-color, #4b5563) !important;
  opacity: 0.7;
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
  gap: 0.5rem; /* Reduzierter Abstand zwischen Elementen */
  width: 100%;
  height: 100%;
  min-height: 50vh;
}

.confirmation-text {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  font-weight: 600;
  line-height: 1.4;
  margin: 0;
  padding: 0;
  text-align: center;
  width: 100%;
  max-width: 90%;
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
  margin-bottom: 1rem; /* Reduziert von 2rem */
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

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .confirmation-container {
    padding: 1rem 1rem; /* Reduziertes Padding */
    gap: 0.25rem; /* Sehr kleiner Abstand zwischen Elementen */
  }
  
  .confirmation-icon {
    width: 80px;
    height: 80px;
    font-size: 2.5rem;
    margin-bottom: 0.5rem; /* Noch weniger Abstand auf Mobile */
  }

  .tile-emoji {
    font-size: clamp(2.5rem, 8vw, 4rem);
  }
}

/* Portrait-Orientierung: Texte noch näher zusammen */
@media (orientation: portrait) and (max-width: 1024px) {
  .confirmation-container {
    padding: 1.5rem 1rem; /* Weniger Padding in Portrait */
    gap: 0.5rem; /* Kleiner Abstand */
    justify-content: center; /* Zentriert vertikal */
  }
  
  .confirmation-icon {
    margin-bottom: 0.75rem; /* Reduzierter Abstand */
  }
}
</style>

