<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'
import AppHeader from '../../../shared/components/AppHeader.vue'

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
const closedFrames = ref(0)
const eyesClosed = ref(false)
const selectedPainLevel = ref<number | null>(null)
const isSelectionComplete = ref(false)
const userInteracted = ref(false)

// Verbesserte Blink-Detection Parameter - zentral gesteuert
const blinkThreshold = computed(() => Math.ceil(settingsStore.settings.blinkSensitivity * 10)) // Konvertiere Sekunden zu Frames (10 FPS)
const lastBlinkTime = ref(0)
const blinkCooldown = computed(() => settingsStore.settings.blinkSensitivity * 1000)

// Marker Position - für synchronen Lauf von Progress Bar und Marker
const markerPosition = computed(() => {
  // Korrekte Berechnung: Level 1 = 5%, Level 2 = 15%, ..., Level 10 = 95%
  const position = ((currentPainLevel.value - 1) * 10) + 5
  console.log('PainScaleView: Current pain level:', currentPainLevel.value, 'Marker position:', position + '%')
  return position
})

// TTS removed

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

// TTS removed

// Volume Toggle Event Handler - TTS removed
const handleVolumeToggle = (event: CustomEvent) => {
  console.log('PainScaleView received volumeToggle event:', event.detail, '- TTS removed')
}

// TTS über SimpleFlowController
const speakText = async (text: string) => {
  console.log('PainScaleView: Requesting TTS for:', text)
  await simpleFlowController.speak(text)
}

// User interaction detection - aktiviert TTS
const enableTTSOnInteraction = () => {
  if (!userInteracted.value) {
    console.log('PainScaleView: User interaction detected - TTS now enabled')
    userInteracted.value = true
    simpleFlowController.setUserInteracted(true)
  }
}

// Auto Mode Funktionen über SimpleFlowController
const startAutoMode = () => {
  if (!isAutoMode.value) return

  console.log('PainScaleView: Starting auto-mode with', painLevels.length, 'pain levels')
  
  const success = simpleFlowController.startAutoMode(
    painLevels,
    (currentIndex, currentItem) => {
      currentPainLevel.value = currentItem.level
      console.log('PainScaleView: Auto-mode cycle:', currentItem.text, '-', currentItem.description, 'at index:', currentIndex, 'level:', currentItem.level)
      console.log('PainScaleView: Marker position will be:', ((currentItem.level - 1) * 10) + 5, '%')
      speakText(`${currentItem.text} - ${currentItem.description}`)
    },
    2000, // initial delay
    2000  // cycle delay
  )

  if (!success) {
    console.log('PainScaleView: Auto-mode start failed')
  }
}

const pauseAutoMode = () => {
  console.log('PainScaleView: Pausing auto-mode')
  simpleFlowController.stopAutoMode()
}

const stopAutoMode = () => {
  console.log('PainScaleView: Stopping auto-mode')
  simpleFlowController.stopAutoMode()
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
    console.log(`Schmerzlevel ${selectedItem.text} - ${selectedItem.description} - TTS removed`)
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
const handleFaceBlink = () => {
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
  
  // Volume Toggle Event Listener
  window.addEventListener('volumeToggle', handleVolumeToggle as EventListener)
  
  // Blink-Check Interval starten
  blinkCheckInterval.value = window.setInterval(() => {
    handleFaceBlink()
  }, 100)
  
  // Auto-Modus nach 5 Sekunden starten
  startAutoMode()
})

onUnmounted(() => {
  console.log('PainScaleView unmounted - stopping face recognition')
  document.removeEventListener('contextmenu', handleRightClick)
  window.removeEventListener('volumeToggle', handleVolumeToggle as EventListener)
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
  <div class="pain-assessment-app">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content -->
    <main class="pain-main-content">
      <div class="pain-content-wrapper">
        <!-- Ausgewählter Körperteil und Schmerzlevel Anzeige -->
        <div class="pain-scale-display">
          <div class="pain-selected-container">
            <div class="pain-scale-header-row">
              <h2 class="pain-scale-body-part">
                {{ selectedBodyPart }}
              </h2>
              <h3 class="pain-scale-title">
                Schmerzlevel:
              </h3>
            </div>
            <div class="pain-scale-level">
              {{ currentPainLevel }}
            </div>
            <div class="pain-scale-description">
              {{ painLevels.find(item => item.level === currentPainLevel)?.description }}
            </div>
          </div>
        </div>

        <!-- Schmerzskala Balken -->
        <div class="pain-scale-bar">
          <div class="pain-scale-progress"
            :style="{ width: markerPosition + '%' }"
          ></div>
          
          <!-- Pain Level Numbers in Bar -->
          <div class="pain-scale-numbers">
            <span 
              v-for="(item, index) in painLevels" 
              :key="item.level"
              class="pain-scale-number"
              :class="{ 'active': currentPainLevel === item.level }"
              :style="{ left: `${(index * 10) + 5}%` }"
            >
              {{ item.level }}
            </span>
          </div>
          
        </div>
        
        <!-- Skala Beschriftung -->
        <div class="pain-scale-labels">
          <span>Leicht</span>
          <span>Schwer</span>
        </div>


        <!-- Abstandshalter -->
        <div style="height: 4rem;"></div>

      </div>
    </main>
  </div>
</template>

<style scoped>
/* Pain Scale View Specific Styles */
.pain-assessment-app {
  min-height: 100vh;
  background-color: white;
  display: flex;
  flex-direction: column;
}

.pain-main-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 4rem;
}

.pain-content-wrapper {
  max-width: 8xl;
  margin: 0 auto;
  width: 100%;
}

.pain-scale-display {
  margin-bottom: 4rem;
  text-align: center;
}

.pain-selected-container {
  margin-bottom: 0.43rem;
  margin-top: -0.58rem;
  text-align: center;
}

.pain-scale-header-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 1rem;
}

.pain-scale-body-part {
  font-size: 4.2rem; /* 30% smaller: 6rem * 0.7 = 4.2rem */
  font-weight: bold;
  color: black;
  font-family: 'Source Code Pro', monospace;
  margin: 0;
}

.pain-scale-title {
  font-size: 4.2rem; /* Gleiche Größe wie body-part */
  font-weight: bold;
  color: black;
  font-family: 'Source Code Pro', monospace;
  margin: 0;
}

.pain-scale-level {
  font-size: 6rem;
  font-weight: bold;
  color: black;
  font-family: 'Source Code Pro', monospace;
  margin-bottom: 1rem;
}

.pain-scale-description {
  font-size: 3rem;
  font-weight: 300;
  color: black;
  font-family: 'Source Code Pro', monospace;
}

.pain-scale-bar {
  margin-bottom: 2rem;
  position: relative;
  height: 6rem;
  background-color: #e5e7eb;
  border-radius: 3rem;
  overflow: hidden;
}

.pain-scale-progress {
  height: 100%;
  transition: all 0.3s ease;
  background: linear-gradient(to right, #10b981 0%, #f59e0b 50%, #ef4444 100%);
}

.pain-scale-numbers {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  display: flex;
  align-items: center;
  pointer-events: none;
}

.pain-scale-number {
  position: absolute;
  font-size: 2.5rem;
  font-weight: 600;
  color: black;
  font-family: 'Source Code Pro', monospace;
  transition: all 0.3s ease;
  text-shadow: 0 0 3px rgba(255, 255, 255, 0.8);
  transform: translateX(-50%);
  text-align: center;
  z-index: 20;
}

.pain-scale-number.active {
  color: black;
  font-weight: 700;
  font-size: 3.45rem; /* 15% größer: 3rem * 1.15 = 3.45rem */
  text-shadow: 0 0 3px rgba(255, 255, 255, 0.8);
}

.pain-scale-marker {
  position: absolute;
  top: 0;
  width: 6rem;
  height: 6rem;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid #d1d5db;
  border-radius: 50%;
  transform: translateX(-50%);
  z-index: 15;
}

.pain-scale-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
  font-size: 2rem;
  font-weight: 300;
  color: #6b7280;
  font-family: 'Source Code Pro', monospace;
}

.pain-scale-buttons {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 4rem;
}

.pain-scale-button {
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 2.5rem;
  background: white;
  border: 2px solid #d1d5db;
  border-radius: 15px;
  outline: none;
  box-shadow: none;
  padding: 1.25rem 0.94rem;
  margin: 0;
  min-width: 5rem;
  font-family: 'Source Code Pro', monospace;
  cursor: pointer;
}

.pain-scale-button:hover {
  transform: scale(1.1);
  color: #6b7280;
}

.pain-scale-button.active {
  background: #f3f4f6;
  color: #f97316;
  transform: scale(1.1);
}

.pain-scale-button.inactive {
  color: #1f2937;
}

.pain-instructions {
  margin-top: -0.15rem;
  text-align: center;
}

.pain-instructions-title {
  font-size: 2.5rem;
  font-weight: 300;
  color: #374151;
  font-family: 'Source Code Pro', monospace;
  margin-bottom: 0.25rem;
}

.pain-instructions-text {
  font-size: 1.5rem;
  color: #1f2937;
  font-family: 'Source Code Pro', monospace;
  font-weight: 300;
  line-height: 1.6;
}

.pain-instructions-text strong {
  font-weight: bold;
}

.pain-auto-mode-indicator {
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: #3b82f6;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-family: 'Source Code Pro', monospace;
  font-size: 1rem;
  z-index: 1000;
  opacity: 0.9;
}

.pain-auto-mode-indicator.active {
  background: #f97316;
}

/* Responsive Design */
@media (max-width: 768px) {
  .pain-main-content {
    padding: 0.5rem 2rem;
  }
  
  .pain-scale-body-part {
    font-size: 2.8rem; /* 30% smaller: 4rem * 0.7 = 2.8rem */
  }
  
  .pain-scale-title {
    font-size: 2.8rem; /* Gleiche Größe wie body-part */
  }
  
  .pain-scale-level {
    font-size: 4rem;
  }
  
  .pain-scale-description {
    font-size: 2rem;
  }
  
  .pain-scale-button {
    font-size: 2rem;
    padding: 1rem 0.75rem;
    min-width: 4rem;
  }
  
  .pain-scale-number {
    font-size: 2rem;
  }
  
  .pain-scale-number.active {
    font-size: 2.76rem; /* 15% größer: 2.4rem * 1.15 = 2.76rem */
  }
}

@media (max-width: 480px) {
  .pain-main-content {
    padding: 0.25rem 1rem;
  }
  
  .pain-scale-body-part {
    font-size: 2.1rem; /* 30% smaller: 3rem * 0.7 = 2.1rem */
  }
  
  .pain-scale-title {
    font-size: 2.8rem; /* 30% smaller: 4rem * 0.7 = 2.8rem */
  }
  
  .pain-scale-level {
    font-size: 3rem;
  }
  
  .pain-scale-description {
    font-size: 1.5rem;
  }
  
  .pain-scale-button {
    font-size: 1.5rem;
    padding: 0.75rem 0.5rem;
    min-width: 3rem;
  }
  
  .pain-scale-number {
    font-size: 1.5rem;
  }
  
  .pain-scale-number.active {
    font-size: 2.07rem; /* 15% größer: 1.8rem * 1.15 = 2.07rem */
  }
}
</style>
