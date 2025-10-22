import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'

export function useGegenstaendeViewLogic() {
  // Router
  const router = useRouter()

  // Stores
  const settingsStore = useSettingsStore()

  // Face Recognition
  const faceRecognition = useFaceRecognition()

  // State
  const currentTileIndex = ref(0)
  const selectedGegenstaendeItem = ref('')
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

  // Gegenstand-Items basierend auf dem gezeigten Interface
  const gegenstaendeItems = [
    // Zeile 1: Handy, Glas, Brille
    { id: 'handy', text: 'Handy', verb: 'benutzen', type: 'gegenstand', emoji: '📱' },
    { id: 'glas', text: 'Glas', verb: 'holen', type: 'gegenstand', emoji: '🥛' },
    { id: 'brille', text: 'Brille', verb: 'aufsetzen', type: 'gegenstand', emoji: '👓' },
    
    // Zeile 2: Stift, Papier, Lineal
    { id: 'stift', text: 'Stift', verb: 'holen', type: 'gegenstand', emoji: '✏️' },
    { id: 'papier', text: 'Papier', verb: 'holen', type: 'gegenstand', emoji: '📄' },
    { id: 'lineal', text: 'Lineal', verb: 'holen', type: 'gegenstand', emoji: '📏' },
    
    // Zeile 3: Teller, Besteck, Tisch
    { id: 'teller', text: 'Teller', verb: 'holen', type: 'gegenstand', emoji: '🍽️' },
    { id: 'besteck', text: 'Besteck', verb: 'holen', type: 'gegenstand', emoji: '🍴' },
    { id: 'tisch', text: 'Tisch', verb: 'decken', type: 'gegenstand', emoji: '🪑' },
    
    // Zeile 4: Zurück
    { id: 'zurueck', text: 'zurück', verb: '', type: 'navigation', emoji: '⬅️' }
  ]

  // Text-to-Speech Funktion
  const speakText = (text: string) => {
    console.log('GegenstaendeView speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value, 'speechSynthesis:', speechSynthesis)
    
    if (!isTTSEnabled.value || !speechSynthesis) {
      console.log('GegenstaendeView TTS disabled or speechSynthesis not available')
      return
    }
    
    speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'de-DE'
    utterance.rate = 0.8
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    console.log('GegenstaendeView Speaking:', text)
    speechSynthesis.speak(utterance)
  }

  // TTS Toggle
  const toggleTTS = () => {
    console.log('GegenstaendeView toggleTTS called, current state:', isTTSEnabled.value)
    isTTSEnabled.value = !isTTSEnabled.value
    console.log('GegenstaendeView TTS toggled to:', isTTSEnabled.value)
    
    if (!isTTSEnabled.value) {
      speechSynthesis.cancel()
      console.log('GegenstaendeView TTS cancelled')
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
      currentTileIndex.value = (currentTileIndex.value + 1) % gegenstaendeItems.length
      const currentItem = gegenstaendeItems[currentTileIndex.value]
      speakText(currentItem.text)
      autoModeInterval.value = window.setTimeout(cycleTiles, 3000) // 3 Sekunden
    }
    
    const firstItem = gegenstaendeItems[currentTileIndex.value]
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

  // Gegenstand-Item Auswahl
  function selectGegenstaendeItem(gegenstaendeItemId: string) {
    console.log('selectGegenstaendeItem called with gegenstaendeItemId:', gegenstaendeItemId)
    pauseAutoMode()
    
    const selectedItem = gegenstaendeItems.find(item => item.id === gegenstaendeItemId)
    if (selectedItem) {
      selectedGegenstaendeItem.value = selectedItem.text
    }
    
    switch (gegenstaendeItemId) {
      case 'zurueck':
        console.log('Navigating back to /umgebung')
        stopAutoMode() // Stoppe Auto-Modus komplett vor Navigation
        router.push('/umgebung')
        break
      default:
        console.log('Selected Gegenstand-Item:', gegenstaendeItemId)
        speakText(`${selectedItem?.text} ausgewählt`)
        
        // Navigiere zu GegenstaendeVerbenView mit dem ausgewählten Item
        stopAutoMode()
        router.push(`/gegenstaende-verben/${gegenstaendeItemId}`)
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
        const currentItem = gegenstaendeItems[currentTileIndex.value]
        console.log('Blink activation for tile:', currentTileIndex.value, 'gegenstaendeItemId:', currentItem.id, 'text:', currentItem.text)
        
        speakText(currentItem.text)
        selectGegenstaendeItem(currentItem.id)
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
    const currentItem = gegenstaendeItems[currentTileIndex.value]
    console.log('Right click activation for tile:', currentTileIndex.value, 'gegenstaendeItemId:', currentItem.id, 'text:', currentItem.text)
    
    speakText(currentItem.text)
    selectGegenstaendeItem(currentItem.id)
  }

  // Lifecycle
  onMounted(() => {
    if (!faceRecognition.isActive.value) {
      faceRecognition.start()
    }
    
    // Erst den Titel vorlesen
    setTimeout(() => {
      speakText('Wählen Sie einen Gegenstand aus')
    }, 1000)
    
    // Starte den Auto-Mode nach 4 Sekunden (1s für Titel + 3s Pause)
    setTimeout(() => {
      startAutoMode()
    }, 4000)
    
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
    selectedGegenstaendeItem,
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
    gegenstaendeItems,
    speakText,
    toggleTTS,
    startAutoMode,
    pauseAutoMode,
    stopAutoMode,
    selectGegenstaendeItem,
    handleBlink,
    handleRightClick,
    settingsStore,
    faceRecognition
  }
}
