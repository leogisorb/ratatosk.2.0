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
const blinkCheckInterval = ref<number | null>(null)

// Text-to-Speech
const speechSynthesis = window.speechSynthesis
const isTTSEnabled = ref(true)

// Verwende die zentrale Grid-Konfiguration
const gridConfig = keyboardGridConfig

// Sensibilitäts-Optionen (in Sekunden)
const sensibilitaetsItems = [
  {
    id: 'sehr-sensibel',
    title: 'SEHR SENSIBEL',
    description: '0.3 Sekunden',
    sensitivity: 0.3
  },
  {
    id: 'sensibel',
    title: 'SENSIBEL',
    description: '0.5 Sekunden',
    sensitivity: 0.5
  },
  {
    id: 'normal',
    title: 'NORMAL',
    description: '0.7 Sekunden',
    sensitivity: 0.7
  },
  {
    id: 'weniger-sensibel',
    title: 'WENIGER SENSIBEL',
    description: '1.0 Sekunde',
    sensitivity: 1.0
  },
  {
    id: 'nicht-sensibel',
    title: 'NICHT SENSIBEL',
    description: '1.5 Sekunden',
    sensitivity: 1.5
  },
  {
    id: 'zurueck',
    title: 'ZURÜCK',
    description: 'Zurück zu Einstellungen',
    sensitivity: 0
  }
]

// Computed
const appClasses = computed(() => ({
  'dark': settingsStore.isDarkMode
}))

// Text-to-Speech Funktion
const speakText = (text: string) => {
  console.log('BlinzeldauerView speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value, 'speechSynthesis:', speechSynthesis)
  
  if (!isTTSEnabled.value || !speechSynthesis) {
    console.log('BlinzeldauerView TTS disabled or speechSynthesis not available')
    return
  }
  
  speechSynthesis.cancel()
  
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'de-DE'
  utterance.rate = 0.8
  utterance.pitch = 1.0
  utterance.volume = 0.8
  
  console.log('BlinzeldauerView Speaking:', text)
  speechSynthesis.speak(utterance)
}

// TTS Toggle
const toggleTTS = () => {
  console.log('BlinzeldauerView toggleTTS called, current state:', isTTSEnabled.value)
  isTTSEnabled.value = !isTTSEnabled.value
  console.log('BlinzeldauerView TTS toggled to:', isTTSEnabled.value)
  
  if (!isTTSEnabled.value) {
    speechSynthesis.cancel()
    console.log('BlinzeldauerView TTS cancelled')
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
    
    currentTileIndex.value = (currentTileIndex.value + 1) % sensibilitaetsItems.length
    
    // Spreche den aktuellen Menüpunkt vor
    const currentItem = sensibilitaetsItems[currentTileIndex.value]
    speakText(currentItem.title)
    
    autoModeInterval.value = window.setTimeout(cycleTiles, settingsStore.settings.autoModeSpeed)
  }
  
  // Spreche den ersten Menüpunkt vor
  const firstItem = sensibilitaetsItems[currentTileIndex.value]
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
    const currentItem = sensibilitaetsItems[currentTileIndex.value]
    speakText(currentItem.title)
    startAutoMode()
  }
}

const stopAutoMode = () => {
  if (autoModeInterval.value) {
    clearTimeout(autoModeInterval.value)
    autoModeInterval.value = null
  }
  if (blinkCheckInterval.value) {
    clearInterval(blinkCheckInterval.value)
    blinkCheckInterval.value = null
  }
  // Stoppe auch die Sprachausgabe
  speechSynthesis.cancel()
}

// Sensibilitäts-Auswahl
function selectSensibilitaet(sensibilitaetId: string) {
  console.log('selectSensibilitaet called with sensibilitaetId:', sensibilitaetId)
  pauseAutoMode() // Pausiere Auto-Modus statt zu stoppen
  
  switch (sensibilitaetId) {
    case 'sehr-sensibel':
      console.log('Sehr sensibel selected')
      speakText('Sehr sensibel ausgewählt - 0.3 Sekunden')
      settingsStore.updateSettings({ blinkSensitivity: 0.3 })
      break
    case 'sensibel':
      console.log('Sensibel selected')
      speakText('Sensibel ausgewählt - 0.5 Sekunden')
      settingsStore.updateSettings({ blinkSensitivity: 0.5 })
      break
    case 'normal':
      console.log('Normal selected')
      speakText('Normal ausgewählt - 0.7 Sekunden')
      settingsStore.updateSettings({ blinkSensitivity: 0.7 })
      break
    case 'weniger-sensibel':
      console.log('Weniger sensibel selected')
      speakText('Weniger sensibel ausgewählt - 1.0 Sekunde')
      settingsStore.updateSettings({ blinkSensitivity: 1.0 })
      break
    case 'nicht-sensibel':
      console.log('Nicht sensibel selected')
      speakText('Nicht sensibel ausgewählt - 1.5 Sekunden')
      settingsStore.updateSettings({ blinkSensitivity: 1.5 })
      break
    case 'zurueck':
      console.log('Zurück selected')
      speakText('Zurück zu Einstellungen')
      stopAutoMode() // Stoppe Auto-Modus komplett vor Navigation
      router.push('/einstellungen')
      break
  }
  
  // Nur bei lokalen Aktionen (nicht bei Navigation) Auto-Modus nach 10 Sekunden neu starten
  if (sensibilitaetId !== 'zurueck') {
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
  console.log('BlinzeldauerView Blink detected, selecting current item')
  
  const currentItem = sensibilitaetsItems[currentTileIndex.value]
  speakText(currentItem.title)
  selectSensibilitaet(currentItem.id)
}

// Right Click Handler
const handleRightClick = (event: MouseEvent) => {
  event.preventDefault()
  console.log('BlinzeldauerView Right click detected, selecting current item')
  
  const currentItem = sensibilitaetsItems[currentTileIndex.value]
  speakText(currentItem.title)
  selectSensibilitaet(currentItem.id)
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
  blinkCheckInterval.value = window.setInterval(() => {
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
          <button @click="stopAutoMode(); $router.push('/einstellungen')" class="p-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-2xl font-bold text-black font-source-code font-light">
            BLINZELDAUER
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
            Wählen Sie die Blink-Sensibilität
          </h2>
          <p class="text-gray-600 dark:text-gray-400" style="font-size: 2rem;">
            Aktuelle Sensibilität: {{ settingsStore.settings.blinkSensitivity }} Sekunden
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
          <!-- Sensibilitäts-Buttons -->
          <button
            v-for="(item, index) in sensibilitaetsItems"
            :key="item.id"
            @click="selectSensibilitaet(item.id)"
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
            <p>Kurz blinzeln ({{ settingsStore.settings.blinkSensitivity }}s): Sensibilität auswählen</p>
            <p>Rechte Maustaste: Sensibilität auswählen</p>
            <p>Auto-Modus: Automatischer Durchlauf durch alle Sensibilitäten</p>
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
