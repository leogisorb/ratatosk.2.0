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
            <button 
              v-for="(region, index) in mainRegions"
              :key="region.id"
              class="menu-tile"
              :class="currentTileIndex === index ? 'tile-active' : 'tile-inactive'"
              :aria-pressed="currentTileIndex === index"
              :aria-label="region.title"
              :disabled="isSpeaking"
              @click="region.id === ID_BACK ? goBack() : selectMainRegion(region.id)"
              @touchstart="region.id === ID_BACK ? goBack() : handleMainRegionTouch($event, region.id)"
              @contextmenu.prevent="region.id === ID_BACK ? goBack() : handleMainRegionRightClick($event, region.id)"
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
            </button>
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
                role="button"
                :aria-pressed="currentTileIndex === index"
                :aria-label="subRegion.title"
                :tabindex="0"
                @click="subRegion.id === ID_BACK ? goBack() : selectSubRegion(subRegion.id)"
                @touchstart="subRegion.id === ID_BACK ? goBack() : handleSubRegionTouch($event, subRegion.id)"
                @contextmenu.prevent="handleSubRegionRightClick($event, subRegion.id)"
                @keydown.enter="subRegion.id === ID_BACK ? goBack() : selectSubRegion(subRegion.id)"
                @keydown.space.prevent="subRegion.id === ID_BACK ? goBack() : selectSubRegion(subRegion.id)"
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
                role="button"
                :aria-pressed="currentTileIndex === index"
                :aria-label="subSubRegion.title"
                :tabindex="0"
                @click="subSubRegion.id === ID_BACK ? goBack() : selectSubSubRegion(subSubRegion.id)"
                @touchstart="subSubRegion.id === ID_BACK ? goBack() : handleSubSubRegionTouch($event, subSubRegion.id)"
                @contextmenu.prevent="handleSubSubRegionRightClick($event, subSubRegion.id)"
                @keydown.enter="subSubRegion.id === ID_BACK ? goBack() : selectSubSubRegion(subSubRegion.id)"
                @keydown.space.prevent="subSubRegion.id === ID_BACK ? goBack() : selectSubSubRegion(subSubRegion.id)"
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
            <div class="confirmation-title">{{ getConfirmationTitle() }}</div>
            <div class="confirmation-text">{{ getConfirmationText() }}</div>
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
  getSubRegionsByMainRegion,
  getSubSubRegionsBySubRegion,
  getArticles,
  buildConfirmationText,
  ID_BACK,
  ID_BETT,
  ID_ZIMMER,
  ID_GEGENSTAENDE
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
const isReturningToMain = ref(false)

// Timer management
const timers = ref<number[]>([])
const autoModeAbortController = ref<{ aborted: boolean } | null>(null)

// Timer management functions
const setSafeTimeout = (fn: Function, ms: number): number => {
  const id = window.setTimeout(() => {
    timers.value = timers.value.filter(t => t !== id)
    fn()
  }, ms)
  timers.value.push(id)
  return id
}

const clearAllTimers = () => {
  timers.value.forEach(id => clearTimeout(id))
  timers.value = []
}

// Cancelable Auto-Mode implementation
const runAutoLoop = async (items: any[], speakTextFn: (text: string) => Promise<void>, delay = 3000) => {
  if (autoModeAbortController.value) {
    autoModeAbortController.value.aborted = true
  }
  autoModeAbortController.value = { aborted: false }
  const token = autoModeAbortController.value

  while (!token.aborted) {
    for (let i = 0; i < items.length; i++) {
      if (token.aborted) break
      currentTileIndex.value = i
      await speakTextFn(items[i].title) // speakText returns Promise
      // wait but abortable
      await new Promise<void>(res => {
        const id = setSafeTimeout(() => res(), delay)
        // Don't add to timers array as it's managed by setSafeTimeout
      })
      if (token.aborted) break
    }
  }
}

const stopAutoLoop = () => {
  if (autoModeAbortController.value) {
    autoModeAbortController.value.aborted = true
  }
  clearAllTimers()
}

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

// Direct TTS implementation as fallback
const speakTextDirect = async (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      console.error('Speech synthesis not supported')
      reject(new Error('Speech synthesis not supported'))
      return
    }

    // Stop any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'de-DE'
    utterance.rate = 0.8
    utterance.pitch = 1.0
    utterance.volume = 1.0

    utterance.onend = () => {
      console.log('Direct TTS completed:', text)
      resolve()
    }

    utterance.onerror = (event) => {
      console.error('Direct TTS error:', event.error)
      reject(new Error(event.error))
    }

    console.log('Speaking directly:', text)
    window.speechSynthesis.speak(utterance)
  })
}

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
    case ID_BETT:
      return 'Wählen Sie einen Bett-Bereich aus'
    case ID_ZIMMER:
      return 'Wählen Sie einen Zimmer-Bereich aus'
    case ID_GEGENSTAENDE:
      return 'Wählen Sie einen Gegenstand aus'
    default:
      return 'Wählen Sie eine Option aus'
  }
}

const getSubSubRegionTitle = (subRegionId: string | null) => {
  if (!subRegionId) return ''
  
  const subRegion = currentSubRegions.value.find(region => region.id === subRegionId)
  if (!subRegion) return ''
  
  // Use centralized grammar utility for dative case (mit)
  const articles = getArticles(subRegion.gender)
  const article = articles.dat
  
  return `Was soll mit ${article} ${subRegion.title} gemacht werden?`
}

const getSubRegionItemTitle = (subRegionId: string | null) => {
  if (!subRegionId) return ''
  const subRegion = currentSubRegions.value.find(region => region.id === subRegionId)
  // Für Karussell: nur den Titel ohne Artikel
  return subRegion ? subRegion.title : subRegionId
}

const getSubRegionItemTitleWithArticle = (subRegionId: string | null) => {
  if (!subRegionId) return ''
  const subRegion = currentSubRegions.value.find(region => region.id === subRegionId)
  // Für Confirmation: mit Artikel
  return subRegion ? (subRegion.ttsText || subRegion.title) : subRegionId
}

const getSubSubRegionItemTitle = (subSubRegionId: string | null) => {
  if (!subSubRegionId) return ''
  const subSubRegion = currentSubSubRegions.value.find(region => region.id === subSubRegionId)
  // Für Verben-Karussell: nur den Titel ohne Artikel
  return subSubRegion ? subSubRegion.title : subSubRegionId
}

const getSubSubRegionItemTitleWithArticle = (subSubRegionId: string | null) => {
  if (!subSubRegionId) return ''
  const subSubRegion = currentSubSubRegions.value.find(region => region.id === subSubRegionId)
  // Für Confirmation: nur den Titel ohne Artikel (Verben haben keine Artikel)
  return subSubRegion ? subSubRegion.title : subSubRegionId
}

const getConfirmationTitle = () => {
  return 'Auswahl erfasst'
}

const getConfirmationText = () => {
  const mainRegion = selectedMainRegion.value
  const subRegion = currentSubRegions.value.find(region => region.id === selectedSubRegion.value)
  const subSubRegion = currentSubSubRegions.value.find(region => region.id === selectedSubSubRegion.value)
  
  console.log('Debug confirmation text generation:')
  console.log('- selectedMainRegion:', mainRegion)
  console.log('- selectedSubRegion:', selectedSubRegion.value)
  console.log('- selectedSubSubRegion:', selectedSubSubRegion.value)
  console.log('- subRegion found:', subRegion)
  console.log('- subSubRegion found:', subSubRegion)
  
  if (selectedSubSubRegion.value && subRegion && subSubRegion) {
    // Use centralized grammar utility for confirmation text
    const result = buildConfirmationText(subRegion, subSubRegion)
    console.log('- Generated confirmation text:', result)
    return result
  } else if (selectedSubRegion.value && subRegion) {
    // Only item with article
    const result = `${subRegion.ttsText || subRegion.title} ausgewählt`
    console.log('- Generated item-only text:', result)
    return result
  } else {
    console.log('- Using fallback text')
    return 'Auswahl erfasst'
  }
}

// Navigation functions
const selectMainRegion = async (regionId: string) => {
  console.log('Selecting main region:', regionId)
  
  // TTS stoppen bevor View wechselt
  stopAutoMode()
  stopAutoLoop() // Clear all timers
  
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
  
  // TTS stoppen bevor View wechselt
  stopAutoMode()
  stopAutoLoop() // Clear all timers
  
  if (subRegionId === ID_BACK) {
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
  
  // TTS stoppen bevor View wechselt
  stopAutoMode()
  stopAutoLoop() // Clear all timers
  
  if (subSubRegionId === ID_BACK) {
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
  console.log('Starting confirmation TTS process...')
  
  // Use immediate execution instead of setTimeout to avoid timer conflicts
  const executeConfirmationTTS = async () => {
    const confirmationText = getConfirmationText()
    console.log('Speaking confirmation text:', confirmationText)
    
    try {
      // Try direct TTS first, fallback to composable TTS
      await speakTextDirect(confirmationText)
      console.log('Direct TTS completed successfully')
      
      // Wait a bit longer after TTS completion before returning
      await new Promise(resolve => setTimeout(resolve, 2000)) // 2 seconds pause after TTS
      console.log('TTS completed, returning to main view')
      resetToMainView()
      
    } catch (error) {
      console.error('Direct TTS failed, trying composable TTS:', error)
      try {
        await speakText(confirmationText)
        console.log('Composable TTS completed successfully')
        
        // Wait a bit longer after TTS completion before returning
        await new Promise(resolve => setTimeout(resolve, 2000)) // 2 seconds pause after TTS
        console.log('TTS completed, returning to main view')
        resetToMainView()
        
      } catch (composableError) {
        console.error('Both TTS methods failed:', composableError)
        // Even if TTS fails, wait a bit before returning
        await new Promise(resolve => setTimeout(resolve, 2000))
        console.log('TTS failed, returning to main view anyway')
        resetToMainView()
      }
    }
  }
  
  // Execute immediately
  executeConfirmationTTS()
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

// Auto-Mode für Sub-Region View - mit cancelable loop
const startSubRegionAutoMode = () => {
  if (currentSubRegions.value.length === 0) return
  
  console.log('Starting sub-region auto-mode with', currentSubRegions.value.length, 'items')
  
  // Start cancelable auto-loop
  runAutoLoop(currentSubRegions.value, speakText, 3000)
}

// Auto-Mode für Sub-Sub-Region View - mit cancelable loop
const startSubSubRegionAutoMode = () => {
  if (currentSubSubRegions.value.length === 0) return
  
  console.log('Starting sub-sub-region auto-mode with', currentSubSubRegions.value.length, 'items')
  
  // Start cancelable auto-loop
  runAutoLoop(currentSubSubRegions.value, speakText, 3000)
}

const resetToMainView = async () => {
  // TTS stoppen bevor View wechselt
  stopAutoMode()
  stopAutoLoop() // Clear all timers
  
  // Flag setzen, dass wir zur Hauptansicht zurückkehren
  isReturningToMain.value = true
  
  currentState.value = 'mainView'
  currentTileIndex.value = 0
  selectedMainRegion.value = null
  selectedSubRegion.value = null
  selectedSubSubRegion.value = null
  
  console.log('Was möchten Sie an ihrer Umgebung verändern? - TTS removed')
  
  // TTS für Zurück zum Hauptmenü
  setSafeTimeout(() => {
    speakText('Zurück zum Hauptmenü')
  }, 500)
  
  // Das Watch-System wird automatisch das Auto-Mode starten, daher hier nichts mehr
}

const resetToSubRegionView = async () => {
  // TTS stoppen bevor View wechselt
  stopAutoMode()
  stopAutoLoop() // Clear all timers
  
  currentState.value = 'subRegionView'
  currentTileIndex.value = 0
  selectedSubRegion.value = null
  selectedSubSubRegion.value = null
  
  console.log('Zurück zu den Sub-Regionen - TTS removed')
  
  // TTS für Zurück zu den Sub-Regionen
  setSafeTimeout(() => {
    speakText('Zurück zu den Sub-Regionen')
  }, 500)
  
  // Start auto-mode for sub regions
  setSafeTimeout(() => {
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
  // Stop all auto-modes and timers before navigation
  stopAutoMode()
  stopAutoLoop()
  clearAllTimers()
  
  // Reset all states before navigation
  currentState.value = 'mainView'
  currentTileIndex.value = 0
  selectedMainRegion.value = null
  selectedSubRegion.value = null
  selectedSubSubRegion.value = null
  
  // Navigate to /app route
  router.push('/app')
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
  stopAutoLoop() // Clear all timers
  
  // Remove keyboard navigation
  document.removeEventListener('keydown', handleKeydown)
})

// Watch for state changes to update lifecycle
watch(currentState, (newState) => {
  console.log('State changed to:', newState)
  stopAutoMode()
  stopAutoLoop() // Clear all timers when state changes
  
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
      // Nur setupLifecycle wenn nicht von resetToMainView aufgerufen
      if (!isReturningToMain.value) {
        cleanup = setupLifecycle(mainRegions, handleMainRegionSelection)
      } else {
        // Flag zurücksetzen
        isReturningToMain.value = false
      }
      break
    case 'subRegionView':
      console.log('Setting up sub region view with', currentSubRegions.value.length, 'sub-regions')
      // Erst den korrekten Titel vorlesen
      setSafeTimeout(() => {
        const subRegionTitle = getSubRegionTitle(selectedMainRegion.value)
        speakText(subRegionTitle)
      }, 1000)
      // Dann Auto-Mode für Sub-Regions starten (nach Titel-TTS)
      setSafeTimeout(() => {
        // Setup lifecycle für Blink und Rechtsklick (überschreibt Auto-Mode)
        cleanup = setupLifecycle(currentSubRegions.value, handleSubRegionSelection)
      }, 4000) // 1s Titel-TTS + 3s Pause = 4s
      break
    case 'subSubRegionView':
      console.log('Setting up sub-sub region view with', currentSubSubRegions.value.length, 'sub-sub-regions')
      // Erst den korrekten Titel vorlesen
      setSafeTimeout(() => {
        const subSubRegionTitle = getSubSubRegionTitle(selectedSubRegion.value)
        speakText(subSubRegionTitle)
      }, 1000)
      // Dann Auto-Mode für Sub-Sub-Regions starten (nach Titel-TTS)
      setSafeTimeout(() => {
        // Setup lifecycle für Blink und Rechtsklick (überschreibt Auto-Mode)
        cleanup = setupLifecycle(currentSubSubRegions.value, handleSubSubRegionSelection)
      }, 4000) // 1s Titel-TTS + 3s Pause = 4s
      break
    case 'confirmation':
      console.log('Confirmation view - no auto-mode needed')
      break
  }
})
</script>

<style scoped>
@import '../../../shared/styles/DialogBase.css';
</style>
