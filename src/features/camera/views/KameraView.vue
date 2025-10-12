<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../settings/stores/settings'
import AppHeader from '../../../shared/components/AppHeader.vue'

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
  
  const constraints: MediaTrackConstraints = {
    // Note: These properties may not be supported by all browsers
    // @ts-ignore - Browser-specific camera constraints
    brightness: brightness.value / 100,
    // @ts-ignore
    contrast: contrast.value / 100,
    // @ts-ignore
    saturation: saturation.value / 100,
    // @ts-ignore
    zoom: zoom.value / 100
  }
  
  videoTrack.applyConstraints(constraints)
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
    <div class="min-h-screen bg-white">
      <!-- App Header -->
      <AppHeader />

      <!-- Main Content -->
      <main class="flex-1 flex flex-col items-center justify-center p-8">
        <!-- Livebild und Einstellungen Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl">
          <!-- Livebild -->
          <div class="bg-white">
            <h2 class="text-2xl font-bold text-gray-800">
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
              <div v-if="!isCameraActive" class="absolute inset-0 flex items-center justify-center bg-gray-200">
                <div class="text-center">
                  <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p class="text-gray-500">Kamera nicht aktiv</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Einstellungen -->
          <div class="bg-white">
            <h2 class="text-2xl font-bold text-gray-800">
              Kamera-Einstellungen
            </h2>
            
            <!-- Helligkeit -->
            <div class="mb-6">
              <label class="block text-lg font-medium text-gray-700">
                Helligkeit: {{ brightness }}%
              </label>
              <input
                v-model="brightness"
                type="range"
                min="0"
                max="100"
                class="w-full h-2 bg-gray-200"
                @input="applyCameraSettings"
              />
            </div>

            <!-- Kontrast -->
            <div class="mb-6">
              <label class="block text-lg font-medium text-gray-700">
                Kontrast: {{ contrast }}%
              </label>
              <input
                v-model="contrast"
                type="range"
                min="0"
                max="100"
                class="w-full h-2 bg-gray-200"
                @input="applyCameraSettings"
              />
            </div>

            <!-- Zoom -->
            <div class="mb-6">
              <label class="block text-lg font-medium text-gray-700">
                Zoom: {{ zoom }}%
              </label>
              <input
                v-model="zoom"
                type="range"
                min="50"
                max="200"
                class="w-full h-2 bg-gray-200"
                @input="applyCameraSettings"
              />
            </div>

            <!-- Sättigung -->
            <div class="mb-8">
              <label class="block text-lg font-medium text-gray-700">
                Sättigung: {{ saturation }}%
              </label>
              <input
                v-model="saturation"
                type="range"
                min="0"
                max="100"
                class="w-full h-2 bg-gray-200"
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
          <div class="bg-blue-100">
            <h3 class="text-2xl font-semibold text-blue-800">
              Bedienung
            </h3>
            <p class="text-lg text-blue-700">
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