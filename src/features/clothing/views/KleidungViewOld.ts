import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'

export function useKleidungViewLogic() {
  // Router
  const router = useRouter()

  // Stores
  const settingsStore = useSettingsStore()

  // Face Recognition
  const faceRecognition = useFaceRecognition()

  // State
  const currentTileIndex = ref(0)
  const selectedKleidung = ref('')
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

  // Kleidung-Items basierend auf dem gezeigten Interface
  const kleidungItems = [
    // Zeile 1: Mütze, Ohrstöpsel, Schaal, Hemd
    { id: 'muetze', text: 'Mütze', type: 'clothing', emoji: '🧢' },
    { id: 'ohrstoepsel', text: 'Ohrstöpsel', type: 'clothing', emoji: '🎧' },
    { id: 'schaal', text: 'Schaal', type: 'clothing', emoji: '🧣' },
    { id: 'hemd', text: 'Hemd', type: 'clothing', emoji: '👔' },
    
    // Zeile 2: T-Shirt, Pullover, Jacke, Hose
    { id: 'tshirt', text: 'T-Shirt', type: 'clothing', emoji: '👕' },
    { id: 'pullover', text: 'Pullover', type: 'clothing', emoji: '🧥' },
    { id: 'jacke', text: 'Jacke', type: 'clothing', emoji: '🧥' },
    { id: 'hose', text: 'Hose', type: 'clothing', emoji: '👖' },
    
    // Zeile 3: Socken, Schuhe, Unterwäsche, Zurück
    { id: 'socken', text: 'Socken', type: 'clothing', emoji: '🧦' },
    { id: 'schuhe', text: 'Schuhe', type: 'clothing', emoji: '👟' },
    { id: 'unterwaesche', text: 'Unterwäsche', type: 'clothing', emoji: '🩲' },
    { id: 'zurueck', text: 'zurück', type: 'navigation', emoji: '⬅️' }
  ]

  // Text-to-Speech Funktion
  const speakText = (text: string) => {
    console.log('KleidungView speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value, 'speechSynthesis:', speechSynthesis)
    
    if (!isTTSEnabled.value || !speechSynthesis) {
      console.log('KleidungView TTS disabled or speechSynthesis not available')
      return
    }
    
    speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'de-DE'
    utterance.rate = 0.8
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    console.log('KleidungView Speaking:', text)
    speechSynthesis.speak(utterance)
  }

  // TTS Toggle
  const toggleTTS = () => {
    console.log('KleidungView toggleTTS called, current state:', isTTSEnabled.value)
    isTTSEnabled.value = !isTTSEnabled.value
    console.log('KleidungView TTS toggled to:', isTTSEnabled.value)
    
    if (!isTTSEnabled.value) {
      speechSynthesis.cancel()
      console.log('KleidungView TTS cancelled')
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
      currentTileIndex.value = (currentTileIndex.value + 1) % kleidungItems.length
      const currentItem = kleidungItems[currentTileIndex.value]
      speakText(currentItem.text)
      autoModeInterval.value = window.setTimeout(cycleTiles, 3000) // 3 Sekunden
    }
    
    const firstItem = kleidungItems[currentTileIndex.value]
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

  // Kleidung-Item Auswahl
  function selectKleidung(kleidungId: string) {
    console.log('selectKleidung called with kleidungId:', kleidungId)
    pauseAutoMode()
    
    const selectedItem = kleidungItems.find(item => item.id === kleidungId)
    if (selectedItem) {
      selectedKleidung.value = selectedItem.text
    }
    
    switch (kleidungId) {
      case 'zurueck':
        console.log('Navigating back to /ich')
        stopAutoMode() // Stoppe Auto-Modus komplett vor Navigation
        router.push('/ich')
        break
      default:
        console.log('Selected Kleidung:', kleidungId)
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
        const currentItem = kleidungItems[currentTileIndex.value]
        console.log('Blink activation for tile:', currentTileIndex.value, 'kleidungId:', currentItem.id, 'text:', currentItem.text)
        
        speakText(currentItem.text)
        selectKleidung(currentItem.id)
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
    const currentItem = kleidungItems[currentTileIndex.value]
    console.log('Right click activation for tile:', currentTileIndex.value, 'kleidungId:', currentItem.id, 'text:', currentItem.text)
    
    speakText(currentItem.text)
    selectKleidung(currentItem.id)
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
    selectedKleidung,
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
    kleidungItems,
    speakText,
    toggleTTS,
    startAutoMode,
    pauseAutoMode,
    stopAutoMode,
    selectKleidung,
    handleBlink,
    handleRightClick,
    settingsStore,
    faceRecognition
  }
}
