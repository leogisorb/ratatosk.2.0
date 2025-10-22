<template>
  <div id="app" class="pain-dialog">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content -->
    <main class="main-content">
      <div class="content-wrapper">
        
        <!-- Main View: Ich Region Selection -->
        <div v-if="currentState === 'mainView'">
          <div class="main-title">
            Was möchten Sie machen?
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
            {{ getSubRegionTitle(selectedMainRegion) }}
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
                    <div v-if="subRegion.emoji" class="tile-emoji">{{ subRegion.emoji }}</div>
                    <img 
                      v-else-if="subRegion.icon" 
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
              :key="`indicator-${subRegion.id}`"
              class="carousel-indicator"
              :class="currentTileIndex === index ? 'carousel-indicator-active' : 'carousel-indicator-inactive'"
              @click="goToSubRegion(index)"
              :title="`Index: ${index}, Current: ${currentTileIndex}, Active: ${currentTileIndex === index}`"
            >
            </button>
          </div>
        </div>

        <!-- Confirmation View -->
        <div v-if="currentState === 'confirmation'">
          <div class="confirmation-container">
            <h2>{{ getConfirmationTitle() }}</h2>
            <p>{{ getConfirmationText() }}</p>
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
  ernaehrungSubRegions, 
  gefuehleSubRegions, 
  kleidungSubRegions, 
  hygieneSubRegions, 
  bewegungSubRegions,
  getSubRegionsByMainRegion
} from '../data/ichDialogData'
import AppHeader from '../../../shared/components/AppHeader.vue'

// Ich dialog states
type IchDialogState = 'mainView' | 'subRegionView' | 'confirmation'

// Reactive state
const currentState = ref<IchDialogState>('mainView')
const selectedMainRegion = ref<string | null>(null)
const selectedSubRegion = ref<string | null>(null)
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

// Ensure currentTileIndex starts at 0
currentTileIndex.value = 0

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
    case 'ERNÄHRUNG':
      return 'Ernährungs'
    case 'GEFÜHLE':
      return 'Gefühls'
    case 'KLEIDUNG':
      return 'Kleidungs'
    case 'HYGIENE':
      return 'Hygiene'
    case 'BEWEGUNG':
      return 'Bewegungs'
    default:
      return region.title
  }
}

const getSubRegionTitle = (mainRegionId: string | null) => {
  if (!mainRegionId) return ''
  
  // Return the main title for each category
  switch (mainRegionId) {
    case 'ernaehrung':
      return 'Was wollen Sie zu sich nehmen?'
    case 'gefuehle':
      return 'Wie fühlen Sie sich?'
    case 'kleidung':
      return 'Was möchten Sie anziehen?'
    case 'hygiene':
      return 'Was möchten Sie machen?'
    case 'bewegung':
      return 'Was möchten Sie machen?'
    default:
      return 'Wählen Sie eine Option aus'
  }
}

const getSubRegionItemTitle = (subRegionId: string | null) => {
  if (!subRegionId) return ''
  const subRegion = currentSubRegions.value.find(region => region.id === subRegionId)
  return subRegion ? (subRegion.ttsText || subRegion.title) : subRegionId
}

const getConfirmationTitle = () => {
  return 'Auswahl erfasst'
}

const getConfirmationText = () => {
  const mainRegion = selectedMainRegion.value
  const itemTitle = getSubRegionItemTitle(selectedSubRegion.value)
  
  switch (mainRegion) {
    case 'ernaehrung':
      return `Ich möchte gerne ${itemTitle} zu mir nehmen`
    case 'gefuehle':
      return `Ich fühle mich ${itemTitle}`
    case 'kleidung':
      return `Ich möchte gerne ${itemTitle} anziehen`
    case 'hygiene':
      return `Ich möchte gerne ${itemTitle}`
    case 'bewegung':
      return `Ich möchte gerne ${itemTitle}`
    default:
      return `Sie haben ${itemTitle} gewählt`
  }
}

// Navigation functions
const selectMainRegion = async (regionId: string) => {
  console.log('Selecting main region:', regionId)
  
  if (!hasUserInteracted.value) {
    hasUserInteracted.value = true
    console.log('User first interaction - TTS removed')
  }
  
  selectedMainRegion.value = regionId
  currentState.value = 'subRegionView'
  currentTileIndex.value = 0
  
  const region = mainRegions.find(r => r.id === regionId)
  if (region) {
    console.log(`Wählen Sie eine ${region.title}option aus. - TTS removed`)
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
  currentState.value = 'confirmation'
  
  const subRegionTitle = getSubRegionTitle(selectedSubRegion.value)
  console.log(`Auswahl erfasst: ${subRegionTitle} - TTS removed`)
  
  // TTS für Bestätigung - spezifisch für jede Kategorie
  setTimeout(() => {
    const mainRegion = selectedMainRegion.value
    const itemTitle = getSubRegionItemTitle(subRegionId)
    
    let confirmationText = ''
    switch (mainRegion) {
      case 'ernaehrung':
        confirmationText = `Ich möchte gerne ${itemTitle} zu mir nehmen`
        break
      case 'gefuehle':
        confirmationText = `Ich fühle mich ${itemTitle}`
        break
      case 'kleidung':
        confirmationText = `Ich möchte gerne ${itemTitle} anziehen`
        break
      case 'hygiene':
        confirmationText = `Ich möchte gerne ${itemTitle}`
        break
      case 'bewegung':
        confirmationText = `Ich möchte gerne ${itemTitle}`
        break
      default:
        confirmationText = `Sie haben ${itemTitle} gewählt`
    }
    
    speakText(confirmationText)
  }, 500)
  
  // Keine zusätzliche "Auswahl bestätigt" Nachricht mehr
  // setTimeout(() => {
  //   speakText('Auswahl bestätigt')
  // }, 2000)
  
  // After confirmation, return to main view after 6.5 seconds (3.5 seconds more time for TTS)
  setTimeout(() => {
    resetToMainView()
  }, 6500)
}

const handleMainRegionRightClick = (event: MouseEvent, regionId: string) => {
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
  console.log('IchDialogView: Right click detected on main region:', regionId)
  selectMainRegion(regionId)
  return false
}

const handleSubRegionRightClick = (event: MouseEvent, subRegionId: string) => {
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
  console.log('IchDialogView: Right click detected on sub-region:', subRegionId)
  selectSubRegion(subRegionId)
  return false
}

const resetToMainView = async () => {
  currentState.value = 'mainView'
  currentTileIndex.value = 0
  selectedMainRegion.value = null
  selectedSubRegion.value = null
  
  console.log('Was möchten Sie machen? - TTS removed')
  
  // TTS für Zurück zum Hauptmenü
  setTimeout(() => {
    speakText('Zurück zum Hauptmenü')
  }, 500)
  
  // Start auto-mode for main regions
  setTimeout(() => {
    startAutoMode(mainRegions, 1000, 3000)
  }, 2000)
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
  if (item && item.id) {
    selectSubRegion(item.id)
  }
}

const goBack = () => {
  console.log('Going back to main app')
  // Navigate to pain-dialog route
  router.push('/pain-dialog')
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

// Lifecycle management
let cleanup: (() => void) | null = null

// Keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (currentState.value === 'mainView') {
    switch (event.key) {
      case 'ArrowLeft':
        currentTileIndex.value = Math.max(0, currentTileIndex.value - 1)
        break
      case 'ArrowRight':
        currentTileIndex.value = Math.min(mainRegions.length - 1, currentTileIndex.value + 1)
        break
      case 'Enter':
      case ' ':
        const currentRegion = mainRegions[currentTileIndex.value]
        if (currentRegion) {
          selectMainRegion(currentRegion.id)
        }
        break
    }
  } else if (currentState.value === 'subRegionView') {
    switch (event.key) {
      case 'ArrowLeft':
        currentTileIndex.value = Math.max(0, currentTileIndex.value - 1)
        break
      case 'ArrowRight':
        currentTileIndex.value = Math.min(currentSubRegions.value.length - 1, currentTileIndex.value + 1)
        break
      case 'Enter':
      case ' ':
        const currentSubRegion = currentSubRegions.value[currentTileIndex.value]
        if (currentSubRegion) {
          selectSubRegion(currentSubRegion.id)
        }
        break
    }
  }
}

onMounted(() => {
  console.log('IchDialogView mounted, current state:', currentState.value)
  
  // Ensure we start in main view
  currentState.value = 'mainView'
  currentTileIndex.value = 0
  
  // Add keyboard navigation
  document.addEventListener('keydown', handleKeydown)
  
  // Setup initial lifecycle and auto-mode
  cleanup = setupLifecycle(mainRegions, handleMainRegionSelection)
})

onUnmounted(() => {
  if (cleanup) {
    cleanup()
  }
  stopAutoMode()
  
  // Remove keyboard navigation
  document.removeEventListener('keydown', handleKeydown)
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
      // Erst den korrekten Titel mit Bereich vorlesen
      setTimeout(() => {
        const mainRegionTitle = getMainRegionTitle(selectedMainRegion.value)
        speakText(`Wählen Sie eine ${mainRegionTitle}option aus`)
      }, 1000)
      // Dann Auto-Mode für Sub-Regions starten
      setTimeout(() => {
        cleanup = setupLifecycle(currentSubRegions.value, handleSubRegionSelection)
      }, 4000)
      break
    case 'confirmation':
      console.log('Confirmation view - no auto-mode needed')
      break
  }
})
</script>

<style scoped>
@import './IchDialogView.css';
</style>
