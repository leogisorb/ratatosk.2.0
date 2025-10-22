<template>
  <div id="app" class="pain-dialog">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content -->
    <main class="main-content">
      <div class="content-wrapper">
        
        <!-- Main View: Category Selection -->
        <div v-if="currentState === 'mainView'">
          <div class="main-title">
            Wählen Sie einen Bereich aus
          </div>

          <div class="grid-container">
            <!-- Dynamic Menu Tiles -->
            <div 
              v-for="(region, index) in mainRegions"
              :key="region.id"
              class="menu-tile"
              :class="[
                currentTileIndex === index ? 'tile-active' : 'tile-inactive',
                region.id === 'zurueck' ? 'back-tile' : ''
              ]"
              @click="region.id === 'zurueck' ? goBack() : selectMainRegion(region.id)"
              @contextmenu.prevent="region.id === 'zurueck' ? goBack() : handleMainRegionRightClick($event, region.id)"
            >
              <div 
                class="tile-icon-container"
                :class="currentTileIndex === index ? 'icon-active' : 'icon-inactive'"
              >
                <img 
                  v-if="region.icon" 
                  :src="region.icon" 
                  :alt="region.title" 
                  class="tile-icon"
                  :class="currentTileIndex === index ? 'icon-inverted' : ''"
                />
              </div>
              <div 
                class="tile-text"
                :class="currentTileIndex === index ? 'text-active' : 'text-inactive'"
              >
                {{ region.title }}
              </div>
            </div>
          </div>
        </div>

        <!-- Sub Region View -->
        <div v-if="currentState === 'subRegionView'">
          <div class="main-title">
            Wählen Sie einen {{ getMainRegionTitle(selectedMainRegion) }}bereich aus
          </div>

          <!-- Karussell Container -->
          <div class="carousel-container">
            <!-- Karussell Content -->
            <div class="carousel-content">
              <div 
                v-for="(subRegion, index) in currentSubRegions"
                :key="subRegion.id"
                class="carousel-item"
                :class="currentTileIndex === index ? 'carousel-item-active' : 'carousel-item-inactive'"
                :style="{
                  '--offset': index - currentTileIndex,
                  '--rotation': (index < currentTileIndex ? -20 : index > currentTileIndex ? 20 : 0) + 'deg'
                }"
                @click="selectSubRegion(subRegion.id)"
                @contextmenu.prevent="handleSubRegionRightClick($event, subRegion.id)"
              >
                <div class="carousel-item-content">
                  <div 
                    class="tile-icon-container"
                    :class="currentTileIndex === index ? 'icon-active' : 'icon-inactive'"
                  >
                    <img 
                      v-if="subRegion.icon" 
                      :src="subRegion.icon" 
                      :alt="subRegion.title" 
                      class="tile-icon"
                      :class="currentTileIndex === index ? 'icon-inverted' : ''"
                    />
                  </div>
                  <div 
                    class="tile-text"
                    :class="currentTileIndex === index ? 'text-active' : 'text-inactive'"
                  >
                    {{ subRegion.title }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Karussell Indicators -->
          <div class="carousel-indicators">
            <button 
              v-for="(subRegion, index) in currentSubRegions"
              :key="subRegion.id"
              class="carousel-indicator"
              :class="{ 'active': currentTileIndex === index }"
              @click="navigateToIndex(index)"
            ></button>
          </div>
        </div>

        <!-- Pain Scale View -->
        <div v-if="currentState === 'painScaleView'">
          <div class="pain-scale-title">
            Wie stark sind Ihre {{ getSubRegionTitle(selectedSubRegion) }}schmerzen?
          </div>

          <div class="pain-scale-container">
            <div class="pain-scale-bar">
              <div class="pain-scale-track"></div>
              <span 
                v-for="(level, index) in painLevels"
                :key="level.id"
                class="pain-scale-number"
                :class="{ 'active': currentTileIndex === index }"
                :style="{ left: `${(index * 10) + 5}%` }"
                @touchstart="selectPainLevel(level.level)"
                @click="selectPainLevel(level.level)"
              >
                {{ level.level }}
              </span>
            </div>
          </div>
        </div>

        <!-- Confirmation View -->
        <div v-if="currentState === 'confirmationView'">
          <div class="confirmation-container">
            <h2>Schmerz erfasst</h2>
            <p>Ihre {{ getSubRegionTitle(selectedSubRegion) }}schmerzen wurden erfolgreich erfasst.</p>
            <button 
              class="btn btn-primary"
              @click="goBackToMain()"
            >
              Zurück zum Hauptmenü
            </button>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AppHeader from '../../../shared/components/AppHeader.vue'
import { 
  mainRegions, 
  getSubRegionsByMainRegion 
} from '../data/ichDialogData'

// State management
const currentState = ref<'mainView' | 'subRegionView' | 'painScaleView' | 'confirmationView'>('mainView')
const currentTileIndex = ref(0)
const selectedMainRegion = ref('')
const selectedSubRegion = ref('')

// Pain levels
const painLevels = ref([
  { id: 0, level: 0, label: 'Kein Schmerz' },
  { id: 1, level: 1, label: 'Leicht' },
  { id: 2, level: 2, label: 'Mäßig' },
  { id: 3, level: 3, label: 'Stark' },
  { id: 4, level: 4, label: 'Sehr stark' },
  { id: 5, level: 5, label: 'Unerträglich' }
])

// Computed properties
const currentSubRegions = computed(() => {
  if (!selectedMainRegion.value) return []
  return getSubRegionsByMainRegion(selectedMainRegion.value)
})

// Navigation methods
const selectMainRegion = (regionId: string) => {
  if (regionId === 'zurueck') {
    goBack()
    return
  }
  
  selectedMainRegion.value = regionId
  currentState.value = 'subRegionView'
  currentTileIndex.value = 0
  
  // TTS announcement
  speakText(`Wählen Sie einen ${getMainRegionTitle(regionId)}bereich aus`)
}

const selectSubRegion = (subRegionId: string) => {
  if (subRegionId === 'zurueck') {
    goBackToMain()
    return
  }
  
  selectedSubRegion.value = subRegionId
  currentState.value = 'painScaleView'
  currentTileIndex.value = 0
  
  // TTS announcement
  speakText(`Wie stark sind Ihre ${getSubRegionTitle(subRegionId)}schmerzen?`)
}

const selectPainLevel = (level: number) => {
  console.log('Pain level selected:', level)
  currentState.value = 'confirmationView'
  
  // TTS announcement
  speakText('Schmerz erfasst')
}

const goBack = () => {
  if (currentState.value === 'subRegionView') {
    goBackToMain()
  } else if (currentState.value === 'painScaleView') {
    goBackToSub()
  } else if (currentState.value === 'confirmationView') {
    goBackToMain()
  }
}

const goBackToMain = () => {
  currentState.value = 'mainView'
  selectedMainRegion.value = ''
  currentTileIndex.value = 0
  
  // TTS announcement
  speakText('Wählen Sie einen Bereich aus')
}

const goBackToSub = () => {
  currentState.value = 'subRegionView'
  selectedSubRegion.value = ''
  currentTileIndex.value = 0
  
  // TTS announcement
  speakText(`Wählen Sie einen ${getMainRegionTitle(selectedMainRegion.value)}bereich aus`)
}

// Carousel navigation
const navigateToIndex = (index: number) => {
  currentTileIndex.value = index
}

// Helper methods
const getMainRegionTitle = (regionId: string) => {
  const region = mainRegions.find(r => r.id === regionId)
  return region ? region.title : ''
}

const getSubRegionTitle = (subRegionId: string) => {
  const subRegion = currentSubRegions.value.find(r => r.id === subRegionId)
  return subRegion ? subRegion.title : ''
}

// TTS functionality
const speakText = (text: string) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'de-DE'
    utterance.rate = 0.8
    speechSynthesis.speak(utterance)
  }
}

// Right-click handlers
const handleMainRegionRightClick = (event: MouseEvent, regionId: string) => {
  event.preventDefault()
  selectMainRegion(regionId)
}

const handleSubRegionRightClick = (event: MouseEvent, subRegionId: string) => {
  event.preventDefault()
  selectSubRegion(subRegionId)
}

// Keyboard navigation
const handleKeyboardNavigation = (event: KeyboardEvent) => {
  if (currentState.value === 'mainView') {
    switch (event.key) {
      case 'ArrowRight':
        currentTileIndex.value = Math.min(currentTileIndex.value + 1, mainRegions.length - 1)
        break
      case 'ArrowLeft':
        currentTileIndex.value = Math.max(currentTileIndex.value - 1, 0)
        break
      case 'Enter':
        selectMainRegion(mainRegions[currentTileIndex.value].id)
        break
    }
  } else if (currentState.value === 'subRegionView') {
    switch (event.key) {
      case 'ArrowRight':
        currentTileIndex.value = Math.min(currentTileIndex.value + 1, currentSubRegions.value.length - 1)
        break
      case 'ArrowLeft':
        currentTileIndex.value = Math.max(currentTileIndex.value - 1, 0)
        break
      case 'Enter':
        selectSubRegion(currentSubRegions.value[currentTileIndex.value].id)
        break
    }
  } else if (currentState.value === 'painScaleView') {
    switch (event.key) {
      case 'ArrowRight':
        currentTileIndex.value = Math.min(currentTileIndex.value + 1, painLevels.value.length - 1)
        break
      case 'ArrowLeft':
        currentTileIndex.value = Math.max(currentTileIndex.value - 1, 0)
        break
      case 'Enter':
        selectPainLevel(painLevels.value[currentTileIndex.value].level)
        break
    }
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeyboardNavigation)
  speakText('Wählen Sie einen Bereich aus')
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyboardNavigation)
})
</script>

<style scoped>
@import './IchDialogView.css';
</style>