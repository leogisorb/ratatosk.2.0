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
const selectedBeineBereich = ref('')
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

// Beine-Bereiche mit SVG-Icons - 3 Zeilen Layout
const beineBereiche = [
  // Zeile 1: Zehen, Fußballen, Fußrücken, Knöchel, Unterschenkel
  { id: 'zehen', text: 'Zehen', type: 'beinebereich' },
  { id: 'fussballen', text: 'Fußballen', type: 'beinebereich' },
  { id: 'fussruecken', text: 'Fußrücken', type: 'beinebereich' },
  { id: 'knoechel', text: 'Knöchel', type: 'beinebereich' },
  { id: 'unterschenkel', text: 'Unterschenkel', type: 'beinebereich' },
  
  // Zeile 2: Knie, Oberschenkel, Geschl.organ, Zurück
  { id: 'knie', text: 'Knie', type: 'beinebereich' },
  { id: 'oberschenkel', text: 'Oberschenkel', type: 'beinebereich' },
  { id: 'geschl_organ', text: 'Geschl.organ', type: 'beinebereich' },
  { id: 'zurueck', text: 'zurück', type: 'navigation' }
]

// Text-to-Speech Funktion
const speakText = (text: string) => {
  console.log('BeineSchmerzView speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value, 'speechSynthesis:', speechSynthesis)
  
  if (!isTTSEnabled.value || !speechSynthesis) {
    console.log('BeineSchmerzView TTS disabled or speechSynthesis not available')
    return
  }
  
  speechSynthesis.cancel()
  
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'de-DE'
  utterance.rate = 0.8
  utterance.pitch = 1.0
  utterance.volume = 0.8
  
  console.log('BeineSchmerzView Speaking:', text)
  speechSynthesis.speak(utterance)
}

// TTS Toggle
const toggleTTS = () => {
  console.log('BeineSchmerzView toggleTTS called, current state:', isTTSEnabled.value)
  isTTSEnabled.value = !isTTSEnabled.value
  console.log('BeineSchmerzView TTS toggled to:', isTTSEnabled.value)
  
  if (!isTTSEnabled.value) {
    speechSynthesis.cancel()
    console.log('BeineSchmerzView TTS cancelled')
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
    currentTileIndex.value = (currentTileIndex.value + 1) % beineBereiche.length
    const currentItem = beineBereiche[currentTileIndex.value]
    speakText(currentItem.text)
    autoModeInterval.value = window.setTimeout(cycleTiles, 3000) // 3 Sekunden
  }
  
  const firstItem = beineBereiche[currentTileIndex.value]
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

// Beine-Bereich Auswahl
function selectBeineBereich(bereichId: string) {
  console.log('selectBeineBereich called with bereichId:', bereichId)
  pauseAutoMode()
  
  const selectedItem = beineBereiche.find(item => item.id === bereichId)
  if (selectedItem) {
    selectedBeineBereich.value = selectedItem.text
  }
  
  switch (bereichId) {
    case 'zurueck':
      console.log('Navigating back to /schmerz')
      router.push('/schmerz')
      break
    default:
      console.log('Selected Beinebereich:', bereichId)
      
      // Bein-Bereich ausgewählt - zur PainScale navigieren
      console.log('Bein-Bereich ausgewählt:', selectedItem?.text)
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
            returnRoute: '/beine-schmerz'
          }
        })
      }, 2000)
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
      const currentItem = beineBereiche[currentTileIndex.value]
      console.log('Blink activation for tile:', currentTileIndex.value, 'bereichId:', currentItem.id, 'text:', currentItem.text)
      
      speakText(currentItem.text)
      selectBeineBereich(currentItem.id)
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
  const currentItem = beineBereiche[currentTileIndex.value]
  console.log('Right click activation for tile:', currentTileIndex.value, 'bereichId:', currentItem.id, 'text:', currentItem.text)
  
  speakText(currentItem.text)
  selectBeineBereich(currentItem.id)
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
  <div class="min-h-screen bg-white">
    <!-- Global Header -->
    <GlobalHeader>
      <div class="flex items-center space-x-4">
        <button @click="$router.push('/schmerz')" class="p-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition-colors">
          <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-2xl font-bold text-black font-source-code font-light">
          BEINSCHMERZEN
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
        <!-- Ausgewählter Beine-Bereich Anzeige -->
        <div class="mb-64 text-center">
          <div class="bg-blue-100">
            <h2 class="text-8xl font-bold text-blue-800" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
              Ausgewählter Bereich:
            </h2>
            <div class="font-bold text-blue-900" style="font-family: 'Source Code Pro', monospace; font-weight: 300; font-size: 4rem;">
              {{ selectedBeineBereich || 'Wählen Sie einen Beine-Bereich aus' }}
            </div>
          </div>
        </div>
         <!-- Abstandshalter -->
         <div style="height: 4rem;"></div>

        <!-- Beine-Bereiche Tastatur -->
        <div class="space-y-20 mt-32 mb-48">
          <!-- Zeile 1: Zehen, Fußballen, Fußrücken, Knöchel, Unterschenkel -->
          <div class="flex justify-center space-x-32">
            <button
              v-for="(item, index) in beineBereiche.slice(0, 5)"
              :key="item.id"
              @click="selectBeineBereich(item.id)"
              class="transition-all duration-300 font-medium hover:scale-110 flex flex-col items-center"
              :style="getKeyboardTileStyle(index, currentTileIndex, gridConfig)"
              :class="currentTileIndex === index ? 'text-orange-500 scale-110' : 'text-black hover:text-gray-600'"
            >
              <!-- SVG für Zehen -->
              <div v-if="item.id === 'zehen'" class="mx-auto mb-2" style="width: 150px; height: 150px; max-width: 150px; max-height: 150px;">
                <img src="/ZEHEN.svg" alt="Zehen" class="w-full h-full object-contain" />
              </div>
              
              <!-- SVG für Fußballen -->
              <div v-else-if="item.id === 'fussballen'" class="mx-auto mb-2" style="width: 150px; height: 150px; max-width: 150px; max-height: 150px;">
                <img src="/FUSBALLEN.svg" alt="Fußballen" class="w-full h-full object-contain" />
              </div>
              
              <!-- SVG für Fußrücken -->
              <div v-else-if="item.id === 'fussruecken'" class="mx-auto mb-2" style="width: 150px; height: 150px; max-width: 150px; max-height: 150px;">
                <img src="/FUSRÜCKEN.svg" alt="Fußrücken" class="w-full h-full object-contain" />
              </div>
              
              <!-- SVG für Knöchel -->
              <div v-else-if="item.id === 'knoechel'" class="mx-auto mb-2" style="width: 150px; height: 150px; max-width: 150px; max-height: 150px;">
                <img src="/KNÖCHEL.svg" alt="Knöchel" class="w-full h-full object-contain" />
              </div>
              
              <!-- SVG für Unterschenkel -->
              <div v-else-if="item.id === 'unterschenkel'" class="mx-auto mb-2" style="width: 150px; height: 150px; max-width: 150px; max-height: 150px;">
                <img src="/UNTERSCHENKEL.svg" alt="Unterschenkel" class="w-full h-full object-contain" />
              </div>
              
              <span class="text-xl font-bold">{{ item.text }}</span>
            </button>
          </div>

          <!-- Zeile 2: Knie, Oberschenkel, Geschl.organ, Zurück -->
          <div class="flex justify-center space-x-32">
            <button
              v-for="(item, index) in beineBereiche.slice(5, 9)"
              :key="item.id"
              @click="selectBeineBereich(item.id)"
              class="transition-all duration-300 font-medium hover:scale-110 flex flex-col items-center"
              :style="{
                fontSize: '2.646rem',
                background: currentTileIndex === index + 5 ? '#f3f4f6' : 'white',
                border: '2px solid #d1d5db',
                borderRadius: '15px',
                outline: 'none',
                boxShadow: 'none',
                padding: '12.6px 18.9px',
                margin: '0'
              }"
              :class="currentTileIndex === index + 5 ? 'text-orange-500 scale-110' : 'text-black hover:text-gray-600'"
            >
              <!-- SVG für Knie -->
              <div v-if="item.id === 'knie'" class="mx-auto mb-2" style="width: 150px; height: 150px; max-width: 150px; max-height: 150px;">
                <img src="/KNIE.svg" alt="Knie" class="w-full h-full object-contain" />
              </div>
              
              <!-- SVG für Oberschenkel -->
              <div v-else-if="item.id === 'oberschenkel'" class="mx-auto mb-2" style="width: 150px; height: 150px; max-width: 150px; max-height: 150px;">
                <img src="/OBERSCHENKEL.svg" alt="Oberschenkel" class="w-full h-full object-contain" />
              </div>
              
              <!-- SVG für Geschlechtsorgan -->
              <div v-else-if="item.id === 'geschl_organ'" class="mx-auto mb-2" style="width: 150px; height: 150px; max-width: 150px; max-height: 150px;">
                <img src="/GESCHLECHTSORGAN.svg" alt="Geschlechtsorgan" class="w-full h-full object-contain" />
              </div>
              
              <!-- SVG für Zurück -->
              <div v-else-if="item.id === 'zurueck'" class="mx-auto mb-2" style="width: 150px; height: 150px; max-width: 150px; max-height: 150px;">
                <svg width="150" height="150" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5M12 19l-7-7 7-7" stroke="#FE0000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              
              <span class="text-xl font-bold">{{ item.text }}</span>
            </button>
          </div>


        </div>

        <!-- Abstandshalter -->
        <div style="height: 4rem;"></div>

        <!-- Instructions -->
        <div class="mt-16 text-center">
          <div class="bg-blue-100">
            <h3 class="text-4xl font-semibold text-blue-800" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
              Bedienung
            </h3>
            <p class="text-2xl text-blue-700" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
              <strong>Kurz blinzeln ({{ settingsStore.settings.blinkSensitivity }}s):</strong> Beine-Bereich auswählen<br>
              <strong>Rechte Maustaste:</strong> Beine-Bereich auswählen<br>
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
