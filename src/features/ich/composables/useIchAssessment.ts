import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../settings/stores/settings'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'

// Centralized ich-dialog logic
// This eliminates duplicate auto-mode, TTS, and blink detection implementations

export function useIchAssessment() {
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
    console.log('IchAssessment: Requesting TTS for:', text)
    console.log('IchAssessment: userInteracted:', userInteracted.value)
    console.log('IchAssessment: simpleFlowController available:', !!simpleFlowController)
    
    isSpeaking.value = true
    try {
      await simpleFlowController.speak(text)
      console.log('IchAssessment: TTS completed successfully')
    } catch (error) {
      console.error('IchAssessment: TTS error:', error)
    }
    isSpeaking.value = false
  }

  // User interaction detection - aktiviert TTS
  const enableTTSOnInteraction = () => {
    if (!userInteracted.value) {
      console.log('IchAssessment: User interaction detected - TTS now enabled')
      userInteracted.value = true
      simpleFlowController.setUserInteracted(true)
    }
  }

  // TTS sofort aktivieren für IchDialogView
  userInteracted.value = true
  simpleFlowController.setUserInteracted(true)
  console.log('IchAssessment: TTS activated immediately')

  // Auto-Mode Funktionen über SimpleFlowController
  const startAutoMode = async (items: any[], initialDelay: number = 3000, cycleDelay: number = 3000) => {
    if (!isAutoMode.value) return

    console.log('IchAssessment: Starting auto-mode with', items.length, 'items')
    
    // Spezielle Behandlung für IchDialogView: Erst Titel vorlesen
    const isMainView = items.some(item => item.id === 'ernaehrung' || item.id === 'gefuehle' || item.id === 'kleidung' || item.id === 'hygiene' || item.id === 'bewegung')
    const isSubRegionView = items.some(item => item.emoji !== undefined)
    
    if (isMainView) {
      // Erst "Was möchten Sie machen?" vorlesen
      setTimeout(() => {
        speakText('Was möchten Sie machen?')
      }, 1000)
      // Zusätzliche Pause nach dem Titel
      initialDelay = initialDelay + 1000
    } else if (isSubRegionView) {
      // Sub-Region Titel wird bereits in IchDialogView.vue gesprochen
      // Kein zusätzlicher TTS hier nötig
      // Zusätzliche Pause nach dem Titel
      initialDelay = initialDelay + 1000
    }
    
    const success = simpleFlowController.startAutoMode(
      items,
      (currentIndex, currentItem) => {
        currentTileIndex.value = currentIndex
        console.log('IchAssessment: Auto-mode cycle:', currentItem.title || currentItem.description, 'at index:', currentIndex)
        // Für Sub-Regions: Spreche den korrekten TTS-Text
        if (isSubRegionView && currentItem.ttsText) {
          speakText(currentItem.ttsText)
        } else {
          speakText(currentItem.title || currentItem.description)
        }
      },
      initialDelay,
      cycleDelay
    )

    if (!success) {
      console.log('IchAssessment: Auto-mode start failed')
    }
  }

  const pauseAutoMode = () => {
    console.log('IchAssessment: Pausing auto-mode')
    simpleFlowController.stopAutoMode()
  }

  const stopAutoMode = () => {
    console.log('IchAssessment: Stopping auto-mode')
    simpleFlowController.stopAutoMode()
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

  // Touch handler für Ich-Dialog (ähnlich wie Pain Scale)
  const handleTouch = (event: TouchEvent, items: any[], onSelection: (item: any) => void) => {
    event.preventDefault()
    event.stopPropagation()
    console.log('Touch detected in Ich-Dialog')
    const currentItem = items[currentTileIndex.value]
    if (currentItem) {
      console.log('Touch activation for item:', currentItem.id || currentItem.title)
      onSelection(currentItem)
    }
  }

  // Click handler für Ich-Dialog
  const handleClick = (event: MouseEvent, items: any[], onSelection: (item: any) => void) => {
    event.preventDefault()
    event.stopPropagation()
    console.log('Click detected in Ich-Dialog')
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
  const navigateBack = (route: string = '/ich-dialog') => {
    stopAutoMode()
    router.push(route)
  }

  // Lifecycle management
  const setupLifecycle = (items: any[], onSelection: (item: any) => void) => {
    // Setze IchDialogView als aktiven View
    simpleFlowController.setActiveView('/ich-dialog')
    
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
      if (isSubRegionView) {
        startAutoMode(items, 4000, 5000) // 4s initial, 5s cycle für Sub-Regions
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

    console.log('IchAssessment: Registering right-click handler')
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
