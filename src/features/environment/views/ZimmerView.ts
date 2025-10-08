import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'

export function useZimmerViewLogic() {
  // Router
  const router = useRouter()

  // Stores
  const settingsStore = useSettingsStore()

  // Face Recognition
  const faceRecognition = useFaceRecognition()

  // State
  const currentTileIndex = ref(0)
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

  // Zimmer-Items basierend auf dem gezeigten Interface
  const zimmerItems = [
    // Zeile 1: Tür, Fenster, Licht
    { id: 'tuer', text: 'Tür', type: 'zimmer', emoji: '🚪' },
    { id: 'fenster', text: 'Fenster', type: 'zimmer', emoji: '🪟' },
    { id: 'licht', text: 'Licht', type: 'zimmer', emoji: '💡' },
    
    // Zeile 2: Bett, Tisch, Stuhl
    { id: 'bett', text: 'Bett', type: 'zimmer', emoji: '🛏️' },
    { id: 'tisch', text: 'Tisch', type: 'zimmer', emoji: '🍽️' },
    { id: 'stuhl', text: 'Stuhl', type: 'zimmer', emoji: '🪑' },
    
    // Zeile 3: Fernseher, Vorhang, Schrank
    { id: 'fernseher', text: 'Fernseher', type: 'zimmer', emoji: '📺' },
    { id: 'vorhang', text: 'Vorhang', type: 'zimmer', emoji: '🪟' },
    { id: 'schrank', text: 'Schrank', type: 'zimmer', emoji: '🚪' },
    
    // Zeile 4: Zurück
    { id: 'zurueck', text: 'zurück', type: 'navigation', emoji: '⬅️' }
  ]

  // Text-to-Speech Funktion
  const speakText = (text: string) => {
    console.log('ZimmerView speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value, 'speechSynthesis:', speechSynthesis)
    
    if (!isTTSEnabled.value || !speechSynthesis) {
      console.log('ZimmerView TTS disabled or speechSynthesis not available')
      return
    }
    
    speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'de-DE'
    utterance.rate = 0.8
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    console.log('ZimmerView Speaking:', text)
    speechSynthesis.speak(utterance)
  }

  // TTS Toggle
  const toggleTTS = () => {
    console.log('ZimmerView toggleTTS called, current state:', isTTSEnabled.value)
    isTTSEnabled.value = !isTTSEnabled.value
    console.log('ZimmerView TTS toggled to:', isTTSEnabled.value)
    
    if (!isTTSEnabled.value) {
      speechSynthesis.cancel()
      console.log('ZimmerView TTS cancelled')
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
      currentTileIndex.value = (currentTileIndex.value + 1) % zimmerItems.length
      const currentItem = zimmerItems[currentTileIndex.value]
      speakText(currentItem.text)
      autoModeInterval.value = window.setTimeout(cycleTiles, 3000) // 3 Sekunden
    }
    
    const firstItem = zimmerItems[currentTileIndex.value]
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

  // Zimmer-Item Auswahl
  function selectZimmerItem(zimmerItemId: string) {
    console.log('selectZimmerItem called with zimmerItemId:', zimmerItemId)
    pauseAutoMode()
    
    const selectedItem = zimmerItems.find(item => item.id === zimmerItemId)
    if (selectedItem) {
      selectedZimmerItem.value = selectedItem.text
    }
    
    switch (zimmerItemId) {
      case 'zurueck':
        console.log('Navigating back to /umgebung')
        stopAutoMode() // Stoppe Auto-Modus komplett vor Navigation
        router.push('/umgebung')
        break
      default:
        console.log('Selected Zimmer-Item:', zimmerItemId)
        speakText(`${selectedItem?.text} ausgewählt`)
        
        // Navigiere zu ZimmerVerbenView mit dem ausgewählten Item
        stopAutoMode()
        router.push(`/zimmer-verben/${zimmerItemId}`)
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
        const currentItem = zimmerItems[currentTileIndex.value]
        console.log('Blink activation for tile:', currentTileIndex.value, 'zimmerItemId:', currentItem.id, 'text:', currentItem.text)
        
        speakText(currentItem.text)
        selectZimmerItem(currentItem.id)
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
    const currentItem = zimmerItems[currentTileIndex.value]
    console.log('Right click activation for tile:', currentTileIndex.value, 'zimmerItemId:', currentItem.id, 'text:', currentItem.text)
    
    speakText(currentItem.text)
    selectZimmerItem(currentItem.id)
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
    selectedZimmerItem,
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
    zimmerItems,
    speakText,
    toggleTTS,
    startAutoMode,
    pauseAutoMode,
    stopAutoMode,
    selectZimmerItem,
    handleBlink,
    handleRightClick,
    settingsStore,
    faceRecognition
  }
}
