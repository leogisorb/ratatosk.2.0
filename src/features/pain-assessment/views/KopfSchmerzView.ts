import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'

export function useKopfSchmerzViewLogic() {
  // Router
  const router = useRouter()

  // Stores
  const settingsStore = useSettingsStore()

  // Face Recognition
  const faceRecognition = useFaceRecognition()

  // State
  const currentTileIndex = ref(0)
  const selectedKopfBereich = ref('')
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

  // Kopf-Bereiche basierend auf dem gezeigten Interface
  const kopfBereiche = [
    // Zeile 1: Stirn, Hinterkopf, Schläfe, Nacken
    { id: 'stirn', text: 'Stirn', type: 'kopfbereich', icon: 'stirn.svg' },
    { id: 'hinterkopf', text: 'Hinterkopf', type: 'kopfbereich', icon: 'hinterkopf.svg' },
    { id: 'schlaefe', text: 'Schläfe', type: 'kopfbereich', icon: 'schläfe.svg' },
    { id: 'nacken', text: 'Nacken', type: 'kopfbereich', icon: 'nacken.svg' },
    
    // Zeile 2: Kiefer, Nebenhöhlen, Hals, Auge
    { id: 'kiefer', text: 'Kiefer', type: 'kopfbereich', icon: 'kiefer.svg' },
    { id: 'nebenhoehlen', text: 'Nebenhöhlen', type: 'kopfbereich', icon: 'nebenhoehlen.svg' },
    { id: 'hals', text: 'Hals', type: 'kopfbereich', icon: 'hals.svg' },
    { id: 'auge', text: 'Auge', type: 'kopfbereich', icon: 'auge.svg' },
    
    // Zeile 3: Nase, Mund, Speiseröhre, Zurück
    { id: 'nase', text: 'Nase', type: 'kopfbereich', icon: 'nase.svg' },
    { id: 'mund', text: 'Mund', type: 'kopfbereich', icon: 'mund.svg' },
    { id: 'speiseroehre', text: 'Speiseröhre', type: 'kopfbereich', icon: 'speiseröhre.svg' },
    { id: 'zurueck', text: 'zurück', type: 'navigation', icon: 'Goback.svg' }
  ]

  // Text-to-Speech Funktion
  const speakText = (text: string) => {
    console.log('KopfSchmerzView speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value, 'speechSynthesis:', speechSynthesis)
    
    if (!isTTSEnabled.value || !speechSynthesis) {
      console.log('KopfSchmerzView TTS disabled or speechSynthesis not available')
      return
    }
    
    speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'de-DE'
    utterance.rate = 0.8
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    console.log('KopfSchmerzView Speaking:', text)
    speechSynthesis.speak(utterance)
  }

  // TTS Toggle
  const toggleTTS = () => {
    console.log('KopfSchmerzView toggleTTS called, current state:', isTTSEnabled.value)
    isTTSEnabled.value = !isTTSEnabled.value
    console.log('KopfSchmerzView TTS toggled to:', isTTSEnabled.value)
    
    if (!isTTSEnabled.value) {
      speechSynthesis.cancel()
      console.log('KopfSchmerzView TTS cancelled')
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
      currentTileIndex.value = (currentTileIndex.value + 1) % kopfBereiche.length
      const currentItem = kopfBereiche[currentTileIndex.value]
      speakText(currentItem.text)
      autoModeInterval.value = window.setTimeout(cycleTiles, 3000) // 3 Sekunden
    }
    
    const firstItem = kopfBereiche[currentTileIndex.value]
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

  // Kopf-Bereich Auswahl
  function selectKopfBereich(kopfBereichId: string) {
    console.log('selectKopfBereich called with kopfBereichId:', kopfBereichId)
    pauseAutoMode()
    
    const selectedItem = kopfBereiche.find(item => item.id === kopfBereichId)
    if (selectedItem) {
      selectedKopfBereich.value = selectedItem.text
    }
    
    switch (kopfBereichId) {
      case 'zurueck':
        console.log('Navigating back to /schmerz')
        stopAutoMode() // Stoppe Auto-Modus komplett vor Navigation
        router.push('/schmerz')
        break
      default:
        console.log('Selected Kopf-Bereich:', kopfBereichId)
        speakText(`${selectedItem?.text} ausgewählt`)
        
        // Navigation zur Schmerzskala
        setTimeout(() => {
          console.log('Navigating to pain scale for:', selectedItem?.text)
          router.push(`/pain-scale?bodyPart=${encodeURIComponent(selectedItem?.text || '')}&returnRoute=/kopf-schmerz`)
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
        const currentItem = kopfBereiche[currentTileIndex.value]
        console.log('Blink activation for tile:', currentTileIndex.value, 'kopfBereichId:', currentItem.id, 'text:', currentItem.text)
        
        speakText(currentItem.text)
        selectKopfBereich(currentItem.id)
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
    const currentItem = kopfBereiche[currentTileIndex.value]
    console.log('Right click activation for tile:', currentTileIndex.value, 'kopfBereichId:', currentItem.id, 'text:', currentItem.text)
    
    speakText(currentItem.text)
    selectKopfBereich(currentItem.id)
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
    selectedKopfBereich,
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
    kopfBereiche,
    speakText,
    toggleTTS,
    startAutoMode,
    pauseAutoMode,
    stopAutoMode,
    selectKopfBereich,
    handleBlink,
    handleRightClick,
    settingsStore,
    faceRecognition
  }
}
