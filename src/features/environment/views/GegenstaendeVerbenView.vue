<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'
import { keyboardGridConfig, getKeyboardTileStyle } from '../../../config/gridConfig'
import GlobalHeader from '../../../shared/components/GlobalHeader.vue'

// Router
const router = useRouter()
const route = useRoute()

// Stores
const settingsStore = useSettingsStore()

// Face Recognition
const faceRecognition = useFaceRecognition()

// State
const currentTileIndex = ref(0)
const selectedVerb = ref('')
const selectedGegenstand = ref('')
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

// Gegenstände-Verben-Items mit passenden Emojis (max 11 Verben + Zurück = 12 total = 3 Zeilen à 4)
const gegenstaendeVerbenItems = [
  { id: 'benutzen', text: 'benutzen', type: 'verb', emoji: '👆' },
  { id: 'halten', text: 'halten', type: 'verb', emoji: '🤏' },
  { id: 'legen', text: 'legen', type: 'verb', emoji: '📦' },
  { id: 'nehmen', text: 'nehmen', type: 'verb', emoji: '✋' },
  { id: 'geben', text: 'geben', type: 'verb', emoji: '🤲' },
  { id: 'aufheben', text: 'aufheben', type: 'verb', emoji: '⬆️' },
  { id: 'reinigen', text: 'reinigen', type: 'verb', emoji: '🧼' },
  { id: 'weglegen', text: 'weglegen', type: 'verb', emoji: '📦' },
  { id: 'finden', text: 'finden', type: 'verb', emoji: '🔍' },
  { id: 'bringen', text: 'bringen', type: 'verb', emoji: '📦' },
  { id: 'holen', text: 'holen', type: 'verb', emoji: '🏃' },
  { id: 'zurück', text: 'zurück', type: 'navigation', emoji: '⬅️' }
]

// Text-to-Speech Funktion
const speakText = (text: string) => {
  if (!isTTSEnabled.value || !speechSynthesis) return
  
  speechSynthesis.cancel()
  
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'de-DE'
  utterance.rate = 0.8
  utterance.pitch = 1.0
  utterance.volume = 1.0
  
  speechSynthesis.speak(utterance)
}

// TTS Toggle
const toggleTTS = () => {
  isTTSEnabled.value = !isTTSEnabled.value
  
  if (!isTTSEnabled.value) {
    speechSynthesis.cancel()
  } else {
    speakText('Sprachausgabe aktiviert')
  }
}

// Auto Mode Funktionen
const startAutoMode = () => {
  if (autoModeInterval.value) return
  
  currentTileIndex.value = 0
  
  const cycleTiles = () => {
    if (!isAutoMode.value || isAutoModePaused.value) {
      return
    }
    currentTileIndex.value = (currentTileIndex.value + 1) % gegenstaendeVerbenItems.length
    const currentItem = gegenstaendeVerbenItems[currentTileIndex.value]
    speakText(currentItem.text)
    autoModeInterval.value = window.setTimeout(cycleTiles, 3000) // 3 Sekunden
  }
  
  const firstItem = gegenstaendeVerbenItems[currentTileIndex.value]
  speakText(firstItem.text)
  
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

// Verb-Auswahl
function selectVerb(verbId: string) {
  pauseAutoMode()
  
  const selectedItem = gegenstaendeVerbenItems.find(item => item.id === verbId)
  if (selectedItem) {
    selectedVerb.value = selectedItem.text
  }
  
  switch (verbId) {
    case 'zurück':
      router.push('/gegenstaende')
      break
    default:
      speakText(`${selectedItem?.text} ausgewählt`)
      
      // Kombination anzeigen
      const combination = `${selectedGegenstand.value} ${selectedItem?.text}`
      speakText(`Kombination: ${combination}`)
      
      // Nach 3 Sekunden zurück zum Gegenstände-View
      restartTimeout.value = window.setTimeout(() => {
        router.push('/gegenstaende')
      }, 3000)
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
      const currentItem = gegenstaendeVerbenItems[currentTileIndex.value]
      
      speakText(currentItem.text)
      selectVerb(currentItem.id)
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
  const currentItem = gegenstaendeVerbenItems[currentTileIndex.value]
  
  speakText(currentItem.text)
  selectVerb(currentItem.id)
}

// Lifecycle
onMounted(() => {
  // Hole den Gegenstand aus der Route und konvertiere Umlaute
  const itemId = route.params.gegenstand as string || 'Gegenstand'
  
  // Konvertiere URL-Parameter zu korrekten deutschen Umlauten
  const umlautMap: { [key: string]: string } = {
    'handy': 'Handy',
    'glas': 'Glas',
    'brille': 'Brille',
    'stift': 'Stift',
    'papier': 'Papier',
    'lineal': 'Lineal',
    'teller': 'Teller',
    'besteck': 'Besteck',
    'buch': 'Buch',
    'uhr': 'Uhr',
    'schluessel': 'Schlüssel'
  }
  
  selectedGegenstand.value = umlautMap[itemId] || itemId
  
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
  <div class="min-h-screen bg-white">
    <!-- Global Header -->
    <GlobalHeader>
      <div class="flex items-center space-x-4">
        <button @click="$router.push('/gegenstaende')" class="p-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition-colors">
          <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-2xl font-bold text-black font-source-code font-light">
          GEGENSTÄNDE-VERBEN FÜR: {{ selectedGegenstand.toUpperCase() }}
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
        <!-- Gewählte Kombination Anzeige -->
        <div class="mb-64 text-center">
          <div class="bg-green-100">
            <h2 class="text-8xl font-bold text-green-800" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
              Kombination:
            </h2>
            <div class="font-bold text-green-900" style="font-family: 'Source Code Pro', monospace; font-weight: 300; font-size: 4rem;">
              {{ selectedGegenstand }}{{ selectedVerb ? ' ' + selectedVerb : '' }}
            </div>
          </div>
        </div>
         <!-- Abstandshalter -->
         <div style="height: 4rem;"></div>

        <!-- Gegenstände-Verben-Items Tastatur - 4 Teile pro Zeile -->
        <div class="space-y-20 mt-32 mb-48">
          <!-- Zeile 1: benutzen, halten, legen, nehmen -->
          <div class="flex justify-center space-x-16">
            <button
              v-for="(item, index) in gegenstaendeVerbenItems.slice(0, 4)"
              :key="item.id"
              @click="selectVerb(item.id)"
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
              <span>{{ item.text }}</span>
            </button>
          </div>

          <!-- Zeile 2: geben, aufheben, reinigen, weglegen -->
          <div class="flex justify-center space-x-16">
            <button
              v-for="(item, index) in gegenstaendeVerbenItems.slice(4, 8)"
              :key="item.id"
              @click="selectVerb(item.id)"
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
              <span>{{ item.text }}</span>
            </button>
          </div>

          <!-- Zeile 3: finden, bringen, holen, zurück -->
          <div class="flex justify-center space-x-16">
            <button
              v-for="(item, index) in gegenstaendeVerbenItems.slice(8, 12)"
              :key="item.id"
              @click="selectVerb(item.id)"
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
              <span>{{ item.text }}</span>
            </button>
          </div>
        </div>

        <!-- Abstandshalter -->
        <div style="height: 4rem;"></div>

        <!-- Instructions -->
        <div class="mt-16 text-center">
          <div class="bg-green-100">
            <h3 class="text-4xl font-semibold text-green-800" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
              Bedienung
            </h3>
            <p class="text-2xl text-green-700" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
              <strong>Kurz blinzeln ({{ settingsStore.settings.blinkSensitivity }}s):</strong> Verb auswählen<br>
              <strong>Rechte Maustaste:</strong> Verb auswählen<br>
              <strong>Auto-Modus:</strong> Automatischer Durchlauf durch alle Verben
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
