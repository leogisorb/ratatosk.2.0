<template>
  <div id="app" class="pain-dialog">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content -->
    <main class="main-content">
      <div class="content-wrapper">
        
        <!-- Main View: Umgebung Region Selection -->
        <div v-if="currentState === 'mainView'">
          <div class="main-title">
            Was möchten Sie an ihrer Umgebung verändern?
          </div>

          <div class="grid-container">
            <!-- Dynamic Menu Tiles -->
            <div 
              v-for="(region, index) in mainRegions"
              :key="region.id"
              class="menu-tile"
              :class="currentTileIndex === index ? 'tile-active' : 'tile-inactive'"
              @click="region.id === 'zurueck' ? goBack() : selectMainRegion(region.id)"
              @touchstart="region.id === 'zurueck' ? goBack() : handleMainRegionTouch($event, region.id)"
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
                @click="subRegion.id === 'zurueck' ? goBack() : selectSubRegion(subRegion.id)"
                @touchstart="subRegion.id === 'zurueck' ? goBack() : handleSubRegionTouch($event, subRegion.id)"
                @contextmenu.prevent="handleSubRegionRightClick($event, subRegion.id)"
              >
                <div class="carousel-item-content">
                  <div 
                    class="tile-icon-container"
                    :class="currentTileIndex === index ? 'icon-active' : 'icon-inactive'"
                  >
                    <img 
                      v-if="subRegion.icon && !subRegion.emoji" 
                      :src="subRegion.icon" 
                      :alt="subRegion.title" 
                      class="tile-icon"
                      :class="currentTileIndex === index ? 'icon-inverted' : ''"
                    />
                    <div 
                      v-if="subRegion.emoji" 
                      class="tile-emoji"
                      :class="currentTileIndex === index ? 'emoji-active' : 'emoji-inactive'"
                    >
                      {{ subRegion.emoji }}
                    </div>
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

        <!-- Sub-Sub Region View (Verben) -->
        <div v-if="currentState === 'subSubRegionView'">
          <div class="main-title">
            {{ getSubSubRegionTitle(selectedSubRegion) }}
          </div>

          <!-- Karussell Container -->
          <div class="carousel-container">
            <!-- Karussell Content -->
            <div class="carousel-content">
              <div 
                v-for="(subSubRegion, index) in currentSubSubRegions"
                :key="subSubRegion.id"
                class="carousel-item"
                :class="currentTileIndex === index ? 'carousel-item-active' : 'carousel-item-inactive'"
                :style="{
                  '--offset': index - currentTileIndex,
                  '--rotation': (index < currentTileIndex ? -20 : index > currentTileIndex ? 20 : 0) + 'deg'
                }"
                @click="subSubRegion.id === 'zurueck' ? goBack() : selectSubSubRegion(subSubRegion.id)"
                @touchstart="subSubRegion.id === 'zurueck' ? goBack() : handleSubSubRegionTouch($event, subSubRegion.id)"
                @contextmenu.prevent="handleSubSubRegionRightClick($event, subSubRegion.id)"
              >
                <div class="carousel-item-content">
                  <div 
                    class="tile-icon-container"
                    :class="currentTileIndex === index ? 'icon-active' : 'icon-inactive'"
                  >
                    <img 
                      v-if="subSubRegion.icon && !subSubRegion.emoji" 
                      :src="subSubRegion.icon" 
                      :alt="subSubRegion.title" 
                      class="tile-icon"
                      :class="currentTileIndex === index ? 'icon-inverted' : ''"
                    />
                    <div 
                      v-if="subSubRegion.emoji" 
                      class="tile-emoji"
                      :class="currentTileIndex === index ? 'emoji-active' : 'emoji-inactive'"
                    >
                      {{ subSubRegion.emoji }}
                    </div>
                  </div>
                  <div 
                    class="tile-text"
                    :class="currentTileIndex === index ? 'text-active' : 'text-inactive'"
                  >
                    {{ subSubRegion.title }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Karussell Indicators -->
          <div class="carousel-indicators">
            <button 
              v-for="(subSubRegion, index) in currentSubSubRegions"
              :key="`indicator-${subSubRegion.id}`"
              class="carousel-indicator"
              :class="currentTileIndex === index ? 'carousel-indicator-active' : 'carousel-indicator-inactive'"
              @click="goToSubSubRegion(index)"
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
import { useRouter } from 'vue-router'
import { useUmgebungAssessment } from '../composables/useUmgebungAssessment'
import { 
  mainRegions, 
  bettSubRegions, 
  zimmerSubRegions, 
  gegenstaendeSubRegions,
  bettVerbenSubRegions,
  zimmerVerbenSubRegions,
  gegenstaendeVerbenSubRegions,
  getSubRegionsByMainRegion,
  getSubSubRegionsBySubRegion
} from '../data/umgebungDialogData'
import AppHeader from '../../../shared/components/AppHeader.vue'

// Router
const router = useRouter()

// Umgebung dialog states
type UmgebungDialogState = 'mainView' | 'subRegionView' | 'subSubRegionView' | 'confirmation'

// Reactive state
const currentState = ref<UmgebungDialogState>('mainView')
const selectedMainRegion = ref<string | null>(null)
const selectedSubRegion = ref<string | null>(null)
const selectedSubSubRegion = ref<string | null>(null)
const hasUserInteracted = ref(false)

// Use umgebung assessment composable
const {
  currentTileIndex,
  isAutoMode,
  startAutoMode,
  pauseAutoMode,
  stopAutoMode,
  speakText,
  setupLifecycle,
  handleClick
} = useUmgebungAssessment()

// Ensure currentTileIndex starts at 0
currentTileIndex.value = 0

// Computed properties
const currentSubRegions = computed(() => {
  if (!selectedMainRegion.value) return []
  return getSubRegionsByMainRegion(selectedMainRegion.value)
})

const currentSubSubRegions = computed(() => {
  if (!selectedSubRegion.value) return []
  return getSubSubRegionsBySubRegion(selectedSubRegion.value)
})

// Helper functions
const getMainRegionTitle = (regionId: string | null) => {
  if (!regionId) return ''
  const region = mainRegions.find(r => r.id === regionId)
  if (!region) return regionId
  
  // Korrekte Grammatik für Bereich-Titel
  switch (region.title) {
    case 'BETT':
      return 'Bett'
    case 'ZIMMER':
      return 'Zimmer'
    case 'GEGENSTÄNDE':
      return 'Gegenstände'
    default:
      return region.title
  }
}

const getSubRegionTitle = (mainRegionId: string | null) => {
  if (!mainRegionId) return ''
  
  // Return the main title for each category
  switch (mainRegionId) {
    case 'bett':
      return 'Wählen Sie einen Bett-Bereich aus'
    case 'zimmer':
      return 'Wählen Sie einen Zimmer-Bereich aus'
    case 'gegenstaende':
      return 'Wählen Sie einen Gegenstand aus'
    default:
      return 'Wählen Sie eine Option aus'
  }
}

const getSubSubRegionTitle = (subRegionId: string | null) => {
  if (!subRegionId) return ''
  
  // Return the verb title for each sub-region
  switch (subRegionId) {
    case 'decke':
    case 'kissen':
    case 'bettbezug':
    case 'fernbedienung':
      return `Was soll mit ${getSubRegionItemTitle(subRegionId)} gemacht werden?`
    case 'tuer':
    case 'fenster':
    case 'licht':
    case 'bett':
    case 'tisch':
    case 'stuhl':
    case 'fernseher':
    case 'vorhang':
    case 'schrank':
      return `Was soll mit ${getSubRegionItemTitle(subRegionId)} gemacht werden?`
    case 'handy':
    case 'glas':
    case 'brille':
    case 'stift':
    case 'papier':
    case 'lineal':
    case 'teller':
    case 'besteck':
    case 'tisch':
      return `Was soll mit ${getSubRegionItemTitle(subRegionId)} gemacht werden?`
    default:
      return 'Wählen Sie eine Option aus'
  }
}

const getSubRegionItemTitle = (subRegionId: string | null) => {
  if (!subRegionId) return ''
  const subRegion = currentSubRegions.value.find(region => region.id === subRegionId)
  return subRegion ? (subRegion.ttsText || subRegion.title) : subRegionId
}

const getSubSubRegionItemTitle = (subSubRegionId: string | null) => {
  if (!subSubRegionId) return ''
  const subSubRegion = currentSubSubRegions.value.find(region => region.id === subSubRegionId)
  return subSubRegion ? (subSubRegion.ttsText || subSubRegion.title) : subSubRegionId
}

const getConfirmationTitle = () => {
  return 'Auswahl erfasst'
}

const getConfirmationText = () => {
  const mainRegion = selectedMainRegion.value
  const subRegionTitle = getSubRegionItemTitle(selectedSubRegion.value)
  const subSubRegionTitle = getSubSubRegionItemTitle(selectedSubSubRegion.value)
  
  if (selectedSubSubRegion.value) {
    // Verb + Item Kombination
    return `Bitte ${subRegionTitle} ${subSubRegionTitle}`
  } else if (selectedSubRegion.value) {
    // Nur Item
    return `${subRegionTitle} ausgewählt`
  } else {
    return 'Auswahl erfasst'
  }
}

// Navigation functions
const selectMainRegion = async (regionId: string) => {
  console.log('Selecting main region:', regionId)
  
  if (!hasUserInteracted.value) {
    hasUserInteracted.value = true
    console.log('User first interaction - TTS enabled')
  }
  
  selectedMainRegion.value = regionId
  currentState.value = 'subRegionView'
  currentTileIndex.value = 0
  
  const region = mainRegions.find(r => r.id === regionId)
  if (region) {
    console.log(`Wählen Sie eine ${region.title}option aus. - TTS removed`)
  }
  
  // Auto-mode wird im watch() gesteuert, nicht hier
}

const selectSubRegion = async (subRegionId: string) => {
  console.log('Selecting sub region:', subRegionId)
  
  if (subRegionId === 'zurueck') {
    // Zurück zu den Hauptregionen
    currentState.value = 'mainView'
    currentTileIndex.value = 0
    selectedMainRegion.value = null
    selectedSubRegion.value = null
    selectedSubSubRegion.value = null
    return
  }
  
  selectedSubRegion.value = subRegionId
  currentState.value = 'subSubRegionView'
  currentTileIndex.value = 0
  
  const subRegionTitle = getSubRegionItemTitle(subRegionId)
  console.log(`Auswahl erfasst: ${subRegionTitle}`)
  
  // Auto-mode wird im watch() gesteuert, nicht hier
}

const selectSubSubRegion = async (subSubRegionId: string) => {
  console.log('Selecting sub-sub region:', subSubRegionId)
  
  if (subSubRegionId === 'zurueck') {
    // Zurück zu den Sub-Regionen
    currentState.value = 'subRegionView'
    currentTileIndex.value = 0
    selectedSubRegion.value = null
    selectedSubSubRegion.value = null
    return
  }
  
  selectedSubSubRegion.value = subSubRegionId
  currentState.value = 'confirmation'
  
  const subRegionTitle = getSubRegionItemTitle(selectedSubRegion.value)
  const subSubRegionTitle = getSubSubRegionItemTitle(subSubRegionId)
  
  console.log(`Auswahl erfasst: ${subRegionTitle} ${subSubRegionTitle} - TTS removed`)
  
  // TTS für Bestätigung - spezifisch für jede Kategorie
  setTimeout(() => {
    const confirmationText = `Bitte ${subRegionTitle} ${subSubRegionTitle}`
    speakText(confirmationText)
  }, 500)
  
  // After confirmation, return to main view after 6.5 seconds
  setTimeout(() => {
    resetToMainView()
  }, 6500)
}

// Click Handlers

const handleMainRegionRightClick = (event: MouseEvent, regionId: string) => {
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
  console.log('UmgebungDialogView: Right click detected on main region:', regionId)
  selectMainRegion(regionId)
  return false
}

const handleSubRegionRightClick = (event: MouseEvent, subRegionId: string) => {
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
  console.log('UmgebungDialogView: Right click detected on sub-region:', subRegionId)
  selectSubRegion(subRegionId)
  return false
}

const handleSubSubRegionRightClick = (event: MouseEvent, subSubRegionId: string) => {
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
  console.log('UmgebungDialogView: Right click detected on sub-sub-region:', subSubRegionId)
  selectSubSubRegion(subSubRegionId)
  return false
}

// Touch-Handler für Main Regions
const handleMainRegionTouch = (event: TouchEvent, regionId: string) => {
  event.preventDefault()
  event.stopPropagation()
  console.log('Touch detected on main region in UmgebungDialogView:', regionId)
  selectMainRegion(regionId)
}

// Touch-Handler für Sub Regions
const handleSubRegionTouch = (event: TouchEvent, subRegionId: string) => {
  event.preventDefault()
  event.stopPropagation()
  console.log('Touch detected on sub-region in UmgebungDialogView:', subRegionId)
  selectSubRegion(subRegionId)
}

// Touch-Handler für Sub-Sub Regions
const handleSubSubRegionTouch = (event: TouchEvent, subSubRegionId: string) => {
  event.preventDefault()
  event.stopPropagation()
  console.log('Touch detected on sub-sub-region in UmgebungDialogView:', subSubRegionId)
  selectSubSubRegion(subSubRegionId)
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

const handleSubSubRegionSelection = (item: any) => {
  console.log('Sub-sub region selection handler called with:', item)
  if (item && item.id) {
    selectSubSubRegion(item.id)
  }
}

// Auto-Mode für Sub-Region View - wie Pain-Dialog: TTS, dann Pause, dann Karussell
const startSubRegionAutoMode = () => {
  if (currentSubRegions.value.length === 0) return
  
  console.log('Starting sub-region auto-mode with', currentSubRegions.value.length, 'items')
  
  // Erst TTS für Sub-Region Titel
  setTimeout(async () => {
    const subRegionTitle = getSubRegionItemTitle(selectedMainRegion.value)
    await speakText(subRegionTitle)
  }, 1000)
  
  // Dann Pause (3 Sekunden) und Karussell starten
  setTimeout(() => {
    console.log('Sub-region TTS completed, starting Karussell after pause')
    const cycleSubRegions = () => {
      if (currentState.value !== 'subRegionView') return
      
      const currentItem = currentSubRegions.value[currentTileIndex.value]
      if (currentItem) {
        speakText(currentItem.ttsText || currentItem.title)
      }
      
      currentTileIndex.value = (currentTileIndex.value + 1) % currentSubRegions.value.length
      
      setTimeout(cycleSubRegions, 3000)
    }
    
    cycleSubRegions()
  }, 4000) // 1s TTS + 3s Pause = 4s
}

// Auto-Mode für Sub-Sub-Region View - wie Pain-Dialog: TTS, dann Pause, dann Karussell
const startSubSubRegionAutoMode = () => {
  if (currentSubSubRegions.value.length === 0) return
  
  console.log('Starting sub-sub-region auto-mode with', currentSubSubRegions.value.length, 'items')
  
  // Erst TTS für Sub-Sub-Region Titel
  setTimeout(async () => {
    const subSubRegionTitle = getSubSubRegionItemTitle(selectedSubRegion.value)
    await speakText(subSubRegionTitle)
  }, 1000)
  
  // Dann Pause (3 Sekunden) und Karussell starten
  setTimeout(() => {
    console.log('Sub-sub-region TTS completed, starting Karussell after pause')
    const cycleSubSubRegions = () => {
      if (currentState.value !== 'subSubRegionView') return
      
      const currentItem = currentSubSubRegions.value[currentTileIndex.value]
      if (currentItem) {
        speakText(currentItem.ttsText || currentItem.title)
      }
      
      currentTileIndex.value = (currentTileIndex.value + 1) % currentSubSubRegions.value.length
      
      setTimeout(cycleSubSubRegions, 3000)
    }
    
    cycleSubSubRegions()
  }, 4000) // 1s TTS + 3s Pause = 4s
}

const resetToMainView = async () => {
  currentState.value = 'mainView'
  currentTileIndex.value = 0
  selectedMainRegion.value = null
  selectedSubRegion.value = null
  selectedSubSubRegion.value = null
  
  console.log('Was möchten Sie an ihrer Umgebung verändern? - TTS removed')
  
  // TTS für Zurück zum Hauptmenü
  setTimeout(() => {
    speakText('Zurück zum Hauptmenü')
  }, 500)
  
  // Start auto-mode for main regions
  setTimeout(() => {
    startAutoMode(mainRegions, 1000, 3000)
  }, 2000)
}

const resetToSubRegionView = async () => {
  currentState.value = 'subRegionView'
  currentTileIndex.value = 0
  selectedSubRegion.value = null
  selectedSubSubRegion.value = null
  
  console.log('Zurück zu den Sub-Regionen - TTS removed')
  
  // TTS für Zurück zu den Sub-Regionen
  setTimeout(() => {
    speakText('Zurück zu den Sub-Regionen')
  }, 500)
  
  // Start auto-mode for sub regions
  setTimeout(() => {
    startAutoMode(currentSubRegions.value, 1000, 3000)
  }, 2000)
}

// Blink Detection
const handleBlink = () => {
  console.log('Blink detected in UmgebungDialogView')
  
  switch (currentState.value) {
    case 'mainView':
      const mainRegion = mainRegions[currentTileIndex.value]
      if (mainRegion) {
        selectMainRegion(mainRegion.id)
      }
      break
    case 'subRegionView':
      const subRegion = currentSubRegions.value[currentTileIndex.value]
      if (subRegion) {
        selectSubRegion(subRegion.id)
      }
      break
    case 'subSubRegionView':
      const subSubRegion = currentSubSubRegions.value[currentTileIndex.value]
      if (subSubRegion) {
        selectSubSubRegion(subSubRegion.id)
      }
      break
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

const goToSubSubRegion = (index: number) => {
  console.log('goToSubSubRegion called with index:', index, 'current:', currentTileIndex.value)
  if (index >= 0 && index < currentSubSubRegions.value.length) {
    currentTileIndex.value = index
    console.log('currentTileIndex updated to:', currentTileIndex.value)
  } else {
    // Reibungsloser Loop - wenn Index außerhalb des Bereichs, loope zurück
    if (index < 0) {
      currentTileIndex.value = currentSubSubRegions.value.length - 1
    } else if (index >= currentSubSubRegions.value.length) {
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
        handleBlink()
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
        handleBlink()
        break
    }
  } else if (currentState.value === 'subSubRegionView') {
    switch (event.key) {
      case 'ArrowLeft':
        currentTileIndex.value = Math.max(0, currentTileIndex.value - 1)
        break
      case 'ArrowRight':
        currentTileIndex.value = Math.min(currentSubSubRegions.value.length - 1, currentTileIndex.value + 1)
        break
      case 'Enter':
      case ' ':
        handleBlink()
        break
    }
  }
}

onMounted(() => {
  console.log('UmgebungDialogView mounted, current state:', currentState.value)
  
  // Ensure we start in main view
  currentState.value = 'mainView'
  currentTileIndex.value = 0
  
  // Add keyboard navigation
  document.addEventListener('keydown', handleKeydown)
  
  // Add blink detection (if available)
  if (window.speechSynthesis) {
    // Blink detection can be added here if needed
    console.log('Blink detection ready')
  }
  
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
    case 'subSubRegionView':
      console.log('Setting up sub-sub region view with', currentSubSubRegions.value.length, 'sub-sub-regions')
      // Erst den korrekten Titel mit Bereich vorlesen
      setTimeout(() => {
        const subRegionTitle = getSubRegionItemTitle(selectedSubRegion.value)
        speakText(`Was soll mit ${subRegionTitle} gemacht werden?`)
      }, 1000)
      // Dann Auto-Mode für Sub-Sub-Regions starten
      setTimeout(() => {
        cleanup = setupLifecycle(currentSubSubRegions.value, handleSubSubRegionSelection)
      }, 4000)
      break
    case 'confirmation':
      console.log('Confirmation view - no auto-mode needed')
      break
  }
})
</script>

<style scoped>
@import './UmgebungDialogView.css';
</style>
