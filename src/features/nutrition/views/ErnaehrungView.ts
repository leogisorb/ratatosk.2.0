import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'

export function useErnaehrungViewLogic() {
  // Router
  const router = useRouter()

  // Stores
  const settingsStore = useSettingsStore()

  // Face Recognition
  const faceRecognition = useFaceRecognition()

  // State
  const currentTileIndex = ref(0)
  const selectedErnaehrung = ref('')
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

  // Ernährung-Items basierend auf dem gezeigten Interface
  const ernaehrungItems = [
    // Hauptkategorien
    { id: 'essen', text: 'Essen', type: 'kategorie', emoji: '🍽️' },
    { id: 'trinken', text: 'Trinken', type: 'kategorie', emoji: '🥤' },
    
    // Essen-Unterkategorien
    { id: 'suess', text: 'süß', type: 'essen', emoji: '🍰' },
    { id: 'herzhaft', text: 'herzhaft', type: 'essen', emoji: '🍔' },
    { id: 'scharf', text: 'scharf', type: 'essen', emoji: '🌶️' },
    { id: 'kalt', text: 'kalt', type: 'essen', emoji: '❄️' },
    { id: 'warm', text: 'warm', type: 'essen', emoji: '🔥' },
    { id: 'lauwarm', text: 'lauwarm', type: 'essen', emoji: '🌡️' },
    { id: 'trocken', text: 'trocken', type: 'essen', emoji: '🍪' },
    { id: 'nass', text: 'nass', type: 'essen', emoji: '💧' },
    { id: 'breiig', text: 'breiig', type: 'essen', emoji: '🥣' },
    
    // Trinken-Items
    { id: 'wasser', text: 'Wasser', type: 'trinken', emoji: '💧' },
    { id: 'saft', text: 'Saft', type: 'trinken', emoji: '🧃' },
    { id: 'milch', text: 'Milch', type: 'trinken', emoji: '🥛' },
    
    // Zurück
    { id: 'zurueck', text: 'zurück', type: 'navigation', emoji: '⬅️' }
  ]

  // Text-to-Speech Funktion
  const speakText = (text: string) => {
    console.log('ErnaehrungView speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value, 'speechSynthesis:', speechSynthesis)
    
    if (!isTTSEnabled.value || !speechSynthesis) {
      console.log('ErnaehrungView TTS disabled or speechSynthesis not available')
      return
    }
    
    speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'de-DE'
    utterance.rate = 0.8
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    console.log('ErnaehrungView Speaking:', text)
    speechSynthesis.speak(utterance)
  }

  // TTS Toggle
  const toggleTTS = () => {
    console.log('ErnaehrungView toggleTTS called, current state:', isTTSEnabled.value)
    isTTSEnabled.value = !isTTSEnabled.value
    console.log('ErnaehrungView TTS toggled to:', isTTSEnabled.value)
    
    if (!isTTSEnabled.value) {
      speechSynthesis.cancel()
      console.log('ErnaehrungView TTS cancelled')
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
      currentTileIndex.value = (currentTileIndex.value + 1) % ernaehrungItems.length
      const currentItem = ernaehrungItems[currentTileIndex.value]
      speakText(currentItem.text)
      autoModeInterval.value = window.setTimeout(cycleTiles, 3000) // 3 Sekunden
    }
    
    const firstItem = ernaehrungItems[currentTileIndex.value]
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

  // Ernährung-Item Auswahl
  function selectErnaehrung(ernaehrungId: string) {
    console.log('selectErnaehrung called with ernaehrungId:', ernaehrungId)
    pauseAutoMode()
    
    const selectedItem = ernaehrungItems.find(item => item.id === ernaehrungId)
    if (selectedItem) {
      selectedErnaehrung.value = selectedItem.text
    }
    
    switch (ernaehrungId) {
      case 'zurueck':
        console.log('Navigating back to /ich')
        stopAutoMode() // Stoppe Auto-Modus komplett vor Navigation
        router.push('/ich')
        break
      default:
        console.log('Selected Ernährung:', ernaehrungId)
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
        const currentItem = ernaehrungItems[currentTileIndex.value]
        console.log('Blink activation for tile:', currentTileIndex.value, 'ernaehrungId:', currentItem.id, 'text:', currentItem.text)
        
        speakText(currentItem.text)
        selectErnaehrung(currentItem.id)
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
    const currentItem = ernaehrungItems[currentTileIndex.value]
    console.log('Right click activation for tile:', currentTileIndex.value, 'ernaehrungId:', currentItem.id, 'text:', currentItem.text)
    
    speakText(currentItem.text)
    selectErnaehrung(currentItem.id)
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
    selectedErnaehrung,
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
    ernaehrungItems,
    speakText,
    toggleTTS,
    startAutoMode,
    pauseAutoMode,
    stopAutoMode,
    selectErnaehrung,
    handleBlink,
    handleRightClick,
    settingsStore,
    faceRecognition
  }
}
