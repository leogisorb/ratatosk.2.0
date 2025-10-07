<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'
import AppHeader from '../../../shared/components/AppHeader.vue'

// Router
const router = useRouter()

// Stores
const settingsStore = useSettingsStore()

// Face Recognition
const faceRecognition = useFaceRecognition()

// State
const closedFrames = ref(0)
const eyesClosed = ref(false)
const currentTileIndex = ref(0)
const isAutoMode = ref(true)
const autoModeInterval = ref<number | null>(null)
const isAutoModePaused = ref(false)

// Tiles für Auto-Modus
const warningTiles = [
  { id: 'glocke', text: 'Glocke', type: 'action' },
  { id: 'zurueck', text: 'Zurück', type: 'navigation' }
]

// Verbesserte Blink-Detection Parameter - zentral gesteuert
const blinkThreshold = computed(() => Math.ceil(settingsStore.settings.blinkSensitivity * 10)) // Konvertiere Sekunden zu Frames (10 FPS)
const lastBlinkTime = ref(0)
const blinkCooldown = computed(() => settingsStore.settings.blinkSensitivity * 1000)

// Audio
const audioContext = ref<AudioContext | null>(null)
const isPlayingSound = ref(false)
const isAlarmActive = ref(false)
const alarmInterval = ref<number | null>(null)

// Text-to-Speech
const speechSynthesis = window.speechSynthesis
const isTTSEnabled = ref(true)

// Text-to-Speech Funktion
const speakText = (text: string) => {
  console.log('WarningView speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value)
  
  if (!isTTSEnabled.value || !speechSynthesis) {
    console.log('WarningView TTS disabled or speechSynthesis not available')
    return
  }
  
  speechSynthesis.cancel()
  
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'de-DE'
  utterance.rate = 0.8
  utterance.pitch = 1.0
  utterance.volume = 1.0
  
  console.log('WarningView Speaking:', text)
  speechSynthesis.speak(utterance)
}

// Auto Mode Funktionen
const startAutoMode = () => {
  if (autoModeInterval.value) return
  
  const cycleTiles = () => {
    if (!isAutoMode.value || isAutoModePaused.value) {
      return
    }
    currentTileIndex.value = (currentTileIndex.value + 1) % warningTiles.length
    const currentItem = warningTiles[currentTileIndex.value]
    speakText(currentItem.text)
    autoModeInterval.value = window.setTimeout(cycleTiles, 3000) // 3 Sekunden
  }
  
  const firstItem = warningTiles[currentTileIndex.value]
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
  speechSynthesis.cancel()
}

const stopAutoMode = () => {
  if (autoModeInterval.value) {
    clearTimeout(autoModeInterval.value)
    autoModeInterval.value = null
  }
  speechSynthesis.cancel()
}

// Tile Auswahl
function selectWarningTile(tileId: string) {
  console.log('selectWarningTile called with tileId:', tileId)
  pauseAutoMode()
  
  switch (tileId) {
    case 'glocke':
      console.log('Glocke selected')
      if (!isAlarmActive.value) {
        startContinuousAlarm()
      } else {
        stopContinuousAlarm()
      }
      
      // Auto-Modus nach 3 Sekunden wieder starten
      setTimeout(() => {
        if (isAutoMode.value) {
          currentTileIndex.value = 0
          isAutoModePaused.value = false
          startAutoMode()
        }
      }, 3000)
      break
    case 'zurueck':
      console.log('Zurück selected')
      stopContinuousAlarm()
      router.push('/app')
      break
  }
}

// Einzelner Alarm-Ton
const playSingleAlarmSound = () => {
  if (isPlayingSound.value) return
  
  isPlayingSound.value = true
  
  try {
    // Erstelle AudioContext falls nicht vorhanden
    if (!audioContext.value) {
      audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    
    const ctx = audioContext.value
    const oscillator1 = ctx.createOscillator()
    const oscillator2 = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    // Verbinde die Nodes
    oscillator1.connect(gainNode)
    oscillator2.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    // Konfiguriere den Alarm (zwei Töne für Alarm-Effekt)
    oscillator1.frequency.setValueAtTime(1000, ctx.currentTime) // 1000 Hz
    oscillator2.frequency.setValueAtTime(1200, ctx.currentTime) // 1200 Hz
    oscillator1.type = 'sine'
    oscillator2.type = 'sine'
    
    // Lautstärke (sehr laut)
    gainNode.gain.setValueAtTime(0.9, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    
    // Spiele den Alarm ab (kürzer für kontinuierlichen Effekt)
    oscillator1.start(ctx.currentTime)
    oscillator2.start(ctx.currentTime)
    oscillator1.stop(ctx.currentTime + 0.3) // 0.3 Sekunden lang
    oscillator2.stop(ctx.currentTime + 0.3)
    
    // Reset nach dem Ton
    setTimeout(() => {
      isPlayingSound.value = false
    }, 300)
    
  } catch (error) {
    console.error('Error playing alarm sound:', error)
    isPlayingSound.value = false
  }
}

// Kontinuierlicher Alarm starten
const startContinuousAlarm = () => {
  if (isAlarmActive.value) return
  
  isAlarmActive.value = true
  console.log('Starting continuous alarm')
  
  // Sofort einen Alarm abspielen
  playSingleAlarmSound()
  
  // Dann alle 0.5 Sekunden wiederholen
  alarmInterval.value = window.setInterval(() => {
    if (isAlarmActive.value) {
      playSingleAlarmSound()
    }
  }, 500) // 0.5 Sekunden
}

// Kontinuierlichen Alarm stoppen
const stopContinuousAlarm = () => {
  if (!isAlarmActive.value) return
  
  isAlarmActive.value = false
  console.log('Stopping continuous alarm')
  
  if (alarmInterval.value) {
    clearInterval(alarmInterval.value)
    alarmInterval.value = null
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
      const currentItem = warningTiles[currentTileIndex.value]
      console.log('Blink activation for tile:', currentTileIndex.value, 'tileId:', currentItem.id, 'text:', currentItem.text)
      
      speakText(currentItem.text)
      selectWarningTile(currentItem.id)
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
  const currentItem = warningTiles[currentTileIndex.value]
  console.log('Right click activation for tile:', currentTileIndex.value, 'tileId:', currentItem.id, 'text:', currentItem.text)
  
  speakText(currentItem.text)
  selectWarningTile(currentItem.id)
}

// Lifecycle
onMounted(() => {
  if (!faceRecognition.isActive.value) {
    faceRecognition.start()
  }
  
  startAutoMode()
  
  const blinkCheckInterval = setInterval(() => {
    handleBlink()
  }, 100)
  
  document.addEventListener('contextmenu', handleRightClick)
})

onUnmounted(() => {
  document.removeEventListener('contextmenu', handleRightClick)
  stopAutoMode()
  stopContinuousAlarm()
})

// Zurück-Funktion wird jetzt über AppHeader gesteuert
</script>

<template>
  <div class="page-container">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content - Zentriert -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- Großes Glocken Icon - Zentriert -->
        <div class="bell-container">
          <button
            @click="selectWarningTile('glocke')"
            class="bell-button"
            :class="currentTileIndex === 0 ? 'bell-active' : ''"
          >
            <img 
              src="/bell.svg" 
              alt="WARNGERÄUSCH" 
              class="bell-icon"
            />
          </button>
        </div>
        
        <!-- Zurück Button - Zentriert -->
        <div class="back-section">
          <button
            @click="selectWarningTile('zurueck')"
            class="back-action-button"
            :class="currentTileIndex === 1 ? 'back-active' : ''"
          >
            Zurück
          </button>
        </div>

        <!-- Instructions - Zentriert -->
        <div class="instructions-container">
          <div class="instructions-box">
            <h3 class="instructions-title">
              Bedienung
            </h3>
            <p class="instructions-text">
              <strong>Kurz blinzeln ({{ settingsStore.settings.blinkSensitivity }}s):</strong> Aktion auswählen<br>
              <strong>Rechte Maustaste:</strong> Aktion auswählen<br>
              <strong>Auto-Modus:</strong> Automatischer Durchlauf durch alle Aktionen
            </p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* WarningView verwendet jetzt globale CSS-Klassen aus main.css */

/* Spezifische WarningView Styles */
.content-wrapper {
  gap: 4rem;
}

/* Bell Container - Zentriert */
.bell-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.bell-button {
  background: none;
  border: none;
  outline: none;
  box-shadow: none;
  cursor: pointer;
  transition: transform 0.3s ease;
  padding: 2rem;
}

.bell-button:hover {
  transform: scale(1.1);
}

.bell-active {
  transform: scale(1.1);
}

.bell-icon {
  width: 60%;
  height: auto;
  max-width: 400px;
  transition: transform 0.3s ease;
}

/* Back Section - Zentriert */
.back-section {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.back-action-button {
  font-size: 2.646rem;
  font-family: 'Source Code Pro', monospace;
  font-weight: 500;
  background: white;
  border: 2px solid #d1d5db;
  border-radius: 15px;
  outline: none;
  box-shadow: none;
  padding: 12.6px 18.9px;
  margin: 0;
  cursor: pointer;
  transition: all 0.3s ease;
  color: black;
}

.back-action-button:hover {
  transform: scale(1.1);
  color: #6b7280;
}

.back-active {
  background: #f3f4f6;
  color: #00B098;
  transform: scale(1.1);
}

/* Instructions - Zentriert */
.instructions-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.instructions-box {
  background-color: transparent;
  color: #374151;
  padding: 1rem;
  max-width: 600px;
  width: 100%;
  text-align: center;
}

.instructions-title {
  font-size: 1.25rem;
  font-weight: bold;
  margin: 0 0 1rem 0;
  color: #1f2937;
}

.instructions-text {
  margin: 0;
  line-height: 1.6;
  color: #374151;
}

.instructions-text strong {
  font-weight: bold;
  color: #1f2937;
}

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

/* Responsive Design */
@media (max-width: 768px) {
  .content-wrapper {
    gap: 2rem;
    padding: 1rem;
  }
  
  .bell-icon {
    width: 80%;
    max-width: 300px;
  }
  
  .back-action-button {
    font-size: 2rem;
    padding: 10px 15px;
  }
}
</style>