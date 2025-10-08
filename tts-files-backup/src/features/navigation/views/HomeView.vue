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
const isVolumeEnabled = ref(true) // Global volume state from header
const isSpeaking = ref(false) // Prevent overlapping TTS calls


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

// Text-to-Speech Functions - Handle browser autoplay policy
let userInteracted = false
let ttsBlockedByBrowser = false

const speakText = (text: string) => {
  console.log('HomeView speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value, 'isSpeaking:', isSpeaking.value, 'userInteracted:', userInteracted)

  if (!isTTSEnabled.value || !speechSynthesis) {
    console.log('HomeView TTS disabled or speechSynthesis not available')
    return
  }

  // Check if user has interacted (required by browser autoplay policy)
  if (!userInteracted) {
    console.log('HomeView: TTS blocked - user interaction required by browser autoplay policy')
    ttsBlockedByBrowser = true
    return
  }

  // Prüfe ob Volume im Header aktiviert ist
  if (!isVolumeEnabled.value) {
    console.log('HomeView: Volume disabled in header - skipping TTS')
    return
  }

  // Verhindere überlappende TTS-Aufrufe
  if (isSpeaking.value) {
    console.log('HomeView: TTS already speaking - skipping new call')
    return
  }

  // Setze isSpeaking Flag sofort
  isSpeaking.value = true
  console.log('HomeView: Setting isSpeaking to true')

  // WICHTIG: Warte länger zwischen cancel und speak
  speechSynthesis.cancel()
  
  // Längere Wartezeit um sicherzustellen, dass alle vorherigen TTS gestoppt sind
  setTimeout(() => {
    // Prüfe nochmal ob wir sprechen dürfen
    if (!isSpeaking.value) {
      console.log('HomeView: isSpeaking wurde zurückgesetzt - TTS abgebrochen')
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'de-DE'
    utterance.rate = 0.8
    utterance.pitch = 1.0
    utterance.volume = 1.0 // Volle Lautstärke

    // Wähle eine deutsche Stimme falls verfügbar
    const voices = speechSynthesis.getVoices()
    const germanVoice = voices.find(voice => voice.lang.startsWith('de'))
    if (germanVoice) {
      utterance.voice = germanVoice
      console.log('HomeView: Using German voice:', germanVoice.name)
    }

    utterance.onstart = () => {
      console.log('🔊 HomeView: Speech started:', text)
      console.log('🔊 Sollte jetzt Ton hören!')
      console.log('🔊 isSpeaking is now:', isSpeaking.value)
    }
    utterance.onend = () => {
      isSpeaking.value = false
      console.log('✅ HomeView: Speech ended:', text)
      console.log('✅ isSpeaking reset to:', isSpeaking.value)
    }
    utterance.onerror = (event) => {
      isSpeaking.value = false
      console.log('❌ HomeView: Speech error:', event)
      console.log('❌ Error details:', event.error, event.charIndex, event.charLength)
      console.log('❌ isSpeaking reset to:', isSpeaking.value)
      
      // Handle different error types
      if (event.error === 'canceled') {
        console.log('ℹ️ HomeView: Speech was canceled (normal)')
      } else if (event.error === 'not-allowed') {
        console.warn('⚠️ HomeView: Speech synthesis not allowed - browser autoplay policy blocking TTS')
        ttsBlockedByBrowser = true
        // Don't retry - user needs to interact first
      } else {
        console.error('❌ HomeView: Speech synthesis error:', event.error)
      }
    }

    console.log('HomeView Speaking:', text)
    speechSynthesis.speak(utterance)

    // Fallback: Reset isSpeaking nach 5 Sekunden falls es hängen bleibt
    setTimeout(() => {
      if (isSpeaking.value) {
        console.log('⚠️ HomeView: isSpeaking timeout - resetting flag')
        isSpeaking.value = false
      }
    }, 5000)
  }, 500) // 500ms Wartezeit - viel länger!
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
    
    // Spreche den aktuellen Menüpunkt vor (nur wenn nicht bereits gesprochen wird)
    const currentItem = menuItems[currentTileIndex.value]
    if (!isSpeaking.value) {
      speakText(currentItem.title)
    }
    
    autoModeInterval.value = window.setTimeout(cycleTiles, 6000) // 6 Sekunden (noch länger)
  }
  
  // Spreche den ersten Menüpunkt vor
  const firstItem = menuItems[currentTileIndex.value]
  speakText(firstItem.title)
  
  // Starte den ersten Zyklus nach 6 Sekunden
  autoModeInterval.value = window.setTimeout(cycleTiles, 6000)
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

// User interaction detection
const enableTTSOnInteraction = () => {
  if (!userInteracted) {
    console.log('User interaction detected - enabling TTS...')
    userInteracted = true
    ttsBlockedByBrowser = false
    
    // Test TTS immediately after user interaction
    setTimeout(() => {
      const testUtterance = new SpeechSynthesisUtterance('')
      testUtterance.volume = 0
      speechSynthesis.speak(testUtterance)
      speechSynthesis.cancel()
      console.log('TTS initialized after user interaction')
    }, 100)
  }
}

// Methods
function selectMenu(menuId: string) {
  console.log('selectMenu called with menuId:', menuId)
  
  // Enable TTS on user interaction
  enableTTSOnInteraction()
  
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

// TTS is now enabled by default - no user interaction required

// Volume toggle event handler
const handleVolumeToggle = (event: any) => {
  isVolumeEnabled.value = event.detail.enabled
  console.log('HomeView: Volume toggle received:', event.detail.enabled)
}

// Lifecycle
onMounted(() => {
  // Add global event listeners to detect user interaction
  document.addEventListener('click', enableTTSOnInteraction)
  document.addEventListener('keydown', enableTTSOnInteraction)
  document.addEventListener('touchstart', enableTTSOnInteraction)
  
  // Listen for volume toggle events from header
  window.addEventListener('volumeToggle', handleVolumeToggle)
  
  // Initialize TTS API
  if (speechSynthesis) {
    console.log('TTS API initialized on page load')
  }
  
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
  // Clean up event listeners
  document.removeEventListener('click', enableTTSOnInteraction)
  document.removeEventListener('keydown', enableTTSOnInteraction)
  document.removeEventListener('touchstart', enableTTSOnInteraction)
  document.removeEventListener('contextmenu', handleRightClick)
  window.removeEventListener('volumeToggle', handleVolumeToggle)
  stopAutoMode()
})
</script>

<template>
  <div id="app" :class="appClasses">
    <!-- App Header -->
    <AppHeader />

    <!-- Hauptinhalt -->
    <main class="main-content">
        
        
        <!-- TTS Status Indicator -->
        <div v-if="ttsBlockedByBrowser" class="tts-status-indicator">
          <div class="tts-status-content">
            <span class="tts-status-icon">🔇</span>
            <span class="tts-status-text">TTS blockiert - Klicken Sie irgendwo um Audio zu aktivieren</span>
          </div>
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
  background-color: #f8f9fa;
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
  transition: all 0.2s;
}

.quick-message-button:hover {
  background-color: #00B098;
  color: white;
  border-color: #00B098;
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
  background-color: #f8f9fa;
  border-left: 3px solid #00B098;
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
  color: #00B098;
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


/* TTS Status Indicator */
.tts-status-indicator {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #fef3c7;
  border: 2px solid #f59e0b;
  border-radius: 0.75rem;
  padding: 1rem 1.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  animation: pulse 2s infinite;
}

.tts-status-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tts-status-icon {
  font-size: 1.5rem;
}

.tts-status-text {
  font-size: 1rem;
  font-weight: 500;
  color: #92400e;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>

