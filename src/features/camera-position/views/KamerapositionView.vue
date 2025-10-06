<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../settings/stores/settings'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'

// Router
const router = useRouter()

// Stores
const settingsStore = useSettingsStore()

// Face Recognition
const faceRecognition = useFaceRecognition()

// State
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const stream = ref<MediaStream | null>(null)
const isCameraActive = ref(false)
const faceDetected = ref(false)
const facePosition = ref({ x: 0, y: 0, width: 0, height: 0 })
const isInFocus = ref(false)

// Text-to-Speech
const speechSynthesis = window.speechSynthesis
const isTTSEnabled = ref(true)

// Computed
const appClasses = computed(() => ({
  'dark': settingsStore.isDarkMode
}))

const focusStatus = computed(() => {
  if (!faceDetected.value) return 'Kein Gesicht erkannt'
  if (isInFocus.value) return 'Perfekt positioniert'
  return 'Positionierung anpassen'
})

const focusStatusColor = computed(() => {
  if (!faceDetected.value) return 'text-red-600'
  if (isInFocus.value) return 'text-green-600'
  return 'text-yellow-600'
})

// Text-to-Speech Funktion
const speakText = (text: string) => {
  console.log('KamerapositionView speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value, 'speechSynthesis:', speechSynthesis)
  
  if (!isTTSEnabled.value || !speechSynthesis) {
    console.log('KamerapositionView TTS disabled or speechSynthesis not available')
    return
  }
  
  speechSynthesis.cancel()
  
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'de-DE'
  utterance.rate = 0.8
  utterance.pitch = 1.0
  utterance.volume = 0.8
  
  console.log('KamerapositionView Speaking:', text)
  speechSynthesis.speak(utterance)
}

// TTS Toggle
const toggleTTS = () => {
  console.log('KamerapositionView toggleTTS called, current state:', isTTSEnabled.value)
  isTTSEnabled.value = !isTTSEnabled.value
  console.log('KamerapositionView TTS toggled to:', isTTSEnabled.value)
  
  if (!isTTSEnabled.value) {
    speechSynthesis.cancel()
    console.log('KamerapositionView TTS cancelled')
  } else {
    // Test TTS when enabling
    speakText('Sprachausgabe aktiviert')
  }
}

// Kamera-Funktionen
const startCamera = async () => {
  try {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
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
  faceDetected.value = false
  isInFocus.value = false
  speakText('Kamera deaktiviert')
}

// Face Detection und Fokus-Bewertung
const checkFaceFocus = () => {
  if (!videoRef.value || !canvasRef.value) return
  
  const video = videoRef.value
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  
  if (!ctx) return
  
  // Canvas auf Video-Größe setzen
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  
  // Video-Frame auf Canvas zeichnen
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  
  // Hier würde normalerweise die Face Detection API verwendet werden
  // Für Demo-Zwecke simulieren wir eine Gesichtserkennung
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const faceSize = Math.min(canvas.width, canvas.height) * 0.3
  
  // Simuliere Gesichtserkennung (in der echten App würde hier die Face API verwendet)
  const faceX = centerX - faceSize / 2
  const faceY = centerY - faceSize / 2
  
  faceDetected.value = true
  facePosition.value = { x: faceX, y: faceY, width: faceSize, height: faceSize }
  
  // Bewerte Fokus
  const idealSize = Math.min(canvas.width, canvas.height) * 0.25
  const sizeDiff = Math.abs(faceSize - idealSize) / idealSize
  const positionDiff = Math.sqrt(
    Math.pow(faceX + faceSize/2 - centerX, 2) + 
    Math.pow(faceY + faceSize/2 - centerY, 2)
  ) / Math.min(canvas.width, canvas.height)
  
  isInFocus.value = sizeDiff < 0.2 && positionDiff < 0.1
  
  // Zeichne Fokus-Kreis
  ctx.strokeStyle = isInFocus.value ? '#00ff00' : '#ff0000'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(faceX + faceSize/2, faceY + faceSize/2, faceSize/2, 0, 2 * Math.PI)
  ctx.stroke()
}

// Animation Loop
let animationId: number | null = null

const startFaceDetection = () => {
  const animate = () => {
    if (isCameraActive.value) {
      checkFaceFocus()
      animationId = requestAnimationFrame(animate)
    }
  }
  animate()
}

const stopFaceDetection = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

// Lifecycle
onMounted(() => {
  if (!faceRecognition.isActive.value) {
    faceRecognition.start()
  }
  
  startCamera()
  startFaceDetection()
})

onUnmounted(() => {
  stopCamera()
  stopFaceDetection()
})
</script>

<template>
  <div id="app" :class="appClasses">
    <!-- Responsive Layout -->
    <div class="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <!-- Header -->
      <header class="bg-gray-200 shadow-2xl flex-shrink-0" style="box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center py-4">
            <div class="flex items-center space-x-4">
              <button @click="$router.push('/einstellungen')" class="p-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 class="text-2xl font-bold text-black font-source-code font-light">
                KAMERAPOSITION
              </h1>
              <img src="/rattenkopf.svg" alt="Ratatosk Logo" class="w-12 h-12" />
              <div class="w-2.5 h-1.5 bg-[#00796B]"></div>
            </div>
            
            <!-- Control Buttons -->
            <div class="flex space-x-2">
              <!-- Camera Toggle Button -->
              <button
                @click="isCameraActive ? stopCamera() : startCamera()"
                class="p-2 rounded-lg transition-colors"
                :class="isCameraActive ? 'bg-green-300 hover:bg-green-400' : 'bg-gray-300 hover:bg-gray-400'"
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
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col items-center justify-center p-8">
        <!-- Instructions -->
        <div class="text-center mb-8 max-w-4xl">
          <h2 class="text-3xl font-bold text-gray-800 dark:text-gray-200 font-source-code mb-6">
            Kamera-Positionierung
          </h2>
          <div class="text-lg text-gray-600 dark:text-gray-400 space-y-4 text-left">
            <p><strong>Die Kamera ist richtig positioniert, wenn um das vollständige Gesicht ein orangener Kreis abgebildet ist.</strong></p>
            <p>Sollte der Kreis zu klein oder nicht vorhanden sein, drehen Sie Ihr Endgerät so, dass Ihr Kopf mit der Stirn zu diesem Text zeigt.</p>
            <p>Zudem kann es helfen das automatische Drehen des Endgerätes an zu schalten.</p>
            <p>Die Videoqualität kann von der tatsächlichen Qualität der Kamera stark abweichen.</p>
          </div>
        </div>

        <!-- Camera Feed -->
        <div class="relative mb-8">
          <div class="relative inline-block">
            <!-- Video Element -->
            <video
              ref="videoRef"
              autoplay
              muted
              playsinline
              class="w-full max-w-2xl h-auto rounded-lg shadow-lg"
              style="transform: scaleX(-1);" <!-- Mirror effect -->
            ></video>
            
            <!-- Canvas für Face Detection Overlay -->
            <canvas
              ref="canvasRef"
              class="absolute top-0 left-0 w-full h-full rounded-lg pointer-events-none"
              style="transform: scaleX(-1);" <!-- Mirror effect -->
            ></canvas>
          </div>
        </div>

        <!-- Status -->
        <div class="text-center">
          <div class="text-2xl font-bold mb-4" :class="focusStatusColor">
            {{ focusStatus }}
          </div>
          
          <div class="text-lg text-gray-600 dark:text-gray-400 space-y-2">
            <p v-if="!faceDetected" class="text-red-600">
              Bitte positionieren Sie Ihr Gesicht vor der Kamera
            </p>
            <p v-else-if="!isInFocus" class="text-yellow-600">
              Gesicht erkannt - Positionierung anpassen
            </p>
            <p v-else class="text-green-600">
              Perfekt! Die Kamera ist optimal positioniert
            </p>
          </div>
        </div>

        <!-- Abstandshalter -->
        <div style="height: 4rem;"></div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.font-source-code {
  font-family: 'Source Code Pro', monospace;
}
</style>
