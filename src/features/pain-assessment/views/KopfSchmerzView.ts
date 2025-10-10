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

  // TTS removed

  // Kopf-Bereiche basierend auf dem gezeigten Interface
  const kopfBereiche = [
    // Zeile 1: Stirn, Schläfe, Hinterkopf, Ohren
    { id: 'stirn', text: 'Stirn', type: 'kopfbereich', icon: 'stirn.svg' },
    { id: 'schlaefe', text: 'Schläfe', type: 'kopfbereich', icon: 'schläfe.svg' },
    { id: 'hinterkopf', text: 'Hinterkopf', type: 'kopfbereich', icon: 'hinterkopf.svg' },
    { id: 'ohren', text: 'Ohren', type: 'kopfbereich', icon: 'ohr.svg' },
    // Zeile 2: Nase, Mund, Kiefer, Augen
    { id: 'nase', text: 'Nase', type: 'kopfbereich', icon: 'nase.svg' },
    { id: 'mund', text: 'Mund', type: 'kopfbereich', icon: 'mund.svg' },
    { id: 'kiefer', text: 'Kiefer', type: 'kopfbereich', icon: 'kiefer.svg' },
    { id: 'augen', text: 'Augen', type: 'kopfbereich', icon: 'auge.svg' },
    // Zeile 3: Nacken, Hals, Nebenhöhlen, Zurück
    { id: 'nacken', text: 'Nacken', type: 'kopfbereich', icon: 'nacken.svg' },
    { id: 'hals', text: 'Hals', type: 'kopfbereich', icon: 'hals.svg' },
    { id: 'nebenhoehlen', text: 'Nebenhöhlen', type: 'kopfbereich', icon: 'nebenhöhlen.svg' },
    { id: 'zurueck', text: 'zurück', type: 'navigation', icon: 'Goback.svg' }
  ]

  // TTS removed

  // Volume Toggle Event Handler - TTS removed
  const handleVolumeToggle = (event: CustomEvent) => {
    console.log('KopfSchmerzView received volumeToggle event:', event.detail, '- TTS removed')
  }

  // Auto Mode Funktionen
  const startAutoMode = () => {
    if (autoModeInterval.value) return
    
    console.log('Starting auto-mode with', kopfBereiche.length, 'items')

    const cycleTiles = () => {
      if (!isAutoMode.value || isAutoModePaused.value) {
        return
      }
      currentTileIndex.value = (currentTileIndex.value + 1) % kopfBereiche.length
      const currentItem = kopfBereiche[currentTileIndex.value]
      console.log('Current item:', currentItem.text, '- TTS removed')
      autoModeInterval.value = window.setTimeout(cycleTiles, 3000) // 3 Sekunden
    }
    
    const firstItem = kopfBereiche[currentTileIndex.value]
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

  // Kopf-Bereich Auswahl
  const selectKopfBereich = (kopfBereichId: string) => {
    const selectedItem = kopfBereiche.find(item => item.id === kopfBereichId)
    
    switch (kopfBereichId) {
      case 'zurueck':
        console.log('Navigating back to main pain view')
        stopAutoMode() // Stoppe Auto-Modus komplett vor Navigation
        router.push('/schmerz')
        break
      default:
        console.log('Selected Kopf-Bereich:', kopfBereichId)
        console.log(`${selectedItem?.text} ausgewählt - TTS removed`)
        
        // Navigation zur Schmerzskala
        setTimeout(() => {
          console.log('Navigating to pain scale for:', selectedItem?.text)
          router.push(`/pain-scale?bodyPart=${encodeURIComponent(selectedItem?.text || '')}&returnRoute=/kopf-schmerz`)
        }, 1000)
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
        const currentItem = kopfBereiche[currentTileIndex.value]
        console.log('Blink activation for tile:', currentTileIndex.value, 'kopfBereichId:', currentItem.id, 'text:', currentItem.text)
        
        console.log('Selected item:', currentItem.text, '- TTS removed')
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

  // Right-click handler
  const handleRightClick = (event: MouseEvent) => {
    event.preventDefault()
    console.log('Right click detected - treating as blink')
    const currentItem = kopfBereiche[currentTileIndex.value]
    console.log('Right click activation for tile:', currentTileIndex.value, 'kopfBereichId:', currentItem.id, 'text:', currentItem.text)
    
    console.log('Selected item:', currentItem.text, '- TTS removed')
    selectKopfBereich(currentItem.id)
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
    // TTS removed
    kopfBereiche,
    startAutoMode,
    pauseAutoMode,
    stopAutoMode,
    selectKopfBereich,
    handleBlink,
    handleRightClick,
    handleVolumeToggle,
    settingsStore,
    faceRecognition
  }
}