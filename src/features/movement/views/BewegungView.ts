import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'

export function useBewegungViewLogic() {
  // Router
  const router = useRouter()

  // Stores
  const settingsStore = useSettingsStore()

  // Face Recognition
  const faceRecognition = useFaceRecognition()

  // State
  const currentTileIndex = ref(0)
  const selectedBewegung = ref('')
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

  // Bewegung-Items basierend auf dem gezeigten Interface
  const bewegungItems = [
    // Zeile 1: Gehen, Laufen, Fahrrad, Schwimmen
    { id: 'gehen', text: 'gehen', type: 'bewegung', emoji: '🚶' },
    { id: 'laufen', text: 'laufen', type: 'bewegung', emoji: '🏃' },
    { id: 'fahrrad', text: 'Fahrrad', type: 'bewegung', emoji: '🚴' },
    { id: 'schwimmen', text: 'schwimmen', type: 'bewegung', emoji: '🏊' },
    
    // Zeile 2: Yoga, Tanzen, Sport, Spazieren
    { id: 'yoga', text: 'Yoga', type: 'bewegung', emoji: '🧘' },
    { id: 'tanzen', text: 'tanzen', type: 'bewegung', emoji: '💃' },
    { id: 'sport', text: 'Sport', type: 'bewegung', emoji: '⚽' },
    { id: 'spazieren', text: 'spazieren', type: 'bewegung', emoji: '🌳' },
    
    // Zeile 3: Physiotherapie, Massage, Ruhe, Zurück
    { id: 'physiotherapie', text: 'Physiotherapie', type: 'bewegung', emoji: '🏥' },
    { id: 'massage', text: 'Massage', type: 'bewegung', emoji: '💆' },
    { id: 'ruhe', text: 'Ruhe', type: 'bewegung', emoji: '😴' },
    { id: 'zurueck', text: 'zurück', type: 'navigation', emoji: '⬅️' }
  ]

  // Text-to-Speech Funktion
  const speakText = (text: string) => {
    console.log('BewegungView speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value, 'speechSynthesis:', speechSynthesis)
    
    if (!isTTSEnabled.value || !speechSynthesis) {
      console.log('BewegungView TTS disabled or speechSynthesis not available')
      return
    }
    
    speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'de-DE'
    utterance.rate = 0.8
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    console.log('BewegungView Speaking:', text)
    speechSynthesis.speak(utterance)
  }

  // TTS Toggle
  const toggleTTS = () => {
    console.log('BewegungView toggleTTS called, current state:', isTTSEnabled.value)
    isTTSEnabled.value = !isTTSEnabled.value
    console.log('BewegungView TTS toggled to:', isTTSEnabled.value)
    
    if (!isTTSEnabled.value) {
      speechSynthesis.cancel()
      console.log('BewegungView TTS cancelled')
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
      currentTileIndex.value = (currentTileIndex.value + 1) % bewegungItems.length
      const currentItem = bewegungItems[currentTileIndex.value]
      speakText(currentItem.text)
      autoModeInterval.value = window.setTimeout(cycleTiles, 3000) // 3 Sekunden
    }
    
    const firstItem = bewegungItems[currentTileIndex.value]
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

  // Bewegung-Item Auswahl
  function selectBewegung(bewegungId: string) {
    console.log('selectBewegung called with bewegungId:', bewegungId)
    pauseAutoMode()
    
    const selectedItem = bewegungItems.find(item => item.id === bewegungId)
    if (selectedItem) {
      selectedBewegung.value = selectedItem.text
    }
    
    switch (bewegungId) {
      case 'zurueck':
        console.log('Navigating back to /ich')
        stopAutoMode() // Stoppe Auto-Modus komplett vor Navigation
        router.push('/ich')
        break
      default:
        console.log('Selected Bewegung:', bewegungId)
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
        const currentItem = bewegungItems[currentTileIndex.value]
        console.log('Blink activation for tile:', currentTileIndex.value, 'bewegungId:', currentItem.id, 'text:', currentItem.text)
        
        speakText(currentItem.text)
        selectBewegung(currentItem.id)
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
    const currentItem = bewegungItems[currentTileIndex.value]
    console.log('Right click activation for tile:', currentTileIndex.value, 'bewegungId:', currentItem.id, 'text:', currentItem.text)
    
    speakText(currentItem.text)
    selectBewegung(currentItem.id)
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
    selectedBewegung,
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
    bewegungItems,
    speakText,
    toggleTTS,
    startAutoMode,
    pauseAutoMode,
    stopAutoMode,
    selectBewegung,
    handleBlink,
    handleRightClick,
    settingsStore,
    faceRecognition
  }
}
