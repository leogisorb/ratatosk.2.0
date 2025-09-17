<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { useCommunicationStore } from '@/stores/communication'
import { useFaceRecognition } from '@/composables/useFaceRecognition'
import { mainGridConfig, getTileStyle as getTileStyleConfig, getIconStyle as getIconStyleConfig, getTextStyle as getTextStyleConfig, getIconColor } from '@/config/gridConfig'

// Router
const router = useRouter()

// Stores
const settingsStore = useSettingsStore()
const communicationStore = useCommunicationStore()

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

// Menu Items mit echten SVG-Icons
const menuItems = [
  {
    id: 'warning',
    title: 'WARNGERÄUSCH',
    description: 'Warnung senden',
    icon: 'bell.svg'
  },
  {
    id: 'communication',
    title: 'UNTERHALTEN',
    description: 'Nachrichten senden und empfangen',
    icon: 'comment-dots.svg'
  },
  {
    id: 'profile',
    title: 'ICH',
    description: 'Persönliche Einstellungen',
    icon: 'user.svg'
  },
  {
    id: 'pain',
    title: 'SCHMERZEN',
    description: 'Schmerzen dokumentieren',
    icon: 'headache.svg'
  },
  {
    id: 'environment',
    title: 'UMGEBUNG',
    description: 'Umgebung beschreiben',
    icon: 'house-chimney.svg'
  },
  {
    id: 'settings',
    title: 'EINSTELLUNGEN',
    description: 'App konfigurieren',
    icon: 'settings-sliders.svg'
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
  console.log('speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value, 'speechSynthesis:', speechSynthesis)
  
  if (!isTTSEnabled.value || !speechSynthesis) {
    console.log('TTS disabled or speechSynthesis not available')
    return
  }
  
  // Stoppe vorherige Sprachausgabe
  speechSynthesis.cancel()
  
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'de-DE'
  utterance.rate = 0.8 // Etwas langsamer sprechen
  utterance.pitch = 1.0
  utterance.volume = 0.8
  
  console.log('Speaking:', text)
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

// Dark Mode Toggle
const toggleDarkMode = () => {
  settingsStore.toggleDarkMode()
}

// TTS Toggle
const toggleTTS = () => {
  console.log('toggleTTS called, current state:', isTTSEnabled.value)
  isTTSEnabled.value = !isTTSEnabled.value
  console.log('TTS toggled to:', isTTSEnabled.value)
  
  if (!isTTSEnabled.value) {
    speechSynthesis.cancel()
    console.log('TTS cancelled')
  } else {
    // Test TTS when enabling
    speakText('Sprachausgabe aktiviert')
  }
}

// Methods
function selectMenu(menuId: string) {
  console.log('selectMenu called with menuId:', menuId)
  currentMenu.value = menuId
  pauseAutoMode() // Pausiere Auto-Modus statt zu stoppen
  
  // Spreche den ausgewählten Menüpunkt vor
  const selectedItem = menuItems.find(item => item.id === menuId)
  if (selectedItem) {
    speakText(selectedItem.title)
  }
  
  // Navigate to corresponding route based on menu ID
  switch (menuId) {
    case 'warning':
      console.log('Navigating to /warning')
      router.push('/warning')
      break
    case 'communication':
      console.log('Navigating to /unterhalten')
      router.push('/unterhalten')
      break
    case 'profile':
      console.log('Navigating to /ich')
      router.push('/ich')
      break
    case 'pain':
      console.log('Navigating to /schmerz')
      router.push('/schmerz')
      break
    case 'environment':
      console.log('Navigating to /umgebung')
      router.push('/umgebung')
      break
    case 'settings':
      console.log('Navigating to /einstellungen')
      router.push('/einstellungen')
      break
    default:
      console.log('Unknown menu ID:', menuId)
  }
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Blink Detection - Verbessert und weniger sensibel (wie in UnterhaltenView)
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
  
  // Resume Auto Mode if it was paused (e.g., returning from warning page)
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
              <h1 class="text-2xl font-bold text-black font-source-code font-light">
                RATATOSK
              </h1>
              <img src="/rattenkopf.svg" alt="Ratatosk Logo" class="w-12 h-12" />
              <div class="w-2.5 h-1.5 bg-[#00796B]"></div>
            </div>
            
            <!-- Control Buttons -->
            <div class="flex space-x-2">
              <!-- TTS Toggle Button -->
              <button
                @click="toggleTTS"
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

              <!-- Dark Mode Toggle Button -->
              <button
                @click="toggleDarkMode"
                class="p-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition-colors"
                :title="settingsStore.isDarkMode ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'"
              >
                <!-- Sun Icon für Light Mode -->
                <svg
                  v-if="settingsStore.isDarkMode"
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
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <!-- Moon Icon für Dark Mode -->
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
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
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
            <!-- WARNGERÄUSCH -->
            <div 
              class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              :style="getTileStyle(0)"
              @click="selectMenu('warning')"
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
                  src="/bell.svg" 
                  alt="WARNGERÄUSCH" 
                  :style="getIconStyle(0)"
                />
              </div>
              <div 
                class="text-center font-source-code font-normal"
                :style="getTextStyle(0)"
              >
                WARNGERÄUSCH
              </div>
            </div>

            <!-- UNTERHALTEN -->
            <div 
              class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              :style="getTileStyle(1)"
              @click="selectMenu('communication')"
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
                  src="/comment-dots.svg" 
                  alt="UNTERHALTEN" 
                  :style="getIconStyle(1)"
                />
              </div>
              <div 
                class="text-center font-source-code font-normal"
                :style="getTextStyle(1)"
              >
                UNTERHALTEN
              </div>
            </div>

            <!-- ICH -->
            <div 
              class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              :style="getTileStyle(2)"
              @click="selectMenu('profile')"
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
                  src="/user.svg" 
                  alt="ICH" 
                  :style="getIconStyle(2)"
                />
              </div>
              <div 
                class="text-center font-source-code font-normal"
                :style="getTextStyle(2)"
              >
                ICH
              </div>
            </div>

            <!-- SCHMERZEN -->
            <div 
              class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              :style="getTileStyle(3)"
              @click="selectMenu('pain')"
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
                  src="/headache.svg" 
                  alt="SCHMERZEN" 
                  :style="getIconStyle(3)"
                />
              </div>
              <div 
                class="text-center font-source-code font-normal"
                :style="getTextStyle(3)"
              >
                SCHMERZEN
              </div>
            </div>

            <!-- UMGEBUNG -->
            <div 
              class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              :style="getTileStyle(4)"
              @click="selectMenu('environment')"
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
                  src="/house-chimney.svg" 
                  alt="UMGEBUNG" 
                  :style="getIconStyle(4)"
                />
              </div>
              <div 
                class="text-center font-source-code font-normal"
                :style="getTextStyle(4)"
              >
                UMGEBUNG
              </div>
            </div>

            <!-- EINSTELLUNGEN -->
            <div 
              class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              :style="getTileStyle(5)"
              @click="selectMenu('settings')"
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
                  src="/settings-sliders.svg" 
                  alt="EINSTELLUNGEN" 
                  :style="getIconStyle(5)"
                />
              </div>
              <div 
                class="text-center font-source-code font-normal"
                :style="getTextStyle(5)"
              >
                EINSTELLUNGEN
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Content Area (Modal) -->
    <div v-if="currentMenu !== ''" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ menuItems.find(item => item.id === currentMenu)?.title }}
          </h2>
          <button 
            @click="currentMenu = ''"
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <!-- Communication Interface -->
        <div v-if="currentMenu === 'communication'" class="space-y-6">
          <div class="space-y-4">
            <textarea
              v-model="communicationStore.currentMessage"
              placeholder="Nachricht eingeben..."
              class="input-field resize-none h-24 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              @keydown.enter.prevent="communicationStore.sendCurrentMessage"
            ></textarea>
            
            <div class="flex space-x-2">
              <button
                @click="communicationStore.sendCurrentMessage"
                class="btn-primary"
              >
                Senden
              </button>
              <button
                @click="communicationStore.currentMessage = ''"
                class="btn-secondary"
              >
                Löschen
              </button>
            </div>
          </div>

          <!-- Quick Messages -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Schnellnachrichten
            </h3>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="message in communicationStore.quickMessages"
                :key="message.id"
                @click="communicationStore.addQuickMessage(message.id)"
                class="p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-white"
              >
                <div class="flex items-center space-x-2">
                  <span class="text-lg">{{ message.icon }}</span>
                  <span class="text-sm">{{ message.text }}</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Message History -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Nachrichtenverlauf
            </h3>
            <div class="space-y-2 max-h-64 overflow-y-auto">
              <div
                v-for="message in communicationStore.messages"
                :key="message.id"
                class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 dark:text-white"
              >
                <div class="flex justify-between items-start">
                  <p class="text-sm">{{ message.text }}</p>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatTime(message.timestamp) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Other Menu Content -->
        <div v-else class="text-center py-12">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {{ menuItems.find(item => item.id === currentMenu)?.title }}
          </h2>
          <p class="text-gray-600 dark:text-gray-300">
            {{ menuItems.find(item => item.id === currentMenu)?.description }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Diese Funktion wird noch implementiert...
          </p>
        </div>
      </div>
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

/* Ratatosk Header mit höchster Spezifität */
.ratatosk-header-main {
  background-color: #D9D9D9 !important;
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
