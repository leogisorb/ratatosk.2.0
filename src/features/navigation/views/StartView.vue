<template>
  <div class="start-container">
    <!-- Header -->
    <header class="start-header">
      <div class="start-header-content">
        <h1 class="start-title">RATATOSK</h1>
        <img src="/rattenkopf.svg" alt="Ratatosk Logo" class="start-logo" />
      </div>
    </header>

    <!-- Main Content -->
    <main class="start-main">
      <div class="start-content">
        <!-- Status Display -->
        <div class="status-container">
          <!-- Camera Status -->
          <div class="status-item">
            <div 
              :class="[
                'status-indicator',
                cameraStatus === 'active' ? 'active' : 
                cameraStatus === 'loading' ? 'loading' : 
                'inactive'
              ]"
            ></div>
            <span class="status-text">{{ cameraStatusText }}</span>
          </div>

          <!-- Face Detection Status -->
          <div v-if="cameraStatus === 'active'" class="status-item">
            <div 
              :class="[
                'status-indicator',
                faceRecognition.isDetected ? 'detected' : 'searching'
              ]"
            ></div>
            <span class="status-text">
              {{ faceRecognition.isDetected ? 'Gesicht erkannt' : 'Gesicht suchen...' }}
            </span>
          </div>
        </div>

        <!-- Safari Kamera-Hinweis -->
        <div v-if="cameraStatus === 'error' && hasSafariError" class="safari-camera-hint">
          <div class="safari-hint-content">
            <h3>🔒 Safari Kamera-Berechtigung erforderlich</h3>
            <p>Um die Kamera zu aktivieren:</p>
            <ol>
              <li>Klicken Sie auf <strong>"Kamera aktivieren"</strong></li>
              <li>Erlauben Sie den Kamera-Zugriff im Safari-Dialog</li>
              <li>Oder gehen Sie zu <strong>Safari → Einstellungen → Websites → Kamera</strong></li>
              <li>Setzen Sie die Berechtigung für diese Website auf <strong>"Erlauben"</strong></li>
            </ol>
          </div>
        </div>

        <!-- Button Container -->
        <div class="button-container">
          <!-- Start Button -->
          <div v-if="cameraStatus === 'inactive' || cameraStatus === 'error'">
            <button
              @click="startCamera"
              :disabled="false"
              class="btn-primary"
            >
              <svg v-if="false" class="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg v-else class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              <span>{{ cameraStatus === 'error' ? 'Kamera starten' : 'Kamera und Sprachausgabe aktivieren' }}</span>
            </button>
          </div>

          <!-- Blink to Start -->
          <div v-if="cameraStatus === 'active' && faceRecognition.isDetected">
            <div class="blink-container">
              <div class="blink-content">
                <div class="blink-icon">👁️</div>
                <h2 class="blink-title">Blinzeln Sie zum Starten</h2>
                <p class="blink-description">
                  Halten Sie beide Augen für {{ blinkDuration }} Sekunden geschlossen
                </p>
                
                <!-- Blink Progress -->
                <div class="progress-container">
                  <div 
                    class="progress-bar"
                    :style="{ width: `${blinkProgress}%` }"
                  ></div>
                </div>
                
                <p class="progress-text">
                  {{ blinkProgress.toFixed(1) }}% / 100%
                </p>
              </div>
            </div>
          </div>

          <!-- Spacer -->
          <div class="spacer"></div>

          <!-- Manual Start Option -->
          <div v-if="cameraStatus === 'active'">
            <button
              @click="startWithoutBlink"
              class="btn-secondary"
            >
              Ohne Blinzeln starten
            </button>
          </div>
        </div>

        <!-- Spacer -->
        <div class="spacer"></div>

        <!-- Error Message -->
        <div v-if="error" class="error-container">
          <p class="error-text">{{ error }}</p>
        </div>

        <!-- Help Text -->
        <div class="help-container">
          <p class="help-text">
            <strong>Tipp:</strong> Stellen Sie sich vor die Kamera und blinzeln Sie langsam
          </p>
          <p class="help-text">
            Falls die Kamera nicht funktioniert, können Sie auch ohne Gesichtserkennung starten
          </p>
        </div>
      </div>
    </main>

    <!-- Hidden Video Element -->
    <video 
      ref="videoElement"
      class="hidden-video"
      autoplay 
      muted 
      playsinline
    ></video>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'
import './StartView.css'

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

// Computed for error check
const hasSafariError = computed(() => {
  const errorValue = faceRecognition.error.value
  return errorValue && typeof errorValue === 'string' && errorValue.includes('Safari')
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
      
      // WICHTIG: Aktiviere TTS nach erfolgreicher Kamera-Aktivierung
      console.log('StartView: Kamera erfolgreich aktiviert - aktiviere TTS seitenübergreifend')
      simpleFlowController.setUserInteracted(true)
    } else {
      throw new Error('Kamera konnte nicht gestartet werden')
    }
  } catch (err) {
    console.error('Kamera-Start Fehler:', err)
    cameraStatus.value = 'error'
    error.value = err instanceof Error ? err.message : 'Unbekannter Fehler'
    
    // Fallback: Setze trotzdem als aktiv, damit User weiter kann
    console.log('Kamera-Fallback: Setze als aktiv für Navigation')
    cameraStatus.value = 'active'
    error.value = null
    
    // Auch im Fallback-Modus TTS aktivieren
    console.log('StartView: Kamera-Fallback - aktiviere TTS seitenübergreifend')
    simpleFlowController.setUserInteracted(true)
  }
}

function startBlinkDetection() {
  let hasSpokenStart = false
  let hasSpokenProgress = false
  
  // Check for blinks every 100ms
  blinkInterval = window.setInterval(() => {
    if (faceRecognition.isBlinking()) {
      if (blinkStartTime === null) {
        blinkStartTime = Date.now()
        // ✅ TTS aktivieren, sobald das Blinzeln beginnt (Interaktion erkannt!)
        console.log('StartView: Blinzeln erkannt - aktiviere TTS als Interaktion')
        simpleFlowController.setUserInteracted(true)
        
        // ✅ TTS-Feedback: "Blinzeln erkannt"
        if (!hasSpokenStart) {
          hasSpokenStart = true
          simpleFlowController.speak('Blinzeln erkannt. Halten Sie die Augen geschlossen.')
        }
      }
      
      const elapsed = (Date.now() - blinkStartTime) / 1000
      blinkProgress.value = Math.min((elapsed / blinkDuration.value) * 100, 100)
      
      // ✅ TTS-Feedback bei 50% Fortschritt
      if (elapsed >= blinkDuration.value * 0.5 && !hasSpokenProgress) {
        hasSpokenProgress = true
        simpleFlowController.speak('Weiter so.')
      }
      
      if (elapsed >= blinkDuration.value) {
        // Blink duration reached - start the app
        simpleFlowController.speak('Starte Programm.')
        startApp()
      }
    } else {
      // Eyes opened - reset blink detection
      blinkStartTime = null
      blinkProgress.value = 0
      hasSpokenStart = false
      hasSpokenProgress = false
    }
  }, 100)
}

function startApp() {
  // Stop blink detection
  if (blinkInterval) {
    clearInterval(blinkInterval)
    blinkInterval = null
  }
  
  // TTS wurde bereits beim Beginn des Blinzelns aktiviert (in startBlinkDetection)
  // Hier stellen wir nur sicher, dass es aktiviert ist (falls noch nicht geschehen)
  if (!simpleFlowController.getState().userInteracted) {
    console.log('StartView: Start durch Blinzeln - stelle sicher, dass TTS aktiviert ist')
    simpleFlowController.setUserInteracted(true)
  } else {
    console.log('StartView: Start durch Blinzeln - TTS bereits aktiviert beim Blinzeln')
  }
  
  // Navigate to main app
  router.push('/app')
}

function startWithoutBlink() {
  // Aktiviere TTS auch beim Start ohne Blinzeln
  console.log('StartView: Start ohne Blinzeln - aktiviere TTS seitenübergreifend')
  simpleFlowController.setUserInteracted(true)
  
  // Navigate to main app without blink detection
  router.push('/app')
}

// Lifecycle
onMounted(() => {
  console.log('StartView: Mounted - Kamera wird NICHT automatisch gestartet, User muss Button klicken')
  // ✅ Kamera wird NICHT automatisch gestartet - User muss explizit den Button klicken
})

onUnmounted(() => {
  // Cleanup
  if (blinkInterval) {
    clearInterval(blinkInterval)
  }
  // Face Recognition NICHT stoppen - sie soll seitenübergreifend laufen
  // faceRecognition.stop()
})
</script>
