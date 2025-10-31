import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../features/settings/stores/settings'
import { useFaceRecognition } from '../../features/face-recognition/composables/useFaceRecognition'
import { simpleFlowController } from '../../core/application/SimpleFlowController'

// Centralized pain assessment logic
// This eliminates duplicate auto-mode, TTS, and blink detection implementations

export function usePainAssessment() {
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

  // Blink detection parameters - centralized
  const blinkThreshold = computed(() => Math.ceil(settingsStore.settings.blinkSensitivity * 10))
  const lastBlinkTime = ref(0)
  const blinkCooldown = computed(() => settingsStore.settings.blinkSensitivity * 1000)

  // TTS über SimpleFlowController
  const speakText = async (text: string) => {
    console.log('PainAssessment: Requesting TTS for:', text)
    await simpleFlowController.speak(text)
  }

  // User interaction detection - aktiviert TTS
  const enableTTSOnInteraction = () => {
    if (!userInteracted.value) {
      console.log('PainAssessment: User interaction detected - TTS now enabled')
      userInteracted.value = true
      simpleFlowController.setUserInteracted(true)
    }
  }

  // TTS sofort aktivieren für PainDialogView
  userInteracted.value = true
  simpleFlowController.setUserInteracted(true)

  // Auto-Mode Funktionen über SimpleFlowController
  const startAutoMode = async (items: any[], initialDelay: number = 3000, cycleDelay: number = 3000) => {
    if (!isAutoMode.value) return

    console.log('PainAssessment: Starting auto-mode with', items.length, 'items')
    
    // Spezielle Behandlung für PainDialogView: Erst Titel vorlesen
    const isMainView = items.some(item => item.id === 'kopf' || item.id === 'torso' || item.id === 'arme' || item.id === 'beine')
    const isSubRegionView = items.some(item => item.id === 'stirn' || item.id === 'nacken' || item.id === 'schulter' || item.id === 'oberarm')
    const isPainScaleView = items.some(item => item.level !== undefined)
    
    if (isMainView) {
      // Erst "Wo haben Sie Schmerzen?" vorlesen
      setTimeout(() => {
        speakText('Wo haben Sie Schmerzen?')
      }, 1000)
      // Zusätzliche Pause nach dem Titel
      initialDelay = initialDelay + 1000
    } else if (isSubRegionView) {
      // Sub-Region Titel wird bereits in PainDialogView.vue gesprochen
      // Kein zusätzlicher TTS hier nötig
      // Zusätzliche Pause nach dem Titel
      initialDelay = initialDelay + 1000
    } else if (isPainScaleView) {
      // Pain Scale Titel wird bereits in PainDialogView.vue gesprochen
      // Kein zusätzlicher TTS hier nötig
    }
    
    const success = simpleFlowController.startAutoMode(
      items,
      (currentIndex, currentItem) => {
        currentTileIndex.value = currentIndex
        // Für Pain Scale: immer description vorlesen (z.B. "kein Schmerz", "sehr leicht", etc.)
        // Für andere Items: title oder description
        const textToSpeak = isPainScaleView && currentItem.description 
          ? currentItem.description 
          : (currentItem.title || currentItem.description || currentItem.level)
        console.log('PainAssessment: Auto-mode cycle:', textToSpeak, 'at index:', currentIndex)
        speakText(textToSpeak)
      },
      initialDelay,
      cycleDelay
    )

    if (!success) {
      console.log('PainAssessment: Auto-mode start failed')
    }
  }

  const pauseAutoMode = () => {
    console.log('PainAssessment: Pausing auto-mode')
    simpleFlowController.stopAutoMode()
  }

  const stopAutoMode = () => {
    console.log('PainAssessment: Stopping auto-mode')
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

  // Volume toggle handler
  const handleVolumeToggle = (event: CustomEvent) => {
    if (!event.detail.enabled) {
      // Verwende SimpleFlowController für konsistente TTS-Kontrolle
      simpleFlowController.stopTTS()
      isSpeaking.value = false
    }
  }

  // Navigation helpers
  // ✅ navigateToPainScale entfernt - Pain Scale View ist jetzt in PainDialogView integriert
  
  const navigateBack = (route: string = '/schmerz') => {
    stopAutoMode()
    router.push(route)
  }

  // Lifecycle management
  const setupLifecycle = (items: any[], onSelection: (item: any) => void) => {
    // Setze PainDialogView als aktiven View
    simpleFlowController.setActiveView('/schmerz')
    
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
      // Für Schmerz-Skala: doppelt so langsam (6 Sekunden statt 3)
      const isPainScale = items.some(item => item.level !== undefined)
      if (isPainScale) {
        startAutoMode(items, 6000, 4500) // 6 Sekunden initial, 4,5 Sekunden cycle
      } else {
        startAutoMode(items) // Standard-Geschwindigkeit für andere Views
      }
    }, 1000)

    // Setup blink detection interval
    const blinkCheckInterval = setInterval(() => {
      handleBlink(items, onSelection)
    }, 100)

    // Setup event listeners
    const rightClickHandler = (event: MouseEvent) => handleRightClick(event, items, onSelection)
    const volumeToggleHandler = (event: CustomEvent) => handleVolumeToggle(event)

    console.log('PainAssessment: Registering right-click handler')
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
    handleVolumeToggle,
    navigateBack,
    setupLifecycle,

    // Stores
    settingsStore,
    faceRecognition
  }
}
