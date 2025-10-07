<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'
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
const selectedGefuehl = ref('')
const isAutoMode = ref(true)
const autoModeInterval = ref<number | null>(null)
const closedFrames = ref(0)
const eyesClosed = ref(false)
const isAutoModePaused = ref(false)
const restartTimeout = ref<number | null>(null)

// Verbesserte Blink-Detection Parameter - zentral gesteuert
const blinkThreshold = computed(() => Math.ceil(settingsStore.settings.blinkSensitivity * 10)) // Konvertiere Sekunden zu Frames (10 FPS)
const lastBlinkTime = ref(0)
const blinkCooldown = computed(() => settingsStore.settings.blinkSensitivity * 1000)

// Text-to-Speech
const speechSynthesis = window.speechSynthesis
const isTTSEnabled = ref(true)

// Verwende die Keyboard-Grid-Konfiguration
const gridConfig = keyboardGridConfig

// Gefühle-Items basierend auf dem gezeigten Interface
const gefuehleItems = [
  // Zeile 1: Glücklich, Froh, Erleichtert, Traurig
  { id: 'gluecklich', text: 'glücklich', type: 'emotion', emoji: '😊' },
  { id: 'froh', text: 'froh', type: 'emotion', emoji: '😄' },
  { id: 'erleichtert', text: 'erleichtert', type: 'emotion', emoji: '😌' },
  { id: 'traurig', text: 'traurig', type: 'emotion', emoji: '😢' },
  
  // Zeile 2: Wütend, Einsam, Ängstlich, Gelangweilt
  { id: 'wuetend', text: 'wütend', type: 'emotion', emoji: '😠' },
  { id: 'einsam', text: 'einsam', type: 'emotion', emoji: '😔' },
  { id: 'aengstlich', text: 'ängstlich', type: 'emotion', emoji: '😰' },
  { id: 'gelangweilt', text: 'gelangweilt', type: 'emotion', emoji: '😴' },
  
  // Zeile 3: Gestresst, Unsicher, Zurück
  { id: 'gestresst', text: 'gestresst', type: 'emotion', emoji: '😫' },
  { id: 'unsicher', text: 'unsicher', type: 'emotion', emoji: '😕' },
  { id: 'zurueck', text: 'zurück', type: 'navigation', emoji: null, icon: '/arrow-left.svg' }
]

// Text-to-Speech Funktion
const speakText = (text: string) => {
  console.log('GefuehleView speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value, 'speechSynthesis:', speechSynthesis)
  
  if (!isTTSEnabled.value || !speechSynthesis) {
    console.log('GefuehleView TTS disabled or speechSynthesis not available')
    return
  }
  
  speechSynthesis.cancel()
  
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'de-DE'
  utterance.rate = 0.8
  utterance.pitch = 1.0
  utterance.volume = 0.8
  
  console.log('GefuehleView Speaking:', text)
  speechSynthesis.speak(utterance)
}

// TTS Toggle
const toggleTTS = () => {
  console.log('GefuehleView toggleTTS called, current state:', isTTSEnabled.value)
  isTTSEnabled.value = !isTTSEnabled.value
  console.log('GefuehleView TTS toggled to:', isTTSEnabled.value)
  
  if (!isTTSEnabled.value) {
    speechSynthesis.cancel()
    console.log('GefuehleView TTS cancelled')
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
    currentTileIndex.value = (currentTileIndex.value + 1) % gefuehleItems.length
    const currentItem = gefuehleItems[currentTileIndex.value]
    speakText(currentItem.text)
    autoModeInterval.value = window.setTimeout(cycleTiles, 3000) // 3 Sekunden
  }
  
  const firstItem = gefuehleItems[currentTileIndex.value]
  speakText(firstItem.text)
  
  // Starte den ersten Zyklus nach 3 Sekunden
  autoModeInterval.value = window.setTimeout(cycleTiles, 3000)
}

const pauseAutoMode = () => {
  isAutoModePaused.value = true
  if (autoModeInterval.value) {
    clearTimeout(autoModeInterval.value)
    autoModeInterval.value = null
  }
  if (restartTimeout.value) {
    clearTimeout(restartTimeout.value)
    restartTimeout.value = null
  }
  speechSynthesis.cancel()
}

const stopAutoMode = () => {
  if (autoModeInterval.value) {
    clearTimeout(autoModeInterval.value)
    autoModeInterval.value = null
  }
  if (restartTimeout.value) {
    clearTimeout(restartTimeout.value)
    restartTimeout.value = null
  }
  speechSynthesis.cancel()
}

// Gefühle-Auswahl
function selectGefuehl(gefuehlId: string) {
  console.log('selectGefuehl called with gefuehlId:', gefuehlId)
  pauseAutoMode()
  
  const selectedItem = gefuehleItems.find(item => item.id === gefuehlId)
  if (selectedItem) {
    selectedGefuehl.value = selectedItem.text
    speakText(selectedItem.text)
  }
  
  switch (gefuehlId) {
    case 'zurueck':
      console.log('Navigating back to /ich')
      router.push('/ich')
      break
    default:
      console.log('Selected feeling:', gefuehlId)
      // Hier könnte später die Gefühls-Auswahl gespeichert werden
      speakText(`${selectedItem?.text} ausgewählt`)
      
      // Auto-Modus nach 10 Sekunden wieder starten
      if (restartTimeout.value) {
        clearTimeout(restartTimeout.value)
      }
      restartTimeout.value = window.setTimeout(() => {
        if (isAutoMode.value) {
          currentTileIndex.value = 0
          isAutoModePaused.value = false
          startAutoMode()
        }
        restartTimeout.value = null
      }, 10000)
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
      const currentItem = gefuehleItems[currentTileIndex.value]
      console.log('Blink activation for tile:', currentTileIndex.value, 'gefuehlId:', currentItem.id, 'text:', currentItem.text)
      
      speakText(currentItem.text)
      selectGefuehl(currentItem.id)
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
  const currentItem = gefuehleItems[currentTileIndex.value]
  console.log('Right click activation for tile:', currentTileIndex.value, 'gefuehlId:', currentItem.id, 'text:', currentItem.text)
  
  speakText(currentItem.text)
  selectGefuehl(currentItem.id)
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
  <div class="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
    <!-- Global Header -->
    <GlobalHeader>
      <div class="flex items-center space-x-4">
        <button @click="$router.push('/ich')" class="p-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition-colors">
          <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-2xl font-bold text-black font-source-code font-light">
          GEFÜHLE
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
          class="w-6 h-6 text-green-700"
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
          class="w-6 h-6 text-gray-700"
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
    <main class="flex-1 flex items-center justify-center p-16">
      <div class="max-w-8xl mx-auto">
        <!-- Ausgewähltes Gefühl Anzeige -->
        <div class="mb-64 text-center">
          <div class="bg-blue-100 dark:bg-blue-900 rounded-xl p-20 max-w-8xl mx-auto">
            <h2 class="text-8xl font-bold text-blue-800 dark:text-blue-200 mb-12" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
              Ausgewähltes Gefühl:
            </h2>
            <div class="font-bold text-blue-900 dark:text-blue-100" style="font-family: 'Source Code Pro', monospace; font-weight: 300; font-size: 4rem;">
              {{ selectedGefuehl || 'Wählen Sie ein Gefühl aus' }}
            </div>
          </div>
        </div>
          <!-- Abstandshalter -->
          <div style="height: 4rem;"></div>

        <!-- Gefühle Tastatur - 3 Zeilen mit 4 Items pro Zeile -->
        <div class="space-y-20 mt-32 mb-48">
          <!-- Zeile 1: Glücklich, Froh, Erleichtert, Traurig -->
          <div class="flex justify-center space-x-16">
            <button
              v-for="(item, index) in gefuehleItems.slice(0, 4)"
              :key="item.id"
              @click="selectGefuehl(item.id)"
              class="transition-all duration-300 font-medium hover:scale-110 flex flex-col items-center space-y-4"
              :style="{
                fontSize: '2.2rem',
                background: currentTileIndex === index ? '#f3f4f6' : 'white',
                border: '2px solid #d1d5db',
                borderRadius: '15px',
                outline: 'none',
                boxShadow: 'none',
                padding: '12.6px 18.9px',
                margin: '0',
                minWidth: '120px'
              }"
              :class="currentTileIndex === index ? 'text-orange-500 scale-110' : 'text-black hover:text-gray-600'"
            >
              <div v-if="item.emoji" style="font-size: 4rem;">{{ item.emoji }}</div>
              <div v-else-if="item.icon" class="w-16 h-16 flex items-center justify-center">
                <img :src="item.icon" :alt="item.text" style="width: 64px; height: 64px; object-fit: cover;" />
              </div>
              <span>{{ item.text }}</span>
            </button>
          </div>

          <!-- Zeile 2: Wütend, Einsam, Ängstlich, Gelangweilt -->
          <div class="flex justify-center space-x-16">
            <button
              v-for="(item, index) in gefuehleItems.slice(4, 8)"
              :key="item.id"
              @click="selectGefuehl(item.id)"
              class="transition-all duration-300 font-medium hover:scale-110 flex flex-col items-center space-y-4"
              :style="{
                fontSize: '2.2rem',
                background: currentTileIndex === index + 4 ? '#f3f4f6' : 'white',
                border: '2px solid #d1d5db',
                borderRadius: '15px',
                outline: 'none',
                boxShadow: 'none',
                padding: '12.6px 18.9px',
                margin: '0',
                minWidth: '120px'
              }"
              :class="currentTileIndex === index + 4 ? 'text-orange-500 scale-110' : 'text-black hover:text-gray-600'"
            >
              <div v-if="item.emoji" style="font-size: 4rem;">{{ item.emoji }}</div>
              <div v-else-if="item.icon" class="w-16 h-16 flex items-center justify-center">
                <img :src="item.icon" :alt="item.text" style="width: 64px; height: 64px; object-fit: cover;" />
              </div>
              <span>{{ item.text }}</span>
            </button>
          </div>

          <!-- Zeile 3: Gestresst, Unsicher, Zurück -->
          <div class="flex justify-center space-x-16">
            <button
              v-for="(item, index) in gefuehleItems.slice(8, 11)"
              :key="item.id"
              @click="selectGefuehl(item.id)"
              class="transition-all duration-300 font-medium hover:scale-110 flex flex-col items-center space-y-4"
              :style="{
                fontSize: '2.2rem',
                background: currentTileIndex === index + 8 ? '#f3f4f6' : 'white',
                border: '2px solid #d1d5db',
                borderRadius: '15px',
                outline: 'none',
                boxShadow: 'none',
                padding: '12.6px 18.9px',
                margin: '0',
                minWidth: '120px'
              }"
              :class="currentTileIndex === index + 8 ? 'text-orange-500 scale-110' : 'text-black hover:text-gray-600'"
            >
              <div v-if="item.emoji" style="font-size: 4rem;">{{ item.emoji }}</div>
              <div v-else-if="item.icon" class="w-16 h-16 flex items-center justify-center">
                <img :src="item.icon" :alt="item.text" style="width: 64px; height: 64px; object-fit: cover;" />
              </div>
              <span>{{ item.text }}</span>
            </button>
          </div>
        </div>

        <!-- Abstandshalter -->
        <div style="height: 4rem;"></div>

        <!-- Instructions -->
        <div class="mt-32 text-center">
          <div class="bg-blue-100 dark:bg-blue-900 rounded-xl p-12 max-w-4xl mx-auto">
            <h3 class="text-4xl font-semibold text-blue-800 dark:text-blue-200 mb-4" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
              Bedienung
            </h3>
            <p class="text-2xl text-blue-700 dark:text-blue-300" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
              <strong>Kurz blinzeln ({{ settingsStore.settings.blinkSensitivity }}s):</strong> Gefühl auswählen<br>
              <strong>Rechte Maustaste:</strong> Gefühl auswählen<br>
              <strong>Auto-Modus:</strong> Automatischer Durchlauf durch alle Gefühle
            </p>
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