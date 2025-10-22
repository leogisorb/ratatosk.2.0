import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'

// Centralized umgebung-dialog logic
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
  const blinkThreshold = computed(() => 3) // Fixed threshold for umgebung-dialog
  const lastBlinkTime = ref(0)
  const blinkCooldown = computed(() => 1000) // 1 second cooldown

  // TTS function über SimpleFlowController
  const speakText = async (text: string) => {
    console.log('UmgebungDialog: Requesting TTS for:', text)
    await simpleFlowController.speak(text)
  }

  // User interaction detection - aktiviert TTS
  const enableTTSOnInteraction = () => {
    if (!userInteracted.value) {
      console.log('UmgebungDialog: User interaction detected - TTS now enabled')
      userInteracted.value = true
      simpleFlowController.setUserInteracted(true)
    }
  }

  // TTS sofort aktivieren für UmgebungDialogView
  userInteracted.value = true
  simpleFlowController.setUserInteracted(true)

  // Auto mode functions
  const startAutoMode = async (items: any[], titleDelay: number = 1000, cycleDelay: number = 3000) => {
    if (!isAutoMode.value) return
    
    console.log('UmgebungDialog: Starting auto-mode with', items.length, 'items')
    
    // Erst den Titel vorlesen
    setTimeout(async () => {
      if (items.length > 0) {
        const title = 'Was möchten Sie an ihrer Umgebung verändern?'
        await speakText(title)
      }
    }, titleDelay)
    
    // Dann Auto-Mode für Items starten
    setTimeout(() => {
      cycleThroughItems(items, cycleDelay)
    }, titleDelay + 2000)
  }

  const cycleThroughItems = (items: any[], delay: number) => {
    if (!isAutoMode.value || items.length === 0) return
    
    const cycle = () => {
      if (!isAutoMode.value) return
      
      const currentItem = items[currentTileIndex.value]
      if (currentItem) {
        speakText(currentItem.ttsText || currentItem.title || currentItem.text)
      }
      
      currentTileIndex.value = (currentTileIndex.value + 1) % items.length
      
      setTimeout(cycle, delay)
    }
    
    cycle()
  }

  const pauseAutoMode = () => {
    isAutoMode.value = false
    simpleFlowController.stopTTS()
  }

  const stopAutoMode = () => {
    isAutoMode.value = false
    simpleFlowController.stopTTS()
  }

  // Blink detection (disabled for umgebung-dialog)
  const handleBlink = () => {
    // Blink detection disabled for umgebung-dialog
    return
  }

  // Setup lifecycle management
  const setupLifecycle = (items: any[], onSelection: (item: any) => void) => {
    console.log('UmgebungDialog: Setting up lifecycle with', items.length, 'items')
    
    // Start auto-mode
    startAutoMode(items)
    
    // Setup blink detection (disabled)
    const blinkCheckInterval = setInterval(() => {
      handleBlink()
    }, 100)
    
    // Setup right-click handler
    const handleRightClick = (event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      
      const currentItem = items[currentTileIndex.value]
      if (currentItem) {
        console.log('UmgebungDialog: Right click activation for item:', currentItem.title || currentItem.text)
        speakText(currentItem.ttsText || currentItem.title || currentItem.text)
        onSelection(currentItem)
      }
      
      return false
    }
    
    document.addEventListener('contextmenu', handleRightClick, { capture: true, passive: false })
    
    // Return cleanup function
    return () => {
      clearInterval(blinkCheckInterval)
      document.removeEventListener('contextmenu', handleRightClick, { capture: true })
      stopAutoMode()
    }
  }

  return {
    currentTileIndex,
    isAutoMode,
    closedFrames,
    eyesClosed,
    userInteracted,
    blinkThreshold,
    lastBlinkTime,
    blinkCooldown,
    speakText,
    enableTTSOnInteraction,
    startAutoMode,
    pauseAutoMode,
    stopAutoMode,
    handleBlink,
    setupLifecycle
  }
}
