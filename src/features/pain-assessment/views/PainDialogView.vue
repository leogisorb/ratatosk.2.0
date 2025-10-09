<template>
  <div class="pain-dialog-app">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content -->
    <main class="main-content">
      <div class="content-wrapper">
        
        <!-- Main View: Body Region Selection -->
        <div v-if="currentState === 'mainView'">
          <div class="main-title">
            Wo haben Sie Schmerzen?
          </div>

          <div class="pain-dialog-grid">
            <!-- Row 1: Kopf, Beine -->
            <div class="pain-dialog-row">
              <button
                v-for="(region, index) in mainRegions.slice(0, 2)"
                :key="region.id"
                @click="selectMainRegion(region.id)"
                class="pain-dialog-item"
                :class="currentTileIndex === index ? 'active' : 'inactive'"
              >
                <img v-if="region.icon" :src="region.icon" :alt="region.title" class="pain-dialog-icon" />
                <span class="pain-dialog-text">{{ region.title }}</span>
              </button>
            </div>
            
            <!-- Row 2: Arme, Torso -->
            <div class="pain-dialog-row">
              <button
                v-for="(region, index) in mainRegions.slice(2, 4)"
                :key="region.id"
                @click="selectMainRegion(region.id)"
                class="pain-dialog-item"
                :class="currentTileIndex === index + 2 ? 'active' : 'inactive'"
              >
                <img v-if="region.icon" :src="region.icon" :alt="region.title" class="pain-dialog-icon" />
                <span class="pain-dialog-text">{{ region.title }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Sub Region View -->
        <div v-if="currentState === 'subRegionView'">
          <div class="main-title">
            Wählen Sie einen {{ getMainRegionTitle(selectedMainRegion) }}bereich aus
          </div>

          <div class="pain-dialog-grid sub-region-grid">
              <button
              v-for="(subRegion, index) in currentSubRegions"
                :key="subRegion.id"
                @click="selectSubRegion(subRegion.id)"
              class="pain-dialog-item sub-region-item"
              :class="currentTileIndex === index ? 'active' : 'inactive'"
            >
              <img v-if="subRegion.icon" :src="subRegion.icon" :alt="subRegion.title" class="pain-dialog-icon sub-region-icon" />
              <span class="pain-dialog-text sub-region-text">{{ subRegion.title }}</span>
              </button>
          </div>
        </div>

        <!-- Pain Scale View -->
        <div v-if="currentState === 'painScaleView'">
          <div class="pain-scale-display">
            <div class="pain-scale-body-part">
                  {{ getSubRegionTitle(selectedSubRegion) }}
            </div>
            <div class="pain-scale-title">
                  Schmerzlevel:
              </div>
              <div class="pain-scale-level">
              {{ currentTileIndex + 1 }}
              </div>
              <div class="pain-scale-description">
              {{ getPainDescription(currentTileIndex + 1) }}
            </div>
          </div>

          <div class="pain-scale-bar">
            <div class="pain-scale-progress"
              :style="{ width: `${(currentTileIndex + 1 - 1) * 10 + 5}%` }"
            ></div>
            
            <div class="pain-scale-numbers">
              <span 
                v-for="(level, index) in painLevels" 
                :key="level.id"
                class="pain-scale-number"
                :class="{ 'active': currentTileIndex === index }"
                :style="{ left: `${(index * 10) + 5}%` }"
              >
                {{ level.level }}
              </span>
            </div>
          </div>
        </div>

        <!-- Confirmation View -->
        <div v-if="currentState === 'confirmation'">
          <div class="confirmation-container">
            <h2>Schmerz erfasst</h2>
            <p>{{ getSubRegionTitle(selectedSubRegion) }} - Schmerzlevel {{ selectedPainLevel }} - {{ selectedPainLevel ? getPainDescription(selectedPainLevel) : '' }}</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { usePainAssessment } from '../composables/usePainAssessment'
import { 
  mainRegions, 
  kopfSubRegions, 
  beineSubRegions, 
  armeSubRegions, 
  torsoSubRegions, 
  painLevels,
  getSubRegionsByMainRegion,
  getPainDescription
} from '../data/painAssessmentData'
import AppHeader from '../../../shared/components/AppHeader.vue'

// Pain dialog states
type PainDialogState = 'mainView' | 'subRegionView' | 'painScaleView' | 'confirmation'

// Reactive state
const currentState = ref<PainDialogState>('mainView')
const selectedMainRegion = ref<string | null>(null)
const selectedSubRegion = ref<string | null>(null)
const selectedPainLevel = ref<number | null>(null)

// Use pain assessment composable
const {
  currentTileIndex,
  isAutoMode,
  isAutoModePaused,
  startAutoMode,
  pauseAutoMode,
  stopAutoMode,
  speakText,
  setupLifecycle
} = usePainAssessment()

// Computed properties
const currentSubRegions = computed(() => {
  if (!selectedMainRegion.value) return []
  return getSubRegionsByMainRegion(selectedMainRegion.value)
})

// Helper functions
const getMainRegionTitle = (regionId: string | null) => {
  if (!regionId) return ''
  const region = mainRegions.find(r => r.id === regionId)
  return region ? region.title : regionId
}

const getSubRegionTitle = (subRegionId: string | null) => {
  if (!subRegionId) return ''
  const subRegion = currentSubRegions.value.find(region => region.id === subRegionId)
  return subRegion ? subRegion.title : subRegionId
}

// Navigation functions
const selectMainRegion = async (regionId: string) => {
  console.log('Selecting main region:', regionId)
  selectedMainRegion.value = regionId
  currentState.value = 'subRegionView'
  currentTileIndex.value = 0
  
  const region = mainRegions.find(r => r.id === regionId)
  if (region) {
    await speakText(`Wählen Sie einen ${region.title}bereich aus.`)
  }
  
  // Start auto-mode for sub-regions
  setTimeout(() => {
    startAutoMode(currentSubRegions.value, 1000, 3000)
  }, 2000)
}

const selectSubRegion = async (subRegionId: string) => {
  console.log('Selecting sub region:', subRegionId)
  selectedSubRegion.value = subRegionId
  currentState.value = 'painScaleView'
  currentTileIndex.value = 0
  
  await speakText('Wie stark sind Ihre Schmerzen?')
  
  // Start auto-mode for pain levels
  setTimeout(() => {
    startAutoMode(painLevels, 1000, 2000)
  }, 2000)
}

const selectPainLevel = async (level: number) => {
  console.log('Selecting pain level:', level)
  selectedPainLevel.value = level
  currentState.value = 'confirmation'
  
  const mainRegion = mainRegions.find(r => r.id === selectedMainRegion.value)
  const subRegion = currentSubRegions.value.find(item => item.id === selectedSubRegion.value)
  const painLevel = painLevels.find(p => p.level === level)
  
  if (mainRegion && subRegion && painLevel) {
    const confirmationText = `${subRegion.title} Schmerzlevel ${level} - ${painLevel.description}`
    await speakText(confirmationText)
  }
  
  // After confirmation, return to main view after 3 seconds
  setTimeout(() => {
    resetToMainView()
  }, 3000)
}

const resetToMainView = async () => {
  currentState.value = 'mainView'
  currentTileIndex.value = 0
  selectedMainRegion.value = null
  selectedSubRegion.value = null
  selectedPainLevel.value = null
  
  await speakText('Wo haben Sie Schmerzen?')
  
  // Start auto-mode for main regions
  setTimeout(() => {
    startAutoMode(mainRegions, 1000, 3000)
  }, 2000)
}

// Selection handlers for different views
const handleMainRegionSelection = (item: any) => {
  console.log('Main region selection handler called with:', item)
  selectMainRegion(item.id)
}

const handleSubRegionSelection = (item: any) => {
  console.log('Sub region selection handler called with:', item)
  selectSubRegion(item.id)
}

const handlePainLevelSelection = (item: any) => {
  console.log('Pain level selection handler called with:', item, 'current index:', currentTileIndex.value)
  const level = currentTileIndex.value + 1
  selectPainLevel(level)
}

// Lifecycle management
let cleanup: (() => void) | null = null

onMounted(() => {
  console.log('PainDialogView mounted, current state:', currentState.value)
  
  // Setup initial lifecycle and auto-mode
  cleanup = setupLifecycle(mainRegions, handleMainRegionSelection)
  
  // Start with welcome message and auto-mode
  setTimeout(async () => {
    await speakText('Wo haben Sie Schmerzen?')
    startAutoMode(mainRegions, 1000, 3000)
  }, 1000)
})

onUnmounted(() => {
  if (cleanup) {
    cleanup()
  }
  stopAutoMode()
})

// Watch for state changes to update lifecycle
watch(currentState, (newState) => {
  console.log('State changed to:', newState)
  stopAutoMode()
  
  // Clean up previous lifecycle
  if (cleanup) {
    cleanup()
  }
  
  // Reset tile index for new state
  currentTileIndex.value = 0
  
  // Setup new lifecycle based on state
  switch (newState) {
    case 'mainView':
      console.log('Setting up main view with', mainRegions.length, 'regions')
      cleanup = setupLifecycle(mainRegions, handleMainRegionSelection)
      break
    case 'subRegionView':
      console.log('Setting up sub region view with', currentSubRegions.value.length, 'sub-regions')
      cleanup = setupLifecycle(currentSubRegions.value, handleSubRegionSelection)
      break
    case 'painScaleView':
      console.log('Setting up pain scale view with', painLevels.length, 'levels')
      cleanup = setupLifecycle(painLevels, handlePainLevelSelection)
      break
  }
})
</script>

<style scoped>
/* Pain Dialog View - CSS basierend auf SchmerzView */

/* App Container */
.pain-dialog-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  background-color: #f8f9fa;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.content-wrapper {
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

/* Main Title - ohne Hintergrund und Box */
.main-title {
  font-family: 'Source Code Pro', monospace;
  font-size: 3.5rem;
  font-weight: normal;
  color: black;
  text-align: center;
  margin-bottom: 2rem;
}

/* Grid Layout - 2x2 Grid für 4 Tiles */
.pain-dialog-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 2.4rem;
  justify-items: center;
  align-items: center;
}

.pain-dialog-row {
  display: contents;
}

/* Menu Tiles - identisch mit SchmerzView */
.pain-dialog-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  padding: 1rem;
  border: 2px solid #9ca3af;
  border-radius: 2rem;
  width: 32rem;
  height: 20rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
  user-select: none;
}

.pain-dialog-item:hover {
  background-color: #f3f4f6;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  transform: scale(1.05);
}

.pain-dialog-item:active {
  transform: scale(0.98);
}

.pain-dialog-item.active {
  background-color: #00B098;
  color: white;
}

.pain-dialog-item.inactive {
  background-color: white;
  color: black;
}

.pain-dialog-icon {
  width: 8.5rem;
  height: 8.5rem;
  object-fit: contain;
  max-width: 8.5rem;
  max-height: 8.5rem;
  margin-bottom: 3rem;
}

.pain-dialog-item.active .pain-dialog-icon {
  filter: brightness(0) invert(1);
}

.pain-dialog-text {
  text-align: center;
  font-family: 'Source Code Pro', monospace;
  font-weight: normal;
  font-size: 3.5rem;
}

.pain-dialog-item.active .pain-dialog-text {
  color: white;
}

.pain-dialog-item.inactive .pain-dialog-text {
  color: black;
}

/* Sub Region Grid - 4 Kacheln pro Zeile */
.sub-region-grid {
  display: grid !important;
  grid-template-columns: repeat(4, 1fr) !important;
  grid-template-rows: repeat(auto-fit, 1fr) !important;
  gap: 1.2rem !important;
  justify-items: center;
  align-items: center;
}

/* Sub Region Items - 25% größer als 50% kleiner */
.sub-region-item {
  width: 20rem !important;
  height: 12.5rem !important;
}

.sub-region-icon {
  width: 5.3125rem !important;
  height: 5.3125rem !important;
  margin-bottom: 1.875rem !important;
}

.sub-region-text {
  font-size: 2.1875rem !important;
}

/* Pain Scale Styles - ohne Box */
.pain-scale-display {
  margin-bottom: 4rem;
  text-align: center;
}

.pain-scale-body-part {
  font-family: 'Source Code Pro', monospace;
  font-size: 3.5rem;
  font-weight: normal;
  color: black;
  margin: 0;
}

.pain-scale-title {
  font-family: 'Source Code Pro', monospace;
  font-size: 3.5rem;
  font-weight: normal;
  color: black;
  margin: 0;
}

.pain-scale-level {
  font-family: 'Source Code Pro', monospace;
  font-size: 8rem;
  font-weight: normal;
  color: black;
  margin: 1rem 0;
}

.pain-scale-description {
  font-family: 'Source Code Pro', monospace;
  font-size: 2.5rem;
  font-weight: normal;
  color: black;
  margin: 0;
}

.pain-scale-bar {
  position: relative;
  width: 290%;
  height: 80px;
  background-color: #e5e7eb;
  border-radius: 40px;
  overflow: hidden;
  margin: 2rem auto;
  transform: translateX(-50%);
  left: 50%;
}

.pain-scale-progress {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50 0%, #FFC107 50%, #F44336 100%);
  border-radius: 40px;
  transition: width 0.3s ease;
}

.pain-scale-numbers {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
}

.pain-scale-number {
  position: absolute;
  font-family: 'Source Code Pro', monospace;
  font-size: 3rem;
  font-weight: normal;
  color: black;
  transform: translateX(-50%);
  transition: all 0.3s ease;
}

.pain-scale-number.active {
  font-size: 3.75rem;
  font-weight: bold;
  color: black;
}

/* Confirmation Styles */
.confirmation-container {
  background-color: white;
  border: 2px solid #9ca3af;
  border-radius: 2rem;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.confirmation-container h2 {
  font-family: 'Source Code Pro', monospace;
  font-size: 3.5rem;
  font-weight: normal;
  color: black;
  margin: 0 0 1rem 0;
}

.confirmation-container p {
  font-family: 'Source Code Pro', monospace;
  font-size: 2.5rem;
  font-weight: normal;
  color: black;
  margin: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .pain-dialog-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .sub-region-grid {
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 1rem !important;
  }
  
  .pain-dialog-item {
    width: 100%;
    max-width: 400px;
    height: 15rem;
  }
  
  .sub-region-item {
    width: 10rem !important;
    height: 6.25rem !important;
  }
  
  .sub-region-icon {
    width: 2.65625rem !important;
    height: 2.65625rem !important;
    margin-bottom: 0.9375rem !important;
  }
  
  .sub-region-text {
    font-size: 1.09375rem !important;
  }
  
  .pain-dialog-text {
    font-size: 2.5rem;
  }
  
  .main-title {
    font-size: 2.5rem;
  }
  
  .pain-scale-body-part,
  .pain-scale-title {
    font-size: 2.5rem;
  }
  
  .pain-scale-level {
    font-size: 6rem;
  }
  
  .pain-scale-description {
    font-size: 2rem;
  }
  
  .pain-scale-number {
    font-size: 2.25rem;
  }
  
  .pain-scale-number.active {
    font-size: 3rem;
    color: black;
  }
  
  .confirmation-container h2 {
    font-size: 2.5rem;
  }
  
  .confirmation-container p {
    font-size: 2rem;
  }
}
</style>