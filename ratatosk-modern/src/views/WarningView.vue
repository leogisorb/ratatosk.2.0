<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '@/composables/useFaceRecognition'
import { useSettingsStore } from '@/stores/settings'

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
const blinkCooldown = 1500 // 1.5 Sekunden Cooldown zwischen Blinks

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
      goBack()
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
    
    if (now - lastBlinkTime.value < blinkCooldown) {
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

// Zurück zur Hauptseite
const goBack = () => {
  router.push('/app')
}
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
    <!-- Header -->
    <header class="bg-gray-200 dark:bg-gray-800 shadow-2xl flex-shrink-0" style="box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <!-- Zurück Button (oben links) -->
          <button
            @click="goBack"
            class="p-2 rounded-lg bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
            title="Zurück zur Hauptseite (oder 10 Sekunden blinzeln)"
          >
            <svg class="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          
          <div class="flex items-center space-x-4">
            <h1 class="text-2xl font-bold text-black dark:text-white" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
              WARNGERÄUSCH
            </h1>
            <img src="/rattenkopf.svg" alt="Ratatosk Logo" class="w-12 h-12" />
            <div class="w-2.5 h-1.5 bg-[#00796B]"></div>
          </div>
          
          <!-- Platzhalter für zentrierte Ausrichtung -->
          <div class="w-10 h-10"></div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex items-center justify-center p-16">
      <div class="max-w-8xl mx-auto">
        <!-- Großes Glocken Icon -->
        <div class="mb-16 text-center">
          <button
            @click="selectWarningTile('glocke')"
            class="transition-all duration-300 hover:scale-110"
            :class="currentTileIndex === 0 ? 'scale-110' : ''"
            style="background: none; border: none; outline: none; box-shadow: none;"
          >
            <img 
              src="/bell.svg" 
              alt="WARNGERÄUSCH" 
              class="mx-auto"
              style="transition: transform 0.3s ease; width: 60%; height: auto;"
            />
          </button>
        </div>
        
        
        <!-- Abstandshalter -->
        <div style="height: 4rem;"></div>

        <!-- Zurück Button -->
        <div class="flex justify-center mb-48">
          <button
            @click="selectWarningTile('zurueck')"
            class="transition-all duration-300 font-medium hover:scale-110"
            :style="{
              fontSize: '2.646rem',
              background: currentTileIndex === 1 ? '#f3f4f6' : 'white',
              border: '2px solid #d1d5db',
              borderRadius: '15px',
              outline: 'none',
              boxShadow: 'none',
              padding: '12.6px 18.9px',
              margin: '0'
            }"
            :class="currentTileIndex === 1 ? 'text-orange-500 scale-110' : 'text-black hover:text-gray-600'"
          >
            Zurück
          </button>
        </div>

        <!-- Abstandshalter -->
        <div style="height: 4rem;"></div>

        <!-- Instructions -->
        <div class="text-center">
          <div class="bg-blue-100 dark:bg-blue-900 rounded-xl p-12 max-w-4xl mx-auto">
            <h3 class="text-4xl font-semibold text-blue-800 dark:text-blue-200 mb-4" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
              Bedienung
            </h3>
            <p class="text-2xl text-blue-700 dark:text-blue-300" style="font-family: 'Source Code Pro', monospace; font-weight: 300;">
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

/* Dark mode styles */
.dark {
  color-scheme: dark;
}
</style>