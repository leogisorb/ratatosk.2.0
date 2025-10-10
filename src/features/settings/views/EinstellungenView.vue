<template>
  <div class="einstellungen-view">
    <AppHeader />
    
    <div class="main-content">
      <div class="grid-container">
        <!-- Einstellungs-Items Grid -->
        <div 
          v-for="(item, index) in einstellungsItems" 
          :key="item.id"
          class="menu-tile"
          :class="{ 
            'tile-active': currentTileIndex === index,
            'tile-inactive': currentTileIndex !== index 
          }"
          @click="selectEinstellung(item.id)"
        >
          <div class="tile-icon-container">
            <img :src="`/ratatosk.2.0/${item.icon}`" :alt="item.title" class="tile-icon" />
          </div>
          <div class="tile-text">{{ item.title }}</div>
        </div>
      </div>
      
      <!-- Bedienungshinweise -->
      <div class="instructions-container">
        <h3>Bedienung</h3>
        <p>Kurz blinzeln (0.7s): Auswahl bestätigen</p>
        <p>Rechte Maustaste: Auswahl bestätigen</p>
        <p>Auto-Modus: Automatischer Durchlauf durch alle Optionen</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settings'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
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
const closedFrames = ref(0)
const eyesClosed = ref(false)
const isAutoModePaused = ref(false)
const restartTimeout = ref<number | null>(null)

// Verbesserte Blink-Detection Parameter - zentral gesteuert
const blinkThreshold = computed(() => Math.ceil(settingsStore.settings.blinkSensitivity * 10)) // Konvertiere Sekunden zu Frames (10 FPS)
const lastBlinkTime = ref(0)
const blinkCooldown = computed(() => settingsStore.settings.blinkSensitivity * 1000)

// TTS removed

// Einstellungs-Items
const einstellungsItems = [
  { id: 'tastatur-design', title: 'Tastatur-Design', icon: 'settings-sliders.svg' },
  { id: 'leucht-dauer', title: 'Leucht-Dauer', icon: 'settings-sliders.svg' },
  { id: 'blinzeldauer', title: 'Blinzeldauer', icon: 'settings-sliders.svg' },
  { id: 'farbmodus', title: 'Farbmodus', icon: 'settings-sliders.svg' },
  { id: 'kamera', title: 'Kamera', icon: 'camera.svg' },
  { id: 'impressum', title: 'Impressum', icon: 'settings-sliders.svg' },
  { id: 'zurueck', title: 'Zurück', icon: 'zurueck.svg' }
]

// Auto Mode Funktionen
const startAutoMode = () => {
  if (autoModeInterval.value) return
  
  console.log('Starting auto-mode with', einstellungsItems.length, 'items')

  const cycleTiles = () => {
    if (!isAutoMode.value || isAutoModePaused.value) {
      return
    }
    currentTileIndex.value = (currentTileIndex.value + 1) % einstellungsItems.length
    const currentItem = einstellungsItems[currentTileIndex.value]
    console.log('Current item:', currentItem.title, '- TTS removed')
    autoModeInterval.value = window.setTimeout(cycleTiles, 3000) // 3 Sekunden
  }
  
  const firstItem = einstellungsItems[currentTileIndex.value]
  console.log('First item:', firstItem.title, '- TTS removed')
  
  // Starte den ersten Zyklus nach 3 Sekunden
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
  // TTS removed
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
  // TTS removed
}

const resumeAutoMode = () => {
  if (isAutoModePaused.value) {
    isAutoModePaused.value = false
    // Starte den Auto-Modus bei der aktuellen Kachel
    const currentItem = einstellungsItems[currentTileIndex.value]
    console.log('Resuming auto-mode with item:', currentItem.title, '- TTS removed')
    startAutoMode()
  }
}

// Einstellung Auswahl
const selectEinstellung = (einstellungId: string) => {
  const selectedItem = einstellungsItems.find(item => item.id === einstellungId)
  
  switch (einstellungId) {
    case 'tastatur-design':
      console.log('Tastatur-Design selected')
      console.log('Tastatur-Design ausgewählt - TTS removed')
      // Hier könnte eine Tastatur-Design-Seite geöffnet werden
      break
    case 'leucht-dauer':
      console.log('Leucht-Dauer selected')
      console.log('Leucht-Dauer ausgewählt - TTS removed')
      stopAutoMode() // Stoppe Auto-Modus komplett vor Navigation
      router.push('/leucht-dauer')
      break
    case 'blinzeldauer':
      console.log('Blinzeldauer selected')
      console.log('Blinzeldauer ausgewählt - TTS removed')
      stopAutoMode() // Stoppe Auto-Modus komplett vor Navigation
      router.push('/blinzeldauer')
      break
    case 'farbmodus':
      console.log('Farbmodus selected')
      console.log('Farbmodus ausgewählt - TTS removed')
      toggleDarkMode()
      break
    case 'kamera':
      console.log('Kamera selected')
      console.log('Kamera ausgewählt - TTS removed')
      stopAutoMode() // Stoppe Auto-Modus komplett vor Navigation
      router.push('/kamera')
      break
    case 'impressum':
      console.log('Impressum selected')
      console.log('Impressum ausgewählt - TTS removed')
      // Hier könnte das Impressum geöffnet werden
      break
    case 'zurueck':
      console.log('Zurück selected')
      console.log('Zurück zur Hauptseite - TTS removed')
      stopAutoMode() // Stoppe Auto-Modus komplett vor Navigation
      router.push('/app')
      break
    default:
      console.log('Selected Einstellung:', einstellungId)
      console.log(`${selectedItem?.title} ausgewählt - TTS removed`)
      break
  }
}

// Dark Mode Toggle
const toggleDarkMode = () => {
  settingsStore.toggleDarkMode()
  console.log('Dark mode toggled:', settingsStore.isDarkMode)
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
      const currentItem = einstellungsItems[currentTileIndex.value]
      console.log('Blink activation for item:', currentItem.title)
      
      console.log('Selected item:', currentItem.title, '- TTS removed')
      selectEinstellung(currentItem.id)
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

// Right-click handler
const handleRightClick = (event: MouseEvent) => {
  event.preventDefault()
  console.log('Right click detected - treating as blink')
  const currentItem = einstellungsItems[currentTileIndex.value]
  console.log('Right click activation for item:', currentItem.title)
  
  console.log('Selected item:', currentItem.title, '- TTS removed')
  selectEinstellung(currentItem.id)
}

// Lifecycle
onMounted(() => {
  // Start face recognition if not active
  if (!faceRecognition.isActive.value) {
    faceRecognition.start()
  }

  // Setup blink detection interval
  const blinkCheckInterval = setInterval(handleBlink, 100)

  // Setup event listeners
  const rightClickHandler = (event: MouseEvent) => handleRightClick(event)
  document.addEventListener('contextmenu', rightClickHandler)

  // Start auto-mode after a short delay
  setTimeout(() => {
    startAutoMode()
  }, 1000)

  // Cleanup function
  return () => {
    clearInterval(blinkCheckInterval)
    document.removeEventListener('contextmenu', rightClickHandler)
    stopAutoMode()
  }
})

onUnmounted(() => {
  stopAutoMode()
})
</script>

<style scoped>
.einstellungen-view {
  min-height: 100vh;
  background: var(--bg-color);
  color: var(--text-color);
}

.main-content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.menu-tile {
  background: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.tile-active {
  border-color: var(--primary-color);
  background: var(--primary-bg);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.tile-inactive {
  opacity: 0.7;
}

.tile-icon-container {
  margin-bottom: 0.5rem;
}

.tile-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.tile-text {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
}

.instructions-container {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 2rem;
}

.instructions-container h3 {
  margin: 0 0 1rem 0;
  color: var(--primary-color);
  font-size: 1.2rem;
}

.instructions-container p {
  margin: 0.5rem 0;
  color: var(--text-color);
  font-size: 0.9rem;
}
</style>