<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
    <!-- Header -->
    <header class="w-full max-w-4xl px-6 py-8">
      <div class="text-center">
        <div class="flex items-center justify-center space-x-4 mb-6">
          <h1 class="text-4xl font-bold text-gray-900 dark:text-white font-source-code font-light">
            RATATOSK
          </h1>
          <img src="/rattenkopf.svg" alt="Ratatosk Logo" class="w-16 h-16" />
          <div class="w-2.5 h-1.5 bg-[#00796B]"></div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex items-center justify-center w-full max-w-4xl px-6">
      <div class="text-center space-y-12">
        <!-- Status Display -->
        <div class="space-y-4">
          <!-- Camera Status -->
          <div class="flex items-center justify-center space-x-3">
            <div 
              :class="[
                'w-4 h-4 rounded-full transition-colors duration-300',
                cameraStatus === 'active' ? 'bg-green-500 animate-pulse' : 
                cameraStatus === 'loading' ? 'bg-yellow-500 animate-spin' : 
                'bg-red-500'
              ]"
            ></div>
            <span class="text-lg font-medium text-gray-700 dark:text-gray-300">
              {{ cameraStatusText }}
            </span>
          </div>

          <!-- Face Detection Status -->
          <div v-if="cameraStatus === 'active'" class="flex items-center justify-center space-x-3">
            <div 
              :class="[
                'w-4 h-4 rounded-full transition-colors duration-300',
                faceRecognition.isDetected ? 'bg-green-500' : 'bg-gray-400'
              ]"
            ></div>
            <span class="text-lg font-medium text-gray-700 dark:text-gray-300">
              {{ faceRecognition.isDetected ? 'Gesicht erkannt' : 'Gesicht suchen...' }}
            </span>
          </div>
        </div>

        <!-- Start Button -->
        <div class="space-y-6">
          <div 
            v-if="cameraStatus === 'inactive'"
            class="max-w-md mx-auto"
          >
            <button
              @click="startCamera"
              :disabled="cameraStatus === 'loading'"
              class="w-full btn-primary text-lg py-4 px-8 flex items-center justify-center space-x-3"
            >
              <svg v-if="cameraStatus === 'loading'" class="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg v-else class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              <span>Kamera aktivieren</span>
            </button>
          </div>

          <!-- Blink to Start -->
          <div 
            v-if="cameraStatus === 'active' && faceRecognition.isDetected"
            class="max-w-md mx-auto"
          >
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border-2 border-primary-200 dark:border-primary-700">
              <div class="text-center space-y-4">
                <div class="text-6xl mb-4">👁️</div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                  Blinzeln Sie zum Starten
                </h2>
                <p class="text-gray-600 dark:text-gray-300">
                  Halten Sie beide Augen für {{ blinkDuration }} Sekunden geschlossen
                </p>
                
                <!-- Blink Progress -->
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    class="bg-primary-600 h-3 rounded-full transition-all duration-300"
                    :style="{ width: `${blinkProgress}%` }"
                  ></div>
                </div>
                
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ blinkProgress.toFixed(1) }}% / 100%
                </p>
              </div>
            </div>
          </div>

          <!-- Abstandshalter -->
          <div style="height: 3rem;"></div>

          <!-- Manual Start Option -->
          <div v-if="cameraStatus === 'active'" class="max-w-md mx-auto">
            <button
              @click="startWithoutBlink"
              class="w-full text-white rounded-lg"
              style="background-color: #00796B; font-size: 16px; height: 40px; padding: 8px 16px; border: none;"
            >
              Ohne Blinzeln starten
            </button>
          </div>
        </div>

        <!-- Abstandshalter -->
        <div style="height: 3rem;"></div>

        <!-- Error Message -->
        <div v-if="error" class="max-w-md mx-auto p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p class="text-red-800 dark:text-red-200 text-sm">
            {{ error }}
          </p>
        </div>

        <!-- Help Text -->
        <div class="max-w-2xl mx-auto text-center text-sm text-gray-500 dark:text-gray-400 space-y-2">
          <p>
            <strong>Tipp:</strong> Stellen Sie sich vor die Kamera und blinzeln Sie langsam
          </p>
          <p>
            Falls die Kamera nicht funktioniert, können Sie auch ohne Gesichtserkennung starten
          </p>
        </div>
      </div>
    </main>

    <!-- Hidden Video Element -->
    <video 
      ref="videoElement"
      class="hidden"
      autoplay 
      muted 
      playsinline
    ></video>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '@/composables/useFaceRecognition'

// Router
const router = useRouter()

// Face Recognition
const faceRecognition = useFaceRecognition()

// State
const cameraStatus = ref<'inactive' | 'loading' | 'active' | 'error'>('inactive')
const blinkProgress = ref(0)
const blinkDuration = ref(2) // seconds
const error = ref<string | null>(null)
const videoElement = ref<HTMLVideoElement | null>(null)

// Computed
const cameraStatusText = computed(() => {
  switch (cameraStatus.value) {
    case 'inactive': return 'Kamera nicht aktiv'
    case 'loading': return 'Kamera wird gestartet...'
    case 'active': return 'Kamera aktiv'
    case 'error': return 'Kamera-Fehler'
    default: return 'Unbekannt'
  }
})

// Blink detection variables
let blinkStartTime: number | null = null
let blinkInterval: number | null = null

// Methods
async function startCamera() {
  try {
    cameraStatus.value = 'loading'
    error.value = null

    // Start face recognition
    await faceRecognition.start()
    
    if (faceRecognition.isActive.value) {
      cameraStatus.value = 'active'
      startBlinkDetection()
    } else {
      throw new Error('Kamera konnte nicht gestartet werden')
    }
  } catch (err) {
    cameraStatus.value = 'error'
    error.value = err instanceof Error ? err.message : 'Unbekannter Fehler'
    console.error('Kamera-Start Fehler:', err)
  }
}

function startBlinkDetection() {
  // Check for blinks every 100ms
  blinkInterval = window.setInterval(() => {
    if (faceRecognition.isBlinking()) {
      if (blinkStartTime === null) {
        blinkStartTime = Date.now()
      }
      
      const elapsed = (Date.now() - blinkStartTime) / 1000
      blinkProgress.value = Math.min((elapsed / blinkDuration.value) * 100, 100)
      
      if (elapsed >= blinkDuration.value) {
        // Blink duration reached - start the app
        startApp()
      }
    } else {
      // Eyes opened - reset blink detection
      blinkStartTime = null
      blinkProgress.value = 0
    }
  }, 100)
}

function startApp() {
  // Stop blink detection
  if (blinkInterval) {
    clearInterval(blinkInterval)
    blinkInterval = null
  }
  
  // Navigate to main app
  router.push('/app')
}

function startWithoutBlink() {
  // Navigate to main app without blink detection
  router.push('/app')
}

// Lifecycle
onMounted(() => {
  // Auto-start camera if possible
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    // Don't auto-start, let user click button
    console.log('Kamera verfügbar - warte auf Benutzerinteraktion')
  }
})

onUnmounted(() => {
  // Cleanup
  if (blinkInterval) {
    clearInterval(blinkInterval)
  }
  faceRecognition.stop()
})
</script>

<style scoped>
/* Custom animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style> 