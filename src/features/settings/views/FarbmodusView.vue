<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settings'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { keyboardGridConfig, getKeyboardTileStyle } from '../../../config/gridConfig'
import AppHeader from '../../../shared/components/AppHeader.vue'

// Router
const router = useRouter()

// Stores
const settingsStore = useSettingsStore()

// Face Recognition
const faceRecognition = useFaceRecognition()

// State
const currentTileIndex = ref(0)
const isAutoMode = ref(true)
const autoModeInterval = ref<number | null>(null)
const isAutoModePaused = ref(false)

// Text-to-Speech
const speechSynthesis = window.speechSynthesis
const isTTSEnabled = ref(true)

// Verwende die zentrale Grid-Konfiguration
const gridConfig = keyboardGridConfig

// Farbmodus-Optionen
const farbmodusItems = [
  {
    id: 'neutral',
    title: 'NEUTRAL',
    description: 'Standard Farben',
    color: '#6b7280'
  },
  {
    id: 'warm',
    title: 'WARM',
    description: 'Warme Farben',
    color: '#f59e0b'
  },
  {
    id: 'cool',
    title: 'COOL',
    description: 'Kühle Farben',
    color: '#3b82f6'
  },
  {
    id: 'high-contrast',
    title: 'HOCHKONTRAST',
    description: 'Hoher Kontrast',
    color: '#000000'
  },
  {
    id: 'dark',
    title: 'DUNKEL',
    description: 'Dunkles Design',
    color: '#1f2937'
  },
  {
    id: 'zurueck',
    title: 'ZURÜCK',
    description: 'Zurück zu Einstellungen',
    color: '#6b7280'
  }
]

// Computed
const appClasses = computed(() => ({
  'dark': settingsStore.isDarkMode
}))

// Text-to-Speech Funktion
const speakText = (text: string) => {
  console.log('FarbmodusView speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value, 'speechSynthesis:', speechSynthesis)
  
  if (!isTTSEnabled.value || !speechSynthesis) {
    console.log('FarbmodusView TTS disabled or speechSynthesis not available')
    return
  }
  
  speechSynthesis.cancel()
  
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'de-DE'
  utterance.rate = 1.0
  utterance.pitch = 1.0
  utterance.volume = 1.0
  
  console.log('FarbmodusView Speaking:', text)
  speechSynthesis.speak(utterance)
}

// TTS Toggle
const toggleTTS = () => {
  console.log('FarbmodusView toggleTTS called, current state:', isTTSEnabled.value)
  isTTSEnabled.value = !isTTSEnabled.value
  console.log('FarbmodusView TTS toggled to:', isTTSEnabled.value)
  
  if (!isTTSEnabled.value) {
    speechSynthesis.cancel()
    console.log('FarbmodusView TTS cancelled')
  } else {
    // Test TTS when enabling
    speakText('Sprachausgabe aktiviert')
  }
}

// Auto Mode Functions
const startAutoMode = () => {
  if (autoModeInterval.value) return
  
  // Stelle sicher, dass wir bei Index 0 starten
  currentTileIndex.value = 0
  
  const cycleTiles = () => {
    if (!isAutoMode.value || isAutoModePaused.value) {
      return
    }
    
    currentTileIndex.value = (currentTileIndex.value + 1) % farbmodusItems.length
    
    // Spreche den aktuellen Menüpunkt vor
    const currentItem = farbmodusItems[currentTileIndex.value]
    speakText(currentItem.title)
    
    autoModeInterval.value = window.setTimeout(cycleTiles, settingsStore.settings.autoModeSpeed)
  }
  
  // Spreche den ersten Menüpunkt vor
  const firstItem = farbmodusItems[currentTileIndex.value]
  speakText(firstItem.title)
  
  // Starte den ersten Zyklus nach der aktuellen Geschwindigkeit
  autoModeInterval.value = window.setTimeout(cycleTiles, settingsStore.settings.autoModeSpeed)
}

const pauseAutoMode = () => {
  isAutoModePaused.value = true
  if (autoModeInterval.value) {
    clearTimeout(autoModeInterval.value)
    autoModeInterval.value = null
  }
  speechSynthesis.cancel()
}

const resumeAutoMode = () => {
  isAutoModePaused.value = false
  if (!autoModeInterval.value) {
    // Starte den Auto-Modus bei der aktuellen Kachel
    const currentItem = farbmodusItems[currentTileIndex.value]
    speakText(currentItem.title)
    startAutoMode()
  }
}

const stopAutoMode = () => {
  if (autoModeInterval.value) {
    clearTimeout(autoModeInterval.value)
    autoModeInterval.value = null
  }
  // Stoppe auch die Sprachausgabe
  speechSynthesis.cancel()
}

// Farbmodus-Auswahl
function selectFarbmodus(farbmodusId: string) {
  console.log('selectFarbmodus called with farbmodusId:', farbmodusId)
  pauseAutoMode() // Pausiere Auto-Modus statt zu stoppen
  
  switch (farbmodusId) {
    case 'neutral':
      console.log('Neutral selected')
      speakText('Neutral ausgewählt - Standard Farben')
      settingsStore.updateSettings({ farbmodus: 'neutral' })
      break
    case 'warm':
      console.log('Warm selected')
      speakText('Warm ausgewählt - Warme Farben')
      settingsStore.updateSettings({ farbmodus: 'warm' })
      break
    case 'cool':
      console.log('Cool selected')
      speakText('Cool ausgewählt - Kühle Farben')
      settingsStore.updateSettings({ farbmodus: 'cool' })
      break
    case 'high-contrast':
      console.log('High contrast selected')
      speakText('Hochkontrast ausgewählt - Hoher Kontrast')
      settingsStore.updateSettings({ farbmodus: 'high-contrast' })
      break
    case 'dark':
      console.log('Dark selected')
      speakText('Dunkel ausgewählt - Dunkles Design')
      settingsStore.updateSettings({ farbmodus: 'dark' })
      break
    case 'zurueck':
      console.log('Zurück selected')
      speakText('Zurück zu Einstellungen')
      stopAutoMode() // Stoppe Auto-Modus komplett vor Navigation
      router.push('/einstellungen')
      break
  }
  
  // Nur bei lokalen Aktionen (nicht bei Navigation) Auto-Modus nach 10 Sekunden neu starten
  if (farbmodusId !== 'zurueck') {
    setTimeout(() => {
      isAutoModePaused.value = false
      startAutoMode()
    }, 10000)
  }
}

// Blink Detection
const handleBlink = () => {
  if (!faceRecognition.isBlinking()) return
  
  const now = Date.now()
  
  // Cooldown prüfen
  if (now - lastBlinkTime.value < blinkCooldown.value) {
    return
  }
  
  lastBlinkTime.value = now
  console.log('FarbmodusView Blink detected, selecting current item')
  
  const currentItem = farbmodusItems[currentTileIndex.value]
  speakText(currentItem.title)
  selectFarbmodus(currentItem.id)
}

// Right Click Handler
const handleRightClick = (event: MouseEvent) => {
  event.preventDefault()
  console.log('FarbmodusView Right click detected, selecting current item')
  
  const currentItem = farbmodusItems[currentTileIndex.value]
  speakText(currentItem.title)
  selectFarbmodus(currentItem.id)
}

// Blink Detection Parameter
const lastBlinkTime = ref(0)
// Blink Cooldown aus Settings (in Millisekunden)
const blinkCooldown = computed(() => settingsStore.settings.blinkSensitivity * 1000)

// Lifecycle
onMounted(() => {
  if (!faceRecognition.isActive.value) {
    faceRecognition.start()
  }
  
  // Resume Auto Mode if it was paused (e.g., returning from another page)
  if (isAutoModePaused.value) {
    resumeAutoMode()
  } else {
    // Start Auto Mode
    startAutoMode()
  }
  
  // Watch for blinks using the isBlinking function
  const blinkCheckInterval = setInterval(() => {
    handleBlink()
  }, 100) // Check every 100ms
  
  // Add right click listener
  document.addEventListener('contextmenu', handleRightClick)
})

onUnmounted(() => {
  document.removeEventListener('contextmenu', handleRightClick)
  stopAutoMode()
})
</script>

<template>
  <div id="app" :class="appClasses">
    <!-- Responsive Layout - automatischer Wechsel zwischen Mobile und Desktop -->
    <div class="min-h-screen bg-white">
      <!-- App Header -->
      <AppHeader />

      <!-- Main Content -->
      <main class="flex-1 flex flex-col items-center justify-center p-8">
        <!-- Title -->
        <div class="text-center mb-12">
          <h2 class="text-5xl font-bold text-gray-800">
            Wählen Sie den Farbmodus
          </h2>
          <p class="text-gray-600" style="font-size: 2rem;">
            Aktueller Modus: {{ settingsStore.settings.farbmodus || 'neutral' }}
          </p>
        </div>

        <!-- Abstandshalter -->
        <div class="h-24"></div>

        <!-- Keyboard Container -->
        <div 
          class="flex flex-wrap justify-center items-stretch"
          :style="{
            gap: '2rem',
            maxWidth: '1200px'
          }"
        >
          <!-- Farbmodus-Buttons -->
          <button
            v-for="(item, index) in farbmodusItems"
            :key="item.id"
            @click="selectFarbmodus(item.id)"
            class="transition-all duration-300 font-medium hover:scale-110 flex flex-col justify-center"
            :style="getKeyboardTileStyle(index, currentTileIndex, gridConfig)"
          >
            <div class="text-center">
              <div class="text-3xl font-bold mb-2">{{ item.title }}</div>
              <div class="text-xl text-gray-600 mb-2">{{ item.description }}</div>
              <!-- Farbvorschau -->
              <div 
                class="w-16 h-16 mx-auto rounded-full border-2 border-gray-300"
                :style="{ backgroundColor: item.color }"
              ></div>
            </div>
          </button>
        </div>

        <!-- Abstandshalter -->
        <div class="h-24"></div>

        <!-- Instructions -->
        <div class="mt-16 text-center">
          <div class="text-2xl text-gray-600">
            <p><strong>Bedienung:</strong></p>
            <p>Kurz blinzeln ({{ settingsStore.settings.blinkSensitivity }}s): Farbmodus auswählen</p>
            <p>Rechte Maustaste: Farbmodus auswählen</p>
            <p>Auto-Modus: Automatischer Durchlauf durch alle Farbmodi</p>
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
