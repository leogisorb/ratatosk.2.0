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

// Leuchtdauer-Optionen (in Sekunden) - NACH SEKUNDEN SORTIERT
const leuchtdauerItems = [
  {
    id: 'normal',
    title: 'Normal',
    description: '3 Sekunden',
    duration: 3
  },
  {
    id: 'langsam',
    title: 'Langsam',
    description: '4 Sekunden',
    duration: 4
  },
  {
    id: 'sehr-langsam',
    title: 'Sehr langsam',
    description: '5 Sekunden',
    duration: 5
  },
  {
    id: 'lang',
    title: 'Lang',
    description: '6 Sekunden',
    duration: 6
  },
  {
    id: 'sehr-lang',
    title: 'Sehr lang',
    description: '7 Sekunden',
    duration: 7
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
  console.log('LeuchtDauerView speakText called with:', text)
  await simpleFlowController.speak(text)
}

// Auto Mode Functions - verwende globalen Durchlauf-Algorithmus
const startAutoMode = () => {
  if (autoModeInterval.value) return
  
  // Prüfe, ob dieser View der aktive ist
  if (!simpleFlowController.isActiveView('/einstellungen/leuchtdauer')) {
    console.log('LeuchtDauerView: Not active view, skipping auto-mode start')
    return
  }
  
  // Stelle sicher, dass wir bei Index 0 starten
  currentTileIndex.value = 0
  
  const cycleTiles = async () => {
    if (!isAutoMode.value || isAutoModePaused.value) {
      return
    }
    
    // Prüfe erneut, ob dieser View noch aktiv ist
    if (!simpleFlowController.isActiveView('/einstellungen/leuchtdauer')) {
      console.log('LeuchtDauerView: No longer active view, stopping auto-mode')
      stopAutoMode()
      return
    }
    
    currentTileIndex.value = (currentTileIndex.value + 1) % leuchtdauerItems.length
    
    // Spreche den aktuellen Menüpunkt vor
    const currentItem = leuchtdauerItems[currentTileIndex.value]
    await speakText(`${currentItem.title}, ${currentItem.description}`)
    
    autoModeInterval.value = window.setTimeout(cycleTiles, getAutoModeLeuchtdauer('LeuchtDauerView'))
  }
  
  // Spreche den ersten Menüpunkt vor
  const firstItem = leuchtdauerItems[currentTileIndex.value]
  speakText(`${firstItem.title}, ${firstItem.description}`)
  
  // Starte den ersten Zyklus nach der aktuellen Geschwindigkeit
  autoModeInterval.value = window.setTimeout(cycleTiles, getAutoModeLeuchtdauer('LeuchtDauerView'))
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
    const currentItem = leuchtdauerItems[currentTileIndex.value]
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

// Leuchtdauer-Auswahl
async function selectLeuchtdauer(leuchtdauerId: string) {
  console.log('selectLeuchtdauer called with leuchtdauerId:', leuchtdauerId)
  pauseAutoMode() // Pausiere Auto-Modus statt zu stoppen
  
  switch (leuchtdauerId) {
    case 'normal':
      console.log('Normal selected')
      await speakText('Die Leuchtdauer wurde auf 3 Sekunden gesetzt.')
      settingsStore.updateSettings({ leuchtdauer: 3 })
      // Automatisch zurück zu Einstellungen
      setTimeout(() => {
        router.push('/einstellungen')
      }, 2000)
      break
    case 'langsam':
      console.log('Langsam selected')
      await speakText('Die Leuchtdauer wurde auf 4 Sekunden gesetzt.')
      settingsStore.updateSettings({ leuchtdauer: 4 })
      // Automatisch zurück zu Einstellungen
      setTimeout(() => {
        router.push('/einstellungen')
      }, 2000)
      break
    case 'sehr-langsam':
      console.log('Sehr langsam selected')
      await speakText('Die Leuchtdauer wurde auf 5 Sekunden gesetzt.')
      settingsStore.updateSettings({ leuchtdauer: 5 })
      // Automatisch zurück zu Einstellungen
      setTimeout(() => {
        router.push('/einstellungen')
      }, 2000)
      break
    case 'lang':
      console.log('Lang selected')
      await speakText('Die Leuchtdauer wurde auf 6 Sekunden gesetzt.')
      settingsStore.updateSettings({ leuchtdauer: 6 })
      // Automatisch zurück zu Einstellungen
      setTimeout(() => {
        router.push('/einstellungen')
      }, 2000)
      break
    case 'sehr-lang':
      console.log('Sehr lang selected')
      await speakText('Die Leuchtdauer wurde auf 7 Sekunden gesetzt.')
      settingsStore.updateSettings({ leuchtdauer: 7 })
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
  console.log('LeuchtDauerView: Face blink received:', event.detail)
  
  const currentItem = leuchtdauerItems[currentTileIndex.value]
  await selectLeuchtdauer(currentItem.id)
}

// Right Click Handler
const handleRightClick = async (event: MouseEvent) => {
  event.preventDefault()
  console.log('LeuchtDauerView: Right click detected')
  
  const currentItem = leuchtdauerItems[currentTileIndex.value]
  await selectLeuchtdauer(currentItem.id)
}

// Lifecycle
onMounted(async () => {
  // Setze diesen View als aktiv
  simpleFlowController.setActiveView('/einstellungen/leuchtdauer')
  
  // Event Listener für globale Blinzel-Erkennung
  window.addEventListener('faceBlinkDetected', handleFaceBlink)
  
  // Add right click listener
  document.addEventListener('contextmenu', handleRightClick)
  
  // Warte auf echte User-Interaktion (Klick, Blinzel, etc.)
  const waitForUserInteraction = () => {
    console.log('LeuchtDauerView: Waiting for user interaction to enable TTS...')
    
    // Setze User-Interaktion beim ersten echten Event
    const enableTTS = () => {
      simpleFlowController.setUserInteracted(true)
      console.log('LeuchtDauerView: User interaction detected, TTS enabled')
      
      // Spreche Intro-TTS
      speakText('Wählen Sie im Folgenden eine Leuchtdauer aus.')
      
      // Warte 5 Sekunden nach Intro, dann starte Auto Mode
      setTimeout(() => {
        startAutoMode()
      }, 5000)
      
      // Entferne Event Listener
      document.removeEventListener('click', enableTTS)
      document.removeEventListener('touchstart', enableTTS)
      window.removeEventListener('faceBlinkDetected', enableTTS)
    }
    
    // Warte auf verschiedene User-Interaktionen
    document.addEventListener('click', enableTTS)
    document.addEventListener('touchstart', enableTTS)
    window.addEventListener('faceBlinkDetected', enableTTS)
    
    // Fallback: Starte Auto-Modus auch ohne TTS
    setTimeout(() => {
      if (!simpleFlowController.userInteracted) {
        console.log('LeuchtDauerView: No user interaction detected, starting auto-mode without TTS')
        startAutoMode()
      }
    }, 3000) // 3 Sekunden warten
  }
  
  // Warte auf User-Interaktion
  setTimeout(waitForUserInteraction, 100)
})

onUnmounted(() => {
  document.removeEventListener('contextmenu', handleRightClick)
  window.removeEventListener('faceBlinkDetected', handleFaceBlink)
  stopAutoMode()
})
</script>

<template>
  <div id="app" :class="appClasses">
    <div class="min-h-screen bg-white">
      <!-- App Header -->
      <AppHeader />

      <!-- Main Content - Zentriert -->
      <main class="main-content">
        <!-- Title Section -->
                <div class="title-section">
                  <h1 class="main-title">Wählen Sie im Folgenden eine Leuchtdauer aus.</h1>
                  <p class="current-duration">
                    Aktuelle Leuchtdauer: {{ settingsStore.settings.leuchtdauer || 3 }} Sekunden
                  </p>
                </div>

        <!-- Options Grid -->
        <div class="options-grid">
          <button
            v-for="(item, index) in leuchtdauerItems"
            :key="item.id"
            @click="selectLeuchtdauer(item.id)"
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
/* Main Layout - Zentriert */
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

/* Option Buttons */
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
    max-width: 800px;
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
    max-width: 400px;
  }
  
  .option-button {
    min-height: 115px; /* 100px * 1.15 = 115px */
    padding: 1.15rem; /* 1rem * 1.15 = 1.15rem */
  }
  
  .option-title {
    font-size: 1.495rem; /* 1.3rem * 1.15 = 1.495rem */
  }
  
  .option-description {
    font-size: 1.15rem; /* 1rem * 1.15 = 1.15rem */
  }
}

@media (max-width: 480px) {
  .main-title {
    font-size: 1.8rem;
  }
  
  .current-duration {
    font-size: 1.1rem;
  }
  
  .option-button {
    min-height: 103.5px; /* 90px * 1.15 = 103.5px */
    padding: 0.92rem; /* 0.8rem * 1.15 = 0.92rem */
  }
  
  .option-title {
    font-size: 1.38rem; /* 1.2rem * 1.15 = 1.38rem */
  }
  
  .option-description {
    font-size: 1.035rem; /* 0.9rem * 1.15 = 1.035rem */
  }
}

/* Dark Mode Support */
.dark .main-content {
  background: #1f2937;
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
  border-color: #60a5fa;
  background: #4b5563;
}

.dark .option-button.active {
  background: linear-gradient(135deg, #00B098, #00a085);
  border-color: #00B098;
}
</style>