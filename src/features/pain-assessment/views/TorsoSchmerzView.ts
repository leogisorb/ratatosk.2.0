import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'

export function useTorsoSchmerzViewLogic() {
  // Router
  const router = useRouter()

  // Stores
  const settingsStore = useSettingsStore()

  // Face Recognition
  const faceRecognition = useFaceRecognition()

  // State
  const currentTileIndex = ref(0)
  const selectedTorsoBereich = ref('')
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

  // Torso-Bereiche basierend auf dem gezeigten Interface
  const torsoBereiche = [
    // Zeile 1: Brust, Rücken, Schulterblatt, Wirbelsäule
    { id: 'brust', text: 'Brust', type: 'torsobereich', icon: 'brust.svg' },
    { id: 'ruecken', text: 'Rücken', type: 'torsobereich', icon: 'schulterblätter.svg' },
    { id: 'schulterblatt', text: 'Schulterblatt', type: 'torsobereich', icon: 'schulterblätter.svg' },
    { id: 'wirbelsaeule', text: 'Wirbelsäule', type: 'torsobereich', icon: 'wirbelsaule.svg' },
    
    // Zeile 2: Bauch, Lunge, Herz, Magen
    { id: 'bauch', text: 'Bauch', type: 'torsobereich', icon: 'magen.svg' },
    { id: 'lunge', text: 'Lunge', type: 'torsobereich', icon: 'lunge.svg' },
    { id: 'herz', text: 'Herz', type: 'torsobereich', icon: 'anatomisches-herz.svg' },
    { id: 'magen', text: 'Magen', type: 'torsobereich', icon: 'magen.svg' },
    
    // Zeile 3: Leber, Niere, Blase, Zurück
    { id: 'leber', text: 'Leber', type: 'torsobereich', icon: 'magen.svg' },
    { id: 'niere', text: 'Niere', type: 'torsobereich', icon: 'magen.svg' },
    { id: 'blase', text: 'Blase', type: 'torsobereich', icon: 'blase.svg' },
    { id: 'zurueck', text: 'zurück', type: 'navigation', icon: 'Goback.svg' }
  ]

  // Text-to-Speech Funktion
  const speakText = (text: string) => {
    console.log('TorsoSchmerzView speakText called with:', text, 'isTTSEnabled:', isTTSEnabled.value, 'speechSynthesis:', speechSynthesis)
    
    if (!isTTSEnabled.value || !speechSynthesis) {
      console.log('TorsoSchmerzView TTS disabled or speechSynthesis not available')
      return
    }
    
    speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'de-DE'
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    console.log('TorsoSchmerzView Speaking:', text)
    speechSynthesis.speak(utterance)
  }

  // Volume Toggle Event Handler
  const handleVolumeToggle = (event: CustomEvent) => {
    console.log('TorsoSchmerzView received volumeToggle event:', event.detail)
    if (!event.detail.enabled) {
      speechSynthesis.cancel()
      console.log('TorsoSchmerzView TTS cancelled due to global volume toggle')
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
      currentTileIndex.value = (currentTileIndex.value + 1) % torsoBereiche.length
      const currentItem = torsoBereiche[currentTileIndex.value]
      speakText(currentItem.text)
      autoModeInterval.value = window.setTimeout(cycleTiles, 3000) // 3 Sekunden
    }
    
    const firstItem = torsoBereiche[currentTileIndex.value]
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

  // Torso-Bereich Auswahl
  function selectTorsoBereich(torsoBereichId: string) {
    console.log('selectTorsoBereich called with torsoBereichId:', torsoBereichId)
    pauseAutoMode()
    
    const selectedItem = torsoBereiche.find(item => item.id === torsoBereichId)
    if (selectedItem) {
      selectedTorsoBereich.value = selectedItem.text
    }
    
    switch (torsoBereichId) {
      case 'zurueck':
        console.log('Navigating back to /schmerz')
        stopAutoMode() // Stoppe Auto-Modus komplett vor Navigation
        router.push('/schmerz')
        break
      default:
        console.log('Selected Torso-Bereich:', torsoBereichId)
        speakText(`${selectedItem?.text} ausgewählt`)
        
        // Navigation zur Schmerzskala
        setTimeout(() => {
          console.log('Navigating to pain scale for:', selectedItem?.text)
          router.push(`/pain-scale?bodyPart=${encodeURIComponent(selectedItem?.text || '')}&returnRoute=/torso-schmerz`)
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
        const currentItem = torsoBereiche[currentTileIndex.value]
        console.log('Blink activation for tile:', currentTileIndex.value, 'torsoBereichId:', currentItem.id, 'text:', currentItem.text)
        
        speakText(currentItem.text)
        selectTorsoBereich(currentItem.id)
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
    const currentItem = torsoBereiche[currentTileIndex.value]
    console.log('Right click activation for tile:', currentTileIndex.value, 'torsoBereichId:', currentItem.id, 'text:', currentItem.text)
    
    speakText(currentItem.text)
    selectTorsoBereich(currentItem.id)
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
    selectedTorsoBereich,
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
    torsoBereiche,
    speakText,
    startAutoMode,
    pauseAutoMode,
    stopAutoMode,
    selectTorsoBereich,
    handleBlink,
    handleRightClick,
    settingsStore,
    faceRecognition
  }
}
