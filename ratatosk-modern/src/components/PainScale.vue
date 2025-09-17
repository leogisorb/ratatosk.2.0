<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useFaceRecognition } from '@/composables/useFaceRecognition'
import { useSettingsStore } from '@/stores/settings'

// Props
interface Props {
  selectedBodyPart: string
}

// Emits
const emit = defineEmits<{
  complete: [painLevel: number]
  back: []
}>()

const props = defineProps<Props>()

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

// Verbesserte Blink-Detection Parameter - zentral gesteuert
const blinkThreshold = computed(() => Math.ceil(settingsStore.settings.blinkSensitivity * 10)) // Konvertiere Sekunden zu Frames (10 FPS)
const lastBlinkTime = ref(0)
const blinkCooldown = 1500 // 1.5 Sekunden Cooldown zwischen Blinks

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
    1: 'Kein Schmerz',
    2: 'Sehr leicht',
    3: 'Leicht',
    4: 'Leicht bis mäßig',
    5: 'Mäßig',
    6: 'Mäßig bis stark',
    7: 'Stark',
    8: 'Sehr stark',
    9: 'Extrem stark',
    10: 'Unerträglich'
  }
  return descriptions[level as keyof typeof descriptions] || ''
}

// Text-to-Speech Funktion
const speakText = (text: string) => {
  console.log('PainScale speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value)
  
  if (!isTTSEnabled.value || !speechSynthesis) {
    console.log('PainScale TTS disabled or speechSynthesis not available')
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
  utterance.onstart = () => console.log('PainScale TTS started:', text)
  utterance.onend = () => console.log('PainScale TTS ended:', text)
  utterance.onerror = (event) => console.error('PainScale TTS error:', event.error, text)
  
  console.log('PainScale Speaking:', text)
  speechSynthesis.speak(utterance)
}

// TTS Toggle
const toggleTTS = () => {
  console.log('PainScale toggleTTS called, current state:', isTTSEnabled.value)
  isTTSEnabled.value = !isTTSEnabled.value
  console.log('PainScale TTS toggled to:', isTTSEnabled.value)
  
  if (!isTTSEnabled.value) {
    speechSynthesis.cancel()
    console.log('PainScale TTS cancelled')
  } else {
    // Test TTS when enabling
    speakText('Sprachausgabe aktiviert')
  }
}

// Auto Mode Funktionen
const startAutoMode = () => {
  if (autoModeInterval.value) return
  
  const cycleLevels = () => {
    if (!isAutoMode.value || isAutoModePaused.value) {
      return
    }
    currentPainLevel.value = currentPainLevel.value === 10 ? 1 : currentPainLevel.value + 1
    const currentItem = painLevels.find(item => item.level === currentPainLevel.value)
    if (currentItem) {
      speakText(`${currentItem.text} - ${currentItem.description}`)
    }
    autoModeInterval.value = window.setTimeout(cycleLevels, 2000) // 2 Sekunden
  }
  
  // Auto-Modus startet sofort (5 Sekunden Pause war bereits im watch)
  const firstItem = painLevels.find(item => item.level === currentPainLevel.value)
  if (firstItem) {
    speakText(`${firstItem.text} - ${firstItem.description}`)
  }
  
  // 2 Sekunden warten, bevor der erste Zyklus startet
  autoModeInterval.value = window.setTimeout(() => {
    cycleLevels()
  }, 2000)
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
  console.log('🔥 PainScale: selectPainLevel called with level:', level)
  pauseAutoMode()
  
  // Setze das aktuelle Level
  currentPainLevel.value = level
  
  const selectedItem = painLevels.find(item => item.level === level)
  if (selectedItem) {
    // Level vorlesen (nur die Nummer)
    console.log('🔊 PainScale: About to speak:', `Schmerzlevel ${selectedItem.text}`)
    speakText(`Schmerzlevel ${selectedItem.text}`)
    console.log('✅ PainScale: speakText called')
  }
  
  // Nach 3 Sekunden zurück zur Körperteil-Auswahl
  setTimeout(() => {
    console.log('⏰ PainScale: Emitting complete event with level:', level)
    emit('complete', level)
  }, 3000)
}

// Blink Detection
const handleBlink = () => {
  const now = Date.now()
  
  if (faceRecognition.isBlinking()) {
    closedFrames.value++
    
    if (now - lastBlinkTime.value < blinkCooldown) {
      return
    }
    
    if (closedFrames.value >= blinkThreshold.value && !eyesClosed.value) {
      console.log('Blink activation for pain level:', currentPainLevel.value)
      console.log('Auto-Modus läuft:', !!autoModeInterval.value, 'Initial timeout:', !!initialTimeout.value)
      
      // Nur auswählen, wenn Auto-Modus bereits läuft
      if (autoModeInterval.value || initialTimeout.value) {
        selectPainLevel(currentPainLevel.value)
      }
      
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
  console.log('Auto-Modus läuft:', !!autoModeInterval.value, 'Initial timeout:', !!initialTimeout.value)
  
  // Stoppe alle anderen TTS
  speechSynthesis.cancel()
  
  // Nur auswählen, wenn Auto-Modus bereits läuft
  if (autoModeInterval.value || initialTimeout.value) {
    selectPainLevel(currentPainLevel.value)
  }
}

// Zurück
const goBack = () => {
  stopAutoMode()
  emit('back')
}

// Watch für selectedBodyPart - startet PainScale automatisch nach 5 Sekunden
watch(() => props.selectedBodyPart, (newBodyPart) => {
  if (newBodyPart) {
    // Reset PainScale State
    currentPainLevel.value = 1
    isAutoModePaused.value = false
    
    // Stoppe alle laufenden Prozesse
    stopAutoMode()
    
    // 5 Sekunden warten nach dem TTS der Körperteil-Auswahl, dann Auto-Modus starten
    setTimeout(() => {
      startAutoMode()
    }, 5000)
  }
})

// Lifecycle
onMounted(() => {
  if (!faceRecognition.isActive.value) {
    faceRecognition.start()
  }
  
  document.addEventListener('contextmenu', handleRightClick)
  
  
  // Wenn bereits eine selectedBodyPart vorhanden ist, starte PainScale
  if (props.selectedBodyPart) {
    // Reset PainScale State
    currentPainLevel.value = 1
    isAutoModePaused.value = false
    
    // Stoppe alle laufenden Prozesse
    stopAutoMode()
    
    // 5 Sekunden warten nach dem TTS der Körperteil-Auswahl, dann Auto-Modus starten
    setTimeout(() => {
      startAutoMode()
    }, 5000)
  }
})

onUnmounted(() => {
  document.removeEventListener('contextmenu', handleRightClick)
  stopAutoMode()
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
              <strong>Kurz blinzeln (0.5s):</strong> Schmerzlevel auswählen<br>
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
