<template>
  <div id="app" class="pain-dialog">
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

          <!-- Karussell Wrapper für vertikale Zentrierung -->
          <div class="carousel-wrapper">
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
          </div>

          <!-- Karussell Indicators -->
          <div class="carousel-indicators">
            <button 
              v-for="(subRegion, index) in currentSubRegions"
              :key="`indicator-${subRegion.id}`"
              class="carousel-indicator"
              :class="currentTileIndex === index ? 'carousel-indicator-active' : 'carousel-indicator-inactive'"
              @click="goToSubRegion(index)"
              :title="`Index: ${index}, Current: ${currentTileIndex}, Active: ${currentTileIndex === index}`"
            >
            </button>
          </div>
        </div>

        <!-- Pain Scale View -->
        <div v-if="currentState === 'painScaleView'"
             @touchstart="handlePainScaleTouch"
             @click="handlePainScaleClick">
          <div class="pain-scale-display">
            <div class="pain-scale-title">
                  Wie stark sind Ihre {{ getSubRegionTitle(selectedSubRegion) }}schmerzen?
              </div>
              <div class="pain-scale-level">
              {{ painLevels[currentTileIndex]?.level || (currentTileIndex + 1) }}
              </div>
              <div class="pain-scale-description">
              {{ painLevels[currentTileIndex]?.description || getPainDescription(currentTileIndex + 1) }}
            </div>
          </div>

          <div class="pain-scale-bar"
               @touchstart="handlePainScaleTouch"
               @click="handlePainScaleClick">
            <div class="pain-scale-progress"
              :style="{ width: `${((painLevels[currentTileIndex]?.level || (currentTileIndex + 1)) - 1) * 10 + 5}%` }"
            ></div>
            
            <div class="pain-scale-numbers">
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
const hasUserInteracted = ref(false)

// Use pain assessment composable
const {
  currentTileIndex,
  isAutoMode,
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
  if (!region) return regionId
  
  // Korrekte Grammatik für Bereich-Titel
  switch (region.title) {
    case 'ARME':
      return 'Arm'
    case 'BEINE':
      return 'Bein'
    default:
      return region.title
  }
}

const getSubRegionTitle = (subRegionId: string | null) => {
  if (!subRegionId) return ''
  const subRegion = currentSubRegions.value.find(region => region.id === subRegionId)
  return subRegion ? subRegion.title : subRegionId
}

// Navigation functions
const selectMainRegion = async (regionId: string) => {
  console.log('Selecting main region:', regionId)
  
  // Spezielle Behandlung für Zurück-Kachel
  if (regionId === 'zurueck') {
    goBack()
    return
  }
  
  // TTS removed
  if (!hasUserInteracted.value) {
    hasUserInteracted.value = true
    console.log('User first interaction - TTS removed')
  }
  
  selectedMainRegion.value = regionId
  currentState.value = 'subRegionView'
  currentTileIndex.value = 0
  
  const region = mainRegions.find(r => r.id === regionId)
  if (region) {
    console.log(`Wählen Sie einen ${region.title}bereich aus. - TTS removed`)
  }
  
  // Auto-mode disabled to prevent infinite loops
  // setTimeout(() => {
  //   startAutoMode(currentSubRegions.value, 2000, 3000)
  // }, 2000)
}

const selectSubRegion = async (subRegionId: string) => {
  console.log('Selecting sub region:', subRegionId)
  
  if (subRegionId === 'zurueck') {
    // Zurück zu den Hauptregionen
    currentState.value = 'mainView'
    currentTileIndex.value = 0
    selectedMainRegion.value = null
    selectedSubRegion.value = null
    return
  }
  
  selectedSubRegion.value = subRegionId
  currentState.value = 'painScaleView'
  currentTileIndex.value = 0
  
  const subRegionTitle = getSubRegionTitle(selectedSubRegion.value)
  console.log(`Wie stark sind Ihre ${subRegionTitle}schmerzen? - TTS removed`)
  
  // Auto-mode disabled to prevent infinite loops
  // setTimeout(() => {
  //   startAutoMode(painLevels, 2000, 2000)
  // }, 2000)
}

const handleMainRegionRightClick = (event: MouseEvent, regionId: string) => {
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
  console.log('PainDialogView: Right click detected on main region:', regionId)
  selectMainRegion(regionId)
  return false
}

const handleSubRegionRightClick = (event: MouseEvent, subRegionId: string) => {
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
  console.log('PainDialogView: Right click detected on sub-region:', subRegionId)
  selectSubRegion(subRegionId)
  return false
}

const selectPainLevel = async (level: number) => {
  console.log('Selecting pain level:', level)
  selectedPainLevel.value = level
  currentState.value = 'confirmation'
  
  const mainRegion = mainRegions.find(r => r.id === selectedMainRegion.value)
  const subRegion = currentSubRegions.value.find(item => item.id === selectedSubRegion.value)
  const painLevel = painLevels.find(p => p.level === level)
  
  console.log('Pain level selection - mainRegion:', mainRegion, 'subRegion:', subRegion, 'painLevel:', painLevel)
  
  if (mainRegion && subRegion && painLevel) {
    const confirmationText = `${subRegion.title} Schmerzlevel ${level} - ${painLevel.description}`
    console.log('Confirmation:', confirmationText)
    
    // TTS für Bestätigung
    setTimeout(() => {
      speakText('Schmerz erfasst')
    }, 500)
    
    setTimeout(() => {
      speakText(confirmationText)
    }, 2000)
  } else {
    console.error('Missing data for confirmation:', { mainRegion, subRegion, painLevel })
  }
  
  // After confirmation, return to main view after 6.5 seconds (3.5 seconds more time for TTS)
  setTimeout(() => {
    resetToMainView()
  }, 6500)
}

const resetToMainView = async () => {
  currentState.value = 'mainView'
  currentTileIndex.value = 0
  selectedMainRegion.value = null
  selectedSubRegion.value = null
  selectedPainLevel.value = null
  
  console.log('Wo haben Sie Schmerzen? - TTS removed')
  
  // Start auto-mode for main regions (nur einmal)
  if (!isAutoMode.value) {
    setTimeout(() => {
      startAutoMode(mainRegions, 1000, 3000)
    }, 2000)
  }
}

// Selection handlers for different views
const handleMainRegionSelection = (item: any) => {
  console.log('Main region selection handler called with:', item)
  if (item && item.id) {
    selectMainRegion(item.id)
  }
}

const handleSubRegionSelection = (item: any) => {
  console.log('Sub region selection handler called with:', item)
  selectSubRegion(item.id)
}

const handlePainLevelSelection = (item: any) => {
  console.log('Pain level selection handler called with:', item, 'current index:', currentTileIndex.value)
  const level = item.level || (currentTileIndex.value + 1)
  selectPainLevel(level)
}


const goBack = () => {
  console.log('PainDialogView: Going back to main app')
  // Navigate to /app route using Vue Router
  window.location.href = '/ratatosk.2.0/app'
}

const goToSubRegion = (index: number) => {
  console.log('goToSubRegion called with index:', index, 'current:', currentTileIndex.value)
  if (index >= 0 && index < currentSubRegions.value.length) {
    currentTileIndex.value = index
    console.log('currentTileIndex updated to:', currentTileIndex.value)
  } else {
    // Reibungsloser Loop - wenn Index außerhalb des Bereichs, loope zurück
    if (index < 0) {
      currentTileIndex.value = currentSubRegions.value.length - 1
    } else if (index >= currentSubRegions.value.length) {
      currentTileIndex.value = 0
    }
    console.log('Looped currentTileIndex to:', currentTileIndex.value)
  }
}

// Touch-Handler für Pain Scale in PainDialogView
const handlePainScaleTouch = (event: TouchEvent) => {
  event.preventDefault()
  event.stopPropagation()
  console.log('Touch detected on pain scale in PainDialogView')
  const level = painLevels[currentTileIndex.value]?.level || (currentTileIndex.value + 1)
  selectPainLevel(level)
}

const handlePainScaleClick = (event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
  console.log('Click detected on pain scale in PainDialogView')
  const level = painLevels[currentTileIndex.value]?.level || (currentTileIndex.value + 1)
  selectPainLevel(level)
}

// Lifecycle management
let cleanup: (() => void) | null = null

onMounted(() => {
  console.log('PainDialogView mounted, current state:', currentState.value)
  
  // Setup initial lifecycle and auto-mode
  cleanup = setupLifecycle(mainRegions, handleMainRegionSelection)
  
  // TTS will be triggered by user interaction instead of setTimeout
  // setTimeout(async () => {
  //   console.log('Wo haben Sie Schmerzen? - TTS removed')
  //   // Auto-mode disabled to prevent infinite loops
  //   // startAutoMode(mainRegions, 1000, 3000)
  // }, 1000)
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
      // Erst den korrekten Titel mit Bereich vorlesen (nur wenn es nicht die Zurück-Kachel ist)
      setTimeout(() => {
        const mainRegionTitle = getMainRegionTitle(selectedMainRegion.value)
        if (mainRegionTitle !== 'Zurück') {
          speakText(`Wählen Sie einen ${mainRegionTitle}bereich aus`)
        }
      }, 1000)
      // Dann Auto-Mode für Sub-Regions starten
      setTimeout(() => {
        cleanup = setupLifecycle(currentSubRegions.value, handleSubRegionSelection)
      }, 4000)
      break
    case 'painScaleView':
      console.log('Setting up pain scale view with', painLevels.length, 'levels')
      // Erst den korrekten Titel mit Körperteil vorlesen
      setTimeout(() => {
        const subRegionTitle = getSubRegionTitle(selectedSubRegion.value)
        speakText(`Wie stark sind Ihre ${subRegionTitle}schmerzen?`)
      }, 1000)
      // Dann Auto-Mode für Pain Scale starten
      setTimeout(() => {
        cleanup = setupLifecycle(painLevels, handlePainLevelSelection)
      }, 4000)
      break
  }
})
</script>

<style scoped>
@import './PainDialogView.css';
</style>