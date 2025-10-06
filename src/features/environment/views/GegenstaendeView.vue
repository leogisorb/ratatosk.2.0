<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'
import { keyboardGridConfig, getKeyboardTileStyle } from '../../../config/gridConfig'

// Router
const router = useRouter()

// Stores
const settingsStore = useSettingsStore()

// Face Recognition
const faceRecognition = useFaceRecognition()

// State
const currentTileIndex = ref(0)
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

// Gegenstände-Items basierend auf dem gezeigten Interface
const gegenstaendeItems = [
  // Zeile 1: Handy, Glas, Brille
  { id: 'handy', text: 'Handy', type: 'gegenstand', emoji: '📱' },
  { id: 'glas', text: 'Glas', type: 'gegenstand', emoji: '🥛' },
  { id: 'brille', text: 'Brille', type: 'gegenstand', emoji: '👓' },
  
  // Zeile 2: Stift, Papier, Lineal
  { id: 'stift', text: 'Stift', type: 'gegenstand', emoji: '✏️' },
  { id: 'papier', text: 'Papier', type: 'gegenstand', emoji: '📄' },
  { id: 'lineal', text: 'Lineal', type: 'gegenstand', emoji: '📏' },
  
  // Zeile 3: Teller, Besteck, Tisch
  { id: 'teller', text: 'Teller', type: 'gegenstand', emoji: '🍽️' },
  { id: 'besteck', text: 'Besteck', type: 'gegenstand', emoji: '🍴' },
  { id: 'tisch', text: 'Tisch', type: 'gegenstand', emoji: '🪑' },
  
  // Zeile 4: Buch, Uhr, Schlüssel
  { id: 'buch', text: 'Buch', type: 'gegenstand', emoji: '📚' },
  { id: 'uhr', text: 'Uhr', type: 'gegenstand', emoji: '🕐' },
  { id: 'schluessel', text: 'Schlüssel', type: 'gegenstand', emoji: '🗝️' },
  
  // Navigation
  { id: 'zurueck', text: 'zurück', type: 'navigation', emoji: null, icon: '/arrow-left.svg' }
]

// Text-to-Speech Funktion
const speakText = (text: string) => {
  console.log('GegenstaendeView speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value, 'speechSynthesis:', speechSynthesis)
  
  if (!isTTSEnabled.value || !speechSynthesis) {
    console.log('GegenstaendeView TTS disabled or speechSynthesis not available')
    return
  }
  
  speechSynthesis.cancel()
  
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'de-DE'
  utterance.rate = 0.8
  utterance.pitch = 1.0
  utterance.volume = 0.8
  
  console.log('GegenstaendeView Speaking:', text)
  speechSynthesis.speak(utterance)
}

// TTS Toggle
const toggleTTS = () => {
  console.log('GegenstaendeView toggleTTS called, current state:', isTTSEnabled.value)
  isTTSEnabled.value = !isTTSEnabled.value
  console.log('GegenstaendeView TTS toggled to:', isTTSEnabled.value)
  
  if (!isTTSEnabled.value) {
    speechSynthesis.cancel()
    console.log('GegenstaendeView TTS cancelled')
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
  
  autoModeInterval.value = window.setInterval(() => {
    if (isAutoModePaused.value) return
    
    currentTileIndex.value = (currentTileIndex.value + 1) % gegenstaendeItems.length
    const currentItem = gegenstaendeItems[currentTileIndex.value]
    
    if (currentItem) {
      speakText(currentItem.text)
    }
  }, settingsStore.settings.autoModeSpeed)
  
  console.log('GegenstaendeView Auto-Modus gestartet')
}

const stopAutoMode = () => {
  if (autoModeInterval.value) {
    clearInterval(autoModeInterval.value)
    autoModeInterval.value = null
  }
  console.log('GegenstaendeView Auto-Modus gestoppt')
}

// Blink Detection
const handleBlink = () => {
  const now = Date.now()
  
  if (now - lastBlinkTime.value < blinkCooldown.value) {
    return
  }
  
  lastBlinkTime.value = now
  
  const currentItem = gegenstaendeItems[currentTileIndex.value]
  if (!currentItem) return
  
  if (currentItem.id === 'zurueck') {
    // Zurück zur Umgebungsseite
    router.push('/umgebung')
    return
  }
  
  // Gegenstand auswählen
  selectedGegenstand.value = currentItem.text
  speakText(`${currentItem.text} ausgewählt`)
  
  // Pausiere Auto-Modus nach Auswahl
  isAutoModePaused.value = true
  stopAutoMode()
  
  // Starte Auto-Modus nach 3 Sekunden neu
  restartTimeout.value = window.setTimeout(() => {
    isAutoModePaused.value = false
    startAutoMode()
  }, 3000)
}

// Face Recognition Event Handler
const handleFaceRecognition = () => {
  if (!faceRecognition.isDetected.value) return
  
  if (faceRecognition.eyeState.value.left === false && faceRecognition.eyeState.value.right === false) {
    closedFrames.value++
    
    if (closedFrames.value >= blinkThreshold.value && !eyesClosed.value) {
      eyesClosed.value = true
      handleBlink()
    }
  } else {
    closedFrames.value = 0
    eyesClosed.value = false
  }
}

// Lifecycle
onMounted(() => {
  console.log('GegenstaendeView mounted')
  
  // Starte Face Recognition
  faceRecognition.start()
  
  // Starte Auto-Modus
  startAutoMode()
  
  // Spreche ersten Gegenstand
  if (gegenstaendeItems.length > 0) {
    speakText(gegenstaendeItems[0].text)
  }
})

onUnmounted(() => {
  console.log('GegenstaendeView unmounted')
  
  // Stoppe Face Recognition
  faceRecognition.stop()
  
  // Stoppe Auto-Modus
  stopAutoMode()
  
  // Stoppe TTS
  if (speechSynthesis) {
    speechSynthesis.cancel()
  }
  
  // Clear timeout
  if (restartTimeout.value) {
    clearTimeout(restartTimeout.value)
  }
})

// Watch Face Recognition
import { watch } from 'vue'
watch(() => faceRecognition.isDetected.value, (newValue) => {
  if (newValue) {
    handleFaceRecognition()
  }
})

watch(() => faceRecognition.eyeState.value, () => {
  handleFaceRecognition()
}, { deep: true })
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
    <!-- Header -->
    <header class="w-full bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-4xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <button 
              @click="router.push('/umgebung')"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <img src="/arrow-left.svg" alt="Zurück" class="w-6 h-6 dark:invert" />
            </button>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Gegenstände
            </h1>
          </div>
          
          <div class="flex items-center space-x-4">
            <!-- TTS Toggle -->
            <button
              @click="toggleTTS"
              :class="[
                'px-4 py-2 rounded-lg font-medium transition-colors',
                isTTSEnabled 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              ]"
            >
              {{ isTTSEnabled ? 'TTS AN' : 'TTS AUS' }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex items-center justify-center p-6">
      <div class="w-full max-w-4xl">
        <!-- Grid -->
        <div class="grid grid-cols-3 gap-6 mb-8">
          <button
            v-for="(item, index) in gegenstaendeItems"
            :key="item.id"
            @click="() => {
              currentTileIndex = index
              if (item.id === 'zurueck') {
                router.push('/umgebung')
              } else {
                selectedGegenstand = item.text
                speakText(`${item.text} ausgewählt`)
              }
            }"
            :class="[
              'flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-300',
              currentTileIndex === index 
                ? 'bg-orange-500 text-white border-orange-500 scale-105 shadow-lg' 
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:border-orange-400 hover:scale-102',
              item.id === 'zurueck' ? 'col-span-3' : ''
            ]"
            :style="getKeyboardTileStyle(gridConfig, currentTileIndex === index)"
          >
            <div v-if="item.emoji" class="text-6xl mb-4">
              {{ item.emoji }}
            </div>
            <div v-else-if="item.icon" class="w-16 h-16 mb-4 flex items-center justify-center">
              <img :src="item.icon" :alt="item.text" class="w-12 h-12 dark:invert" />
            </div>
            <span class="text-lg font-medium text-center">
              {{ item.text }}
            </span>
          </button>
        </div>

        <!-- Auswahl-Anzeige -->
        <div v-if="selectedGegenstand" class="text-center">
          <div class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-6 py-3 rounded-lg inline-block">
            <span class="text-lg font-medium">Ausgewählt: {{ selectedGegenstand }}</span>
          </div>
        </div>

        <!-- Anweisungen -->
        <div class="text-center mt-8">
          <p class="text-gray-600 dark:text-gray-400 text-lg">
            Blinzeln Sie, um einen Gegenstand auszuwählen
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.hover\:scale-102:hover {
  transform: scale(1.02);
}
</style>
