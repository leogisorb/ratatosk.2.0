<template>
  <div id="app" class="ich-dialog">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content -->
    <main class="main-content">
      <div class="content-wrapper">
        
        <!-- Main View: Main Region Selection -->
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
              @click="handleMainRegionClick(region)"
              @contextmenu.prevent="handleMainRegionRightClick($event, region)"
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
                :style="currentTileIndex === index ? 'color: white !important;' : ''"
              >
                {{ region.title }}
              </div>
            </div>
          </div>
        </div>

        <!-- Sub Region View -->
        <div v-if="currentState === 'subRegionView'">
          <div class="main-title">
            Was möchten Sie machen?
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
                @click="handleSubRegionClick(subRegion)"
                @contextmenu.prevent="handleSubRegionRightClick($event, subRegion)"
              >
                <div class="carousel-item-content">
                  <div 
                    class="tile-icon-container"
                    :class="currentTileIndex === index ? 'icon-active' : 'icon-inactive'"
                  >
                    <span v-if="subRegion.emoji" class="tile-emoji">{{ subRegion.emoji }}</span>
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
                    :style="currentTileIndex === index ? 'color: white !important;' : ''"
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
            >
            </button>
          </div>
        </div>

        <!-- Confirmation View -->
        <div v-if="currentState === 'confirmation'">
          <div class="confirmation-container">
            <div class="confirmation-title">Auswahl erfasst</div>
            <div class="confirmation-text">{{ confirmationSentence }}</div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useIchAssessment } from '../composables/useIchAssessment'
import { 
  mainRegions, 
  ernaehrungSubRegions, 
  gefuehleSubRegions, 
  kleidungSubRegions, 
  hygieneSubRegions, 
  bewegungSubRegions,
  getSubRegionsByMainRegion,
  getMainRegionTitle,
  getSubRegionTitle,
  generateConfirmationSentence,
  type IchSubRegion
} from '../data/ichDialogData'
import AppHeader from '../../../shared/components/AppHeader.vue'
import { useSettingsStore } from '../../settings/stores/settings'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'

// Ich dialog states
type IchDialogState = 'mainView' | 'subRegionView' | 'confirmation'

// Reactive state
const currentState = ref<IchDialogState>('mainView')
const selectedMainRegion = ref<string | null>(null)
const selectedSubRegion = ref<string | null>(null)

// Use IchAssessment composable
const {
  currentTileIndex,
  isAutoMode,
  speakText,
  startAutoMode,
  stopAutoMode,
  handleClick,
  handleRightClick,
  setupLifecycle,
  settingsStore
} = useIchAssessment()

// Computed properties
const currentSubRegions = computed(() => {
  if (!selectedMainRegion.value) return []
  return getSubRegionsByMainRegion(selectedMainRegion.value)
})

const confirmationSentence = computed(() => {
  if (!selectedMainRegion.value || !selectedSubRegion.value) return ''
  
  const subRegion = currentSubRegions.value.find(r => r.id === selectedSubRegion.value)
  if (!subRegion) return ''
  
  // Use helper function to generate confirmation sentence
  return generateConfirmationSentence(selectedMainRegion.value, subRegion)
})

// Helper functions
const getMainRegionDisplayTitle = (regionId: string | null) => {
  if (!regionId) return ''
  const region = mainRegions.find(r => r.id === regionId)
  return region ? region.title : ''
}

// Navigation functions
const selectMainRegion = async (regionId: string) => {
  console.log('IchDialogView: Selecting main region:', regionId)
  
  // Stop auto-mode and TTS when user clicks
  stopAutoMode()
  simpleFlowController.stopTTS()
  
  // Special handling for Zurück tile
  if (regionId === 'zurueck') {
    goBack()
    return
  }
  
  selectedMainRegion.value = regionId
  currentState.value = 'subRegionView'
  currentTileIndex.value = 0
  
  // Start subview flow: heading TTS → 3s pause → auto-mode
  await initializeSubview()
}

const selectSubRegion = async (subRegionId: string) => {
  console.log('IchDialogView: Selecting sub region:', subRegionId)
  
  // Stop auto-mode and TTS when user clicks
  stopAutoMode()
  simpleFlowController.stopTTS()
  
  if (subRegionId === 'zurueck') {
    // Back to main view
    await resetToMainView()
    return
  }
  
  selectedSubRegion.value = subRegionId
  currentState.value = 'confirmation'
  
  // Start confirmation flow
  await showConfirmation()
}

// NOTE: Initialization functions are no longer needed - watch(currentState) handles TTS and auto-mode
// These functions are kept for backwards compatibility but not called anymore

const showConfirmation = async () => {
  console.log('IchDialogView: Showing confirmation')
  
  const sentence = confirmationSentence.value
  if (!sentence) {
    console.error('IchDialogView: No confirmation sentence generated')
    await resetToMainView()
    return
  }
  
  // Step 1: Generate confirmation sentence (already computed)
  // Step 2: Start TTS for confirmation sentence
  await speakText(sentence)
  
  // Step 3: Wait 3 seconds after TTS
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  // Step 4: Reset completely and reload IchDialogView
  await resetToMainView()
}

const resetToMainView = async () => {
  console.log('IchDialogView: Resetting to main view')
  
  // Stop auto-mode
  stopAutoMode()
  
  // Stop all TTS instances
  simpleFlowController.stopTTS()
  
  // Reset all states
  currentState.value = 'mainView'
  currentTileIndex.value = 0
  selectedMainRegion.value = null
  selectedSubRegion.value = null
  
  // Clear any pending timers
  // (SimpleFlowController handles its own cleanup)
  
  // Re-initialize main view
  await initializeMainView()
}

// Auto-mode functions
const startAutoModeForMainView = async (cycleDelay: number) => {
  console.log('IchDialogView: Starting auto-mode for main view with cycle delay:', cycleDelay)
  
  // Calculate initial delay (0 since we already waited 3s after initial TTS)
  const initialDelay = 0
  
  // Start auto-mode - SimpleFlowController will wait for TTS to finish
  // The callback must start TTS synchronously so isSpeaking is set before scheduleNextCycle
  const success = simpleFlowController.startAutoMode(
    mainRegions,
    (index, item) => {
      // This callback is called synchronously
      // Update tile index immediately
      currentTileIndex.value = index
      console.log('IchDialogView: Auto-mode cycle:', item.title, 'at index:', index)
      
      // Start TTS - this must be called synchronously (don't await)
      // SimpleFlowController will wait for TTS to finish via isSpeaking flag
      speakText(item.title).catch(err => {
        console.error('IchDialogView: TTS error in auto-mode:', err)
      })
    },
    initialDelay,
    cycleDelay
  )
  
  if (!success) {
    console.error('IchDialogView: Failed to start auto-mode for main view')
  }
}

const startAutoModeForSubView = async (cycleDelay: number) => {
  console.log('IchDialogView: Starting auto-mode for subview with cycle delay:', cycleDelay)
  
  const items = currentSubRegions.value
  
  // Start auto-mode - SimpleFlowController will wait for TTS to finish
  // The callback must start TTS synchronously so isSpeaking is set before scheduleNextCycle
  const success = simpleFlowController.startAutoMode(
    items,
    (index, item) => {
      // This callback is called synchronously
      // Update tile index immediately
      currentTileIndex.value = index
      
      // Use ttsText if available, otherwise use title
      const textToSpeak = (item as IchSubRegion).ttsText || item.title
      console.log('IchDialogView: Auto-mode cycle:', textToSpeak, 'at index:', index)
      
      // Start TTS - this must be called synchronously (don't await)
      // SimpleFlowController will wait for TTS to finish via isSpeaking flag
      speakText(textToSpeak).catch(err => {
        console.error('IchDialogView: TTS error in auto-mode:', err)
      })
    },
    0, // initial delay (already waited 3s after heading TTS)
    cycleDelay
  )
  
  if (!success) {
    console.error('IchDialogView: Failed to start auto-mode for subview')
  }
}

// Click handlers
const handleMainRegionClick = (region: any) => {
  if (currentTileIndex.value === mainRegions.findIndex(r => r.id === region.id)) {
    selectMainRegion(region.id)
  }
}

const handleSubRegionClick = (subRegion: any) => {
  if (currentTileIndex.value === currentSubRegions.value.findIndex(r => r.id === subRegion.id)) {
    selectSubRegion(subRegion.id)
  }
}

const handleMainRegionRightClick = (event: MouseEvent, region: any) => {
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
  console.log('IchDialogView: Right click on main region:', region.id)
  selectMainRegion(region.id)
  return false
}

const handleSubRegionRightClick = (event: MouseEvent, subRegion: any) => {
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
  console.log('IchDialogView: Right click on sub region:', subRegion.id)
  selectSubRegion(subRegion.id)
  return false
}

const goToSubRegion = (index: number) => {
  console.log('goToSubRegion called with index:', index)
  if (index >= 0 && index < currentSubRegions.value.length) {
    currentTileIndex.value = index
  } else {
    // Loop smoothly
    if (index < 0) {
      currentTileIndex.value = currentSubRegions.value.length - 1
    } else if (index >= currentSubRegions.value.length) {
      currentTileIndex.value = 0
    }
  }
}

const goBack = () => {
  console.log('IchDialogView: Going back to main app')
  // Navigate to /app route
  window.location.href = '/ratatosk.2.0/app'
}

// Lifecycle
let cleanup: (() => void) | null = null

onMounted(() => {
  console.log('IchDialogView: Mounted - initializing')
  
  // IMPORTANT: Enable TTS immediately for IchDialogView
  // This ensures "Was möchten Sie machen?" is spoken at the start
  simpleFlowController.setUserInteracted(true)
  console.log('IchDialogView: TTS enabled for initial greeting')
  
  // Erst TTS für "Was möchten Sie machen?" vorlesen (für initialen Start)
  setTimeout(() => {
    speakText('Was möchten Sie machen?')
  }, 1000)
  
  // Setup lifecycle (face recognition, event listeners, etc.)
  // setupLifecycle will start auto-mode after 1 second (aber TTS läuft schon)
  // Daher starten wir setupLifecycle erst nach TTS + 3s pause
  setTimeout(() => {
    cleanup = setupLifecycle(mainRegions, (item: any) => {
      selectMainRegion(item.id)
    })
  }, 4000) // 1s delay + ~2s TTS + 1s buffer = 4s
})

// Watch for state changes to update lifecycle and handle TTS (wie im Pain Dialog)
watch(currentState, (newState) => {
  console.log('IchDialogView: State changed to:', newState)
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
      // Erst TTS für "Was möchten Sie machen?" vorlesen
      setTimeout(() => {
        speakText('Was möchten Sie machen?')
      }, 1000)
      // Dann Auto-Mode für Main Regions starten (nach TTS + 3s pause)
      setTimeout(() => {
        cleanup = setupLifecycle(mainRegions, (item: any) => {
          selectMainRegion(item.id)
        })
      }, 4000) // 1s delay + ~2s TTS + 1s buffer = 4s
      break
    case 'subRegionView':
      console.log('Setting up sub region view with', currentSubRegions.value.length, 'sub-regions')
      // Erst TTS für "Was möchten Sie machen?" vorlesen
      setTimeout(() => {
        speakText('Was möchten Sie machen?')
      }, 1000)
      // Dann Auto-Mode für Sub-Regions starten (nach TTS + 3s pause, mit +2s pause zwischen tiles)
      setTimeout(() => {
        cleanup = setupLifecycle(currentSubRegions.value, (item: any) => {
          selectSubRegion(item.id)
        })
      }, 4000) // 1s delay + ~2s TTS + 1s buffer = 4s
      break
  }
})

onUnmounted(() => {
  console.log('IchDialogView: Unmounted - cleaning up')
  
  // Stop auto-mode
  stopAutoMode()
  
  // Stop TTS
  simpleFlowController.stopTTS()
  
  // Cleanup lifecycle
  if (cleanup) {
    cleanup()
  }
})
</script>

<style scoped>
@import '../../../shared/styles/DialogBase.css';

.ich-dialog {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.content-wrapper {
  width: 100%;
  max-width: 1200px;
}

.main-title {
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 2rem;
  color: var(--text-primary, #333);
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.menu-tile {
  aspect-ratio: 1;
  border: 2px solid var(--border-color, #ddd);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--tile-background, #f5f5f5);
}

.menu-tile.tile-active {
  background: var(--tile-active-background, #4a90e2);
  border-color: var(--tile-active-border, #4a90e2);
  transform: scale(1.05);
}

.tile-icon-container {
  width: 80px;
  height: 80px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
}

.tile-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: filter 0.3s ease;
}

.tile-icon.icon-inverted {
  filter: brightness(0) invert(1);
}

.tile-emoji {
  font-size: 4rem;
}

.tile-text {
  font-size: 1.2rem;
  font-weight: 600;
  text-align: center;
  color: var(--text-secondary, #666);
  transition: color 0.3s ease;
}

.tile-text.text-active {
  color: white;
}

.carousel-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  perspective: 1000px;
}

.carousel-container {
  position: relative;
  width: 100%;
  max-width: 800px;
  height: 400px;
}

.carousel-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.carousel-item {
  position: absolute;
  width: 300px;
  height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 2px solid var(--border-color, #ddd);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.5s ease;
  background: var(--tile-background, #f5f5f5);
  opacity: 0.5;
  transform: translateX(calc(var(--offset) * 320px)) rotateY(var(--rotation)) scale(0.8);
}

.carousel-item.carousel-item-active {
  opacity: 1;
  transform: translateX(0) rotateY(0deg) scale(1);
  background: var(--tile-active-background, #4a90e2);
  border-color: var(--tile-active-border, #4a90e2);
  z-index: 10;
}

.carousel-item-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.carousel-indicators {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.carousel-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--border-color, #ddd);
  background: transparent;
  cursor: pointer;
  transition: all 0.3s ease;
}

.carousel-indicator.carousel-indicator-active {
  background: var(--tile-active-background, #4a90e2);
  border-color: var(--tile-active-background, #4a90e2);
}

.confirmation-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  text-align: center;
}

.confirmation-title {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 2rem;
  color: var(--text-primary, #333);
}

.confirmation-text {
  font-size: 1.5rem;
  color: var(--text-secondary, #666);
  max-width: 600px;
  line-height: 1.6;
}

.back-tile {
  border: 2px dashed var(--border-color, #ddd);
}

@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  .main-title {
    font-size: 1.5rem;
  }
  
  .tile-text {
    font-size: 1rem;
  }
}
</style>
