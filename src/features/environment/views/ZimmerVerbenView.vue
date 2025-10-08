<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'
import { keyboardGridConfig, getKeyboardTileStyle } from '../../../config/gridConfig'
import AppHeader from '../../../shared/components/AppHeader.vue'

// Router
const router = useRouter()
const route = useRoute()

// Stores
const settingsStore = useSettingsStore()

// Face Recognition
const faceRecognition = useFaceRecognition()

// State
const currentTileIndex = ref(0)
const selectedVerb = ref('')
const selectedZimmerItem = ref('')
const isAutoMode = ref(true)
const autoModeInterval = ref<number | null>(null)
const closedFrames = ref(0)
const eyesClosed = ref(false)
const isAutoModePaused = ref(false)
const restartTimeout = ref<number | null>(null)

// Verbesserte Blink-Detection Parameter - zentral gesteuert
const blinkThreshold = computed(() => Math.ceil(settingsStore.settings.blinkSensitivity * 10)) // Konvertiere Sekunden zu Frames (10 FPS)
const lastBlinkTime = ref(0)
const blinkCooldown = computed(() => settingsStore.settings.blinkSensitivity * 1000)

// Text-to-Speech
const speechSynthesis = window.speechSynthesis
const isTTSEnabled = ref(true)

// Verwende die Keyboard-Grid-Konfiguration
const gridConfig = keyboardGridConfig

// Zimmer-Verben-Items mit passenden Emojis (max 11 Verben + Zurück = 12 total = 3 Zeilen à 4)
const zimmerVerbenItems = [
  { id: 'öffnen', text: 'öffnen', type: 'verb', emoji: '🔓' },
  { id: 'schließen', text: 'schließen', type: 'verb', emoji: '🔒' },
  { id: 'anmachen', text: 'anmachen', type: 'verb', emoji: '🔛' },
  { id: 'ausmachen', text: 'ausmachen', type: 'verb', emoji: '🔴' },
  { id: 'aufstehen', text: 'aufstehen', type: 'verb', emoji: '⬆️' },
  { id: 'hinsetzen', text: 'hinsetzen', type: 'verb', emoji: '🪑' },
  { id: 'hinlegen', text: 'hinlegen', type: 'verb', emoji: '🛏️' },
  { id: 'liegen', text: 'liegen', type: 'verb', emoji: '🛌' },
  { id: 'sitzen', text: 'sitzen', type: 'verb', emoji: '🪑' },
  { id: 'sehen', text: 'sehen', type: 'verb', emoji: '👁️' },
  { id: 'benutzen', text: 'benutzen', type: 'verb', emoji: '👆' },
  { id: 'zurück', text: 'zurück', type: 'navigation', emoji: '⬅️' }
]

// Text-to-Speech Funktion
const speakText = (text: string) => {
  if (!isTTSEnabled.value || !speechSynthesis) return
  
  speechSynthesis.cancel()
  
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'de-DE'
  utterance.rate = 0.8
  utterance.pitch = 1.0
  utterance.volume = 1.0
  
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

// Auto Mode Funktionen
const startAutoMode = () => {
  if (autoModeInterval.value) return
  
  currentTileIndex.value = 0
  
  const cycleTiles = () => {
    if (!isAutoMode.value || isAutoModePaused.value) {
      return
    }
    currentTileIndex.value = (currentTileIndex.value + 1) % zimmerVerbenItems.length
    const currentItem = zimmerVerbenItems[currentTileIndex.value]
    speakText(currentItem.text)
    autoModeInterval.value = window.setTimeout(cycleTiles, 3000) // 3 Sekunden
  }
  
  const firstItem = zimmerVerbenItems[currentTileIndex.value]
  speakText(firstItem.text)
  
  autoModeInterval.value = window.setTimeout(cycleTiles, 3000)
}

const pauseAutoMode = () => {
  isAutoModePaused.value = true
  if (autoModeInterval.value) {
    clearTimeout(autoModeInterval.value)
    autoModeInterval.value = null
  }
  if (restartTimeout.value) {
    clearTimeout(restartTimeout.value)
    restartTimeout.value = null
  }
  speechSynthesis.cancel()
}

const stopAutoMode = () => {
  if (autoModeInterval.value) {
    clearTimeout(autoModeInterval.value)
    autoModeInterval.value = null
  }
  if (restartTimeout.value) {
    clearTimeout(restartTimeout.value)
    restartTimeout.value = null
  }
  speechSynthesis.cancel()
}

// Verb-Auswahl
function selectVerb(verbId: string) {
  pauseAutoMode()
  
  const selectedItem = zimmerVerbenItems.find(item => item.id === verbId)
  if (selectedItem) {
    selectedVerb.value = selectedItem.text
  }
  
  switch (verbId) {
    case 'zurück':
      router.push('/zimmer')
      break
    default:
      speakText(`${selectedItem?.text} ausgewählt`)
      
      // Kombination anzeigen
      const combination = `${selectedZimmerItem.value} ${selectedItem?.text}`
      speakText(`Kombination: ${combination}`)
      
      // Nach 3 Sekunden zurück zum Zimmer-View
      restartTimeout.value = window.setTimeout(() => {
        router.push('/zimmer')
      }, 3000)
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
      const currentItem = zimmerVerbenItems[currentTileIndex.value]
      
      speakText(currentItem.text)
      selectVerb(currentItem.id)
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
  const currentItem = zimmerVerbenItems[currentTileIndex.value]
  
  speakText(currentItem.text)
  selectVerb(currentItem.id)
}

// Lifecycle
onMounted(() => {
  // Hole den Zimmer-Gegenstand aus der Route und konvertiere Umlaute
  const itemId = route.params.zimmerItem as string || 'Zimmer-Item'
  
  // Konvertiere URL-Parameter zu korrekten deutschen Umlauten
  const umlautMap: { [key: string]: string } = {
    'tuer': 'Tür',
    'fenster': 'Fenster',
    'licht': 'Licht',
    'bett': 'Bett',
    'tisch': 'Tisch',
    'stuhl': 'Stuhl',
    'fernseher': 'Fernseher',
    'vorhang': 'Vorhang',
    'schrank': 'Schrank'
  }
  
  selectedZimmerItem.value = umlautMap[itemId] || itemId
  
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
})
</script>

<template>
  <div class="zimmer-verben-app">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content - Zentriert -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- Ausgewähltes Verb-Item Anzeige -->
        <div class="selected-item-container">
          <div class="selected-item-text">
            {{ selectedZimmerItem }}{{ selectedVerb ? ' ' + selectedVerb : '' }}
          </div>
        </div>

        <!-- Zimmer-Verben-Items Grid - 2x5 Grid für 10 Items -->
        <div class="zimmer-verben-items-grid">
          <button
            v-for="(item, index) in zimmerVerbenItems"
            :key="item.id"
            @click="selectVerb(item.id)"
            class="zimmer-verben-items-item"
            :class="currentTileIndex === index ? 'active' : 'inactive'"
          >
            <div v-if="item.emoji" class="zimmer-verben-items-emoji">{{ item.emoji }}</div>
            <span class="zimmer-verben-items-text">{{ item.text }}</span>
          </button>
        </div>

        <!-- Instructions -->
        <div class="instructions-container">
          <h3 class="instructions-title">Bedienung</h3>
          <p class="instructions-text">
            <strong>Kurz blinzeln ({{ settingsStore.settings.blinkSensitivity }}s):</strong> Verb auswählen<br>
            <strong>Rechte Maustaste:</strong> Verb auswählen<br>
            <strong>Auto-Modus:</strong> Automatischer Durchlauf durch alle Items
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import './ZimmerVerbenView.css';
</style>
