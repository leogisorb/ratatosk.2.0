<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../settings/stores/settings'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { mainGridConfig, getTileStyle as getTileStyleConfig, getIconStyle as getIconStyleConfig, getTextStyle as getTextStyleConfig, getIconColor } from '../../../config/gridConfig'
import GlobalHeader from '../../../shared/components/GlobalHeader.vue'

// Router
const router = useRouter()

// Stores
const settingsStore = useSettingsStore()

// Face Recognition
const faceRecognition = useFaceRecognition()

// State
const currentTileIndex = ref(0)
const isAutoMode = ref(true)
const autoModeInterval = ref<number | null>(null)
const closedFrames = ref(0)
const eyesClosed = ref(false)
const isAutoModePaused = ref(false)

// Verbesserte Blink-Detection Parameter - zentral gesteuert
const blinkThreshold = computed(() => Math.ceil(settingsStore.settings.blinkSensitivity * 10)) // Konvertiere Sekunden zu Frames (10 FPS)
const lastBlinkTime = ref(0)
const blinkCooldown = computed(() => settingsStore.settings.blinkSensitivity * 1000)

// Text-to-Speech
const speechSynthesis = window.speechSynthesis
const isTTSEnabled = ref(true)

// Verwende die zentrale Grid-Konfiguration
const gridConfig = mainGridConfig

// Umgebung-Items - 4 Bereiche + Zurück
const umgebungItems = [
  {
    id: 'bett',
    title: 'BETT',
    description: 'Bett verwalten',
    icon: 'sleeping.png'
  },
  {
    id: 'zimmer',
    title: 'ZIMMER',
    description: 'Zimmer verwalten',
    icon: 'living.png'
  },
  {
    id: 'gegenstaende',
    title: 'GEGENSTÄNDE',
    description: 'Gegenstände verwalten',
    icon: 'eyeglasses.png'
  },
  {
    id: 'zurueck',
    title: 'ZURÜCK',
    description: 'Zurück zur Hauptseite',
    icon: 'Goback.svg'
  }
]

// Computed
const appClasses = computed(() => [
  'min-h-screen flex flex-col',
  settingsStore.isHighContrast ? 'high-contrast' : '',
  settingsStore.isLargeText ? 'large-text' : ''
])

// Text-to-Speech Functions
const speakText = (text: string) => {
  if (!isTTSEnabled.value || !speechSynthesis) return
  
  // Stoppe vorherige Sprachausgabe
  speechSynthesis.cancel()
  
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'de-DE'
  utterance.rate = 0.8 // Etwas langsamer sprechen
  utterance.pitch = 1.0
  utterance.volume = 0.8
  
  speechSynthesis.speak(utterance)
}

// Auto Mode Functions
const startAutoMode = () => {
  if (autoModeInterval.value) return
  
  // Stelle sicher, dass wir bei Index 0 starten
  currentTileIndex.value = 0
  
  const cycleTiles = () => {
    if (!isAutoMode.value || isAutoModePaused.value) {
      return
    }
    
    currentTileIndex.value = (currentTileIndex.value + 1) % umgebungItems.length
    
    // Spreche den aktuellen Menüpunkt vor
    const currentItem = umgebungItems[currentTileIndex.value]
    speakText(currentItem.title)
    
    autoModeInterval.value = window.setTimeout(cycleTiles, 3000) // 3 Sekunden
  }
  
  // Spreche den ersten Menüpunkt vor
  const firstItem = umgebungItems[currentTileIndex.value]
  speakText(firstItem.title)
  
  // Starte den ersten Zyklus nach 3 Sekunden
  autoModeInterval.value = window.setTimeout(cycleTiles, 3000)
}

const pauseAutoMode = () => {
  isAutoModePaused.value = true
  if (autoModeInterval.value) {
    clearTimeout(autoModeInterval.value)
    autoModeInterval.value = null
  }
  speechSynthesis.cancel()
}

const resumeAutoMode = () => {
  isAutoModePaused.value = false
  if (!autoModeInterval.value) {
    // Starte den Auto-Modus bei der aktuellen Kachel
    const currentItem = umgebungItems[currentTileIndex.value]
    speakText(currentItem.title)
    startAutoMode()
  }
}

const stopAutoMode = () => {
  if (autoModeInterval.value) {
    clearTimeout(autoModeInterval.value)
    autoModeInterval.value = null
  }
  // Stoppe auch die Sprachausgabe
  speechSynthesis.cancel()
}

// Verwende die zentrale Styling-Funktion
const getTileStyle = (index: number) => {
  return getTileStyleConfig(index, currentTileIndex.value, settingsStore.isDarkMode, gridConfig)
}

// Verwende die zentrale Styling-Funktion
const getIconStyle = (index: number) => {
  return getIconStyleConfig(index, currentTileIndex.value, settingsStore.isDarkMode, gridConfig)
}

// Verwende die zentrale Styling-Funktion
const getTextStyle = (index: number) => {
  return getTextStyleConfig(index, currentTileIndex.value, settingsStore.isDarkMode, gridConfig)
}

// Umgebung-Auswahl
function selectUmgebung(umgebungId: string) {
  console.log('selectUmgebung called with umgebungId:', umgebungId)
  pauseAutoMode()
  
  const selectedItem = umgebungItems.find(item => item.id === umgebungId)
  if (selectedItem) {
    speakText(selectedItem.title)
  }
  
  switch (umgebungId) {
    case 'zurueck':
      console.log('Navigating back to /app')
      router.push('/app')
      break
    case 'bett':
      console.log('Navigating to /bett')
      router.push('/bett')
      break
    case 'zimmer':
      console.log('Navigating to /zimmer')
      router.push('/zimmer')
      break
    case 'gegenstaende':
      console.log('Navigating to /gegenstaende')
      router.push('/gegenstaende')
      break
    default:
      console.log('Unknown umgebung ID:', umgebungId)
  }
}

// Blink Detection
const handleBlink = () => {
  const now = Date.now()
  
  if (faceRecognition.isBlinking()) {
    closedFrames.value++
    
    if (now - lastBlinkTime.value < blinkCooldown.value) {
      return
    }
    
    if (closedFrames.value >= blinkThreshold.value && !eyesClosed.value) {
      const currentItem = umgebungItems[currentTileIndex.value]
      console.log('Blink activation for tile:', currentTileIndex.value, 'umgebungId:', currentItem.id, 'title:', currentItem.title)
      
      speakText(currentItem.title)
      selectUmgebung(currentItem.id)
      eyesClosed.value = true
      lastBlinkTime.value = now
      closedFrames.value = 0
    }
  } else {
    if (closedFrames.value > 0) {
      closedFrames.value = 0
      eyesClosed.value = false
    }
  }
}

// Rechte Maustaste als Blinzeln-Ersatz
const handleRightClick = (event: MouseEvent) => {
  event.preventDefault() // Verhindert Kontextmenü
  console.log('Right click detected - treating as blink')
  const currentItem = umgebungItems[currentTileIndex.value]
  console.log('Right click activation for tile:', currentTileIndex.value, 'umgebungId:', currentItem.id, 'title:', currentItem.title)
  
  speakText(currentItem.title)
  selectUmgebung(currentItem.id)
}

// Lifecycle
onMounted(() => {
  // Ensure face recognition is active if it was started from the start page
  if (!faceRecognition.isActive.value) {
    faceRecognition.start()
  }
  
  // Resume Auto Mode if it was paused (e.g., returning from other page)
  if (isAutoModePaused.value) {
    resumeAutoMode()
  } else {
    // Start Auto Mode
    startAutoMode()
  }
  
  // Watch for blinks using the isBlinking function
  const blinkCheckInterval = setInterval(() => {
    handleBlink()
  }, 100) // Check every 100ms
  
  // Add right click listener
  document.addEventListener('contextmenu', handleRightClick)
})

onUnmounted(() => {
  document.removeEventListener('contextmenu', handleRightClick)
  stopAutoMode()
})
</script>

<template>
  <div id="app" :class="appClasses">
    <!-- Responsive Layout - automatischer Wechsel zwischen Mobile und Desktop -->
    <div class="min-h-screen bg-white flex flex-col">
      <!-- Global Header -->
      <GlobalHeader>
        <div class="flex items-center space-x-4">
          <button @click="$router.push('/app')" class="p-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition-colors">
            <svg class="w-6 h-6" :style="{ color: getIconColor(false, false) }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-2xl font-bold text-black font-source-code font-light">
            UMGEBUNG
          </h1>
        </div>
        
        <!-- Control Buttons -->
        <div class="flex space-x-2">
          <!-- TTS Toggle Button -->
          <button
            @click="isTTSEnabled = !isTTSEnabled"
            class="p-2 rounded-lg transition-colors"
            :class="isTTSEnabled ? 'bg-green-300 hover:bg-green-400' : 'bg-gray-300 hover:bg-gray-400'"
            :title="isTTSEnabled ? 'Sprachausgabe deaktivieren' : 'Sprachausgabe aktivieren'"
          >
            <!-- Speaker Icon für TTS aktiv -->
            <svg
              v-if="isTTSEnabled"
              class="w-6 h-6"
              :style="{ color: getIconColor(true, false) }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
            </svg>
            <!-- Muted Speaker Icon für TTS deaktiviert -->
            <svg
              v-else
              class="w-6 h-6"
              :style="{ color: getIconColor(false, false) }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
              />
            </svg>
          </button>
        </div>
      </GlobalHeader>

    <!-- Main Content -->
    <main class="flex-1 flex items-center justify-center">
      <!-- Desktop Layout (2×2 Grid) - wird auf allen Bildschirmen angezeigt -->
      <div class="max-w-7xl mx-auto p-8">
        <div 
          class="grid grid-cols-2" 
          :style="{
            gap: gridConfig.tileGap,
            gridTemplateColumns: `repeat(2, ${gridConfig.tileWidth})`
          }"
        >
          <!-- BETT -->
          <div 
            class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 transition-colors"
            :style="getTileStyle(0)"
            @click="selectUmgebung('bett')"
          >
            <div 
              class="flex items-center justify-center rounded-lg"
              :style="{
                width: gridConfig.iconWidth,
                height: gridConfig.iconHeight,
                backgroundColor: gridConfig.iconBackgroundColor
              }"
            >
              <img 
                src="/sleeping.png" 
                alt="BETT" 
                :style="getIconStyle(0)"
              />
            </div>
            <div 
              class="text-center font-source-code font-normal"
              :style="getTextStyle(0)"
            >
              BETT
            </div>
          </div>

          <!-- ZIMMER -->
          <div 
            class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 transition-colors"
            :style="getTileStyle(1)"
            @click="selectUmgebung('zimmer')"
          >
            <div 
              class="flex items-center justify-center rounded-lg"
              :style="{
                width: gridConfig.iconWidth,
                height: gridConfig.iconHeight,
                backgroundColor: gridConfig.iconBackgroundColor
              }"
            >
              <img 
                src="/living.png" 
                alt="ZIMMER" 
                :style="getIconStyle(1)"
              />
            </div>
            <div 
              class="text-center font-source-code font-normal"
              :style="getTextStyle(1)"
            >
              ZIMMER
            </div>
          </div>

          <!-- GEGENSTÄNDE -->
          <div 
            class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 transition-colors"
            :style="getTileStyle(2)"
            @click="selectUmgebung('gegenstaende')"
          >
            <div 
              class="flex items-center justify-center rounded-lg"
              :style="{
                width: gridConfig.iconWidth,
                height: gridConfig.iconHeight,
                backgroundColor: gridConfig.iconBackgroundColor
              }"
            >
              <img 
                src="/eyeglasses.png" 
                alt="GEGENSTÄNDE" 
                :style="getIconStyle(2)"
              />
            </div>
            <div 
              class="text-center font-source-code font-normal"
              :style="getTextStyle(2)"
            >
              GEGENSTÄNDE
            </div>
          </div>

          <!-- ZURÜCK -->
          <div 
            class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 transition-colors"
            :style="getTileStyle(3)"
            @click="selectUmgebung('zurueck')"
          >
            <div 
              class="flex items-center justify-center rounded-lg"
              :style="{
                width: gridConfig.iconWidth,
                height: gridConfig.iconHeight,
                backgroundColor: gridConfig.iconBackgroundColor
              }"
            >
              <img 
                src="/Goback.svg" 
                alt="ZURÜCK" 
                :style="getIconStyle(3)"
              />
            </div>
            <div 
              class="text-center font-source-code font-normal"
              :style="getTextStyle(3)"
            >
              ZURÜCK
            </div>
          </div>
        </div>
      </div>
    </main>
    </div>
  </div>
</template>

<style scoped>
.high-contrast {
  filter: contrast(150%);
}

.large-text {
  font-size: 1.2em;
}

/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

</style>
