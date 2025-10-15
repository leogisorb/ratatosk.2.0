<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'
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
const selectedGegenstand = ref('')
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

// Gegenstände-Verben-Items mit passenden Emojis (max 10 Verben + Zurück = 11 total = 2x5 Grid)
const gegenstaendeVerbenItems = [
  { id: 'benutzen', text: 'benutzen', type: 'verb', emoji: '👆' },
  { id: 'halten', text: 'halten', type: 'verb', emoji: '🤏' },
  { id: 'legen', text: 'legen', type: 'verb', emoji: '📦' },
  { id: 'nehmen', text: 'nehmen', type: 'verb', emoji: '✋' },
  { id: 'geben', text: 'geben', type: 'verb', emoji: '🤲' },
  { id: 'aufheben', text: 'aufheben', type: 'verb', emoji: '⬆️' },
  { id: 'reinigen', text: 'reinigen', type: 'verb', emoji: '🧼' },
  { id: 'weglegen', text: 'weglegen', type: 'verb', emoji: '📦' },
  { id: 'finden', text: 'finden', type: 'verb', emoji: '🔍' },
  { id: 'bringen', text: 'bringen', type: 'verb', emoji: '📦' },
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
    speakText(`Was soll mit ${selectedGegenstand.value} gemacht werden?`)
    // Starte Auto-Mode nach 4 Sekunden (für vollständiges Vorlesen des Titels)
    setTimeout(() => {
      const firstItem = gegenstaendeVerbenItems[currentTileIndex.value]
      speakText(firstItem.text)
      autoModeInterval.value = window.setTimeout(cycleTiles, 3000)
    }, 4000)
  }, 1000)
  
  const cycleTiles = () => {
    if (!isAutoMode.value || isAutoModePaused.value) {
      return
    }
    currentTileIndex.value = (currentTileIndex.value + 1) % gegenstaendeVerbenItems.length
    const currentItem = gegenstaendeVerbenItems[currentTileIndex.value]
    speakText(currentItem.text)
    autoModeInterval.value = window.setTimeout(cycleTiles, 3000) // 3 Sekunden
  }
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
  
  const selectedItem = gegenstaendeVerbenItems.find(item => item.id === verbId)
  if (selectedItem) {
    selectedVerb.value = selectedItem.text
  }
  
  switch (verbId) {
    case 'zurück':
      router.push('/gegenstaende')
      break
    default:
      // "Bitte [Item] [Verb]" anzeigen und vorlesen
      const pleaseText = `Bitte ${selectedGegenstand.value} ${selectedItem?.text}`
      setTimeout(() => {
        speakText(pleaseText)
      }, 1000)
      
      // Nach 4 Sekunden zurück zum Gegenstände-View
      restartTimeout.value = window.setTimeout(() => {
        router.push('/gegenstaende')
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
      const currentItem = gegenstaendeVerbenItems[currentTileIndex.value]
      
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
  const currentItem = gegenstaendeVerbenItems[currentTileIndex.value]
  
  speakText(currentItem.text)
  selectVerb(currentItem.id)
}

// Lifecycle
onMounted(() => {
  // Hole den Gegenstand aus der Route und konvertiere Umlaute
  const itemId = route.params.gegenstand as string || 'Gegenstand'
  
  // Konvertiere URL-Parameter zu korrekten deutschen Umlauten
  const umlautMap: { [key: string]: string } = {
    'handy': 'Handy',
    'glas': 'Glas',
    'brille': 'Brille',
    'stift': 'Stift',
    'papier': 'Papier',
    'lineal': 'Lineal',
    'teller': 'Teller',
    'besteck': 'Besteck',
    'tisch': 'Tisch'
  }
  
  selectedGegenstand.value = umlautMap[itemId] || itemId
  
  if (!faceRecognition.isActive.value) {
    faceRecognition.start()
  }
  
  // Erst den Titel vorlesen
  setTimeout(() => {
    speakText(`Was soll mit ${selectedGegenstand.value} gemacht werden?`)
  }, 1000)
  
  // Starte den Auto-Mode nach 4 Sekunden (1s für Titel + 3s Pause)
  setTimeout(() => {
    startAutoMode()
  }, 4000)
  
  const blinkCheckInterval = setInterval(() => {
    handleFaceBlink()
  }, 100)
  
  document.addEventListener('contextmenu', handleRightClick)
})

onUnmounted(() => {
  document.removeEventListener('contextmenu', handleRightClick)
  stopAutoMode()
})
</script>

<template>
  <div class="gegenstaende-verben-app">
    <!-- App Header -->
    <AppHeader />

    <!-- Main Content - Zentriert -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- Ausgewähltes Verb-Item Anzeige -->
        <div class="selected-item-container">
          <div class="selected-item-text" style="font-size: 3.43rem; font-family: 'Source Code Pro', monospace; font-weight: 500;">
            Was soll mit {{ selectedGegenstand }} gemacht werden?
          </div>
        </div>
        
        <!-- Ausgewählte Kombination Anzeige -->
        <div v-if="selectedVerb" class="selected-combination-container">
          <div class="selected-combination-text" style="font-size: 2.5rem; font-family: 'Source Code Pro', monospace; font-weight: 500; color: #f97316;">
            Bitte {{ selectedGegenstand }} {{ selectedVerb }}
          </div>
        </div>

        <!-- Gegenstände-Verben-Items Grid - 2x5 Grid für 10 Items -->
        <div class="gegenstaende-verben-items-grid">
          <button
            v-for="(item, index) in gegenstaendeVerbenItems"
            :key="item.id"
            @click="selectVerb(item.id)"
            class="gegenstaende-verben-items-item"
            :class="currentTileIndex === index ? 'active' : 'inactive'"
          >
            <div v-if="item.emoji" class="gegenstaende-verben-items-emoji">{{ item.emoji }}</div>
            <span class="gegenstaende-verben-items-text">{{ item.text }}</span>
          </button>
        </div>

      </div>
    </main>
  </div>
</template>

<style scoped>
/* GegenstaendeVerbenView - Komplett neu geschriebenes CSS nach ZimmerView-Vorbild */

/* App Container */
.gegenstaende-verben-app {
  min-height: 100vh;
  background-color: var(--bg-primary);
  display: flex;
  flex-direction: column;
}

/* Main Content - Weniger Abstand unter Header */
.main-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 4rem; /* Weniger Abstand oben/unten: 4rem → 1rem */
}

.content-wrapper {
  max-width: 8xl;
  margin: 0 auto;
  width: 100%;
}

/* Ausgewähltes Item Anzeige - Nochmal 5% weiter hoch */
.selected-item-container {
  margin-bottom: 0.43rem; /* 5% weniger: 0.45rem * 0.95 = 0.43rem */
  margin-top: -0.58rem; /* 5% mehr negativer Abstand: -0.55rem * 1.05 = -0.58rem */
  text-align: center;
}

.selected-item-title {
  font-size: 3.75rem; /* 25% kleiner: 5rem * 0.75 = 3.75rem */
  font-weight: bold;
  color: #374151;
  font-family: 'Source Code Pro', monospace;
  font-weight: 300;
  margin-bottom: 1rem;
}

.selected-item-text {
  font-size: 4.06rem; /* 75% größer: 2.32rem * 1.75 = 4.06rem */
  font-weight: bold;
  color: #1f2937;
  font-family: 'Source Code Pro', monospace;
  font-weight: 300;
}

/* Spacer */
.spacer {
  height: 4rem;
}

/* Gegenstände-Verben-Items Grid - 2x5 Grid für 10 Items */
.gegenstaende-verben-items-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2rem;
  justify-items: center;
  align-items: center;
  margin: 0 0 0.43rem 0; /* 5% weniger: 0.45rem * 0.95 = 0.43rem */
}

/* Gegenstände-Verben-Items Item Buttons - Alle gleich groß */
.gegenstaende-verben-items-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem; /* Noch weniger Abstand unter Emoji */
  padding: 1.5rem;
  border: 2px solid var(--border-secondary);
  border-radius: 15px;
  background: var(--bg-primary);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 2.145rem; /* 30% größer: 1.65rem * 1.3 = 2.145rem */
  font-weight: 500;
  width: 304px; /* 30% größer: 234px * 1.3 = 304px */
  height: 156px; /* 30% größer: 120px * 1.3 = 156px */
  outline: none;
  box-shadow: none;
  margin: 0;
}

.gegenstaende-verben-items-item:hover {
  transform: scale(1.1);
  color: #6b7280;
}

.gegenstaende-verben-items-item.active {
  background: #f3f4f6;
  color: #f97316;
  transform: scale(1.1);
}

.gegenstaende-verben-items-item.inactive {
  color: black;
}

.gegenstaende-verben-items-emoji {
  font-size: 4rem;
}

.gegenstaende-verben-items-text {
  font-family: 'Source Code Pro', monospace;
}

/* Instructions - Nochmal 5% weiter hoch */
.instructions-container {
  margin-top: -0.15rem; /* 5% mehr negativer Abstand: -0.1rem * 1.5 = -0.15rem */
  text-align: center;
}

.instructions-title {
  font-size: 2.5rem;
  font-weight: 600;
  color: #374151;
  font-family: 'Source Code Pro', monospace;
  font-weight: 300;
  margin-bottom: 0.25rem; /* Weniger Abstand zum Text darunter */
}

.instructions-text {
  font-size: 1.5rem;
  color: #1f2937;
  font-family: 'Source Code Pro', monospace;
  font-weight: 300;
  line-height: 1.6;
}

.instructions-text strong {
  font-weight: bold;
}

/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Dark mode scrollbar */
.dark .overflow-y-auto::-webkit-scrollbar-track {
  background: #374151;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: #6b7280;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Responsive Design - 30% größer angepasst */
@media (max-width: 768px) {
  .main-content {
    padding: 0.5rem 2rem; /* Weniger Abstand oben/unten: 2rem → 0.5rem */
  }
  
  .gegenstaende-verben-items-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }
  
  .gegenstaende-verben-items-item {
    padding: 1rem;
    font-size: 1.35rem;
    width: 195px;
    height: 100px;
  }
  
  .gegenstaende-verben-items-emoji {
    font-size: 3rem;
  }
  
  .selected-item-title {
    font-size: 2.25rem; /* 25% kleiner: 3rem * 0.75 = 2.25rem */
  }
  
  .selected-item-text {
    font-size: 3.26rem; /* 75% größer: 1.86rem * 1.75 = 3.26rem */
  }
  
  .instructions-title {
    font-size: 2rem;
  }
  
  .instructions-text {
    font-size: 1.2rem;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 0.25rem 1rem; /* Weniger Abstand oben/unten: 1rem → 0.25rem */
  }
  
  .gegenstaende-verben-items-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .gegenstaende-verben-items-item {
    padding: 0.75rem;
    font-size: 1.125rem;
    width: 156px;
    height: 80px;
  }
  
  .gegenstaende-verben-items-emoji {
    font-size: 2.5rem;
  }
  
  .selected-item-title {
    font-size: 1.875rem; /* 25% kleiner: 2.5rem * 0.75 = 1.875rem */
  }
  
  .selected-item-text {
    font-size: 2.43rem; /* 75% größer: 1.39rem * 1.75 = 2.43rem */
  }
  
  .selected-combination-text {
    font-size: 1.75rem; /* 30% kleiner: 2.5rem * 0.7 = 1.75rem */
  }
}

/* Ausgewählte Kombination Anzeige */
.selected-combination-container {
  margin-bottom: 1rem;
  text-align: center;
}

.selected-combination-text {
  font-size: 2.5rem;
  font-weight: 500;
  color: #f97316;
  margin: 0;
  line-height: 1.2;
}
</style>
