import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../settings/stores/settings'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'

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
  const autoModeInterval = ref<number | null>(null)
  const closedFrames = ref(0)
  const eyesClosed = ref(false)
  const isAutoModePaused = ref(false)
  const restartTimeout = ref<number | null>(null)

  // Blink detection parameters - centralized
  const blinkThreshold = computed(() => Math.ceil(settingsStore.settings.blinkSensitivity * 10))
  const lastBlinkTime = ref(0)
  const blinkCooldown = computed(() => settingsStore.settings.blinkSensitivity * 1000)

  // Text-to-Speech - centralized
  const speechSynthesis = window.speechSynthesis
  const isTTSEnabled = computed(() => settingsStore.settings.voiceEnabled)
  const isSpeaking = ref(false)

  // Centralized TTS function
  const speakText = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      console.log('TTS: Attempting to speak:', text)
      console.log('TTS: isTTSEnabled:', isTTSEnabled.value, 'isSpeaking:', isSpeaking.value)
      
      if (!isTTSEnabled.value) {
        console.warn('TTS: TTS is disabled')
        resolve()
        return
      }
      
      if (isSpeaking.value) {
        console.warn('TTS: Already speaking, skipping')
        resolve()
        return
      }
      
      if (!speechSynthesis) {
        console.error('TTS: Speech synthesis not available')
        resolve()
        return
      }

      isSpeaking.value = true
      speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'de-DE'
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0

      // Prefer male voice
      const voices = speechSynthesis.getVoices()
      console.log('TTS: Available voices:', voices.length)
      
      const maleVoice = voices.find(voice => 
        voice.lang.startsWith('de') && 
        (voice.name.includes('male') || voice.name.includes('männlich') || voice.name.includes('deutsch'))
      )
      if (maleVoice) {
        utterance.voice = maleVoice
        console.log('TTS: Using voice:', maleVoice.name)
      } else {
        console.warn('TTS: No German male voice found, using default')
      }

      utterance.onstart = () => {
        console.log('TTS: Started speaking:', text)
      }

      utterance.onend = () => {
        console.log('TTS: Finished speaking:', text)
        isSpeaking.value = false
        resolve()
      }

      utterance.onerror = (event) => {
        console.error('TTS: Error speaking:', event.error, text)
        isSpeaking.value = false
        resolve()
      }

      speechSynthesis.speak(utterance)
    })
  }

  // Centralized auto-mode functions
  const startAutoMode = async (items: any[], initialDelay: number = 3000, cycleDelay: number = 3000) => {
    if (autoModeInterval.value || items.length === 0) return

    console.log('Starting auto-mode with items:', items.length, 'initial delay:', initialDelay, 'cycle delay:', cycleDelay)

    // Reset to first item
    currentTileIndex.value = 0

    const cycleTiles = async () => {
      if (!isAutoMode.value || isAutoModePaused.value) {
        console.log('Auto-mode stopped or paused')
        return
      }

      // Speak current item
      const currentItem = items[currentTileIndex.value]
      if (currentItem && currentItem.title) {
        console.log('Speaking item:', currentItem.title, 'at index:', currentTileIndex.value)
        await speakText(currentItem.title)
      }

      // Move to next item
      currentTileIndex.value = (currentTileIndex.value + 1) % items.length
      console.log('Moved to next item, new index:', currentTileIndex.value)

      // Schedule next cycle
      autoModeInterval.value = window.setTimeout(cycleTiles, cycleDelay)
    }

    // Start after initial delay
    autoModeInterval.value = window.setTimeout(cycleTiles, initialDelay)
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
    isSpeaking.value = false
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
    isSpeaking.value = false
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
    const currentItem = items[currentTileIndex.value]
    if (currentItem) {
      console.log('Right click activation for item:', currentItem.id || currentItem.title)
      onSelection(currentItem)
    }
  }

  // Volume toggle handler
  const handleVolumeToggle = (event: CustomEvent) => {
    if (!event.detail.enabled) {
      speechSynthesis.cancel()
      isSpeaking.value = false
    }
  }

  // Navigation helpers
  const navigateToPainScale = (bodyPart: string, returnRoute: string) => {
    stopAutoMode()
    router.push(`/pain-scale?bodyPart=${encodeURIComponent(bodyPart)}&returnRoute=${encodeURIComponent(returnRoute)}`)
  }

  const navigateBack = (route: string = '/schmerz') => {
    stopAutoMode()
    router.push(route)
  }

  // Lifecycle management
  const setupLifecycle = (items: any[], onSelection: (item: any) => void) => {
    // Start face recognition if not active
    if (!faceRecognition.isActive.value) {
      faceRecognition.start()
    }

    // Start auto-mode
    startAutoMode(items)

    // Setup blink detection interval
    const blinkCheckInterval = setInterval(() => {
      handleBlink(items, onSelection)
    }, 100)

    // Setup event listeners
    const rightClickHandler = (event: MouseEvent) => handleRightClick(event, items, onSelection)
    const volumeToggleHandler = (event: CustomEvent) => handleVolumeToggle(event)

    document.addEventListener('contextmenu', rightClickHandler)
    window.addEventListener('volumeToggle', volumeToggleHandler as EventListener)

    // Return cleanup function
    return () => {
      clearInterval(blinkCheckInterval)
      document.removeEventListener('contextmenu', rightClickHandler)
      window.removeEventListener('volumeToggle', volumeToggleHandler as EventListener)
      stopAutoMode()
    }
  }

  return {
    // State
    currentTileIndex,
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
    isSpeaking,

    // Methods
    speakText,
    startAutoMode,
    pauseAutoMode,
    stopAutoMode,
    handleBlink,
    handleRightClick,
    handleVolumeToggle,
    navigateToPainScale,
    navigateBack,
    setupLifecycle,

    // Stores
    settingsStore,
    faceRecognition
  }
}
