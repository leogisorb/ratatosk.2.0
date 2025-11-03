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

          <div class="grid-container">
            <!-- Dynamic Menu Tiles -->
            <div 
              v-for="(region, index) in items"
              :key="region.id"
              class="menu-tile"
              :class="[
                autoMode.index.value === index ? 'tile-active' : 'tile-inactive',
                region.id === 'zurueck' ? 'back-tile' : ''
              ]"
              @click="autoMode.index.value === index ? (region.id === 'zurueck' ? goBack() : selectMainRegion(String(region.id))) : null"
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
                      v-if="'icon' in subRegion && subRegion.icon" 
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
import { computed, onMounted, onUnmounted } from 'vue'
import { usePainDialogMachine } from '../composables/usePainDialogMachine'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useInputManager } from '../../../shared/composables/useInputManager'
import type { InputEvent } from '../../../core/application/InputManager'
import AppHeader from '../../../shared/components/AppHeader.vue'

// ✅ Neue modulare Architektur
const machine = usePainDialogMachine()
const faceRecognition = useFaceRecognition()

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

// ✅ Navigation Helper
const goBack = () => {
  if (state.value === 'subRegionView') {
    selectSubRegion('zurueck')
  }
}


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
// ✅ Nur Blinzeln und linke Maustaste
const inputManager = useInputManager({
  onSelect: (event: InputEvent) => {
    console.log('InputManager: Input detected', event.type, event.source)
    // ✅ Einheitlicher Callback für Blink und linke Maustaste
    handleBlink()
  },
  enabledInputs: ['blink', 'click'], // ✅ Nur Blinzeln und linke Maustaste
  cooldown: 300 // ✅ Verhindert zu häufige Inputs
})

// ✅ Lifecycle
onMounted(() => {
  // Start Face Recognition
  if (!faceRecognition.isActive.value) {
    faceRecognition.start()
  }
  
  // Start AutoMode
  autoMode.start()
  
  // ✅ Start Input Manager - alle Handler werden automatisch registriert!
  inputManager.start()
})

onUnmounted(() => {
  // Stop AutoMode
  autoMode.stop()
  
  // ✅ Stop Input Manager - alle Handler werden automatisch entfernt!
  inputManager.stop()
  
  // Stop Face Recognition
  if (faceRecognition.isActive.value) {
    faceRecognition.stop()
  }
})
</script>

<style scoped>
@import '../../../shared/styles/DialogBase.css';
</style>
