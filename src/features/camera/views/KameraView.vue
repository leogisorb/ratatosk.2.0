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

// Kamera-Optionen
const kameraItems = [
  {
    id: 'ein',
    title: 'Ein',
    description: 'Kamera aktivieren',
    value: true
  },
  {
    id: 'aus',
    title: 'Aus',
    description: 'Kamera deaktivieren',
    value: false
  },
  {
    id: 'zurueck',
    title: 'Zurück',
    description: 'Zurück zu Einstellungen',
    value: null
  }
]

// Computed
const appClasses = computed(() => ({
  'dark': settingsStore.isDarkMode
}))

// Text-to-Speech Funktion - verwende SimpleFlowController
const speakText = async (text: string) => {
  console.log('KameraView speakText called with:', text)
  await simpleFlowController.speak(text)
}

// Auto Mode Functions - verwende globalen Durchlauf-Algorithmus
const startAutoMode = () => {
  if (autoModeInterval.value) return
  
  console.log('KameraView: Starting auto-mode')
  simpleFlowController.setActiveView('/einstellungen/kamera')
  
  const cycleTiles = async () => {
    if (!simpleFlowController.isActiveView('/einstellungen/kamera')) {
      console.log('KameraView: Not active view, skipping auto-mode cycle')
      return
    }
    
    const currentItem = kameraItems[currentTileIndex.value]
    console.log('KameraView: Auto-mode cycle:', currentItem.title, 'at index:', currentTileIndex.value)
    
    await speakText(`${currentItem.title}, ${currentItem.description}`)
    
    currentTileIndex.value = (currentTileIndex.value + 1) % kameraItems.length
    autoModeInterval.value = window.setTimeout(cycleTiles, getAutoModeLeuchtdauer('KameraView'))
  }
  
  // Starte mit dem ersten Item
  const firstItem = kameraItems[0]
  speakText(`${firstItem.title}, ${firstItem.description}`)
  
  // Starte den Zyklus
  autoModeInterval.value = window.setTimeout(cycleTiles, getAutoModeLeuchtdauer('KameraView'))
}

const pauseAutoMode = () => {
  if (autoModeInterval.value) {
    clearTimeout(autoModeInterval.value)
    autoModeInterval.value = null
    isAutoModePaused.value = true
  }
}

const stopAutoMode = () => {
  if (autoModeInterval.value) {
    clearTimeout(autoModeInterval.value)
    autoModeInterval.value = null
  }
  isAutoModePaused.value = false
  simpleFlowController.stopAutoMode()
}

// Selection Functions
const selectKamera = async (kameraId: string) => {
  const item = kameraItems.find(item => item.id === kameraId)
  if (!item) return
  
  stopAutoMode()
  
  if (item.id === 'ein') {
    settingsStore.updateSettings({ kameraAktiv: true })
    await speakText('Die Kamera wurde aktiviert.')
  } else if (item.id === 'aus') {
    settingsStore.updateSettings({ kameraAktiv: false })
    await speakText('Die Kamera wurde deaktiviert.')
  } else if (item.id === 'zurueck') {
    await speakText('Zurück zu Einstellungen')
    setTimeout(() => {
      router.push('/einstellungen')
    }, 2000)
    return
  }
  
  // Kurze Pause, dann zurück zu Einstellungen
  setTimeout(() => {
    router.push('/einstellungen')
  }, 2000)
}

// Event Handlers
const handleFaceBlink = async (event: any) => {
  console.log('KameraView: Face blink received:', event.detail)
  const currentItem = kameraItems[currentTileIndex.value]
  await selectKamera(currentItem.id)
}

const handleRightClick = (event: MouseEvent) => {
  event.preventDefault()
  console.log('KameraView: Right click detected')
  const currentItem = kameraItems[currentTileIndex.value]
  selectKamera(currentItem.id)
}

// Lifecycle
onMounted(async () => {
  console.log('KameraView: Mounted')
  simpleFlowController.setActiveView('/einstellungen/kamera')
  
  // Warte auf User-Interaktion für TTS
  const waitForUserInteraction = () => {
    return new Promise<void>((resolve) => {
      const handleInteraction = () => {
        console.log('KameraView: User interaction detected - TTS now enabled')
        simpleFlowController.setUserInteracted(true)
        document.removeEventListener('click', handleInteraction)
        document.removeEventListener('touchstart', handleInteraction)
        window.removeEventListener('faceBlinkDetected', handleInteraction)
        resolve()
      }
      
      document.addEventListener('click', handleInteraction)
      document.addEventListener('touchstart', handleInteraction)
      window.addEventListener('faceBlinkDetected', handleInteraction)
      
      // Fallback nach 3 Sekunden
      setTimeout(() => {
        console.log('KameraView: No user interaction detected, starting auto-mode without TTS')
        document.removeEventListener('click', handleInteraction)
        document.removeEventListener('touchstart', handleInteraction)
        window.removeEventListener('faceBlinkDetected', handleInteraction)
        resolve()
      }, 3000)
    })
  }
  
  await waitForUserInteraction()
  
  // Intro-TTS
  await speakText('Wählen Sie im Folgenden eine Kamera-Einstellung aus.')
  
  // Starte Auto-Modus nach kurzer Pause
  setTimeout(() => {
    startAutoMode()
  }, 2000)
  
  // Event Listeners
  window.addEventListener('faceBlinkDetected', handleFaceBlink)
  document.addEventListener('contextmenu', handleRightClick)
})

onUnmounted(() => {
  console.log('KameraView: Unmounted')
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
        <div class="title-section">
          <h1 class="main-title">Wählen Sie im Folgenden eine Kamera-Einstellung aus.</h1>
          <p class="current-duration">
            Aktuelle Kamera: {{ settingsStore.settings.kameraAktiv ? 'Aktiviert' : 'Deaktiviert' }}
          </p>
        </div>
        
        <div class="options-grid">
          <button
            v-for="(item, index) in kameraItems"
            :key="item.id"
            @click="selectKamera(item.id)"
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
/* App Container */
#app {
  min-height: 100vh;
  transition: background-color 0.3s ease;
}

#app.dark {
  background-color: #1a1a1a;
}

/* Main Content */
.main-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 80px);
  padding: 2rem;
  gap: 3rem;
}

/* Title Section */
.title-section {
  text-align: center;
  max-width: 800px;
}

.main-title {
  font-size: 2.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.current-duration {
  font-size: 1.25rem;
  color: #6b7280;
  margin: 0;
}

/* Options Grid */
.options-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  max-width: 1200px;
  width: 100%;
  place-items: center;
  justify-content: center;
}

/* Option Button */
.option-button {
  width: 100%;
  max-width: 350px;
  min-height: 120px;
  padding: 2rem;
  border: 3px solid var(--border-primary);
  border-radius: 16px;
  background: var(--bg-primary);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.option-button:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
}

.option-button.active {
  border-color: #3b82f6;
  background: #eff6ff;
  transform: scale(1.05);
  box-shadow: 0 10px 25px -3px rgba(59, 130, 246, 0.3);
}

.option-content {
  text-align: center;
  width: 100%;
}

.option-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.3;
}

/* Dark Mode */
#app.dark .main-title {
  color: #f9fafb;
}

#app.dark .current-duration {
  color: #9ca3af;
}

#app.dark .option-button {
  background: #374151;
  border-color: #4b5563;
}

#app.dark .option-button:hover {
  border-color: #60a5fa;
  background: #4b5563;
}

#app.dark .option-button.active {
  border-color: #60a5fa;
  background: #1e3a8a;
}

#app.dark .option-title {
  color: #f9fafb;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .options-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
  
  .main-title {
    font-size: 2rem;
  }
  
  .option-button {
    max-width: 300px;
    min-height: 100px;
    padding: 1.5rem;
  }
  
  .option-title {
    font-size: 1.25rem;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
    gap: 2rem;
  }
  
  .options-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .main-title {
    font-size: 1.75rem;
  }
  
  .current-duration {
    font-size: 1rem;
  }
  
  .option-button {
    max-width: 100%;
    min-height: 80px;
    padding: 1rem;
  }
  
  .option-title {
    font-size: 1.125rem;
  }
}
</style>