import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'

export function useBeineSchmerzViewLogic() {
  // Router
  const router = useRouter()

  // Stores
  const settingsStore = useSettingsStore()

  // Face Recognition
  const faceRecognition = useFaceRecognition()

  // State
  const currentTileIndex = ref(0)
  const selectedBeinBereich = ref('')
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
  const isTTSEnabled = computed(() => settingsStore.settings.voiceEnabled)

  // Bein-Bereiche basierend auf dem gezeigten Interface
  const beinBereiche = [
    // Zeile 1: Oberschenkel, Knie, Unterschenkel, Knöchel
    { id: 'oberschenkel', text: 'Oberschenkel', type: 'beinbereich', icon: 'OBERSCHENKEL.svg' },
    { id: 'knie', text: 'Knie', type: 'beinbereich', icon: 'KNIE.svg' },
    { id: 'unterschenkel', text: 'Unterschenkel', type: 'beinbereich', icon: 'UNTERSCHENKEL.svg' },
    { id: 'knoechel', text: 'Knöchel', type: 'beinbereich', icon: 'KNÖCHEL.svg' },
    
    // Zeile 2: Fuß, Zehen, Hüfte, Wade
    { id: 'fuss', text: 'Fuß', type: 'beinbereich', icon: 'FUSBALLEN.svg' },
    { id: 'zehen', text: 'Zehen', type: 'beinbereich', icon: 'ZEHEN.svg' },
    { id: 'huefte', text: 'Hüfte', type: 'beinbereich', icon: 'hüfte.svg' },
    { id: 'wade', text: 'Wade', type: 'beinbereich', icon: 'UNTERSCHENKEL.svg' },
    
    // Zeile 3: Leiste, Gesäß, Sprunggelenk, Zurück
    { id: 'leiste', text: 'Leiste', type: 'beinbereich', icon: 'hüfte.svg' },
    { id: 'gesaess', text: 'Gesäß', type: 'beinbereich', icon: 'hüfte.svg' },
    { id: 'sprunggelenk', text: 'Sprunggelenk', type: 'beinbereich', icon: 'KNÖCHEL.svg' },
    { id: 'zurueck', text: 'zurück', type: 'navigation', icon: 'Goback.svg' }
  ]

  // Text-to-Speech Funktion
  const speakText = (text: string) => {
    console.log('BeineSchmerzView speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value, 'speechSynthesis:', speechSynthesis)
    
    if (!isTTSEnabled.value || !speechSynthesis) {
      console.log('BeineSchmerzView TTS disabled or speechSynthesis not available')
      return
    }
    
    speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'de-DE'
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    console.log('BeineSchmerzView Speaking:', text)
    speechSynthesis.speak(utterance)
  }

  // Volume Toggle Event Handler
  const handleVolumeToggle = (event: CustomEvent) => {
    console.log('BeineSchmerzView received volumeToggle event:', event.detail)
    if (!event.detail.enabled) {
      speechSynthesis.cancel()
      console.log('BeineSchmerzView TTS cancelled due to global volume toggle')
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
      currentTileIndex.value = (currentTileIndex.value + 1) % beinBereiche.length
      const currentItem = beinBereiche[currentTileIndex.value]
      speakText(currentItem.text)
      autoModeInterval.value = window.setTimeout(cycleTiles, 3000) // 3 Sekunden
    }
    
    const firstItem = beinBereiche[currentTileIndex.value]
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

  // Bein-Bereich Auswahl
  function selectBeinBereich(beinBereichId: string) {
    console.log('selectBeinBereich called with beinBereichId:', beinBereichId)
    pauseAutoMode()
    
    const selectedItem = beinBereiche.find(item => item.id === beinBereichId)
    if (selectedItem) {
      selectedBeinBereich.value = selectedItem.text
    }
    
    switch (beinBereichId) {
      case 'zurueck':
        console.log('Navigating back to /schmerz')
        stopAutoMode() // Stoppe Auto-Modus komplett vor Navigation
        router.push('/schmerz')
        break
      default:
        console.log('Selected Bein-Bereich:', beinBereichId)
        speakText(`${selectedItem?.text} ausgewählt`)
        
        // Navigation zur Schmerzskala
        setTimeout(() => {
          console.log('Navigating to pain scale for:', selectedItem?.text)
          router.push(`/pain-scale?bodyPart=${encodeURIComponent(selectedItem?.text || '')}&returnRoute=/beine-schmerz`)
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
        const currentItem = beinBereiche[currentTileIndex.value]
        console.log('Blink activation for tile:', currentTileIndex.value, 'beinBereichId:', currentItem.id, 'text:', currentItem.text)
        
        speakText(currentItem.text)
        selectBeinBereich(currentItem.id)
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
    const currentItem = beinBereiche[currentTileIndex.value]
    console.log('Right click activation for tile:', currentTileIndex.value, 'beinBereichId:', currentItem.id, 'text:', currentItem.text)
    
    speakText(currentItem.text)
    selectBeinBereich(currentItem.id)
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
    window.addEventListener('volumeToggle', handleVolumeToggle as EventListener)
  })

  onUnmounted(() => {
    document.removeEventListener('contextmenu', handleRightClick)
    window.removeEventListener('volumeToggle', handleVolumeToggle as EventListener)
    stopAutoMode()
  })

  return {
    currentTileIndex,
    selectedBeinBereich,
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
    beinBereiche,
    speakText,
    startAutoMode,
    pauseAutoMode,
    stopAutoMode,
    selectBeinBereich,
    handleBlink,
    handleRightClick,
    settingsStore,
    faceRecognition
  }
}
