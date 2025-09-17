<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { useFaceRecognition } from '@/composables/useFaceRecognition'
import { mainGridConfig, getTileStyle as getTileStyleConfig, getIconStyle as getIconStyleConfig, getTextStyle as getTextStyleConfig, getIconColor } from '@/config/gridConfig'

// Router
const router = useRouter()

// Stores
const settingsStore = useSettingsStore()

// Face Recognition
const faceRecognition = useFaceRecognition()

// State
const currentMenu = ref('')
const currentTileIndex = ref(0)
const isAutoMode = ref(true)
const autoModeInterval = ref<number | null>(null)
const closedFrames = ref(0)
const eyesClosed = ref(false)
const timeClosed = 2 // 2 Sekunden für Blinzeln
const isAutoModePaused = ref(false)

// Verbesserte Blink-Detection Parameter - zentral gesteuert
const blinkThreshold = computed(() => Math.ceil(settingsStore.settings.blinkSensitivity * 10)) // Konvertiere Sekunden zu Frames (10 FPS)
const lastBlinkTime = ref(0)
const blinkCooldown = 1500 // 1.5 Sekunden Cooldown zwischen Blinks

// Text-to-Speech
const speechSynthesis = window.speechSynthesis
const isTTSEnabled = ref(true)

// Verwende die zentrale Grid-Konfiguration
const gridConfig = mainGridConfig

// Menu Items für Ich-Seite - 5 Bereiche + Zurück
const menuItems = [
  {
    id: 'ernaehrung',
    title: 'ERNÄHRUNG',
    description: 'Ernährung verwalten',
    icon: 'hamburger-soda.svg'
  },
  {
    id: 'gefuehle',
    title: 'GEFÜHLE',
    description: 'Gefühle dokumentieren',
    icon: 'face-smile-upside-down.svg'
  },
  {
    id: 'kleidung',
    title: 'KLEIDUNG',
    description: 'Kleidung verwalten',
    icon: 'clothes-hanger.svg'
  },
  {
    id: 'hygiene',
    title: 'HYGIENE',
    description: 'Hygiene verwalten',
    icon: 'bath.svg'
  },
  {
    id: 'bewegung',
    title: 'BEWEGUNG',
    description: 'Bewegung dokumentieren',
    icon: 'barefoot.svg'
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
    
    currentTileIndex.value = (currentTileIndex.value + 1) % menuItems.length
    
    // Spreche den aktuellen Menüpunkt vor
    const currentItem = menuItems[currentTileIndex.value]
    speakText(currentItem.title)
    
    autoModeInterval.value = window.setTimeout(cycleTiles, 3000) // 3 Sekunden
  }
  
  // Spreche den ersten Menüpunkt vor
  const firstItem = menuItems[currentTileIndex.value]
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
    const currentItem = menuItems[currentTileIndex.value]
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

// Menu Selection
function selectMenu(menuId: string) {
  console.log('selectMenu called with menuId:', menuId)
  pauseAutoMode() // Pausiere Auto-Modus statt zu stoppen
  
  const selectedItem = menuItems.find(item => item.id === menuId)
  if (selectedItem) {
    speakText(selectedItem.title)
  }
  
  switch (menuId) {
    case 'zurueck':
      console.log('Navigating back to /app')
      router.push('/app')
      break
    case 'ernaehrung':
      console.log('Ernährung selected')
      speakText('Ernährung ausgewählt')
      router.push('/ernaehrung')
      break
    case 'gefuehle':
      console.log('Navigating to /gefuehle')
      router.push('/gefuehle')
      break
    case 'kleidung':
      console.log('Kleidung selected')
      speakText('Kleidung ausgewählt')
      router.push('/kleidung')
      break
    case 'hygiene':
      console.log('Hygiene selected')
      speakText('Hygiene ausgewählt')
      router.push('/hygiene')
      break
    case 'bewegung':
      console.log('Bewegung selected')
      speakText('Bewegung ausgewählt')
      router.push('/bewegung')
      break
    default:
      console.log('Unknown menu item:', menuId)
  }
}

// Blink Detection - Verbessert und weniger sensibel (wie in anderen Views)
const handleBlink = () => {
  const now = Date.now()
  
  if (faceRecognition.isBlinking()) {
    closedFrames.value++
    
    // Nur verarbeiten wenn genug Zeit seit letztem Blink vergangen ist
    if (now - lastBlinkTime.value < blinkCooldown) {
      return
    }
    
    // Menü-Auswahl bei kurzem Blinzeln (mindestens 5 Frames = 0.5 Sekunden)
    if (closedFrames.value >= blinkThreshold.value && !eyesClosed.value) {
      const currentItem = menuItems[currentTileIndex.value]
      console.log('Blink activation for tile:', currentTileIndex.value, 'menuId:', currentItem.id, 'title:', currentItem.title, 'frames:', closedFrames.value, 'threshold:', blinkThreshold)
      
      // Spreche den Menüpunkt vor, bevor er ausgewählt wird
      speakText(currentItem.title)
      
      selectMenu(currentItem.id)
      eyesClosed.value = true
      lastBlinkTime.value = now
      // Reset frames after successful detection
      closedFrames.value = 0
    }
  } else {
    // Reset nur wenn Augen wirklich offen sind
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
  const currentItem = menuItems[currentTileIndex.value]
  console.log('Right click activation for tile:', currentTileIndex.value, 'menuId:', currentItem.id, 'title:', currentItem.title)
  
  // Spreche den Menüpunkt vor, bevor er ausgewählt wird
  speakText(currentItem.title)
  
  selectMenu(currentItem.id)
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
    <div class="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
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
                ICH
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
                <!-- Muted Speaker Icon für TTS deaktiviert -->
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
        </div>
      </header>

    <!-- Main Content -->
    <main class="flex-1 flex items-center justify-center">
      <!-- Desktop Layout (3×2 Grid) - wird auf allen Bildschirmen angezeigt -->
      <div class="max-w-7xl mx-auto p-8">
        <div 
          class="grid grid-cols-3" 
          :style="{
            gap: gridConfig.tileGap,
            gridTemplateColumns: `repeat(3, ${gridConfig.tileWidth})`
          }"
        >
          <!-- ERNÄHRUNG -->
          <div 
            class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :style="getTileStyle(0)"
            @click="selectMenu('ernaehrung')"
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
                src="/hamburger-soda.svg" 
                alt="ERNÄHRUNG" 
                :style="getIconStyle(0)"
              />
            </div>
            <div 
              class="text-center font-source-code font-normal"
              :style="getTextStyle(0)"
            >
              ERNÄHRUNG
            </div>
          </div>

          <!-- GEFÜHLE -->
          <div 
            class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :style="getTileStyle(1)"
            @click="selectMenu('gefuehle')"
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
                src="/face-smile-upside-down.svg" 
                alt="GEFÜHLE" 
                :style="getIconStyle(1)"
              />
            </div>
            <div 
              class="text-center font-source-code font-normal"
              :style="getTextStyle(1)"
            >
              GEFÜHLE
            </div>
          </div>

          <!-- KLEIDUNG -->
          <div 
            class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :style="getTileStyle(2)"
            @click="selectMenu('kleidung')"
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
                src="/clothes-hanger.svg" 
                alt="KLEIDUNG" 
                :style="getIconStyle(2)"
              />
            </div>
            <div 
              class="text-center font-source-code font-normal"
              :style="getTextStyle(2)"
            >
              KLEIDUNG
            </div>
          </div>

          <!-- HYGIENE -->
          <div 
            class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :style="getTileStyle(3)"
            @click="selectMenu('hygiene')"
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
                src="/bath.svg" 
                alt="HYGIENE" 
                :style="getIconStyle(3)"
              />
            </div>
            <div 
              class="text-center font-source-code font-normal"
              :style="getTextStyle(3)"
            >
              HYGIENE
            </div>
          </div>

          <!-- BEWEGUNG -->
          <div 
            class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :style="getTileStyle(4)"
            @click="selectMenu('bewegung')"
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
                src="/barefoot.svg" 
                alt="BEWEGUNG" 
                :style="getIconStyle(4)"
              />
            </div>
            <div 
              class="text-center font-source-code font-normal"
              :style="getTextStyle(4)"
            >
              BEWEGUNG
            </div>
          </div>

          <!-- ZURÜCK -->
          <div 
            class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :style="getTileStyle(5)"
            @click="selectMenu('zurueck')"
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
                :style="getIconStyle(5)"
              />
            </div>
            <div 
              class="text-center font-source-code font-normal"
              :style="getTextStyle(5)"
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