import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'

export function useGefuehleViewLogic() {
  // Router
  const router = useRouter()

  // Stores
  const settingsStore = useSettingsStore()

  // Face Recognition
  const faceRecognition = useFaceRecognition()

  // State
  const currentTileIndex = ref(0)
  const selectedGefuehl = ref('')
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

  // Gefühle-Items basierend auf dem gezeigten Interface
  const gefuehleItems = [
    // Zeile 1: Glücklich, Froh, Erleichtert, Traurig
    { id: 'gluecklich', text: 'glücklich', type: 'emotion', emoji: '😊' },
    { id: 'froh', text: 'froh', type: 'emotion', emoji: '😄' },
    { id: 'erleichtert', text: 'erleichtert', type: 'emotion', emoji: '😌' },
    { id: 'traurig', text: 'traurig', type: 'emotion', emoji: '😢' },
    
    // Zeile 2: Wütend, Einsam, Ängstlich, Gelangweilt
    { id: 'wuetend', text: 'wütend', type: 'emotion', emoji: '😠' },
    { id: 'einsam', text: 'einsam', type: 'emotion', emoji: '😔' },
    { id: 'aengstlich', text: 'ängstlich', type: 'emotion', emoji: '😰' },
    { id: 'gelangweilt', text: 'gelangweilt', type: 'emotion', emoji: '😑' },
    
    // Zeile 3: Aufgeregt, Müde, Gestresst, Zurück
    { id: 'aufgeregt', text: 'aufgeregt', type: 'emotion', emoji: '🤩' },
    { id: 'muede', text: 'müde', type: 'emotion', emoji: '😴' },
    { id: 'gestresst', text: 'gestresst', type: 'emotion', emoji: '😫' },
    { id: 'zurueck', text: 'zurück', type: 'navigation', emoji: '⬅️' }
  ]

  // Text-to-Speech Funktion
  const speakText = (text: string) => {
    console.log('GefuehleView speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value, 'speechSynthesis:', speechSynthesis)
    
    if (!isTTSEnabled.value || !speechSynthesis) {
      console.log('GefuehleView TTS disabled or speechSynthesis not available')
      return
    }
    
    speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'de-DE'
    utterance.rate = 0.8
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    console.log('GefuehleView Speaking:', text)
    speechSynthesis.speak(utterance)
  }

  // TTS Toggle
  const toggleTTS = () => {
    console.log('GefuehleView toggleTTS called, current state:', isTTSEnabled.value)
    isTTSEnabled.value = !isTTSEnabled.value
    console.log('GefuehleView TTS toggled to:', isTTSEnabled.value)
    
    if (!isTTSEnabled.value) {
      speechSynthesis.cancel()
      console.log('GefuehleView TTS cancelled')
    } else {
      // Test TTS when enabling
      speakText('Sprachausgabe aktiviert')
    }
  }

  // Auto Mode Funktionen
  const startAutoMode = () => {
    if (autoModeInterval.value) return
    
    // Stelle sicher, dass wir bei Index 0 starten
    currentTileIndex.value = 0
    
    const cycleTiles = () => {
      if (!isAutoMode.value || isAutoModePaused.value) {
        return
      }
      currentTileIndex.value = (currentTileIndex.value + 1) % gefuehleItems.length
      const currentItem = gefuehleItems[currentTileIndex.value]
      speakText(currentItem.text)
      autoModeInterval.value = window.setTimeout(cycleTiles, 3000) // 3 Sekunden
    }
    
    const firstItem = gefuehleItems[currentTileIndex.value]
    speakText(firstItem.text)
    
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

  // Gefühle-Item Auswahl
  function selectGefuehl(gefuehlId: string) {
    console.log('selectGefuehl called with gefuehlId:', gefuehlId)
    pauseAutoMode()
    
    const selectedItem = gefuehleItems.find(item => item.id === gefuehlId)
    if (selectedItem) {
      selectedGefuehl.value = selectedItem.text
    }
    
    switch (gefuehlId) {
      case 'zurueck':
        console.log('Navigating back to /ich')
        stopAutoMode() // Stoppe Auto-Modus komplett vor Navigation
        router.push('/ich')
        break
      default:
        console.log('Selected Gefühl:', gefuehlId)
        speakText(`${selectedItem?.text} ausgewählt`)
        
        // Auto-Modus nach 10 Sekunden wieder starten
        restartTimeout.value = window.setTimeout(() => {
          if (isAutoMode.value) {
            currentTileIndex.value = 0
            isAutoModePaused.value = false
            startAutoMode()
          }
        }, 10000)
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
        const currentItem = gefuehleItems[currentTileIndex.value]
        console.log('Blink activation for tile:', currentTileIndex.value, 'gefuehlId:', currentItem.id, 'text:', currentItem.text)
        
        speakText(currentItem.text)
        selectGefuehl(currentItem.id)
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
    console.log('Right click detected - treating as blink')
    const currentItem = gefuehleItems[currentTileIndex.value]
    console.log('Right click activation for tile:', currentTileIndex.value, 'gefuehlId:', currentItem.id, 'text:', currentItem.text)
    
    speakText(currentItem.text)
    selectGefuehl(currentItem.id)
  }

  // Lifecycle
  onMounted(() => {
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

  return {
    currentTileIndex,
    selectedGefuehl,
    isAutoMode,
    autoModeInterval,
    closedFrames,
    eyesClosed,
    isAutoModePaused,
    restartTimeout,
    blinkThreshold,
    lastBlinkTime,
    blinkCooldown,
    speechSynthesis,
    isTTSEnabled,
    gefuehleItems,
    speakText,
    toggleTTS,
    startAutoMode,
    pauseAutoMode,
    stopAutoMode,
    selectGefuehl,
    handleBlink,
    handleRightClick,
    settingsStore,
    faceRecognition
  }
}
