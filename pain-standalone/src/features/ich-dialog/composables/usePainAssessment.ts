import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'

// Centralized ich-dialog logic
// This eliminates duplicate auto-mode, TTS, and blink detection implementations

export function usePainAssessment() {
  // Router
  const router = useRouter()

  // State
  const currentTileIndex = ref(0)
  const isAutoMode = ref(true)
  const closedFrames = ref(0)
  const eyesClosed = ref(false)
  const userInteracted = ref(false)

  // Blink detection parameters - centralized
  const blinkThreshold = computed(() => 3) // Fixed threshold for ich-dialog
  const lastBlinkTime = ref(0)
  const blinkCooldown = computed(() => 1000) // 1 second cooldown

  // TTS function über SimpleFlowController
  const speakText = async (text: string) => {
    console.log('IchDialog: Requesting TTS for:', text)
    await simpleFlowController.speak(text)
  }

  // User interaction detection - aktiviert TTS
  const enableTTSOnInteraction = () => {
    if (!userInteracted.value) {
      console.log('IchDialog: User interaction detected - TTS now enabled')
      userInteracted.value = true
      simpleFlowController.setUserInteracted(true)
    }
  }

  // TTS sofort aktivieren für IchDialogView
  userInteracted.value = true
  simpleFlowController.setUserInteracted(true)

  // Auto-Mode Funktionen (nur für Navigation, keine automatische Auswahl)
  const startAutoMode = async (items: any[], initialDelay: number = 3000, cycleDelay: number = 3000) => {
    if (!isAutoMode.value) return

    console.log('IchDialog: Starting auto-mode with', items.length, 'items')
    
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
    
    // Start auto-mode with simplified logic - nur Navigation, keine Auswahl
    setTimeout(() => {
      let currentIndex = 0
      const cycleItems = () => {
        if (!isAutoMode.value) return
        
        currentTileIndex.value = currentIndex
        const currentItem = items[currentIndex]
        if (currentItem) {
          console.log('IchDialog: Auto-mode cycle:', currentItem.title, 'at index:', currentIndex)
          speakText(currentItem.title)
        }
        
        currentIndex = (currentIndex + 1) % items.length
        setTimeout(cycleItems, cycleDelay)
      }
      
      // Start first cycle after initial delay
      setTimeout(cycleItems, initialDelay)
    }, 1000)
  }

  const pauseAutoMode = () => {
    console.log('IchDialog: Pausing auto-mode')
    isAutoMode.value = false
  }

  const stopAutoMode = () => {
    console.log('IchDialog: Stopping auto-mode')
    isAutoMode.value = false
  }

  // Centralized blink detection (simplified)
  const handleBlink = (items: any[], onSelection: (item: any) => void) => {
    // Disabled for now - only right-click and keyboard navigation
    // This prevents automatic selection that was causing the issue
    return
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
      console.log('IchDialog: Volume disabled')
    }
  }

  // Navigation helpers
  const navigateBack = (route: string = '/') => {
    stopAutoMode()
    router.push(route)
  }

  // Lifecycle management
  const setupLifecycle = (items: any[], onSelection: (item: any) => void) => {
    console.log('IchDialog: Setting up lifecycle')
    
    // Add global event listeners to detect user interaction
    document.addEventListener('click', enableTTSOnInteraction)
    document.addEventListener('keydown', enableTTSOnInteraction)
    document.addEventListener('touchstart', enableTTSOnInteraction)

    // Start auto-mode automatically
    setTimeout(() => {
      startAutoMode(items) // Standard-Geschwindigkeit für ich-dialog
    }, 1000)

    // Setup blink detection interval (disabled for now)
    const blinkCheckInterval = setInterval(() => {
      // handleBlink(items, onSelection) // Disabled to prevent auto-selection
    }, 100)

    // Setup event listeners
    const rightClickHandler = (event: MouseEvent) => handleRightClick(event, items, onSelection)
    const volumeToggleHandler = (event: CustomEvent) => handleVolumeToggle(event)

    console.log('IchDialog: Registering right-click handler')
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
    setupLifecycle
  }
}
