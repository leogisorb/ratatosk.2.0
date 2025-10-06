<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../settings/stores/settings'

// Router
const router = useRouter()

// Stores
const settingsStore = useSettingsStore()

// State
const videoRef = ref<HTMLVideoElement | null>(null)
const stream = ref<MediaStream | null>(null)
const isCameraActive = ref(false)

// Kamera-Einstellungen
const brightness = ref(50)
const contrast = ref(50)
const zoom = ref(100)
const saturation = ref(50)

// Text-to-Speech
const speechSynthesis = window.speechSynthesis
const isTTSEnabled = ref(true)

// Computed
const appClasses = computed(() => ({
  'dark': settingsStore.isDarkMode
}))

// Text-to-Speech Funktion
const speakText = (text: string) => {
  if (!isTTSEnabled.value || !speechSynthesis) return
  
  speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'de-DE'
  utterance.rate = 0.8
  utterance.pitch = 1.0
  utterance.volume = 0.8
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

// Kamera-Funktionen
const startCamera = async () => {
  try {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      }
    })
    
    stream.value = mediaStream
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
      isCameraActive.value = true
      speakText('Kamera aktiviert')
    }
  } catch (error) {
    console.error('Error accessing camera:', error)
    speakText('Kamera konnte nicht aktiviert werden')
  }
}

const stopCamera = () => {
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
    stream.value = null
  }
  isCameraActive.value = false
  speakText('Kamera deaktiviert')
}

// Kamera-Einstellungen anwenden
const applyCameraSettings = () => {
  if (!stream.value) return
  
  const videoTrack = stream.value.getVideoTracks()[0]
  if (!videoTrack) return
  
  const constraints = {
    brightness: brightness.value / 100,
    contrast: contrast.value / 100,
    saturation: saturation.value / 100,
    zoom: zoom.value / 100
  }
  
  videoTrack.applyConstraints({ advanced: [constraints] })
    .then(() => {
      speakText('Kamera-Einstellungen angewendet')
    })
    .catch((error) => {
      console.error('Error applying camera settings:', error)
      speakText('Einstellungen konnten nicht angewendet werden')
    })
}

// Einstellungen zurücksetzen
const resetSettings = () => {
  brightness.value = 50
  contrast.value = 50
  zoom.value = 100
  saturation.value = 50
  applyCameraSettings()
  speakText('Einstellungen zurückgesetzt')
}

// Lifecycle
onMounted(() => {
  startCamera()
})

onUnmounted(() => {
  stopCamera()
})
</script>

<template>
  <div id="app" :class="appClasses">
    <!-- Responsive Layout -->
    <div class="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <!-- Header -->
      <header class="bg-gray-200 dark:bg-gray-800 shadow-2xl flex-shrink-0" style="box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center py-4">
            <div class="flex items-center space-x-4">
              <button @click="$router.push('/einstellungen')" class="p-2 rounded-lg bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 class="text-2xl font-bold text-black dark:text-white font-source-code font-light">
                KAMERA
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
              
              <!-- Kamera Toggle Button -->
              <button
                @click="isCameraActive ? stopCamera() : startCamera()"
                class="p-2 rounded-lg transition-colors"
                :class="isCameraActive ? 'bg-red-300 hover:bg-red-400' : 'bg-green-300 hover:bg-green-400'"
                :title="isCameraActive ? 'Kamera deaktivieren' : 'Kamera aktivieren'"
              >
                <!-- Camera Icon -->
                <svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col items-center justify-center p-8">
        <!-- Livebild und Einstellungen Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl">
          <!-- Livebild -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 font-source-code mb-4 text-center">
              Livebild
            </h2>
            <div class="relative">
              <video
                ref="videoRef"
                autoplay
                muted
                playsinline
                class="w-full h-auto rounded-lg shadow-lg"
                style="transform: scaleX(-1);"
              ></video>
              <div v-if="!isCameraActive" class="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg">
                <div class="text-center">
                  <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p class="text-gray-500 dark:text-gray-400">Kamera nicht aktiv</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Einstellungen -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 font-source-code mb-6 text-center">
              Kamera-Einstellungen
            </h2>
            
            <!-- Helligkeit -->
            <div class="mb-6">
              <label class="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Helligkeit: {{ brightness }}%
              </label>
              <input
                v-model="brightness"
                type="range"
                min="0"
                max="100"
                class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                @input="applyCameraSettings"
              />
            </div>

            <!-- Kontrast -->
            <div class="mb-6">
              <label class="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kontrast: {{ contrast }}%
              </label>
              <input
                v-model="contrast"
                type="range"
                min="0"
                max="100"
                class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                @input="applyCameraSettings"
              />
            </div>

            <!-- Zoom -->
            <div class="mb-6">
              <label class="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Zoom: {{ zoom }}%
              </label>
              <input
                v-model="zoom"
                type="range"
                min="50"
                max="200"
                class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                @input="applyCameraSettings"
              />
            </div>

            <!-- Sättigung -->
            <div class="mb-8">
              <label class="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sättigung: {{ saturation }}%
              </label>
              <input
                v-model="saturation"
                type="range"
                min="0"
                max="100"
                class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                @input="applyCameraSettings"
              />
            </div>

            <!-- Buttons -->
            <div class="flex gap-4 justify-center">
              <button
                @click="applyCameraSettings"
                class="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors font-source-code"
              >
                Anwenden
              </button>
              <button
                @click="resetSettings"
                class="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors font-source-code"
              >
                Zurücksetzen
              </button>
            </div>
          </div>
        </div>

        <!-- Bedienung -->
        <div class="mt-8 text-center">
          <div class="bg-blue-100 dark:bg-blue-900 rounded-xl p-6 max-w-4xl mx-auto">
            <h3 class="text-2xl font-semibold text-blue-800 dark:text-blue-200 mb-4 font-source-code">
              Bedienung
            </h3>
            <p class="text-lg text-blue-700 dark:text-blue-300 font-source-code">
              <strong>Kurz blinzeln ({{ settingsStore.settings.blinkSensitivity }}s):</strong> Einstellung auswählen<br>
              <strong>Rechte Maustaste:</strong> Einstellung auswählen<br>
              <strong>Auto-Modus:</strong> Automatischer Durchlauf durch alle Einstellungen
            </p>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.font-source-code {
  font-family: 'Source Code Pro', monospace;
}

/* Slider Styling */
.slider::-webkit-slider-thumb {
  appearance: none;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #3B82F6;
  cursor: pointer;
  box-shadow: 0 0 2px 0 #555;
}

.slider::-moz-range-thumb {
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #3B82F6;
  cursor: pointer;
  border: none;
  box-shadow: 0 0 2px 0 #555;
}
</style>