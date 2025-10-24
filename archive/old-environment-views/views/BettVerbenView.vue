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
const selectedBettItem = ref('')
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

// Bett-Verben-Items mit passenden Emojis (15 Verben + Zurück = 16 total)
const bettVerbenItems = [
  { id: 'wechseln', text: 'wechseln', type: 'verb', emoji: '🔄' },
  { id: 'waschen', text: 'waschen', type: 'verb', emoji: '🧽' },
  { id: 'bringen', text: 'bringen', type: 'verb', emoji: '📦' },
  { id: 'holen', text: 'holen', type: 'verb', emoji: '🏃' },
  { id: 'benutzen', text: 'benutzen', type: 'verb', emoji: '👆' },
  { id: 'einstellen', text: 'einstellen', type: 'verb', emoji: '⚙️' },
  { id: 'anreichen', text: 'anreichen', type: 'verb', emoji: '🤲' },
  { id: 'auflegen', text: 'auflegen', type: 'verb', emoji: '⬆️' },
  { id: 'zurechtlegen', text: 'zurechtlegen', type: 'verb', emoji: '📐' },
  { id: 'aufdecken', text: 'aufdecken', type: 'verb', emoji: '🔓' },
  { id: 'zudecken', text: 'zudecken', type: 'verb', emoji: '🛌' },
  { id: 'tauschen', text: 'tauschen', type: 'verb', emoji: '🔄' },
  { id: 'bereitlegen', text: 'bereitlegen', type: 'verb', emoji: '📋' },
  { id: 'reinigen', text: 'reinigen', type: 'verb', emoji: '✨' },
  { id: 'verwenden', text: 'verwenden', type: 'verb', emoji: '🔧' },
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
  
  // Erst den Titel vorlesen
  setTimeout(() => {
    speakText(`Was soll mit ${selectedBettItem.value} gemacht werden?`)
  }, 1000)
  
  const cycleTiles = () => {
    if (!isAutoMode.value || isAutoModePaused.value) {
      return
    }
    currentTileIndex.value = (currentTileIndex.value + 1) % bettVerbenItems.length
    const currentItem = bettVerbenItems[currentTileIndex.value]
    speakText(currentItem.text)
    autoModeInterval.value = window.setTimeout(cycleTiles, 3000) // 3 Sekunden
  }
  
  // Starte den Auto-Mode nach 4 Sekunden (1s für Titel + 3s Pause)
  setTimeout(() => {
    const firstItem = bettVerbenItems[currentTileIndex.value]
    speakText(firstItem.text)
    
    autoModeInterval.value = window.setTimeout(cycleTiles, 3000)
  }, 4000)
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
  
  const selectedItem = bettVerbenItems.find(item => item.id === verbId)
  if (selectedItem) {
    selectedVerb.value = selectedItem.text
  }
  
  switch (verbId) {
    case 'zurück':
      router.push('/bett')
      break
    default:
      // "Bitte [Item] [Verb]" anzeigen und vorlesen
      const pleaseText = `Bitte ${selectedBettItem.value} ${selectedItem?.text}`
      setTimeout(() => {
        speakText(pleaseText)
      }, 1000)
      
      // Nach 4 Sekunden zurück zum Bett-View
      restartTimeout.value = window.setTimeout(() => {
        router.push('/bett')
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
    
    if (closedFrames.value >= blinkThreshold.value && !eyesClosed.value) {
      const currentItem = bettVerbenItems[currentTileIndex.value]
      
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
  event.stopPropagation()
  event.stopImmediatePropagation()
  console.log('BettVerbenView: Right click detected! Current tile index:', currentTileIndex.value, 'Items length:', bettVerbenItems.length)
  const currentItem = bettVerbenItems[currentTileIndex.value]
  if (currentItem) {
    console.log('BettVerbenView: Right click activation for item:', currentItem.text)
    speakText(currentItem.text)
    selectVerb(currentItem.id)
  } else {
    console.log('BettVerbenView: No current item found for right click')
  }
  return false
}

// Lifecycle
onMounted(() => {
  // Hole den Bett-Gegenstand aus der Route und konvertiere Umlaute
  const itemId = route.params.bettItem as string || 'Bett-Item'
  
  // Konvertiere URL-Parameter zu korrekten deutschen Umlauten
  const umlautMap: { [key: string]: string } = {
    'decke': 'Decke',
    'kissen': 'Kissen',
    'bettlaken': 'Bettlaken',
    'bettzeug': 'Bettzeug',
    'matratze': 'Matratze'
  }
  
  selectedBettItem.value = umlautMap[itemId] || itemId
  
  if (!faceRecognition.isActive.value) {
    faceRecognition.start()
  }
  
  startAutoMode()
  
  const blinkCheckInterval = setInterval(() => {
    handleFaceBlink()
  }, 100)
  
  console.log('BettVerbenView: Registering right-click handler')
  document.addEventListener('contextmenu', handleRightClick, { capture: true, passive: false })
})

onUnmounted(() => {
  document.removeEventListener('contextmenu', handleRightClick, { capture: true })
  stopAutoMode()
})
</script>

<template>
  <div class="bett-verben-app">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content - Zentriert -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- Titel Anzeige -->
        <div class="selected-item-container">
          <div class="selected-item-text" style="font-size: 3.43rem; font-family: 'Source Code Pro', monospace; font-weight: 500;">
            Was soll mit {{ selectedBettItem }} gemacht werden?
          </div>
        </div>
        
        <!-- Ausgewählte Kombination Anzeige -->
        <div v-if="selectedVerb" class="selected-combination-container">
          <div class="selected-combination-text" style="font-size: 2.5rem; font-family: 'Source Code Pro', monospace; font-weight: 500; color: #f97316;">
            Bitte {{ selectedBettItem }} {{ selectedVerb }}
          </div>
        </div>

        <!-- Bett-Verben-Items Grid - 4x4 Grid für 16 Items -->
        <div class="bett-verben-items-grid">
          <button
            v-for="(item, index) in bettVerbenItems"
            :key="item.id"
            @click="selectVerb(item.id)"
            class="bett-verben-items-item"
            :class="currentTileIndex === index ? 'active' : 'inactive'"
          >
            <div v-if="item.emoji" class="bett-verben-items-emoji">{{ item.emoji }}</div>
            <span class="bett-verben-items-text">{{ item.text }}</span>
          </button>
        </div>

      </div>
    </main>
  </div>
</template>

<style scoped>
@import './BettVerbenView.css';
</style>
