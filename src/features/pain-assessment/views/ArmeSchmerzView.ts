import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'

export function useArmeSchmerzViewLogic() {
  // Router
  const router = useRouter()

  // Stores
  const settingsStore = useSettingsStore()

  // Face Recognition
  const faceRecognition = useFaceRecognition()

  // State
  const currentTileIndex = ref(0)
  const selectedArmBereich = ref('')
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

  // Arm-Bereiche basierend auf dem gezeigten Interface
  const armBereiche = [
    // Zeile 1: Oberarm, Unterarm, Ellenbogen, Handgelenk
    { id: 'oberarm', text: 'Oberarm', type: 'armbereich', icon: 'oberarm.svg' },
    { id: 'unterarm', text: 'Unterarm', type: 'armbereich', icon: 'unterarm.svg' },
    { id: 'ellenbogen', text: 'Ellenbogen', type: 'armbereich', icon: 'ellenbogen.svg' },
    { id: 'handgelenk', text: 'Handgelenk', type: 'armbereich', icon: 'ellebogen.svg' },
    
    // Zeile 2: Hand, Finger, Schulter, Daumen
    { id: 'hand', text: 'Hand', type: 'armbereich', icon: 'handfläche.svg' },
    { id: 'finger', text: 'Finger', type: 'armbereich', icon: 'finger.svg' },
    { id: 'schulter', text: 'Schulter', type: 'armbereich', icon: 'schulter.svg' },
    { id: 'daumen', text: 'Daumen', type: 'armbereich', icon: 'finger.svg' },
    
    // Zeile 3: Achsel, Handrücken, Handfläche, Zurück
    { id: 'achsel', text: 'Achsel', type: 'armbereich', icon: 'achsel.svg' },
    { id: 'handruecken', text: 'Handrücken', type: 'armbereich', icon: 'handrücken.svg' },
    { id: 'handflaeche', text: 'Handfläche', type: 'armbereich', icon: 'handfläche.svg' },
    { id: 'zurueck', text: 'zurück', type: 'navigation', icon: 'Goback.svg' }
  ]

  // Text-to-Speech Funktion
  const speakText = (text: string) => {
    console.log('ArmeSchmerzView speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value, 'speechSynthesis:', speechSynthesis)
    
    if (!isTTSEnabled.value || !speechSynthesis) {
      console.log('ArmeSchmerzView TTS disabled or speechSynthesis not available')
      return
    }
    
    speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'de-DE'
    utterance.rate = 0.8
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    console.log('ArmeSchmerzView Speaking:', text)
    speechSynthesis.speak(utterance)
  }

  // TTS Toggle
  const toggleTTS = () => {
    console.log('ArmeSchmerzView toggleTTS called, current state:', isTTSEnabled.value)
    isTTSEnabled.value = !isTTSEnabled.value
    console.log('ArmeSchmerzView TTS toggled to:', isTTSEnabled.value)
    
    if (!isTTSEnabled.value) {
      speechSynthesis.cancel()
      console.log('ArmeSchmerzView TTS cancelled')
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
      currentTileIndex.value = (currentTileIndex.value + 1) % armBereiche.length
      const currentItem = armBereiche[currentTileIndex.value]
      speakText(currentItem.text)
      autoModeInterval.value = window.setTimeout(cycleTiles, 3000) // 3 Sekunden
    }
    
    const firstItem = armBereiche[currentTileIndex.value]
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

  // Arm-Bereich Auswahl
  function selectArmBereich(armBereichId: string) {
    console.log('selectArmBereich called with armBereichId:', armBereichId)
    pauseAutoMode()
    
    const selectedItem = armBereiche.find(item => item.id === armBereichId)
    if (selectedItem) {
      selectedArmBereich.value = selectedItem.text
    }
    
    switch (armBereichId) {
      case 'zurueck':
        console.log('Navigating back to /schmerz')
        stopAutoMode() // Stoppe Auto-Modus komplett vor Navigation
        router.push('/schmerz')
        break
      default:
        console.log('Selected Arm-Bereich:', armBereichId)
        speakText(`${selectedItem?.text} ausgewählt`)
        
        // Navigation zur Schmerzskala
        setTimeout(() => {
          console.log('Navigating to pain scale for:', selectedItem?.text)
          router.push(`/pain-scale?bodyPart=${encodeURIComponent(selectedItem?.text || '')}&returnRoute=/arme-schmerz`)
        }, 2000)
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
        const currentItem = armBereiche[currentTileIndex.value]
        console.log('Blink activation for tile:', currentTileIndex.value, 'armBereichId:', currentItem.id, 'text:', currentItem.text)
        
        speakText(currentItem.text)
        selectArmBereich(currentItem.id)
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
    const currentItem = armBereiche[currentTileIndex.value]
    console.log('Right click activation for tile:', currentTileIndex.value, 'armBereichId:', currentItem.id, 'text:', currentItem.text)
    
    speakText(currentItem.text)
    selectArmBereich(currentItem.id)
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
    selectedArmBereich,
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
    armBereiche,
    speakText,
    toggleTTS,
    startAutoMode,
    pauseAutoMode,
    stopAutoMode,
    selectArmBereich,
    handleBlink,
    handleRightClick,
    settingsStore,
    faceRecognition
  }
}
