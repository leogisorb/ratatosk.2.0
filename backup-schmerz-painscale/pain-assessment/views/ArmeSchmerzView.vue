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
const selectedArmeBereich = ref('')
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

// Arme-Bereiche basierend auf dem gezeigten Interface
const armeBereiche = [
  // Zeile 1: Finger, Handfläche, Handrücken
  { id: 'finger', text: 'Finger', type: 'armbereich' },
  { id: 'handflaeche', text: 'Handfläche', type: 'armbereich' },
  { id: 'handruecken', text: 'Handrücken', type: 'armbereich' },
  
  // Zeile 2: Unterarm, Ellenbogen, Ellenbeuge
  { id: 'unterarm', text: 'Unterarm', type: 'armbereich' },
  { id: 'ellenbogen', text: 'Ellenbogen', type: 'armbereich' },
  { id: 'ellenbeuge', text: 'Ellenbeuge', type: 'armbereich' },
  
  // Zeile 3: Oberarm, Schulter, Achsel
  { id: 'oberarm', text: 'Oberarm', type: 'armbereich' },
  { id: 'schulter', text: 'Schulter', type: 'armbereich' },
  { id: 'achsel', text: 'Achsel', type: 'armbereich' },
  
  // Zurück
  { id: 'zurueck', text: 'zurück', type: 'navigation' }
]

// Text-to-Speech Funktion
const speakText = (text: string) => {
  console.log('ArmeSchmerzView speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value, 'speechSynthesis:', speechSynthesis)
  
  if (!isTTSEnabled.value || !speechSynthesis) {
    console.log('ArmeSchmerzView TTS disabled or speechSynthesis not available')
    return
  }
  
  speechSynthesis.cancel()
  
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'de-DE'
  utterance.rate = 0.8
  utterance.pitch = 1.0
  utterance.volume = 0.8
  
  console.log('ArmeSchmerzView Speaking:', text)
  speechSynthesis.speak(utterance)
}

// TTS Toggle
const toggleTTS = () => {
  console.log('ArmeSchmerzView toggleTTS called, current state:', isTTSEnabled.value)
  isTTSEnabled.value = !isTTSEnabled.value
  console.log('ArmeSchmerzView TTS toggled to:', isTTSEnabled.value)
  
  if (!isTTSEnabled.value) {
    speechSynthesis.cancel()
    console.log('ArmeSchmerzView TTS cancelled')
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
    currentTileIndex.value = (currentTileIndex.value + 1) % armeBereiche.length
    const currentItem = armeBereiche[currentTileIndex.value]
    speakText(currentItem.text)
    autoModeInterval.value = window.setTimeout(cycleTiles, 3000) // 3 Sekunden
  }
  
  const firstItem = armeBereiche[currentTileIndex.value]
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

// Arme-Bereich Auswahl
function selectArmeBereich(bereichId: string) {
  console.log('selectArmeBereich called with bereichId:', bereichId)
  pauseAutoMode()
  
  const selectedItem = armeBereiche.find(item => item.id === bereichId)
  if (selectedItem) {
    selectedArmeBereich.value = selectedItem.text
  }
  
  switch (bereichId) {
    case 'zurueck':
      console.log('Navigating back to /schmerz')
      router.push('/schmerz')
      break
    default:
      console.log('Selected Armbereich:', bereichId)
      
      // Arm-Bereich ausgewählt - zur PainScale navigieren
      console.log('Arm-Bereich ausgewählt:', selectedItem?.text)
      speakText(`${selectedItem?.text} ausgewählt`)
      
      // Face Recognition stoppen bevor Navigation
      if (faceRecognition.isActive.value) {
        faceRecognition.stop()
      }
      
      // Nach TTS zur PainScale navigieren
      setTimeout(() => {
        router.push({
          path: '/pain-scale',
          query: {
            bodyPart: selectedItem?.text || '',
            returnRoute: '/arme-schmerz'
          }
        })
      }, 2000)
  }
}

// Schmerzskala Callbacks

// Blink Detection
const handleBlink = () => {
  const now = Date.now()
  
  if (faceRecognition.isBlinking()) {
    closedFrames.value++
    
    if (now - lastBlinkTime.value < blinkCooldown.value) {
      return
    }
    
    if (closedFrames.value >= blinkThreshold.value && !eyesClosed.value) {
      const currentItem = armeBereiche[currentTileIndex.value]
      console.log('Blink activation for tile:', currentTileIndex.value, 'bereichId:', currentItem.id, 'text:', currentItem.text)
      
      speakText(currentItem.text)
      selectArmeBereich(currentItem.id)
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
  const currentItem = armeBereiche[currentTileIndex.value]
  console.log('Right click activation for tile:', currentTileIndex.value, 'bereichId:', currentItem.id, 'text:', currentItem.text)
  
  speakText(currentItem.text)
  selectArmeBereich(currentItem.id)
}

// Lifecycle
onMounted(() => {
  if (!faceRecognition.isActive.value) {
    faceRecognition.start()
  }
  
  // Auto-Modus nach 2 Sekunden starten (für Rückkehr von PainScale)
  setTimeout(() => {
    startAutoMode()
  }, 2000)
  
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
  <!-- Schmerzskala anzeigen wenn ein Körperteil ausgewählt wurde -->
  <div class="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
    <!-- Header -->
    <header class="bg-gray-200 shadow-2xl flex-shrink-0" style="box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center space-x-4">
            <button @click="$router.push('/schmerz')" class="p-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition-colors">
              <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 class="text-2xl font-bold text-black font-source-code font-light">
              ARMSCHMERZEN
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
        <!-- Ausgewählter Arme-Bereich Anzeige -->
        <div class="mb-64 text-center">
          <div class="bg-blue-100 dark:bg-blue-900 rounded-xl p-20 max-w-8xl mx-auto">
            <h2 class="text-8xl font-bold text-blue-800 dark:text-blue-200 mb-12" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
              Ausgewählter Bereich:
            </h2>
            <div class="font-bold text-blue-900 dark:text-blue-100" style="font-family: 'Source Code Pro', monospace; font-weight: 300; font-size: 4rem;">
              {{ selectedArmeBereich || 'Wählen Sie einen Arme-Bereich aus' }}
            </div>
          </div>
        </div>
         <!-- Abstandshalter -->
         <div style="height: 4rem;"></div>

        <!-- Arme-Bereiche Tastatur -->
        <div class="space-y-20 mt-32 mb-48">
          <!-- Zeile 1: Finger, Handfläche, Handrücken -->
          <div class="flex justify-center space-x-32">
            <button
              v-for="(item, index) in armeBereiche.slice(0, 3)"
              :key="item.id"
              @click="selectArmeBereich(item.id)"
              class="transition-all duration-300 font-medium hover:scale-110"
                :style="getKeyboardTileStyle(index, currentTileIndex, gridConfig)"
              :class="currentTileIndex === index ? 'text-orange-500 scale-110' : 'text-black hover:text-gray-600'"
            >
              {{ item.text }}
            </button>
          </div>

          <!-- Zeile 2: Unterarm, Ellenbogen, Ellenbeuge -->
          <div class="flex justify-center space-x-32">
            <button
              v-for="(item, index) in armeBereiche.slice(3, 6)"
              :key="item.id"
              @click="selectArmeBereich(item.id)"
              class="transition-all duration-300 font-medium hover:scale-110"
              :style="{
                fontSize: '2.646rem',
                background: currentTileIndex === index + 3 ? '#f3f4f6' : 'white',
                border: '2px solid #d1d5db',
                borderRadius: '15px',
                outline: 'none',
                boxShadow: 'none',
                padding: '12.6px 18.9px',
                margin: '0'
              }"
              :class="currentTileIndex === index + 3 ? 'text-orange-500 scale-110' : 'text-black hover:text-gray-600'"
            >
              {{ item.text }}
            </button>
          </div>

          <!-- Zeile 3: Oberarm, Schulter, Achsel -->
          <div class="flex justify-center space-x-32">
            <button
              v-for="(item, index) in armeBereiche.slice(6, 9)"
              :key="item.id"
              @click="selectArmeBereich(item.id)"
              class="transition-all duration-300 font-medium hover:scale-110"
              :style="{
                fontSize: '2.646rem',
                background: currentTileIndex === index + 6 ? '#f3f4f6' : 'white',
                border: '2px solid #d1d5db',
                borderRadius: '15px',
                outline: 'none',
                boxShadow: 'none',
                padding: '12.6px 18.9px',
                margin: '0'
              }"
              :class="currentTileIndex === index + 6 ? 'text-orange-500 scale-110' : 'text-black hover:text-gray-600'"
            >
              {{ item.text }}
            </button>
          </div>

          <!-- Zeile 4: Zurück -->
          <div class="flex justify-center">
            <button
              @click="selectArmeBereich('zurueck')"
              class="transition-all duration-300 font-medium hover:scale-110"
              :style="{
                fontSize: '2.646rem',
                background: currentTileIndex === 9 ? '#f3f4f6' : 'white',
                border: '2px solid #d1d5db',
                borderRadius: '15px',
                outline: 'none',
                boxShadow: 'none',
                padding: '12.6px 18.9px',
                margin: '0'
              }"
              :class="currentTileIndex === 9 ? 'text-orange-500 scale-110' : 'text-black hover:text-gray-600'"
            >
              {{ armeBereiche[9].text }}
            </button>
          </div>
        </div>

        <!-- Abstandshalter -->
        <div style="height: 4rem;"></div>

        <!-- Instructions -->
        <div class="mt-16 text-center">
          <div class="bg-blue-100 dark:bg-blue-900 rounded-xl p-12 max-w-4xl mx-auto">
            <h3 class="text-4xl font-semibold text-blue-800 dark:text-blue-200 mb-4" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
              Bedienung
            </h3>
            <p class="text-2xl text-blue-700 dark:text-blue-300" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
              <strong>Kurz blinzeln ({{ settingsStore.settings.blinkSensitivity }}s):</strong> Arme-Bereich auswählen<br>
              <strong>Rechte Maustaste:</strong> Arme-Bereich auswählen<br>
              <strong>Auto-Modus:</strong> Automatischer Durchlauf durch alle Bereiche
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
