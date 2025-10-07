<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../settings/stores/settings'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { keyboardGridConfig, getKeyboardTileStyle } from '../../../config/gridConfig'
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
const isAutoModePaused = ref(false)

// Text-to-Speech
const speechSynthesis = window.speechSynthesis
const isTTSEnabled = ref(true)

// Verwende die zentrale Grid-Konfiguration
const gridConfig = keyboardGridConfig

// Geschwindigkeits-Optionen (in Millisekunden)
const geschwindigkeitsItems = [
  {
    id: 'sehr-langsam',
    title: 'SEHR LANGSAM',
    description: '5 Sekunden',
    speed: 5000
  },
  {
    id: 'langsam',
    title: 'LANGSAM',
    description: '4 Sekunden',
    speed: 4000
  },
  {
    id: 'normal',
    title: 'NORMAL',
    description: '3 Sekunden',
    speed: 3000
  },
  {
    id: 'schnell',
    title: 'SCHNELL',
    description: '2 Sekunden',
    speed: 2000
  },
  {
    id: 'sehr-schnell',
    title: 'SEHR SCHNELL',
    description: '1 Sekunde',
    speed: 1000
  },
  {
    id: 'zurueck',
    title: 'ZURÜCK',
    description: 'Zurück zu Einstellungen',
    speed: 0
  }
]

// Computed
const appClasses = computed(() => ({
  'dark': settingsStore.isDarkMode
}))

// Text-to-Speech Funktion
const speakText = (text: string) => {
  console.log('LeuchtDauerView speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value, 'speechSynthesis:', speechSynthesis)
  
  if (!isTTSEnabled.value || !speechSynthesis) {
    console.log('LeuchtDauerView TTS disabled or speechSynthesis not available')
    return
  }
  
  speechSynthesis.cancel()
  
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'de-DE'
  utterance.rate = 0.8
  utterance.pitch = 1.0
  utterance.volume = 0.8
  
  console.log('LeuchtDauerView Speaking:', text)
  speechSynthesis.speak(utterance)
}

// TTS Toggle
const toggleTTS = () => {
  console.log('LeuchtDauerView toggleTTS called, current state:', isTTSEnabled.value)
  isTTSEnabled.value = !isTTSEnabled.value
  console.log('LeuchtDauerView TTS toggled to:', isTTSEnabled.value)
  
  if (!isTTSEnabled.value) {
    speechSynthesis.cancel()
    console.log('LeuchtDauerView TTS cancelled')
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
    
    currentTileIndex.value = (currentTileIndex.value + 1) % geschwindigkeitsItems.length
    
    // Spreche den aktuellen Menüpunkt vor
    const currentItem = geschwindigkeitsItems[currentTileIndex.value]
    speakText(currentItem.title)
    
    autoModeInterval.value = window.setTimeout(cycleTiles, settingsStore.settings.autoModeSpeed)
  }
  
  // Spreche den ersten Menüpunkt vor
  const firstItem = geschwindigkeitsItems[currentTileIndex.value]
  speakText(firstItem.title)
  
  // Starte den ersten Zyklus nach der aktuellen Geschwindigkeit
  autoModeInterval.value = window.setTimeout(cycleTiles, settingsStore.settings.autoModeSpeed)
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
    const currentItem = geschwindigkeitsItems[currentTileIndex.value]
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

// Geschwindigkeits-Auswahl
function selectGeschwindigkeit(geschwindigkeitId: string) {
  console.log('selectGeschwindigkeit called with geschwindigkeitId:', geschwindigkeitId)
  pauseAutoMode() // Pausiere Auto-Modus statt zu stoppen
  
  switch (geschwindigkeitId) {
    case 'sehr-langsam':
      console.log('Sehr langsam selected')
      speakText('Sehr langsam ausgewählt - 5 Sekunden')
      settingsStore.updateSettings({ autoModeSpeed: 5000 })
      break
    case 'langsam':
      console.log('Langsam selected')
      speakText('Langsam ausgewählt - 4 Sekunden')
      settingsStore.updateSettings({ autoModeSpeed: 4000 })
      break
    case 'normal':
      console.log('Normal selected')
      speakText('Normal ausgewählt - 3 Sekunden')
      settingsStore.updateSettings({ autoModeSpeed: 3000 })
      break
    case 'schnell':
      console.log('Schnell selected')
      speakText('Schnell ausgewählt - 2 Sekunden')
      settingsStore.updateSettings({ autoModeSpeed: 2000 })
      break
    case 'sehr-schnell':
      console.log('Sehr schnell selected')
      speakText('Sehr schnell ausgewählt - 1 Sekunde')
      settingsStore.updateSettings({ autoModeSpeed: 1000 })
      break
    case 'zurueck':
      console.log('Zurück selected')
      speakText('Zurück zu Einstellungen')
      router.push('/einstellungen')
      break
  }
  
  // Starte Auto-Modus nach 10 Sekunden neu
  setTimeout(() => {
    isAutoModePaused.value = false
    startAutoMode()
  }, 10000)
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
  console.log('LeuchtDauerView Blink detected, selecting current item')
  
  const currentItem = geschwindigkeitsItems[currentTileIndex.value]
  speakText(currentItem.title)
  selectGeschwindigkeit(currentItem.id)
}

// Right Click Handler
const handleRightClick = (event: MouseEvent) => {
  event.preventDefault()
  console.log('LeuchtDauerView Right click detected, selecting current item')
  
  const currentItem = geschwindigkeitsItems[currentTileIndex.value]
  speakText(currentItem.title)
  selectGeschwindigkeit(currentItem.id)
}

// Blink Detection Parameter
const lastBlinkTime = ref(0)
// Blink Cooldown aus Settings (in Millisekunden)
const blinkCooldown = computed(() => settingsStore.settings.blinkSensitivity * 1000)

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
      <!-- Global Header -->
      <GlobalHeader>
        <div class="flex items-center space-x-4">
          <button @click="$router.push('/einstellungen')" class="p-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-2xl font-bold text-black font-source-code font-light">
            LEUCHT-DAUER
          </h1>
        </div>
        
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
      </GlobalHeader>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col items-center justify-center p-8">
        <!-- Title -->
        <div class="text-center mb-12">
          <h2 class="text-5xl font-bold text-gray-800 dark:text-gray-200 font-source-code mb-4">
            Wählen Sie die Geschwindigkeit
          </h2>
          <p class="text-gray-600 dark:text-gray-400" style="font-size: 2rem;">
            Aktuelle Geschwindigkeit: {{ (settingsStore.settings.autoModeSpeed / 1000).toFixed(1) }} Sekunden
          </p>
        </div>

        <!-- Abstandshalter -->
        <div class="h-24"></div>

        <!-- Keyboard Container -->
        <div 
          class="flex flex-wrap justify-center items-stretch"
          :style="{
            gap: '2rem',
            maxWidth: '1200px'
          }"
        >
          <!-- Geschwindigkeits-Buttons -->
          <button
            v-for="(item, index) in geschwindigkeitsItems"
            :key="item.id"
            @click="selectGeschwindigkeit(item.id)"
            class="transition-all duration-300 font-medium hover:scale-110 flex flex-col justify-center"
            :style="getKeyboardTileStyle(index, currentTileIndex, gridConfig)"
          >
            <div class="text-center">
              <div class="text-3xl font-bold mb-2">{{ item.title }}</div>
              <div class="text-xl text-gray-600 dark:text-gray-400">{{ item.description }}</div>
            </div>
          </button>
        </div>

        <!-- Abstandshalter -->
        <div class="h-24"></div>

        <!-- Instructions -->
        <div class="mt-16 text-center">
          <div class="text-2xl text-gray-600 dark:text-gray-400 space-y-2">
            <p><strong>Bedienung:</strong></p>
            <p>Kurz blinzeln ({{ settingsStore.settings.blinkSensitivity }}s): Geschwindigkeit auswählen</p>
            <p>Rechte Maustaste: Geschwindigkeit auswählen</p>
            <p>Auto-Modus: Automatischer Durchlauf durch alle Geschwindigkeiten</p>
          </div>
        </div>

        <!-- Abstandshalter -->
        <div style="height: 4rem;"></div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.font-source-code {
  font-family: 'Source Code Pro', monospace;
}
</style>
