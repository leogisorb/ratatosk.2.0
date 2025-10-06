<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settings'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useKeyboardDesignStore } from '../../communication/stores/keyboardDesign'
import KeyboardDesign from '../../communication/components/KeyboardDesign.vue'
import { mainGridConfig, getTileStyle as getTileStyleConfig, getIconStyle as getIconStyleConfig, getTextStyle as getTextStyleConfig, getIconColor } from '../../../config/gridConfig'

// Router
const router = useRouter()

// Stores
const settingsStore = useSettingsStore()
const keyboardDesignStore = useKeyboardDesignStore()

// Face Recognition
const faceRecognition = useFaceRecognition()

// State
const currentTileIndex = ref(0)
const isAutoMode = ref(true)
const autoModeInterval = ref<number | null>(null)
const closedFrames = ref(0)
const eyesClosed = ref(false)
const isAutoModePaused = ref(false)

// Verbesserte Blink-Detection Parameter
const blinkThreshold = 5 // Mindestens 5 Frames (0.5 Sekunden) für gültigen Blink
const lastBlinkTime = ref(0)
const blinkCooldown = computed(() => settingsStore.settings.blinkSensitivity * 1000)

// Text-to-Speech
const speechSynthesis = window.speechSynthesis
const isTTSEnabled = ref(true)

// Verwende die zentrale Grid-Konfiguration
const gridConfig = mainGridConfig

// Einstellungs-Items basierend auf dem Foto
const einstellungsItems = [
  {
    id: 'tastatur-design',
    title: 'TASTATUR-DESIGN',
    description: 'Tastatur-Design anpassen',
    icon: 'settings-sliders.svg'
  },
  {
    id: 'leucht-dauer',
    title: 'LEUCHT-DAUER',
    description: 'Leuchtdauer einstellen',
    icon: 'bell.svg'
  },
  {
    id: 'blinzeldaue',
    title: 'BLINZELDAUE',
    description: 'Blinzeldauer anpassen',
    icon: 'face-smile-upside-down.svg'
  },
  {
    id: 'farbmodus',
    title: 'FARBMODUS',
    description: 'Farbmodus wechseln',
    icon: 'settings-sliders.svg'
  },
  {
    id: 'kamera',
    title: 'KAMERA',
    description: 'Kamera-Einstellungen',
    icon: 'settings-sliders.svg'
  },
  {
    id: 'impressum',
    title: 'IMPRESSUM',
    description: 'Impressum anzeigen',
    icon: 'user.svg'
  }
]

// Computed
const appClasses = computed(() => ({
  'dark': settingsStore.isDarkMode
}))

// Text-to-Speech Funktion
const speakText = (text: string) => {
  console.log('EinstellungenView speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value, 'speechSynthesis:', speechSynthesis)
  
  if (!isTTSEnabled.value || !speechSynthesis) {
    console.log('EinstellungenView TTS disabled or speechSynthesis not available')
    return
  }
  
  speechSynthesis.cancel()
  
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'de-DE'
  utterance.rate = 0.8
  utterance.pitch = 1.0
  utterance.volume = 0.8
  
  console.log('EinstellungenView Speaking:', text)
  speechSynthesis.speak(utterance)
}

// TTS Toggle
const toggleTTS = () => {
  console.log('EinstellungenView toggleTTS called, current state:', isTTSEnabled.value)
  isTTSEnabled.value = !isTTSEnabled.value
  console.log('EinstellungenView TTS toggled to:', isTTSEnabled.value)
  
  if (!isTTSEnabled.value) {
    speechSynthesis.cancel()
    console.log('EinstellungenView TTS cancelled')
  } else {
    // Test TTS when enabling
    speakText('Sprachausgabe aktiviert')
  }
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
    
    currentTileIndex.value = (currentTileIndex.value + 1) % einstellungsItems.length
    
    // Spreche den aktuellen Menüpunkt vor
    const currentItem = einstellungsItems[currentTileIndex.value]
    speakText(currentItem.title)
    
    autoModeInterval.value = window.setTimeout(cycleTiles, 3000) // 3 Sekunden
  }
  
  // Spreche den ersten Menüpunkt vor
  const firstItem = einstellungsItems[currentTileIndex.value]
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
    const currentItem = einstellungsItems[currentTileIndex.value]
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

// Einstellungs-Auswahl
function selectEinstellung(einstellungId: string) {
  console.log('selectEinstellung called with einstellungId:', einstellungId)
  pauseAutoMode() // Pausiere Auto-Modus statt zu stoppen
  
  switch (einstellungId) {
    case 'tastatur-design':
      console.log('Tastatur-Design selected')
      speakText('Tastatur-Design ausgewählt')
      // Hier könnte eine Tastatur-Design-Seite geöffnet werden
      break
    case 'leucht-dauer':
      console.log('Leucht-Dauer selected')
      speakText('Leucht-Dauer ausgewählt')
      stopAutoMode() // Stoppe Auto-Modus komplett vor Navigation
      router.push('/leucht-dauer')
      break
    case 'blinzeldaue':
      console.log('Blinzeldauer selected')
      speakText('Blinzeldauer ausgewählt')
      stopAutoMode() // Stoppe Auto-Modus komplett vor Navigation
      router.push('/blinzeldauer')
      break
    case 'farbmodus':
      console.log('Farbmodus selected')
      speakText('Farbmodus ausgewählt')
      toggleDarkMode()
      // Auto-Modus sofort neu starten nach Farbmodus-Wechsel
      setTimeout(() => {
        isAutoModePaused.value = false
        startAutoMode()
      }, 2000) // 2 Sekunden warten
      break
    case 'kamera':
      console.log('Kamera selected')
      speakText('Kamera ausgewählt')
      stopAutoMode() // Stoppe Auto-Modus komplett vor Navigation
      router.push('/kamera')
      break
    case 'impressum':
      console.log('Impressum selected')
      speakText('Impressum ausgewählt')
      // Hier könnte das Impressum geöffnet werden
      break
    case 'zurueck':
      console.log('Zurück selected')
      speakText('Zurück zur Hauptseite')
      stopAutoMode() // Stoppe Auto-Modus komplett vor Navigation
      router.push('/app')
      break
  }
  
  // Nur bei lokalen Aktionen (nicht bei Navigation) Auto-Modus nach 10 Sekunden neu starten
  if (einstellungId === 'tastatur-design' || einstellungId === 'impressum') {
    setTimeout(() => {
      isAutoModePaused.value = false
      startAutoMode()
    }, 10000)
  }
}

// Blink Detection
const handleBlink = () => {
  if (!faceRecognition.isBlinking()) return
  
  const now = Date.now()
  
  // Cooldown prüfen
  if (now - lastBlinkTime.value < blinkCooldown.value) {
    return
  }
  
  lastBlinkTime.value = now
  console.log('EinstellungenView Blink detected, selecting current item')
  
  const currentItem = einstellungsItems[currentTileIndex.value]
  speakText(currentItem.title)
  selectEinstellung(currentItem.id)
}

// Right Click Handler
const handleRightClick = (event: MouseEvent) => {
  event.preventDefault()
  console.log('EinstellungenView Right click detected, selecting current item')
  
  const currentItem = einstellungsItems[currentTileIndex.value]
  speakText(currentItem.title)
  selectEinstellung(currentItem.id)
}

// Lifecycle
onMounted(() => {
  if (!faceRecognition.isActive.value) {
    faceRecognition.start()
  }
  
  // Resume Auto Mode if it was paused (e.g., returning from another page)
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
              <button @click="stopAutoMode(); $router.push('/app')" class="p-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition-colors">
                <svg class="w-6 h-6" :style="{ color: getIconColor(false, settingsStore.isDarkMode) }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 class="text-2xl font-bold text-black font-source-code font-light">
                EINSTELLUNGEN
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
      <main class="flex-1 flex flex-col items-center justify-center p-8">
        <!-- Grid Container -->
        <div 
          class="grid gap-8"
          :style="{
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: gridConfig.tileGap
          }"
        >
          <!-- TASTATUR-DESIGN -->
          <div 
            class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :style="getTileStyle(0)"
            @click="$router.push('/tastaturdesign')"
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
                alt="TASTATUR-DESIGN" 
                :style="getIconStyle(0)"
              />
            </div>
            <div 
              class="text-center font-source-code font-normal"
              :style="getTextStyle(0)"
            >
              TASTATUR
            </div>
          </div>

          <!-- LEUCHT-DAUER -->
          <div 
            class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :style="getTileStyle(1)"
            @click="selectEinstellung('leucht-dauer')"
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
                alt="LEUCHT-DAUER" 
                :style="getIconStyle(1)"
              />
            </div>
            <div 
              class="text-center font-source-code font-normal"
              :style="getTextStyle(1)"
            >
              LEUCHT-DAUER
            </div>
          </div>

          <!-- BLINZELDAUE -->
          <div 
            class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :style="getTileStyle(2)"
            @click="selectEinstellung('blinzeldaue')"
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
                alt="BLINZELDAUE" 
                :style="getIconStyle(2)"
              />
            </div>
            <div 
              class="text-center font-source-code font-normal"
              :style="getTextStyle(2)"
            >
              BLINZELDAUE
            </div>
          </div>

          <!-- FARBMODUS -->
          <div 
            class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :style="getTileStyle(3)"
            @click="selectEinstellung('farbmodus')"
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
                alt="FARBMODUS" 
                :style="getIconStyle(3)"
              />
            </div>
            <div 
              class="text-center font-source-code font-normal"
              :style="getTextStyle(3)"
            >
              FARBMODUS
            </div>
          </div>

          <!-- KAMERA -->
          <div 
            class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :style="getTileStyle(4)"
            @click="selectEinstellung('kamera')"
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
                alt="KAMERA" 
                :style="getIconStyle(4)"
              />
            </div>
            <div 
              class="text-center font-source-code font-normal"
              :style="getTextStyle(4)"
            >
              KAMERA
            </div>
          </div>

          <!-- IMPRESSUM -->
          <div 
            class="flex flex-col justify-start items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :style="getTileStyle(5)"
            @click="selectEinstellung('impressum')"
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
                alt="IMPRESSUM" 
                :style="getIconStyle(5)"
              />
            </div>
            <div 
              class="text-center font-source-code font-normal"
              :style="getTextStyle(5)"
            >
              IMPRESSUM
            </div>
          </div>
        </div>


        <!-- Status Message -->
        <div class="mt-8 text-center">
          <p class="text-lg italic text-gray-600 dark:text-gray-400">
            Blinzeldaue wurde erfolgreich geändert.
          </p>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.font-source-code {
  font-family: 'Source Code Pro', monospace;
}
</style>
