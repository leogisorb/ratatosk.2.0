<template>
  <div id="app" class="environment-dialog">
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

        <!-- ===== SUB REGION VIEW ===== -->
        <template v-if="state === 'subRegionView'">
          <!-- Horizontales Karussell für Sub-Regions -->
          <div class="carousel-wrapper">
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
                  <div v-if="item.emoji" class="tile-emoji">{{ item.emoji }}</div>
                  <img
                    v-else-if="item.icon"
                    :src="item.icon"
                    :alt="item.title"
                    class="tile-icon"
                  />
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

        <!-- ===== SUB SUB REGION VIEW (Verben) ===== -->
        <template v-if="state === 'subSubRegionView'">
          <!-- Horizontales Karussell für Sub-Sub-Regions (Verben) -->
          <div class="carousel-wrapper">
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
                  <div v-if="item.emoji" class="tile-emoji">{{ item.emoji }}</div>
                  <img
                    v-else-if="item.icon"
                    :src="item.icon"
                    :alt="item.title"
                    class="tile-icon"
                  />
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
import { watch, onMounted, onUnmounted } from 'vue'
import { useEnvironmentDialogMachine } from '../composables/useEnvironmentDialogMachine'
import { useEnvironmentDictionary } from '../composables/useEnvironmentDictionary'
import { useInputManager } from '../../../shared/composables/useInputManager'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useMobileDetection } from '../../../shared/composables/useMobileDetection'
import AppHeader from '../../../shared/components/AppHeader.vue'
import { debug, debugComponent, debugAutoMode } from '../../../shared/utils/debug'

// ===== COMPOSABLES =====
const machine = useEnvironmentDialogMachine()
const dict = useEnvironmentDictionary()
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
  selectSubSubRegion,
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
  debug.log('UmgebungDialog', 'Touch start', { y: touchStartY })
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
      debug.log('UmgebungDialog', 'Swipe down', { newIndex })
    } else {
      // Swipe nach oben = nächste Karte
      const newIndex = Math.min(items.value.length - 1, autoMode.index.value + 1)
      autoMode.index.value = newIndex
      debug.log('UmgebungDialog', 'Swipe up', { newIndex })
    }
  }
}

// ===== ITEM INTERACTION =====
const handleItemClick = (item: any, index: number) => {
  debug.log('UmgebungDialog', 'Item clicked', { 
    itemId: item.id, 
    index,
    state: state.value,
    isBackButton: item.id === dict.ID_BACK,
    isActive: index === autoMode.index.value
  })

  // Aktiviere User-Interaktion für TTS
  enableTTSOnInteraction()

  // ✅ Zurück-Button ist IMMER klickbar (auch wenn nicht im AutoMode aktiv)
  if (item.id === dict.ID_BACK) {
    handleBackButton()
    return
  }

  // ✅ Alle anderen Buttons sind NUR klickbar, wenn sie im AutoMode aktiv sind
  handleItemSelection(item, index)
}

const handleContextMenu = (item: any, index: number) => {
  debug.log('UmgebungDialog', 'Context menu', { 
    itemId: item.id, 
    index,
    state: state.value 
  })
  // Context menu handling if needed
}

const handleBackButton = () => {
  switch (state.value) {
    case 'subSubRegionView':
      selectSubSubRegion(dict.ID_BACK)
      break
    case 'subRegionView':
      selectSubRegion(dict.ID_BACK)
      break
    case 'mainView':
    default:
      goBack()
      break
  }
}

const handleItemSelection = (item: any, index: number) => {
  switch (state.value) {
    case 'mainView':
      if (autoMode.index.value === index) {
        selectMainRegion(item.id)
      }
      break
    case 'subRegionView':
      if (autoMode.index.value === index) {
        selectSubRegion(item.id)
      }
      break
    case 'subSubRegionView':
      if (autoMode.index.value === index) {
        selectSubSubRegion(item.id)
      }
      break
    default:
      debug.warn('UmgebungDialog', 'Item selection in unexpected state', { 
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
    debug.log('UmgebungDialog', 'Input detected', {
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
    debug.log('UmgebungDialog', 'State changed', {
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
  debugComponent.lifecycle('EnvironmentDialogView', 'mounted')
  debugComponent.props('EnvironmentDialogView', { isMobile: isMobile.value })
  
  // ✅ Cleanup SOFORT verfügbar machen (BEVOR Services starten)
  ;(window as any).__environmentDialogCleanup = () => {
    debug.log('UmgebungDialog', 'Global cleanup called')
    machine.cleanup()
    inputManager.stop()
  }
  
  // Start Services NACH Cleanup-Registrierung
  if (!faceRecognition.isActive.value) {
    debug.log('UmgebungDialog', 'Starting face recognition')
    faceRecognition.start()
  }
  
  // Reset index
  autoMode.index.value = 0
  
  // Start AutoMode
  debugAutoMode.start(false)
  autoMode.start()
  
  // Start Input Manager
  debug.log('UmgebungDialog', 'Starting Input Manager')
  inputManager.start()
})

onUnmounted(() => {
  debugComponent.lifecycle('EnvironmentDialogView', 'unmounted')
  
  // Stop AutoMode
  debugAutoMode.stop()
  autoMode.stop()
  
  // Stop Input Manager
  debug.log('UmgebungDialog', 'Stopping Input Manager')
  inputManager.stop()
  
  // Stop Face Recognition
  if (faceRecognition.isActive.value) {
    debug.log('UmgebungDialog', 'Stopping Face Recognition')
    faceRecognition.stop()
  }
  
  // Remove global cleanup
  delete (window as any).__environmentDialogCleanup
})
</script>

<!-- DialogBase.css Import - NICHT scoped, da globale Styles -->
<style>
@import '../../../shared/styles/DialogBase.css';
</style>

<!-- Spezifische Styles für diese Komponente - scoped -->
<style scoped>
/* Falls UmgebungDialog spezifische Styles braucht, hier einfügen */
</style>
