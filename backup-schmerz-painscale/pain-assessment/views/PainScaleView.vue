<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'

// Props
interface Props {
  selectedBodyPart: string
  returnRoute: string
}

const props = defineProps<Props>()

// Get query parameters
const route = useRoute()
const selectedBodyPart = computed(() => route.query.bodyPart as string || props.selectedBodyPart || 'Unbekannter Bereich')
const returnRoute = computed(() => route.query.returnRoute as string || props.returnRoute || '/schmerz')

// Router
const router = useRouter()

// Stores
const settingsStore = useSettingsStore()

// Face Recognition
const faceRecognition = useFaceRecognition()

// State
const currentPainLevel = ref(1)
const isAutoMode = ref(true)
const autoModeInterval = ref<number | null>(null)
const initialTimeout = ref<number | null>(null)
const closedFrames = ref(0)
const eyesClosed = ref(false)
const isAutoModePaused = ref(false)
const selectedPainLevel = ref<number | null>(null)
const isSelectionComplete = ref(false)
const blinkCheckInterval = ref<number | null>(null)

// Verbesserte Blink-Detection Parameter - zentral gesteuert
const blinkThreshold = computed(() => Math.ceil(settingsStore.settings.blinkSensitivity * 10)) // Konvertiere Sekunden zu Frames (10 FPS)
const lastBlinkTime = ref(0)
const blinkCooldown = computed(() => settingsStore.settings.blinkSensitivity * 1000)

// Text-to-Speech
const speechSynthesis = window.speechSynthesis
const isTTSEnabled = ref(true)

// Pain Scale Items (1-10)
const painLevels = Array.from({ length: 10 }, (_, i) => ({
  level: i + 1,
  text: `${i + 1}`,
  description: getPainDescription(i + 1)
}))

function getPainDescription(level: number): string {
  const descriptions = {
    1: 'kein Schmerz',
    2: 'sehr leicht',
    3: 'leicht',
    4: 'leicht bis mäßig',
    5: 'mäßig',
    6: 'mäßig bis stark',
    7: 'stark',
    8: 'sehr stark',
    9: 'extrem stark',
    10: 'unerträglich'
  }
  return descriptions[level as keyof typeof descriptions] || ''
}

// Text-to-Speech Funktion
const speakText = (text: string) => {
  console.log('PainScaleView speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value)
  
  if (!isTTSEnabled.value || !speechSynthesis) {
    console.log('PainScaleView TTS disabled or speechSynthesis not available')
    return
  }
  
  // Prüfe ob TTS verfügbar ist
  if (!speechSynthesis.speaking && !speechSynthesis.pending) {
    speechSynthesis.cancel()
  }
  
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'de-DE'
  utterance.rate = 0.8
  utterance.pitch = 1.0
  utterance.volume = 1.0
  
  // Event Listeners für Debugging
  utterance.onstart = () => console.log('PainScaleView TTS started:', text)
  utterance.onend = () => console.log('PainScaleView TTS ended:', text)
  utterance.onerror = (event) => console.error('PainScaleView TTS error:', event.error, text)
  
  console.log('PainScaleView Speaking:', text)
  speechSynthesis.speak(utterance)
}

// TTS Toggle
const toggleTTS = () => {
  console.log('PainScaleView toggleTTS called, current state:', isTTSEnabled.value)
  isTTSEnabled.value = !isTTSEnabled.value
  console.log('PainScaleView TTS toggled to:', isTTSEnabled.value)
  
  if (!isTTSEnabled.value) {
    speechSynthesis.cancel()
    console.log('PainScaleView TTS cancelled')
  } else {
    // Test TTS when enabling
    speakText('Sprachausgabe aktiviert')
  }
}

// Auto Mode Funktionen
const startAutoMode = () => {
  if (autoModeInterval.value) return
  
  const cycleLevels = () => {
    if (!isAutoMode.value || isAutoModePaused.value || isSelectionComplete.value) {
      return
    }
    currentPainLevel.value = currentPainLevel.value === 10 ? 1 : currentPainLevel.value + 1
    const currentItem = painLevels.find(item => item.level === currentPainLevel.value)
    if (currentItem) {
      speakText(`${currentItem.text} - ${currentItem.description}`)
    }
    autoModeInterval.value = window.setTimeout(cycleLevels, 2000) // 2 Sekunden
  }
  
  // Auto-Modus startet nach 5 Sekunden
  initialTimeout.value = window.setTimeout(() => {
    const firstItem = painLevels.find(item => item.level === currentPainLevel.value)
    if (firstItem) {
      speakText(`${firstItem.text} - ${firstItem.description}`)
    }
    
    // 2 Sekunden warten, bevor der erste Zyklus startet
    autoModeInterval.value = window.setTimeout(() => {
      cycleLevels()
    }, 2000)
  }, 5000)
}

const pauseAutoMode = () => {
  isAutoModePaused.value = true
  if (autoModeInterval.value) {
    clearTimeout(autoModeInterval.value)
    autoModeInterval.value = null
  }
  if (initialTimeout.value) {
    clearTimeout(initialTimeout.value)
    initialTimeout.value = null
  }
  speechSynthesis.cancel()
}

const stopAutoMode = () => {
  if (autoModeInterval.value) {
    clearTimeout(autoModeInterval.value)
    autoModeInterval.value = null
  }
  if (initialTimeout.value) {
    clearTimeout(initialTimeout.value)
    initialTimeout.value = null
  }
  speechSynthesis.cancel()
}

// Pain Level Auswahl
function selectPainLevel(level: number) {
  console.log('🔥 PainScaleView: selectPainLevel called with level:', level)
  pauseAutoMode()
  isSelectionComplete.value = true
  
  // Setze das aktuelle Level
  currentPainLevel.value = level
  selectedPainLevel.value = level
  
  const selectedItem = painLevels.find(item => item.level === level)
  if (selectedItem) {
    // Level vorlesen
    console.log('🔊 PainScaleView: About to speak:', `Schmerzlevel ${selectedItem.text} - ${selectedItem.description}`)
    speakText(`Schmerzlevel ${selectedItem.text} - ${selectedItem.description}`)
    console.log('✅ PainScaleView: speakText called')
    
    // Nach TTS Ende: 3 Sekunden warten, dann zurück
    // Vereinfachte Lösung: Nach 4 Sekunden zurückkehren (TTS + 3s Wartezeit)
    setTimeout(() => {
      console.log('⏰ PainScaleView: TTS + 3s wait completed, returning to body part selection')
      router.push(returnRoute.value)
    }, 4000)
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
    
    if (closedFrames.value >= blinkThreshold.value && !eyesClosed.value && !isSelectionComplete.value) {
      console.log('Blink activation for pain level:', currentPainLevel.value)
      
      // Blink-Detection funktioniert immer, nicht nur im Auto-Modus
      selectPainLevel(currentPainLevel.value)
      
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
  console.log('Right click activation for pain level:', currentPainLevel.value)
  
  if (!isSelectionComplete.value) {
    // Right-Click funktioniert immer, nicht nur im Auto-Modus
    selectPainLevel(currentPainLevel.value)
  }
}

// Zurück
const goBack = () => {
  stopAutoMode()
  router.push(returnRoute.value)
}

// Lifecycle
onMounted(() => {
  console.log('PainScaleView mounted - starting face recognition')
  
  // Face Recognition neu starten
  if (faceRecognition.isActive.value) {
    faceRecognition.stop()
  }
  
  // Kurz warten, dann Face Recognition starten
  setTimeout(() => {
    faceRecognition.start()
  }, 100)
  
  document.addEventListener('contextmenu', handleRightClick)
  
  // Blink-Check Interval starten
  blinkCheckInterval.value = window.setInterval(() => {
    handleBlink()
  }, 100)
  
  // Auto-Modus nach 5 Sekunden starten
  startAutoMode()
})

onUnmounted(() => {
  console.log('PainScaleView unmounted - stopping face recognition')
  document.removeEventListener('contextmenu', handleRightClick)
  stopAutoMode()
  
  // Blink-Check Interval stoppen
  if (blinkCheckInterval.value) {
    clearInterval(blinkCheckInterval.value)
  }
  
  // Face Recognition stoppen
  if (faceRecognition.isActive.value) {
    faceRecognition.stop()
  }
})
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
    <!-- Header -->
    <header class="bg-gray-200 shadow-2xl flex-shrink-0" style="box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center space-x-4">
            <button @click="goBack" class="p-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition-colors">
              <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 class="text-2xl font-bold text-black font-source-code font-light">
              SCHMERZSKALA
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
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex items-center justify-center p-16">
      <div class="max-w-8xl mx-auto">
        <!-- Ausgewählter Körperteil und Schmerzlevel Anzeige -->
        <div class="mb-64 text-center">
          <div class="bg-blue-100 dark:bg-blue-900 rounded-xl p-20 max-w-8xl mx-auto">
            <h2 class="text-6xl font-bold text-blue-800 dark:text-blue-200 mb-8" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
              {{ selectedBodyPart }}
            </h2>
            <h3 class="text-8xl font-bold text-blue-800 dark:text-blue-200 mb-12" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
              Schmerzlevel:
            </h3>
            <div class="font-bold text-blue-900 dark:text-blue-100" style="font-family: 'Source Code Pro', monospace; font-weight: 300; font-size: 6rem;">
              {{ currentPainLevel }}
            </div>
            <div class="font-bold text-blue-700 dark:text-blue-300 mt-4" style="font-family: 'Source Code Pro', monospace; font-weight: 300; font-size: 3rem;">
              {{ painLevels.find(item => item.level === currentPainLevel)?.description }}
            </div>
          </div>
        </div>

        <!-- Schmerzskala Balken -->
        <div class="mb-32">
          <div class="bg-gray-200 dark:bg-gray-700 rounded-full h-16 relative overflow-hidden">
            <!-- Schmerzskala Balken -->
            <div 
              class="h-full transition-all duration-500 ease-out"
              :style="{
                width: `${(currentPainLevel / 10) * 100}%`,
                background: `linear-gradient(to right, 
                  #10b981 0%, 
                  #f59e0b 50%, 
                  #ef4444 100%)`
              }"
            ></div>
            
            <!-- Schmerzlevel Marker -->
            <div 
              class="absolute top-0 w-8 h-16 bg-white dark:bg-gray-800 border-4 border-gray-600 rounded-full transform -translate-x-1/2 transition-all duration-500 ease-out"
              :style="{ left: `${(currentPainLevel / 10) * 100}%` }"
            ></div>
          </div>
          
          <!-- Skala Beschriftung -->
          <div class="flex justify-between mt-4 text-2xl font-bold text-gray-600 dark:text-gray-400" style="font-family: 'Source Code Pro', monospace;">
            <span>Leicht</span>
            <span>Schwer</span>
          </div>
        </div>

        <!-- Schmerzlevel Buttons - Horizontal -->
        <div class="flex justify-center space-x-8 mb-16">
          <button
            v-for="(item, index) in painLevels"
            :key="item.level"
            @click="selectPainLevel(item.level)"
            class="transition-all duration-300 font-medium hover:scale-110"
            :style="{
              fontSize: '2.5rem',
              background: currentPainLevel === item.level ? '#f3f4f6' : 'white',
              border: '2px solid #d1d5db',
              borderRadius: '15px',
              outline: 'none',
              boxShadow: 'none',
              padding: '20px 15px',
              margin: '0',
              minWidth: '80px'
            }"
            :class="currentPainLevel === item.level ? 'text-orange-500 scale-110' : 'text-black hover:text-gray-600'"
          >
            {{ item.text }}
          </button>
        </div>

        <!-- Abstandshalter -->
        <div style="height: 4rem;"></div>

        <!-- Instructions -->
        <div class="text-center">
          <div class="bg-blue-100 dark:bg-blue-900 rounded-xl p-12 max-w-4xl mx-auto">
            <h3 class="text-4xl font-semibold text-blue-800 dark:text-blue-200 mb-4" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
              Bedienung
            </h3>
            <p class="text-2xl text-blue-700 dark:text-blue-300" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
              <strong>Kurz blinzeln ({{ settingsStore.settings.blinkSensitivity }}s):</strong> Schmerzlevel auswählen<br>
              <strong>Rechte Maustaste:</strong> Schmerzlevel auswählen<br>
              <strong>Auto-Modus:</strong> Automatischer Durchlauf durch alle Schmerzlevel
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
