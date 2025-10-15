<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../settings/stores/settings'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'
import { getAutoModeLeuchtdauer } from '../../../core/utils/leuchtdauerUtils'
import AppHeader from '../../../shared/components/AppHeader.vue'

// Router
const router = useRouter()

// Stores
const settingsStore = useSettingsStore()

// State
const currentTileIndex = ref(0)
const isAutoMode = ref(true)
const autoModeInterval = ref<number | null>(null)
const isAutoModePaused = ref(false)

// Blinzeldauer-Optionen (in Sekunden) - NACH SEKUNDEN SORTIERT
const blinzeldauerItems = [
  {
    id: 'sehr-kurz',
    title: 'Sehr kurz',
    description: '0,3 Sekunden',
    duration: 0.3
  },
  {
    id: 'kurz',
    title: 'Kurz',
    description: '0,5 Sekunden',
    duration: 0.5
  },
  {
    id: 'normal',
    title: 'Normal',
    description: '0,7 Sekunden',
    duration: 0.7
  },
  {
    id: 'lang',
    title: 'Lang',
    description: '0,9 Sekunden',
    duration: 0.9
  },
  {
    id: 'zurueck',
    title: 'Zurück',
    description: 'Zurück zu Einstellungen',
    duration: 0
  }
]

// Computed
const appClasses = computed(() => ({
  'dark': settingsStore.isDarkMode
}))

// Text-to-Speech Funktion - verwende SimpleFlowController
const speakText = async (text: string) => {
  console.log('BlinzeldauerView speakText called with:', text)
  await simpleFlowController.speak(text)
}

// Auto Mode Functions - verwende globalen Durchlauf-Algorithmus
const startAutoMode = () => {
  if (autoModeInterval.value) return
  
  // Prüfe, ob dieser View der aktive ist
  if (!simpleFlowController.isActiveView('/einstellungen/blinzeldauer')) {
    console.log('BlinzeldauerView: Not active view, skipping auto-mode start')
    return
  }
  
  // Stelle sicher, dass wir bei Index 0 starten
  currentTileIndex.value = 0
  
  const cycleTiles = async () => {
    if (!isAutoMode.value || isAutoModePaused.value) {
      return
    }
    
    // Prüfe erneut, ob dieser View noch aktiv ist
    if (!simpleFlowController.isActiveView('/einstellungen/blinzeldauer')) {
      console.log('BlinzeldauerView: Not active view, stopping auto-mode')
      return
    }
    
    currentTileIndex.value = (currentTileIndex.value + 1) % blinzeldauerItems.length
    
    // Spreche den aktuellen Menüpunkt vor
    const currentItem = blinzeldauerItems[currentTileIndex.value]
    await speakText(`${currentItem.title}, ${currentItem.description}`)
    
    autoModeInterval.value = window.setTimeout(cycleTiles, getAutoModeLeuchtdauer('BlinzeldauerView'))
  }
  
  // Spreche den ersten Menüpunkt vor
  const firstItem = blinzeldauerItems[currentTileIndex.value]
  speakText(`${firstItem.title}, ${firstItem.description}`)
  
  // Starte den ersten Zyklus nach der aktuellen Geschwindigkeit
  autoModeInterval.value = window.setTimeout(cycleTiles, getAutoModeLeuchtdauer('BlinzeldauerView'))
}

const pauseAutoMode = () => {
  isAutoModePaused.value = true
  if (autoModeInterval.value) {
    clearTimeout(autoModeInterval.value)
    autoModeInterval.value = null
  }
  simpleFlowController.stopTTS()
}

const resumeAutoMode = () => {
  isAutoModePaused.value = false
  if (!autoModeInterval.value) {
    // Starte den Auto-Modus bei der aktuellen Kachel
    const currentItem = blinzeldauerItems[currentTileIndex.value]
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
  simpleFlowController.stopTTS()
}

// Blinzeldauer-Auswahl
async function selectBlinzeldauer(blinzeldauerId: string) {
  console.log('selectBlinzeldauer called with blinzeldauerId:', blinzeldauerId)
  pauseAutoMode() // Pausiere Auto-Modus statt zu stoppen
  
  switch (blinzeldauerId) {
    case 'sehr-kurz':
      console.log('Sehr kurz selected')
      await speakText('Die Blinzeldauer wurde auf 0,3 Sekunden gesetzt.')
      settingsStore.updateSettings({ blinzeldauer: 0.3 })
      // Automatisch zurück zu Einstellungen
      setTimeout(() => {
        router.push('/einstellungen')
      }, 2000)
      break
    case 'kurz':
      console.log('Kurz selected')
      await speakText('Die Blinzeldauer wurde auf 0,5 Sekunden gesetzt.')
      settingsStore.updateSettings({ blinzeldauer: 0.5 })
      // Automatisch zurück zu Einstellungen
      setTimeout(() => {
        router.push('/einstellungen')
      }, 2000)
      break
    case 'normal':
      console.log('Normal selected')
      await speakText('Die Blinzeldauer wurde auf 0,7 Sekunden gesetzt.')
      settingsStore.updateSettings({ blinzeldauer: 0.7 })
      // Automatisch zurück zu Einstellungen
      setTimeout(() => {
        router.push('/einstellungen')
      }, 2000)
      break
    case 'lang':
      console.log('Lang selected')
      await speakText('Die Blinzeldauer wurde auf 0,9 Sekunden gesetzt.')
      settingsStore.updateSettings({ blinzeldauer: 0.9 })
      // Automatisch zurück zu Einstellungen
      setTimeout(() => {
        router.push('/einstellungen')
      }, 2000)
      break
    case 'zurueck':
      console.log('Zurück selected')
      await speakText('Zurück zu Einstellungen')
      stopAutoMode() // Stoppe Auto-Modus komplett vor Navigation
      router.push('/einstellungen')
      break
  }
  
  // Starte Auto-Modus nach 10 Sekunden neu
  setTimeout(() => {
    isAutoModePaused.value = false
    startAutoMode()
  }, 10000)
}

// Blink Detection - verwende globale Blinzel-Erkennung
const handleFaceBlink = async (event: any) => {
  console.log('BlinzeldauerView: Face blink received:', event.detail)
  
  const currentItem = blinzeldauerItems[currentTileIndex.value]
  await selectBlinzeldauer(currentItem.id)
}

// Right Click Handler
const handleRightClick = async (event: MouseEvent) => {
  event.preventDefault()
  console.log('BlinzeldauerView: Right click detected')
  
  const currentItem = blinzeldauerItems[currentTileIndex.value]
  await selectBlinzeldauer(currentItem.id)
}

// Lifecycle
onMounted(async () => {
  // Setze diesen View als aktiv
  simpleFlowController.setActiveView('/einstellungen/blinzeldauer')
  
  // Event Listener für globale Blinzel-Erkennung
  window.addEventListener('faceBlinkDetected', handleFaceBlink)
  
  // Add right click listener
  document.addEventListener('contextmenu', handleRightClick)
  
  // Warte auf echte User-Interaktion (Klick, Blinzel, etc.)
  const waitForUserInteraction = () => {
    console.log('BlinzeldauerView: Waiting for user interaction to enable TTS...')
    
    // Setze User-Interaktion beim ersten echten Event
    const enableTTS = () => {
      simpleFlowController.setUserInteracted(true)
      console.log('BlinzeldauerView: User interaction detected, TTS enabled')
      
      // Spreche Intro-TTS
      speakText('Wählen Sie im Folgenden eine Blinzeldauer aus.')
      
      // Warte 5 Sekunden nach Intro, dann starte Auto Mode
      setTimeout(() => {
        startAutoMode()
      }, 5000)
      
      // Entferne Event Listener
      document.removeEventListener('click', enableTTS)
      document.removeEventListener('touchstart', enableTTS)
      window.removeEventListener('faceBlinkDetected', enableTTS)
    }
    
    // Event Listener für User-Interaktion
    document.addEventListener('click', enableTTS)
    document.addEventListener('touchstart', enableTTS)
    window.addEventListener('faceBlinkDetected', enableTTS)
    
    // Fallback: Starte Auto-Mode ohne TTS nach 3 Sekunden
    setTimeout(() => {
      if (!simpleFlowController.userInteracted) {
        console.log('BlinzeldauerView: No user interaction detected, starting auto-mode without TTS')
        startAutoMode()
      }
    }, 3000)
  }
  
  // Starte User-Interaktion-Waiting
  waitForUserInteraction()
})

onUnmounted(() => {
  // Cleanup
  if (autoModeInterval.value) {
    clearTimeout(autoModeInterval.value)
  }
  
  // Entferne Event Listener
  window.removeEventListener('faceBlinkDetected', handleFaceBlink)
  document.removeEventListener('contextmenu', handleRightClick)
  
  // Stoppe Auto-Modus
  stopAutoMode()
})
</script>

<template>
  <div id="app" :class="appClasses">
    <div class="min-h-screen bg-white">
      <AppHeader />

      <!-- Main Content - Zentriert -->
      <main class="main-content">
        <!-- Title Section -->
        <div class="title-section">
          <h1 class="main-title">Wählen Sie im Folgenden eine Blinzeldauer aus.</h1>
          <p class="current-duration">
            Aktuelle Blinzeldauer: {{ settingsStore.settings.blinzeldauer || 0.7 }} Sekunden
          </p>
        </div>

        <!-- Options Grid -->
        <div class="options-grid">
          <button
            v-for="(item, index) in blinzeldauerItems"
            :key="item.id"
            @click="selectBlinzeldauer(item.id)"
            class="option-button"
            :class="{ 'active': index === currentTileIndex }"
          >
            <div class="option-content">
              <div class="option-title">{{ item.title }} – {{ item.description }}</div>
            </div>
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Dark Mode Support */
.dark {
  background-color: #1f2937;
  color: #f9fafb;
}

.dark .main-content {
  background-color: #1f2937;
}

.dark .main-title {
  color: #f9fafb;
}

.dark .current-duration {
  color: #d1d5db;
}

.dark .option-button {
  background: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}

.dark .option-button:hover {
  background: #4b5563;
  border-color: #60a5fa;
}

.dark .option-button.active {
  background: linear-gradient(135deg, #00B098, #00a085);
  border-color: #00B098;
  color: white;
}

/* Main Layout */
.main-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 80px); /* Abzug für Header */
  padding: 2rem;
  gap: 3rem;
}

/* Title Section */
.title-section {
  text-align: center;
  margin-bottom: 2rem;
}

.main-title {
  font-size: 3rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.current-duration {
  font-size: 1.5rem;
  color: #6b7280;
  margin: 0;
}

/* Options Grid */
.options-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* Immer 3 Spalten */
  gap: 1.8rem; /* 1.5rem * 1.20 = 1.8rem */
  max-width: 1200px; /* Feste Breite für 3 Spalten */
  width: 100%;
  justify-items: center;
  justify-content: center; /* Zentriert das Grid selbst */
  place-items: center; /* Zentriert sowohl horizontal als auch vertikal */
}

/* Option Buttons - 20% größer */
.option-button {
  width: 100%;
  max-width: 360px; /* 300px * 1.20 = 360px */
  min-height: 144px; /* 120px * 1.20 = 144px */
  padding: 1.8rem; /* 1.5rem * 1.20 = 1.8rem */
  border: 3px solid var(--border-primary);
  border-radius: 12px;
  background: var(--bg-primary);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.option-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  border-color: #3b82f6;
}

.option-button.active {
  border-color: #00B098;
  background: linear-gradient(135deg, #00B098, #00a085);
  color: white;
  transform: scale(1.05);
  box-shadow: 0 6px 12px rgba(0, 176, 152, 0.3);
}

.option-content {
  text-align: center;
  width: 100%;
}

.option-title {
  font-size: 1.8rem; /* 1.5rem * 1.20 = 1.8rem */
  font-weight: bold;
  margin-bottom: 0.5rem;
  line-height: 1.2;
}

/* Option description removed - now using combined title */

/* Responsive Design */
@media (max-width: 1024px) {
  .options-grid {
    grid-template-columns: repeat(2, 1fr); /* 2 Spalten auf Tablets */
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
    gap: 2rem;
  }
  
  .main-title {
    font-size: 2rem;
  }
  
  .current-duration {
    font-size: 1.2rem;
  }
  
  .options-grid {
    grid-template-columns: 1fr; /* 1 Spalte auf Mobile */
    gap: 1rem;
  }
  
  .option-button {
    max-width: 100%;
    min-height: 120px;
    padding: 1.5rem;
  }
  
  .option-title {
    font-size: 1.5rem;
  }
}

/* Animation für aktive Kachel */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 176, 152, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(0, 176, 152, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 176, 152, 0);
  }
}

.option-button.active {
  animation: pulse 2s infinite;
}
</style>