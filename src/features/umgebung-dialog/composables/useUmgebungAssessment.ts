import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../settings/stores/settings'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'
import { useAutoMode } from '../../../shared/composables/useAutoMode'

// Centralized umgebung-dialog logic
// This eliminates duplicate auto-mode, TTS, and blink detection implementations

export function useUmgebungAssessment() {
  // Router
  const router = useRouter()

  // Stores
  const settingsStore = useSettingsStore()

  // Face Recognition
  const faceRecognition = useFaceRecognition()

  // State
  const currentTileIndex = ref(0)
  const isAutoMode = ref(true)
  const closedFrames = ref(0)
  const eyesClosed = ref(false)
  const userInteracted = ref(false)
  const isSpeaking = ref(false)

  // Blink detection parameters - centralized
  const blinkThreshold = computed(() => Math.ceil(settingsStore.settings.blinkSensitivity * 10))
  const lastBlinkTime = ref(0)
  const blinkCooldown = computed(() => settingsStore.settings.blinkSensitivity * 1000)

  // TTS über SimpleFlowController
  const speakText = async (text: string) => {
    console.log('UmgebungAssessment: Requesting TTS for:', text)
    console.log('UmgebungAssessment: userInteracted:', userInteracted.value)
    console.log('UmgebungAssessment: simpleFlowController available:', !!simpleFlowController)
    
    isSpeaking.value = true
    try {
      await simpleFlowController.speak(text)
      console.log('UmgebungAssessment: TTS completed successfully')
    } catch (error) {
      console.error('UmgebungAssessment: TTS error:', error)
    }
    isSpeaking.value = false
  }

  // User interaction detection - aktiviert TTS
  const enableTTSOnInteraction = () => {
    if (!userInteracted.value) {
      console.log('UmgebungAssessment: User interaction detected - TTS now enabled')
      userInteracted.value = true
      simpleFlowController.setUserInteracted(true)
    }
  }

  // TTS sofort aktivieren für UmgebungDialogView
  userInteracted.value = true
  simpleFlowController.setUserInteracted(true)
  console.log('UmgebungAssessment: TTS activated immediately')

  // Auto-Mode Instanz (wird dynamisch erstellt)
  let autoModeInstance: ReturnType<typeof useAutoMode> | null = null

  // Auto-Mode Funktionen über useAutoMode
  const startAutoMode = async (items: any[], initialDelay: number = 3000, cycleDelay: number = 3000) => {
    if (!isAutoMode.value) return

    console.log('UmgebungAssessment: Starting auto-mode with', items.length, 'items')
    
    // Stoppe vorherige Instanz falls vorhanden
    if (autoModeInstance) {
      autoModeInstance.stop()
    }
    
    // Spezielle Behandlung für UmgebungDialogView: Erst Titel vorlesen
    const isMainView = items.some(item => item.id === 'bett' || item.id === 'zimmer' || item.id === 'gegenstaende')
    const isSubRegionView = items.some(item => item.emoji !== undefined)
    const isSubSubRegionView = items.some(item => item.verb !== undefined)
    
    let titleText = ''
    if (isMainView) {
      titleText = 'Was möchten Sie an ihrer Umgebung verändern?'
      // Zusätzliche Pause nach dem Titel
      initialDelay = initialDelay + 1000
    } else if (isSubRegionView) {
      // Sub-Region Titel wird bereits in UmgebungDialogView.vue gesprochen
      // skipTitle = true wird verwendet
      initialDelay = initialDelay + 1000
    } else if (isSubSubRegionView) {
      // Sub-Sub-Region Titel wird bereits in UmgebungDialogView.vue gesprochen
      // skipTitle = true wird verwendet
      initialDelay = initialDelay + 1000
    }
    
    // Erstelle neue Auto-Mode Instanz
    autoModeInstance = useAutoMode({
      speak: speakText,
      getItems: () => items,
      getTitle: () => titleText,
      onCycle: (currentIndex, currentItem) => {
        currentTileIndex.value = currentIndex
      },
      initialDelay,
      cycleDelay
    })
    
    // Starte Auto-Mode (skipTitle = true wenn Titel bereits gesprochen wurde)
    const skipTitle = isSubRegionView || isSubSubRegionView || isMainView
    autoModeInstance.start(skipTitle)
    
    // Für MainView: Titel separat sprechen
    if (isMainView && titleText) {
      setTimeout(() => {
        speakText(titleText)
      }, 1000)
    }
  }

  const pauseAutoMode = () => {
    console.log('UmgebungAssessment: Pausing auto-mode')
    if (autoModeInstance) {
      autoModeInstance.stop()
    }
  }

  const stopAutoMode = () => {
    console.log('UmgebungAssessment: Stopping auto-mode')
    if (autoModeInstance) {
      autoModeInstance.stop()
      autoModeInstance = null
    }
  }

  // Centralized blink detection
  const handleBlink = (items: any[], onSelection: (item: any) => void) => {
    const now = Date.now()
    
    if (faceRecognition.isBlinking()) {
      closedFrames.value++
      
      if (now - lastBlinkTime.value < blinkCooldown.value) {
        return
      }
      
      if (closedFrames.value >= blinkThreshold.value && !eyesClosed.value) {
        const currentItem = items[currentTileIndex.value]
        if (currentItem) {
          console.log('Blink activation for item:', currentItem.id || currentItem.title)
          onSelection(currentItem)
          eyesClosed.value = true
          lastBlinkTime.value = now
          closedFrames.value = 0
        }
      }
    } else {
      if (closedFrames.value > 0) {
        closedFrames.value = 0
        eyesClosed.value = false
      }
    }
  }

  // Centralized right-click handler
  const handleRightClick = (event: MouseEvent, items: any[], onSelection: (item: any) => void) => {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    console.log('Right click detected! Current tile index:', currentTileIndex.value, 'Items length:', items.length)
    const currentItem = items[currentTileIndex.value]
    if (currentItem) {
      console.log('Right click activation for item:', currentItem.id || currentItem.title)
      onSelection(currentItem)
    } else {
      console.log('No current item found for right click')
    }
    return false
  }

  // Touch handler für Umgebung-Dialog
  const handleTouch = (event: TouchEvent, items: any[], onSelection: (item: any) => void) => {
    event.preventDefault()
    event.stopPropagation()
    console.log('Touch detected in Umgebung-Dialog')
    const currentItem = items[currentTileIndex.value]
    if (currentItem) {
      console.log('Touch activation for item:', currentItem.id || currentItem.title)
      onSelection(currentItem)
    }
  }

  // Click handler für Umgebung-Dialog
  const handleClick = (event: MouseEvent, items: any[], onSelection: (item: any) => void) => {
    event.preventDefault()
    event.stopPropagation()
    console.log('Click detected in Umgebung-Dialog')
    const currentItem = items[currentTileIndex.value]
    if (currentItem) {
      console.log('Click activation for item:', currentItem.id || currentItem.title)
      onSelection(currentItem)
    }
  }

  // Volume toggle handler
  const handleVolumeToggle = (event: CustomEvent) => {
    if (!event.detail.enabled) {
      // Verwende SimpleFlowController für konsistente TTS-Kontrolle
      simpleFlowController.stopTTS()
      isSpeaking.value = false
    }
  }

  // Navigation helpers
  const navigateBack = (route: string = '/umgebung-dialog') => {
    stopAutoMode()
    router.push(route)
  }

  // Lifecycle management
  const setupLifecycle = (items: any[], onSelection: (item: any) => void) => {
    // Setze UmgebungDialogView als aktiven View
    simpleFlowController.setActiveView('/umgebung-dialog')
    
    // Start face recognition if not active
    if (!faceRecognition.isActive.value) {
      faceRecognition.start()
    }

    // Add global event listeners to detect user interaction
    document.addEventListener('click', enableTTSOnInteraction)
    document.addEventListener('keydown', enableTTSOnInteraction)
    document.addEventListener('touchstart', enableTTSOnInteraction)

    // Start auto-mode automatically
    setTimeout(() => {
      // Für Sub-Regions: längere Delays für bessere TTS-Abwicklung
      const isSubRegionView = items.some(item => item.emoji !== undefined)
      const isSubSubRegionView = items.some(item => item.verb !== undefined)
      
      if (isSubRegionView) {
        startAutoMode(items, 4000, 5000) // 4s initial, 5s cycle für Sub-Regions
      } else if (isSubSubRegionView) {
        startAutoMode(items, 4000, 5000) // 4s initial, 5s cycle für Sub-Sub-Regions
      } else {
        startAutoMode(items) // Standard-Geschwindigkeit für Main-View
      }
    }, 1000)

    // Setup blink detection interval
    const blinkCheckInterval = setInterval(() => {
      handleBlink(items, onSelection)
    }, 100)

    // Setup event listeners
    const rightClickHandler = (event: MouseEvent) => handleRightClick(event, items, onSelection)
    const volumeToggleHandler = (event: CustomEvent) => handleVolumeToggle(event)

    console.log('UmgebungAssessment: Registering right-click handler')
    document.addEventListener('contextmenu', rightClickHandler, { capture: true, passive: false })
    window.addEventListener('volumeToggle', volumeToggleHandler as EventListener)

    // Return cleanup function
    return () => {
      clearInterval(blinkCheckInterval)
      document.removeEventListener('contextmenu', rightClickHandler, { capture: true })
      document.removeEventListener('click', enableTTSOnInteraction)
      document.removeEventListener('keydown', enableTTSOnInteraction)
      document.removeEventListener('touchstart', enableTTSOnInteraction)
      window.removeEventListener('volumeToggle', volumeToggleHandler as EventListener)
      stopAutoMode()
      simpleFlowController.stopTTS()
    }
  }

  return {
    // State
    currentTileIndex,
    isAutoMode,
    closedFrames,
    eyesClosed,
    userInteracted,
    isSpeaking,
    blinkThreshold,
    lastBlinkTime,
    blinkCooldown,

    // Methods
    speakText,
    startAutoMode,
    pauseAutoMode,
    stopAutoMode,
    handleBlink,
    handleRightClick,
    handleTouch,
    handleClick,
    handleVolumeToggle,
    navigateBack,
    setupLifecycle,

    // Stores
    settingsStore,
    faceRecognition
  }
}
