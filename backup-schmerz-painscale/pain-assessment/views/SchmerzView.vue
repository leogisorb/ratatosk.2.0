<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../settings/stores/settings'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { mainGridConfig, getTileStyle as getTileStyleConfig, getIconStyle as getIconStyleConfig, getTextStyle as getTextStyleConfig, getIconColor } from '../../../config/gridConfig'

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

// Schmerz-Items mit Körperteilen
const schmerzItems = [
  {
    id: 'kopf',
    title: 'KOPF',
    description: 'Kopfschmerzen dokumentieren',
    icon: 'head.png'
  },
  {
    id: 'beine',
    title: 'BEINE',
    description: 'Beinschmerzen dokumentieren',
    icon: 'leg.png'
  },
  {
    id: 'arme',
    title: 'ARME',
    description: 'Armschmerzen dokumentieren',
    icon: 'elbow-2.png'
  },
  {
    id: 'torso',
    title: 'TORSO',
    description: 'Torsoschmerzen dokumentieren',
    icon: 'back.png'
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
  settingsStore.isDarkMode ? 'dark' : '',
  settingsStore.isHighContrast ? 'high-contrast' : '',
  settingsStore.isLargeText ? 'large-text' : ''
])

// Text-to-Speech Funktion
const speakText = (text: string) => {
  console.log('SchmerzView speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value, 'speechSynthesis:', speechSynthesis)
  
  if (!isTTSEnabled.value || !speechSynthesis) {
    console.log('SchmerzView TTS disabled or speechSynthesis not available')
    return
  }
  
  speechSynthesis.cancel()
  
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'de-DE'
  utterance.rate = 0.8
  utterance.pitch = 1.0
  utterance.volume = 0.8
  
  console.log('SchmerzView Speaking:', text)
  speechSynthesis.speak(utterance)
}

// TTS Toggle
const toggleTTS = () => {
  console.log('SchmerzView toggleTTS called, current state:', isTTSEnabled.value)
  isTTSEnabled.value = !isTTSEnabled.value
  console.log('SchmerzView TTS toggled to:', isTTSEnabled.value)
  
  if (!isTTSEnabled.value) {
    speechSynthesis.cancel()
    console.log('SchmerzView TTS cancelled')
  } else {
    // Test TTS when enabling
    speakText('Sprachausgabe aktiviert')
  }
}

// Auto Mode Funktionen
const startAutoMode = () => {
  if (autoModeInterval.value) return
  
  // Stelle sicher, dass wir bei Index 0 starten
  currentTileIndex.value = 0
  
  const cycleTiles = () => {
    if (!isAutoMode.value || isAutoModePaused.value) {
      return
    }
    currentTileIndex.value = (currentTileIndex.value + 1) % schmerzItems.length
    const currentItem = schmerzItems[currentTileIndex.value]
    speakText(currentItem.title)
    autoModeInterval.value = window.setTimeout(cycleTiles, 3000) // 3 Sekunden
  }
  
  const firstItem = schmerzItems[currentTileIndex.value]
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

const stopAutoMode = () => {
  if (autoModeInterval.value) {
    clearTimeout(autoModeInterval.value)
    autoModeInterval.value = null
  }
  speechSynthesis.cancel()
}

// Schmerz-Auswahl
function selectSchmerz(schmerzId: string) {
  console.log('selectSchmerz called with schmerzId:', schmerzId)
  pauseAutoMode()
  
  const selectedItem = schmerzItems.find(item => item.id === schmerzId)
  if (selectedItem) {
    speakText(selectedItem.title)
  }
  
  switch (schmerzId) {
    case 'zurueck':
      console.log('Navigating back to /app')
      router.push('/app')
      break
    case 'kopf':
      console.log('Navigating to Kopfschmerzen')
      speakText('Kopfschmerzen ausgewählt')
      router.push('/kopf-schmerz')
      break
    case 'beine':
      console.log('Navigating to Beinschmerzen')
      speakText('Beinschmerzen ausgewählt')
      router.push('/beine-schmerz')
      break
    case 'arme':
      console.log('Navigating to Armschmerzen')
      speakText('Armschmerzen ausgewählt')
      router.push('/arme-schmerz')
      break
    case 'torso':
      console.log('Navigating to Torsoschmerzen')
      speakText('Torsoschmerzen ausgewählt')
      router.push('/torso-schmerz')
      break
    default:
      console.log('Unknown schmerz ID:', schmerzId)
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
      const currentItem = schmerzItems[currentTileIndex.value]
      console.log('Blink activation for tile:', currentTileIndex.value, 'schmerzId:', currentItem.id, 'title:', currentItem.title)
      
      speakText(currentItem.title)
      selectSchmerz(currentItem.id)
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
  event.preventDefault()
  console.log('Right click detected - treating as blink')
  const currentItem = schmerzItems[currentTileIndex.value]
  console.log('Right click activation for tile:', currentTileIndex.value, 'schmerzId:', currentItem.id, 'title:', currentItem.title)
  
  speakText(currentItem.title)
  selectSchmerz(currentItem.id)
}

// Style Functions
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

// Lifecycle
onMounted(() => {
  if (!faceRecognition.isActive.value) {
    faceRecognition.start()
  }
  
  startAutoMode()
  
  const blinkCheckInterval = setInterval(() => {
    handleBlink()
  }, 100)
  
  document.addEventListener('contextmenu', handleRightClick)
})

onUnmounted(() => {
  document.removeEventListener('contextmenu', handleRightClick)
  stopAutoMode()
})
</script>

<template>
  <div :class="appClasses">
    <!-- Header -->
    <header class="bg-gray-200 shadow-2xl flex-shrink-0" style="box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center space-x-4">
            <button @click="$router.push('/app')" class="p-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition-colors">
              <svg class="w-6 h-6" :style="{ color: getIconColor(false, settingsStore.isDarkMode) }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 class="text-2xl font-bold text-black font-source-code font-light">
              SCHMERZEN
            </h1>
          </div>
          
          <!-- TTS Toggle Button -->
          <button
            @click="toggleTTS"
            class="p-2 rounded-lg transition-colors"
            :class="isTTSEnabled ? 'bg-green-300 hover:bg-green-400' : 'bg-gray-300 hover:bg-gray-400'"
            :title="isTTSEnabled ? 'Sprachausgabe deaktivieren' : 'Sprachausgabe aktivieren'"
          >
            <svg
              v-if="isTTSEnabled"
              class="w-6 h-6"
              :style="{ color: getIconColor(true, settingsStore.isDarkMode) }"
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
            <svg
              v-else
              class="w-6 h-6"
              :style="{ color: getIconColor(false, settingsStore.isDarkMode) }"
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
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex items-center justify-center">
      <!-- Desktop Layout (2x3 Grid) - 5 Kacheln -->
      <div class="max-w-7xl mx-auto p-8">
        <div 
          class="grid grid-cols-3" 
          :style="{
            gap: gridConfig.tileGap,
            gridTemplateColumns: `repeat(3, ${gridConfig.tileWidth})`
          }"
        >
          <!-- KOPF -->
          <div 
            class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :style="getTileStyle(0)"
            @click="selectSchmerz('kopf')"
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
                src="/head.png" 
                alt="KOPF" 
                :style="getIconStyle(0)"
              />
            </div>
            <div 
              class="text-center font-source-code font-normal"
              :style="getTextStyle(0)"
            >
              KOPF
            </div>
          </div>

          <!-- BEINE -->
          <div 
            class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :style="getTileStyle(1)"
            @click="selectSchmerz('beine')"
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
                src="/leg.png" 
                alt="BEINE" 
                :style="getIconStyle(1)"
              />
            </div>
            <div 
              class="text-center font-source-code font-normal"
              :style="getTextStyle(1)"
            >
              BEINE
            </div>
          </div>

          <!-- ARME -->
          <div 
            class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :style="getTileStyle(2)"
            @click="selectSchmerz('arme')"
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
                src="/elbow-2.png" 
                alt="ARME" 
                :style="getIconStyle(2)"
              />
            </div>
            <div 
              class="text-center font-source-code font-normal"
              :style="getTextStyle(2)"
            >
              ARME
            </div>
          </div>

          <!-- TORSO -->
          <div 
            class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :style="getTileStyle(3)"
            @click="selectSchmerz('torso')"
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
                src="/back.png" 
                alt="TORSO" 
                :style="getIconStyle(3)"
              />
            </div>
            <div 
              class="text-center font-source-code font-normal"
              :style="getTextStyle(3)"
            >
              TORSO
            </div>
          </div>

          <!-- ZURÜCK -->
          <div 
            class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :style="getTileStyle(4)"
            @click="selectSchmerz('zurueck')"
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
                :style="getIconStyle(4)"
              />
            </div>
            <div 
              class="text-center font-source-code font-normal"
              :style="getTextStyle(4)"
            >
              ZURÜCK
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
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

.dark .overflow-y-auto::-webkit-scrollbar-track {
  background: #374151;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: #6b7280;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>