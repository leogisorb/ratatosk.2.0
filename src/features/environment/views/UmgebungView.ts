import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../settings/stores/settings'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'

export function useUmgebungViewLogic() {
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

  // Verbesserte Blink-Detection Parameter - zentral gesteuert
  const blinkThreshold = computed(() => Math.ceil(settingsStore.settings.blinkSensitivity * 10)) // Konvertiere Sekunden zu Frames (10 FPS)
  const lastBlinkTime = ref(0)
  const blinkCooldown = computed(() => settingsStore.settings.blinkSensitivity * 1000)

  // Text-to-Speech
  const speechSynthesis = window.speechSynthesis
  const isTTSEnabled = ref(true)

  // Umgebung-Items mit Bereichen - 3x2 Grid wie SchmerzView
  const umgebungItems = [
    {
      id: 'bett',
      title: 'BETT',
      description: 'Bett-Bereich auswählen',
      icon: 'Schmerz.svg'
    },
    {
      id: 'zimmer',
      title: 'ZIMMER',
      description: 'Zimmer-Bereich auswählen',
      icon: 'Umgebung.svg'
    },
    {
      id: 'gegenstaende',
      title: 'GEGENSTÄNDE',
      description: 'Gegenstände-Bereich auswählen',
      icon: 'house-chimney.svg'
    },
    {
      id: 'zurueck',
      title: 'ZURÜCK',
      description: 'Zurück zur Hauptansicht',
      icon: 'zurueck.svg'
    }
  ]

  // Text-to-Speech Funktion
  const speakText = (text: string) => {
    console.log('UmgebungView speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value, 'speechSynthesis:', speechSynthesis)
    
    if (!isTTSEnabled.value || !speechSynthesis) {
      console.log('UmgebungView TTS disabled or speechSynthesis not available')
      return
    }
    
    speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'de-DE'
    utterance.rate = 0.8
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    console.log('UmgebungView Speaking:', text)
    speechSynthesis.speak(utterance)
  }

  // TTS Toggle
  const toggleTTS = () => {
    console.log('UmgebungView toggleTTS called, current state:', isTTSEnabled.value)
    isTTSEnabled.value = !isTTSEnabled.value
    console.log('UmgebungView TTS toggled to:', isTTSEnabled.value)
    
    if (!isTTSEnabled.value) {
      speechSynthesis.cancel()
      console.log('UmgebungView TTS cancelled')
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
      
      // Wenn wir am Ende des Loops sind, warte 2,5s und starte neuen Loop mit Titel
      if (currentTileIndex.value === umgebungItems.length - 1) {
        // Warte 2,5 Sekunden nach dem letzten Tile
        autoModeInterval.value = window.setTimeout(() => {
          // Lese den Titel vor
          speakText('Was möchten Sie an ihrer Umgebung verändern?')
          // Warte 5 Sekunden nach dem Titel (für vollständiges Vorlesen)
          autoModeInterval.value = window.setTimeout(() => {
            currentTileIndex.value = 0 // Zurück zum Anfang
            const currentItem = umgebungItems[currentTileIndex.value]
            speakText(currentItem.title)
            autoModeInterval.value = window.setTimeout(cycleTiles, 3000)
          }, 5000)
        }, 2500)
        return
      } else {
        currentTileIndex.value = (currentTileIndex.value + 1) % umgebungItems.length
      }
      
      const currentItem = umgebungItems[currentTileIndex.value]
      speakText(currentItem.title)
      autoModeInterval.value = window.setTimeout(cycleTiles, 3000) // 3 Sekunden
    }
    
    const firstItem = umgebungItems[currentTileIndex.value]
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

  const stopAutoMode = () => {
    if (autoModeInterval.value) {
      clearTimeout(autoModeInterval.value)
      autoModeInterval.value = null
    }
    speechSynthesis.cancel()
  }

  // Umgebung-Item Auswahl
  function selectUmgebungItem(umgebungId: string) {
    console.log('selectUmgebungItem called with umgebungId:', umgebungId)
    pauseAutoMode()
    
    const selectedItem = umgebungItems.find(item => item.id === umgebungId)
    if (selectedItem) {
      speakText(`${selectedItem.title} ausgewählt`)
    }
    
    switch (umgebungId) {
      case 'zurueck':
        console.log('Navigating back to /app')
        stopAutoMode() // Stoppe Auto-Modus komplett vor Navigation
        speechSynthesis.cancel() // Stoppe auch TTS
        router.push('/app')
        break
      case 'bett':
        console.log('Navigating to BettView')
        stopAutoMode()
        router.push('/bett')
        break
      case 'zimmer':
        console.log('Navigating to ZimmerView')
        stopAutoMode()
        router.push('/zimmer')
        break
      case 'gegenstaende':
        console.log('Navigating to GegenstaendeView')
        stopAutoMode()
        router.push('/gegenstaende')
        break
      default:
        console.log('Selected Umgebung:', umgebungId)
        
        // Auto-Modus nach 10 Sekunden wieder starten
        setTimeout(() => {
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
        const currentItem = umgebungItems[currentTileIndex.value]
        console.log('Blink activation for tile:', currentTileIndex.value, 'umgebungId:', currentItem.id, 'title:', currentItem.title)
        
        speakText(currentItem.title)
        selectUmgebungItem(currentItem.id)
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
    const currentItem = umgebungItems[currentTileIndex.value]
    console.log('Right click activation for tile:', currentTileIndex.value, 'umgebungId:', currentItem.id, 'title:', currentItem.title)
    
    speakText(currentItem.title)
    selectUmgebungItem(currentItem.id)
  }

  // Lifecycle
  onMounted(() => {
    if (!faceRecognition.isActive.value) {
      faceRecognition.start()
    }
    
    // Erst den Titel vorlesen und dann Auto-Mode starten
    setTimeout(() => {
      speakText('Was möchten Sie an ihrer Umgebung verändern?')
      // Warte 5 Sekunden nach dem Titel (für vollständiges Vorlesen)
      setTimeout(() => {
        startAutoMode()
      }, 5000)
    }, 1000)
    
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
    isAutoMode,
    autoModeInterval,
    closedFrames,
    eyesClosed,
    isAutoModePaused,
    blinkThreshold,
    lastBlinkTime,
    blinkCooldown,
    speechSynthesis,
    isTTSEnabled,
    umgebungItems,
    speakText,
    toggleTTS,
    startAutoMode,
    pauseAutoMode,
    stopAutoMode,
    selectUmgebungItem,
    handleBlink,
    handleRightClick,
    settingsStore,
    faceRecognition
  }
}
