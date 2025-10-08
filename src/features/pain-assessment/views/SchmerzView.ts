import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../settings/stores/settings'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'

export function useSchmerzViewLogic() {
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

  // Schmerz-Items mit Körperteilen - 3x2 Grid wie Ich-View
  const schmerzItems = [
    {
      id: 'kopf',
      title: 'KOPF',
      description: 'Kopfschmerzen dokumentieren',
      icon: 'head.png'
    },
    {
      id: 'beine',
      title: 'BEINE',
      description: 'Beinschmerzen dokumentieren',
      icon: 'leg.png'
    },
    {
      id: 'arme',
      title: 'ARME',
      description: 'Armschmerzen dokumentieren',
      icon: 'elbow-2.png'
    },
    {
      id: 'torso',
      title: 'TORSO',
      description: 'Torsoschmerzen dokumentieren',
      icon: 'living.png'
    },
    {
      id: 'zurueck',
      title: 'ZURÜCK',
      description: 'Zurück zur Hauptansicht',
      icon: 'Goback.svg'
    }
  ]

  // Text-to-Speech Funktion
  const speakText = (text: string) => {
    console.log('SchmerzView speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value, 'speechSynthesis:', speechSynthesis)
    
    if (!isTTSEnabled.value || !speechSynthesis) {
      console.log('SchmerzView TTS disabled or speechSynthesis not available')
      return
    }
    
    speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'de-DE'
    utterance.rate = 0.8
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    console.log('SchmerzView Speaking:', text)
    speechSynthesis.speak(utterance)
  }

  // TTS Toggle
  const toggleTTS = () => {
    console.log('SchmerzView toggleTTS called, current state:', isTTSEnabled.value)
    isTTSEnabled.value = !isTTSEnabled.value
    console.log('SchmerzView TTS toggled to:', isTTSEnabled.value)
    
    if (!isTTSEnabled.value) {
      speechSynthesis.cancel()
      console.log('SchmerzView TTS cancelled')
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
      currentTileIndex.value = (currentTileIndex.value + 1) % schmerzItems.length
      const currentItem = schmerzItems[currentTileIndex.value]
      speakText(currentItem.title)
      autoModeInterval.value = window.setTimeout(cycleTiles, 3000) // 3 Sekunden
    }
    
    const firstItem = schmerzItems[currentTileIndex.value]
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

  // Schmerz-Item Auswahl
  function selectSchmerz(schmerzId: string) {
    console.log('selectSchmerz called with schmerzId:', schmerzId)
    pauseAutoMode()
    
    const selectedItem = schmerzItems.find(item => item.id === schmerzId)
    if (selectedItem) {
      speakText(`${selectedItem.title} ausgewählt`)
    }
    
    switch (schmerzId) {
      case 'zurueck':
        console.log('Navigating back to main menu')
        stopAutoMode() // Stoppe Auto-Modus komplett vor Navigation
        speechSynthesis.cancel() // Stoppe auch TTS
        router.push('/app')
        break
      case 'kopf':
        console.log('Navigating to KopfSchmerzView')
        stopAutoMode()
        router.push('/kopf-schmerz')
        break
      case 'beine':
        console.log('Navigating to BeineSchmerzView')
        stopAutoMode()
        router.push('/beine-schmerz')
        break
      case 'arme':
        console.log('Navigating to ArmeSchmerzView')
        stopAutoMode()
        router.push('/arme-schmerz')
        break
      case 'torso':
        console.log('Navigating to TorsoSchmerzView')
        stopAutoMode()
        router.push('/torso-schmerz')
        break
      default:
        console.log('Selected Schmerz:', schmerzId)
        
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
        const currentItem = schmerzItems[currentTileIndex.value]
        console.log('Blink activation for tile:', currentTileIndex.value, 'schmerzId:', currentItem.id, 'title:', currentItem.title)
        
        speakText(currentItem.title)
        selectSchmerz(currentItem.id)
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
    const currentItem = schmerzItems[currentTileIndex.value]
    console.log('Right click activation for tile:', currentTileIndex.value, 'schmerzId:', currentItem.id, 'title:', currentItem.title)
    
    speakText(currentItem.title)
    selectSchmerz(currentItem.id)
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
    schmerzItems,
    speakText,
    toggleTTS,
    startAutoMode,
    pauseAutoMode,
    stopAutoMode,
    selectSchmerz,
    handleBlink,
    handleRightClick,
    settingsStore,
    faceRecognition
  }
}
