import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'

export function useSchmerzViewLogic() {
  // Router
  const router = useRouter()

  // Stores
  const settingsStore = useSettingsStore()

  // Face Recognition
  const faceRecognition = useFaceRecognition()

  // State
  const currentTileIndex = ref(0)
  const selectedSchmerzBereich = ref('')
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

  // TTS removed

  // Schmerz-Bereiche basierend auf dem gezeigten Interface
  const schmerzBereiche = [
    { id: 'kopf', text: 'Kopf', type: 'schmerzbereich', icon: 'Kopf.svg' },
    { id: 'beine', text: 'Beine', type: 'schmerzbereich', icon: 'Beine.svg' },
    { id: 'arme', text: 'Arme', type: 'schmerzbereich', icon: 'Arme.svg' },
    { id: 'torso', text: 'Torso', type: 'schmerzbereich', icon: 'Torso.svg' },
    { id: 'zurueck', text: 'zurück', type: 'navigation', icon: 'zurueck.svg' }
  ]

  // TTS removed

  // Volume Toggle Event Handler - TTS removed
  const handleVolumeToggle = (event: CustomEvent) => {
    console.log('SchmerzView received volumeToggle event:', event.detail, '- TTS removed')
  }

  // Auto Mode Funktionen
  const startAutoMode = () => {
    if (autoModeInterval.value) return
    
    console.log('Starting auto-mode with', schmerzBereiche.length, 'items')

    const cycleTiles = () => {
      if (!isAutoMode.value || isAutoModePaused.value) {
        return
      }
      currentTileIndex.value = (currentTileIndex.value + 1) % schmerzBereiche.length
      const currentItem = schmerzBereiche[currentTileIndex.value]
      console.log('Current item:', currentItem.text, '- TTS removed')
      autoModeInterval.value = window.setTimeout(cycleTiles, 3000) // 3 Sekunden
    }
    
    const firstItem = schmerzBereiche[currentTileIndex.value]
    console.log('First item:', firstItem.text, '- TTS removed')
    
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
    // TTS removed
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
    // TTS removed
  }

  // Schmerz-Bereich Auswahl
  const selectSchmerzBereich = (schmerzBereichId: string) => {
    const selectedItem = schmerzBereiche.find(item => item.id === schmerzBereichId)
    
    switch (schmerzBereichId) {
      case 'zurueck':
        console.log('Navigating back to home view')
        stopAutoMode() // Stoppe Auto-Modus komplett vor Navigation
        router.push('/app')
        break
      case 'kopf':
        console.log('Navigating to Kopf-Schmerz view')
        stopAutoMode()
        router.push('/kopf-schmerz')
        break
      case 'beine':
        console.log('Navigating to Beine-Schmerz view')
        stopAutoMode()
        router.push('/beine-schmerz')
        break
      case 'arme':
        console.log('Navigating to Arme-Schmerz view')
        stopAutoMode()
        router.push('/arme-schmerz')
        break
      case 'torso':
        console.log('Navigating to Torso-Schmerz view')
        stopAutoMode()
        router.push('/torso-schmerz')
        break
      default:
        console.log('Selected Schmerz-Bereich:', schmerzBereichId)
        console.log(`${selectedItem?.text} ausgewählt - TTS removed`)
        break
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
        const currentItem = schmerzBereiche[currentTileIndex.value]
        console.log('Blink activation for tile:', currentTileIndex.value, 'schmerzBereichId:', currentItem.id, 'text:', currentItem.text)
        
        console.log('Selected item:', currentItem.text, '- TTS removed')
        selectSchmerzBereich(currentItem.id)
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

  // Right-click handler
  const handleRightClick = (event: MouseEvent) => {
    event.preventDefault()
    console.log('Right click detected - treating as blink')
    const currentItem = schmerzBereiche[currentTileIndex.value]
    console.log('Right click activation for tile:', currentTileIndex.value, 'schmerzBereichId:', currentItem.id, 'text:', currentItem.text)
    
    console.log('Selected item:', currentItem.text, '- TTS removed')
    selectSchmerzBereich(currentItem.id)
  }

  // Lifecycle
  onMounted(() => {
    // Start face recognition if not active
    if (!faceRecognition.isActive.value) {
      faceRecognition.start()
    }

    // Setup blink detection interval
    const blinkCheckInterval = setInterval(handleBlink, 100)

    // Setup event listeners
    const rightClickHandler = (event: MouseEvent) => handleRightClick(event)
    const volumeToggleHandler = (event: CustomEvent) => handleVolumeToggle(event)

    document.addEventListener('contextmenu', rightClickHandler)
    window.addEventListener('volumeToggle', volumeToggleHandler as EventListener)

    // Start auto-mode after a short delay
    setTimeout(() => {
      startAutoMode()
    }, 1000)

    // Cleanup function
    return () => {
      clearInterval(blinkCheckInterval)
      document.removeEventListener('contextmenu', rightClickHandler)
      window.removeEventListener('volumeToggle', volumeToggleHandler as EventListener)
      stopAutoMode()
    }
  })

  onUnmounted(() => {
    stopAutoMode()
  })

  return {
    // State
    currentTileIndex,
    selectedSchmerzBereich,
    isAutoMode,
    autoModeInterval,
    closedFrames,
    eyesClosed,
    isAutoModePaused,
    restartTimeout,
    blinkThreshold,
    lastBlinkTime,
    blinkCooldown,
    // TTS removed
    speechSynthesis: null,
    isTTSEnabled: false,
    speakText: () => {},
    schmerzBereiche,
    startAutoMode,
    pauseAutoMode,
    stopAutoMode,
    selectSchmerzBereich,
    handleFaceBlink: handleBlink,
    handleRightClick,
    handleVolumeToggle,
    settingsStore,
    faceRecognition
  }
}