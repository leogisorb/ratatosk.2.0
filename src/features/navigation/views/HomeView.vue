<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../settings/stores/settings'
import { useCommunicationStore } from '../../communication/stores/communication'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import AppHeader from '../../../shared/components/AppHeader.vue'

// Router
const router = useRouter()

// Stores
const settingsStore = useSettingsStore()
const communicationStore = useCommunicationStore()

// Face Recognition
const faceRecognition = useFaceRecognition()

// State
const currentMenu = ref('')
const currentTileIndex = ref(0)
const isAutoMode = ref(true)
const autoModeInterval = ref<number | null>(null)
const closedFrames = ref(0)
const eyesClosed = ref(false)
const timeClosed = 2 // 2 Sekunden für Blinzeln
const isAutoModePaused = ref(false)

// Verbesserte Blink-Detection Parameter - zentral gesteuert
const blinkThreshold = computed(() => Math.ceil(settingsStore.settings.blinkSensitivity * 10)) // Konvertiere Sekunden zu Frames (10 FPS)
const lastBlinkTime = ref(0)
const blinkCooldown = computed(() => settingsStore.settings.blinkSensitivity * 1000)

// Text-to-Speech
const speechSynthesis = window.speechSynthesis
const isTTSEnabled = ref(true)


// Menu Items mit echten SVG-Icons
const menuItems = [
  {
    id: 'warning',
    title: 'WARNGERÄUSCH',
    description: 'Warnung senden',
    icon: 'bell.svg'
  },
  {
    id: 'communication',
    title: 'UNTERHALTEN',
    description: 'Nachrichten senden und empfangen',
    icon: 'comment-dots.svg'
  },
  {
    id: 'profile',
    title: 'ICH',
    description: 'Persönliche Einstellungen',
    icon: 'user.svg'
  },
  {
    id: 'pain',
    title: 'SCHMERZEN',
    description: 'Schmerzen dokumentieren',
    icon: 'headache.svg'
  },
  {
    id: 'environment',
    title: 'UMGEBUNG',
    description: 'Umgebung beschreiben',
    icon: 'house-chimney.svg'
  },
  {
    id: 'settings',
    title: 'EINSTELLUNGEN',
    description: 'App konfigurieren',
    icon: 'settings-sliders.svg'
  }
]

// Computed
const appClasses = computed(() => [
  'min-h-screen flex flex-col',
  settingsStore.isHighContrast ? 'high-contrast' : '',
  settingsStore.isLargeText ? 'large-text' : ''
])

// Text-to-Speech Functions - Browser-safe
const speakText = (text: string) => {
  console.log('HomeView speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value)
  
  if (!isTTSEnabled.value || !speechSynthesis) {
    console.log('HomeView TTS disabled or speechSynthesis not available')
    return
  }
  
  // Warte länger und verwende try-catch
  setTimeout(() => {
    try {
      speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'de-DE'
      utterance.rate = 0.8
      utterance.pitch = 1.0
      utterance.volume = 1.0
      
      // Event Listener für Debugging
      utterance.onstart = () => console.log('HomeView: Speech started:', text)
      utterance.onend = () => console.log('HomeView: Speech ended:', text)
      utterance.onerror = (event) => {
        console.log('HomeView: Speech error:', event)
        // Versuche es nochmal nach Fehler
        setTimeout(() => {
          console.log('HomeView: Retrying TTS...')
          speechSynthesis.speak(utterance)
        }, 500)
      }
      
      console.log('HomeView Speaking:', text)
      speechSynthesis.speak(utterance)
    } catch (error) {
      console.log('HomeView: TTS Error:', error)
    }
  }, 200)
}

// TTS Test Funktion
const testTTS = () => {
  console.log('TTS Test Button clicked!')
  speakText('TTS Test funktioniert! Dies ist ein Test der Sprachausgabe.')
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
    
    currentTileIndex.value = (currentTileIndex.value + 1) % menuItems.length
    
    // Spreche den aktuellen Menüpunkt vor
    const currentItem = menuItems[currentTileIndex.value]
    speakText(currentItem.title)
    
    autoModeInterval.value = window.setTimeout(cycleTiles, 3000) // 3 Sekunden
  }
  
  // Spreche den ersten Menüpunkt vor
  const firstItem = menuItems[currentTileIndex.value]
  speakText(firstItem.title)
  
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

const resumeAutoMode = () => {
  isAutoModePaused.value = false
  if (!autoModeInterval.value) {
    // Starte den Auto-Modus bei der aktuellen Kachel
    const currentItem = menuItems[currentTileIndex.value]
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

// Methods
function selectMenu(menuId: string) {
  console.log('selectMenu called with menuId:', menuId)
  
  // Setze den aktuellen Tile-Index basierend auf der menuId
  const index = menuItems.findIndex(item => item.id === menuId)
  if (index !== -1) {
    currentTileIndex.value = index
  }
  
  currentMenu.value = menuId
  pauseAutoMode() // Pausiere Auto-Modus statt zu stoppen
  
  // Spreche den ausgewählten Menüpunkt vor
  const selectedItem = menuItems.find(item => item.id === menuId)
  if (selectedItem) {
    speakText(selectedItem.title)
  }
  
  // Navigate to corresponding route based on menu ID
  switch (menuId) {
    case 'warning':
      console.log('Navigating to /warning')
      router.push('/warning')
      break
    case 'communication':
      console.log('Navigating to /unterhalten')
      router.push('/unterhalten')
      break
    case 'profile':
      console.log('Navigating to /ich')
      router.push('/ich')
      break
    case 'pain':
      console.log('Navigating to /schmerz')
      router.push('/schmerz')
      break
    case 'environment':
      console.log('Navigating to /umgebung')
      router.push('/umgebung')
      break
    case 'settings':
      console.log('Navigating to /einstellungen')
      router.push('/einstellungen')
      break
    default:
      console.log('Unknown menu ID:', menuId)
  }
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Blink Detection - Verbessert und weniger sensibel (wie in UnterhaltenView)
const handleBlink = () => {
  const now = Date.now()
  
  if (faceRecognition.isBlinking()) {
    closedFrames.value++
    
    // Nur verarbeiten wenn genug Zeit seit letztem Blink vergangen ist
    if (now - lastBlinkTime.value < blinkCooldown.value) {
      return
    }
    
    // Menü-Auswahl bei kurzem Blinzeln (mindestens 5 Frames = 0.5 Sekunden)
    if (closedFrames.value >= blinkThreshold.value && !eyesClosed.value) {
      const currentItem = menuItems[currentTileIndex.value]
      console.log('Blink activation for tile:', currentTileIndex.value, 'menuId:', currentItem.id, 'title:', currentItem.title, 'frames:', closedFrames.value, 'threshold:', blinkThreshold)
      
      // Spreche den Menüpunkt vor, bevor er ausgewählt wird
      speakText(currentItem.title)
      
      selectMenu(currentItem.id)
      eyesClosed.value = true
      lastBlinkTime.value = now
      // Reset frames after successful detection
      closedFrames.value = 0
    }
  } else {
    // Reset nur wenn Augen wirklich offen sind
    if (closedFrames.value > 0) {
      closedFrames.value = 0
      eyesClosed.value = false
    }
  }
}

// Rechte Maustaste als Blinzeln-Ersatz
const handleRightClick = (event: MouseEvent) => {
  event.preventDefault() // Verhindert Kontextmenü
  console.log('Right click detected - treating as blink')
  const currentItem = menuItems[currentTileIndex.value]
  console.log('Right click activation for tile:', currentTileIndex.value, 'menuId:', currentItem.id, 'title:', currentItem.title)
  
  // Spreche den Menüpunkt vor, bevor er ausgewählt wird
  speakText(currentItem.title)
  
  selectMenu(currentItem.id)
}

// Lifecycle
onMounted(() => {
  // Ensure face recognition is active if it was started from the start page
  if (!faceRecognition.isActive.value) {
    faceRecognition.start()
  }
  
  // Resume Auto Mode if it was paused (e.g., returning from warning page)
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
    <!-- App Header -->
    <AppHeader />

    <!-- Hauptinhalt -->
    <main class="main-content">
        
        <!-- TTS Test Button -->
        <div class="tts-test-section">
          <button @click="testTTS" class="tts-test-button">🔊 TTS Test</button>
          <p class="tts-test-text">Klicken Sie um TTS zu testen</p>
        </div>
        
        <!-- Desktop Layout (3×2 Grid) - wird auf allen Bildschirmen angezeigt -->
        <div class="grid-container">
            <!-- WARNGERÄUSCH -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 0 ? 'tile-active' : 'tile-inactive'"
              @click="selectMenu('warning')"
            >
              <div 
                class="tile-icon-container"
                :class="currentTileIndex === 0 ? 'icon-active' : 'icon-inactive'"
              >
                <img 
                  src="/bell.svg" 
                  alt="WARNGERÄUSCH" 
                  class="tile-icon"
                  :class="currentTileIndex === 0 ? 'icon-inverted' : ''"
                />
              </div>
              <div 
                class="tile-text"
                :class="currentTileIndex === 0 ? 'text-active' : 'text-inactive'"
                :style="currentTileIndex === 0 ? 'color: white !important;' : ''"
              >
                WARNGERÄUSCH
              </div>
            </div>

            <!-- UNTERHALTEN -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 1 ? 'tile-active' : 'tile-inactive'"
              @click="selectMenu('communication')"
            >
              <div 
                class="tile-icon-container"
                :class="currentTileIndex === 1 ? 'icon-active' : 'icon-inactive'"
              >
                <img 
                  src="/comment-dots.svg" 
                  alt="UNTERHALTEN" 
                  class="tile-icon"
                  :class="currentTileIndex === 1 ? 'icon-inverted' : ''"
                />
              </div>
              <div 
                class="tile-text"
                :class="currentTileIndex === 1 ? 'text-active' : 'text-inactive'"
                :style="currentTileIndex === 1 ? 'color: white !important;' : ''"
              >
                UNTERHALTEN
              </div>
            </div>

            <!-- ICH -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 2 ? 'tile-active' : 'tile-inactive'"
              @click="selectMenu('profile')"
            >
              <div 
                class="tile-icon-container"
                :class="currentTileIndex === 2 ? 'icon-active' : 'icon-inactive'"
              >
                <img 
                  src="/user.svg" 
                  alt="ICH" 
                  class="tile-icon"
                  :class="currentTileIndex === 2 ? 'icon-inverted' : ''"
                />
              </div>
              <div 
                class="tile-text"
                :class="currentTileIndex === 2 ? 'text-active' : 'text-inactive'"
                :style="currentTileIndex === 2 ? 'color: white !important;' : ''"
              >
                ICH
              </div>
            </div>

            <!-- SCHMERZEN -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 3 ? 'tile-active' : 'tile-inactive'"
              @click="selectMenu('pain')"
            >
              <div 
                class="tile-icon-container"
                :class="currentTileIndex === 3 ? 'icon-active' : 'icon-inactive'"
              >
                <img 
                  src="/headache.svg" 
                  alt="SCHMERZEN" 
                  class="tile-icon"
                  :class="currentTileIndex === 3 ? 'icon-inverted' : ''"
                />
              </div>
              <div 
                class="tile-text"
                :class="currentTileIndex === 3 ? 'text-active' : 'text-inactive'"
                :style="currentTileIndex === 3 ? 'color: white !important;' : ''"
              >
                SCHMERZEN
              </div>
            </div>

            <!-- UMGEBUNG -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 4 ? 'tile-active' : 'tile-inactive'"
              @click="selectMenu('environment')"
            >
              <div 
                class="tile-icon-container"
                :class="currentTileIndex === 4 ? 'icon-active' : 'icon-inactive'"
              >
                <img 
                  src="/house-chimney.svg" 
                  alt="UMGEBUNG" 
                  class="tile-icon"
                  :class="currentTileIndex === 4 ? 'icon-inverted' : ''"
                />
              </div>
              <div 
                class="tile-text"
                :class="currentTileIndex === 4 ? 'text-active' : 'text-inactive'"
                :style="currentTileIndex === 4 ? 'color: white !important;' : ''"
              >
                UMGEBUNG
              </div>
            </div>

            <!-- EINSTELLUNGEN -->
            <div 
              class="menu-tile"
              :class="currentTileIndex === 5 ? 'tile-active' : 'tile-inactive'"
              @click="selectMenu('settings')"
            >
              <div 
                class="tile-icon-container"
                :class="currentTileIndex === 5 ? 'icon-active' : 'icon-inactive'"
              >
                <img 
                  src="/settings-sliders.svg" 
                  alt="EINSTELLUNGEN" 
                  class="tile-icon"
                  :class="currentTileIndex === 5 ? 'icon-inverted' : ''"
                />
              </div>
              <div 
                class="tile-text"
                :class="currentTileIndex === 5 ? 'text-active' : 'text-inactive'"
                :style="currentTileIndex === 5 ? 'color: white !important;' : ''"
              >
                EINSTELLUNGEN
              </div>
            </div>
        </div>
    </main>

    <!-- Content Area (Modal) -->
    <div v-if="currentMenu !== ''" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">
            {{ menuItems.find(item => item.id === currentMenu)?.title }}
          </h2>
          <button 
            @click="currentMenu = ''"
            class="modal-close"
          >
            ✕
          </button>
        </div>

        <!-- Communication Interface -->
        <div v-if="currentMenu === 'communication'" class="communication-interface">
          <div class="message-input-section">
            <textarea
              v-model="communicationStore.currentMessage"
              placeholder="Nachricht eingeben..."
              class="message-textarea"
              @keydown.enter.prevent="communicationStore.sendCurrentMessage"
            ></textarea>
            
            <div class="message-buttons">
              <button
                @click="communicationStore.sendCurrentMessage"
                class="btn-primary"
              >
                Senden
              </button>
              <button
                @click="communicationStore.currentMessage = ''"
                class="btn-secondary"
              >
                Löschen
              </button>
            </div>
          </div>

          <!-- Quick Messages -->
          <div class="quick-messages-section">
            <h3 class="section-title">
              Schnellnachrichten
            </h3>
            <div class="quick-messages-grid">
              <button
                v-for="message in communicationStore.quickMessages"
                :key="message.id"
                @click="communicationStore.addQuickMessage(message.id)"
                class="quick-message-button"
              >
                <div class="quick-message-content">
                  <span class="quick-message-icon">{{ message.icon }}</span>
                  <span class="quick-message-text">{{ message.text }}</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Message History -->
          <div class="message-history-section">
            <h3 class="section-title">
              Nachrichtenverlauf
            </h3>
            <div class="message-history">
              <div
                v-for="message in communicationStore.messages"
                :key="message.id"
                class="message-item"
              >
                <div class="message-content">
                  <p class="message-text">{{ message.text }}</p>
                  <span class="message-time">
                    {{ formatTime(message.timestamp) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Other Menu Content -->
        <div v-else class="other-menu-content">
          <h2 class="other-menu-title">
            {{ menuItems.find(item => item.id === currentMenu)?.title }}
          </h2>
          <p class="other-menu-description">
            {{ menuItems.find(item => item.id === currentMenu)?.description }}
          </p>
          <p class="other-menu-note">
            Diese Funktion wird noch implementiert...
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* HomeView verwendet jetzt globale CSS-Klassen aus main.css */

/* Spezifische HomeView Styles */
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  background-color: #f9fafb;
}

/* Communication Interface - spezifische Styles */
.communication-interface {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.message-input-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message-textarea {
  resize: none;
  height: 6rem;
}

.message-buttons {
  display: flex;
  gap: 0.5rem;
}

.quick-messages-section,
.message-history-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.quick-messages-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.quick-message-button {
  padding: 0.75rem;
  text-align: left;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  background-color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

.quick-message-button:hover {
  background-color: #f9fafb;
}

.quick-message-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quick-message-icon {
  font-size: 1.125rem;
}

.quick-message-text {
  font-size: 0.875rem;
}

.message-history {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 16rem;
  overflow-y: auto;
}

.message-item {
  padding: 0.75rem;
  border-radius: 0.5rem;
  background-color: #f9fafb;
}

.message-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.message-text {
  font-size: 0.875rem;
  margin: 0;
}

.message-time {
  font-size: 0.75rem;
  color: #6b7280;
}

/* Other Menu Content */
.other-menu-content {
  text-align: center;
  padding: 3rem 0;
}

.other-menu-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #111827;
  margin-bottom: 1rem;
}

.other-menu-description {
  color: #6b7280;
  margin-bottom: 1rem;
}

.other-menu-note {
  font-size: 0.875rem;
  color: #9ca3af;
  margin-top: 1rem;
}
</style>

