<template>
  <div class="start-container">
    <!-- Header -->
    <header class="start-header">
      <div class="start-header-content">
        <h1 class="start-title">VOCA</h1>
        <img :src="rattenkopfIcon" alt="VOCA Logo" class="start-logo" />
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
          <div class="status-item">
            <div 
              :class="[
                'status-indicator',
                cameraStatus === 'active' && faceRecognition.isDetected ? 'detected' : 
                cameraStatus === 'active' ? 'searching' : 
                'inactive'
              ]"
            ></div>
            <span class="status-text">
              {{ cameraStatus === 'active' && faceRecognition.isDetected ? 'Gesicht erkannt' : 
                 cameraStatus === 'active' ? 'Gesicht suchen...' : 
                 'Keine Kamera' }}
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
          <!-- Kamera Start Button (wenn Kamera nicht aktiv) -->
          <div v-if="cameraStatus === 'inactive' || cameraStatus === 'error'">
            <button
              @click="startCamera"
              :disabled="false"
              class="btn-primary"
            >
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              <span>{{ cameraStatus === 'error' ? 'Kamera starten' : 'Kamera aktivieren' }}</span>
            </button>
          </div>

          <!-- Option Buttons (wenn Kamera aktiv und Gesicht erkannt) -->
          <div v-if="cameraStatus === 'active' && faceRecognition.isDetected" class="options-container">
            <!-- Mit Sprachausgabe starten Button -->
            <button
              @click="handleButtonClick(0)"
              :class="[
                'btn-option',
                'btn-option-tts',
                autoMode.index.value === 0 ? 'btn-option-active' : 'btn-option-inactive'
              ]"
            >
              <div class="btn-icon">🔊</div>
              <div class="btn-text">
                <div class="btn-title">Mit Sprachausgabe starten</div>
                <div class="btn-subtitle">TTS wird aktiviert</div>
              </div>
            </button>

            <!-- Ohne Sprachausgabe starten Button -->
            <button
              @click="handleButtonClick(1)"
              :class="[
                'btn-option',
                'btn-option-muted',
                autoMode.index.value === 1 ? 'btn-option-active-muted' : 'btn-option-inactive-muted'
              ]"
            >
              <div class="btn-icon">🔇</div>
              <div class="btn-text">
                <div class="btn-title">Ohne Sprachausgabe starten</div>
                <div class="btn-subtitle">TTS bleibt stumm</div>
              </div>
            </button>
          </div>

          <!-- Option Buttons (wenn keine Kamera erkannt - rot) -->
          <div v-if="cameraStatus === 'inactive' || cameraStatus === 'error'" class="options-container">
            <!-- Mit Sprachausgabe starten Button -->
            <button
              @click="handleButtonClick(0)"
              :class="[
                'btn-option',
                'btn-option-error',
                autoMode.index.value === 0 ? 'btn-option-active-error' : 'btn-option-inactive-error'
              ]"
            >
              <div class="btn-icon">🔊</div>
              <div class="btn-text">
                <div class="btn-title">Mit Sprachausgabe starten</div>
                <div class="btn-subtitle">TTS wird aktiviert</div>
              </div>
            </button>

            <!-- Ohne Sprachausgabe starten Button -->
            <button
              @click="handleButtonClick(1)"
              :class="[
                'btn-option',
                'btn-option-error',
                autoMode.index.value === 1 ? 'btn-option-active-error' : 'btn-option-inactive-error'
              ]"
            >
              <div class="btn-icon">🔇</div>
              <div class="btn-text">
                <div class="btn-title">Ohne Sprachausgabe starten</div>
                <div class="btn-subtitle">TTS bleibt stumm</div>
              </div>
            </button>
          </div>

          <!-- Warte auf Gesichtserkennung -->
          <div v-if="cameraStatus === 'active' && !faceRecognition.isDetected" class="waiting-container">
            <div class="waiting-content">
              <div class="waiting-icon">👤</div>
              <p class="waiting-text">Bitte stellen Sie sich vor die Kamera</p>
            </div>
          </div>
        </div>

        <!-- Spacer -->
        <div class="spacer"></div>

        <!-- Error Message -->
        <div v-if="error" class="error-container">
          <p class="error-text">{{ error }}</p>
        </div>

        <!-- Help Text (reduziert) -->
        <div class="help-container">
          <p class="help-text">
            Blinzeln Sie langsam, um zwischen den Optionen zu navigieren
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'
import { useAutoMode } from '../../../shared/composables/useAutoMode'

// Keine baseUrl mehr nötig - verwende absolute Pfade direkt
import { useInputManager } from '../../../shared/composables/useInputManager'
import rattenkopfIcon from '@/assets/icons/logo_VOCA.svg'
import './StartView.css'

// Router
const router = useRouter()

// Face Recognition
const faceRecognition = useFaceRecognition()

// Zustand
const cameraStatus = ref<'inactive' | 'loading' | 'active' | 'error'>('inactive')
const error = ref<string | null>(null)
const videoElement = ref<HTMLVideoElement | null>(null)

// Option Buttons (reaktiv)
const options = computed(() => [
  { id: 'startWithTTS', title: 'Mit Sprachausgabe starten', subtitle: 'TTS wird aktiviert' },
  { id: 'startWithoutTTS', title: 'Ohne Sprachausgabe starten', subtitle: 'TTS bleibt stumm' }
])

// Auto-Mode Configuration
const autoModeConfig = {
  speak: async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!simpleFlowController.getTTSMuted()) {
        simpleFlowController.speak(text)
        // Warte auf TTS-Ende (vereinfacht: 2 Sekunden)
        setTimeout(() => resolve(), 2000)
      } else {
        resolve()
      }
    })
  },
  getItems: () => options.value,
  getTitle: () => 'Wählen Sie eine Option'
}

const autoMode = useAutoMode(autoModeConfig)

// Input Manager für Blink-Erkennung und Rechtsklick (Balldrucksensor)
const inputManager = useInputManager({
  onSelect: (event) => {
    console.log('StartView: Input detected - selecting option', autoMode.index.value, event.type)
    handleButtonClick(autoMode.index.value)
  },
  enabledInputs: ['blink', 'click'],
  cooldown: 500
})

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

// Berechnet für Fehlerprüfung
const hasSafariError = computed(() => {
  const errorValue = faceRecognition.error.value
  return errorValue && typeof errorValue === 'string' && errorValue.includes('Safari')
})


// Methods
async function startCamera() {
  try {
    cameraStatus.value = 'loading'
    error.value = null

    // Start face recognition
    await faceRecognition.start()
    
    // Prüfe ob wirklich eine Kamera vorhanden ist (nicht nur Fallback-Modus)
    // Im Fallback-Modus wird isActive auf true gesetzt, aber error enthält eine Nachricht
    const isFallbackMode = faceRecognition.error.value && 
                           faceRecognition.error.value.includes('Fallback-Modus')
    
    if (faceRecognition.isActive.value && !isFallbackMode) {
      cameraStatus.value = 'active'
      
      // Start Auto-Mode für Button-Navigation
      if (faceRecognition.isDetected.value) {
        startAutoMode()
      }
      
      // WICHTIG: Aktiviere TTS nach erfolgreicher Kamera-Aktivierung (für TTS-Toggle)
      console.log('StartView: Kamera erfolgreich aktiviert')
      simpleFlowController.setUserInteracted(true)
    } else {
      // Keine echte Kamera erkannt - setze Status auf error
      console.log('StartView: Keine echte Kamera erkannt - Fallback-Modus erkannt')
      throw new Error('Kamera konnte nicht gestartet werden')
    }
  } catch (err) {
    console.error('Kamera-Start Fehler:', err)
    cameraStatus.value = 'error'
    error.value = err instanceof Error ? err.message : 'Unbekannter Fehler'
    
    // KEIN Fallback mehr - Status bleibt auf 'error', damit User sieht, dass keine Kamera erkannt wurde
    // User kann trotzdem die Buttons verwenden (werden rot angezeigt)
    console.log('StartView: Kamera-Fehler - Status bleibt auf error')
  }
}

function startAutoMode() {
  // Start Auto-Mode für Button-Navigation
  autoMode.start(true)
  
  // Start Input Manager für Blink-Erkennung
  inputManager.start()
  
  // Aktiviere TTS, damit Auto-Mode TTS verwenden kann
  // (auch wenn keine Kamera vorhanden ist, sollte TTS funktionieren)
  simpleFlowController.setUserInteracted(true)
  
  console.log('StartView: Auto-Mode gestartet für Button-Navigation')
}

function handleButtonClick(index: number) {
  if (autoMode.index.value !== index) {
    // Navigiere zu diesem Button
    autoMode.index.value = index
    return
  }
  
  // Button wurde ausgewählt
  const option = options.value[index]
  
  if (option.id === 'startWithTTS') {
    // Starte Anwendung mit TTS aktiviert
    console.log('StartView: Anwendung starten - mit TTS')
    simpleFlowController.setTTSMuted(false) // Stelle sicher, dass TTS aktiv ist
    simpleFlowController.setUserInteracted(true)
    router.push('/app')
  } else if (option.id === 'startWithoutTTS') {
    // Starte Anwendung ohne TTS (stumm)
    console.log('StartView: Anwendung starten - ohne TTS')
    simpleFlowController.setTTSMuted(true) // Stelle sicher, dass TTS stumm ist
    simpleFlowController.setUserInteracted(true)
    router.push('/app')
  }
}

// Watch für Gesichtserkennung - starte Auto-Mode wenn Gesicht erkannt wird
watch(() => faceRecognition.isDetected.value, (detected) => {
  if (detected && cameraStatus.value === 'active' && !autoMode.running.value) {
    startAutoMode()
  }
})

// Watch für Kamera-Status - starte Auto-Mode auch wenn keine Kamera erkannt (für rote Buttons)
watch(() => cameraStatus.value, (status) => {
  if ((status === 'inactive' || status === 'error') && !autoMode.running.value) {
    // Starte Auto-Mode auch ohne Kamera, damit Buttons navigierbar sind
    startAutoMode()
  }
})

// Lebenszyklus
onMounted(async () => {
  console.log('StartView: Mounted')
  
  // Starte Kamera automatisch falls möglich
  if (typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
    console.log('Kamera verfügbar - starte automatisch')
    // Starte Kamera automatisch nach kurzer Verzögerung
    setTimeout(async () => {
      try {
        await startCamera()
      } catch (error) {
        console.log('Auto-start failed, user can still click button')
        // Setze Status auf error, damit User den Button verwenden kann
        cameraStatus.value = 'error'
      }
    }, 1000) // 1 Sekunde Verzögerung
  } else {
    console.log('Kamera nicht verfügbar - User kann trotzdem den Button verwenden')
    cameraStatus.value = 'error'
  }
})

onUnmounted(() => {
  // Aufräumen
  autoMode.stop()
  inputManager.stop()
  // Gesichtserkennung NICHT stoppen - sie soll seitenübergreifend laufen
  // faceRecognition.stop()
})
</script>
