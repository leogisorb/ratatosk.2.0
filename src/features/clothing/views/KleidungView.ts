import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'

export function useKleidungViewLogic() {
  // Router
  const router = useRouter()

  // Stores
  const settingsStore = useSettingsStore()

  // Face Recognition
  const faceRecognition = useFaceRecognition()

  // State
  const currentTileIndex = ref(0)
  const selectedKleidung = ref('')
  const isAutoMode = ref(true)
  const closedFrames = ref(0)
  const eyesClosed = ref(false)
  const userInteracted = ref(false)

  // Verbesserte Blink-Detection Parameter - zentral gesteuert
  const blinkThreshold = computed(() => Math.ceil(settingsStore.settings.blinkSensitivity * 10))
  const lastBlinkTime = ref(0)
  const blinkCooldown = computed(() => settingsStore.settings.blinkSensitivity * 1000)

  // User interaction detection - aktiviert TTS
  const enableTTSOnInteraction = () => {
    if (!userInteracted.value) {
      console.log('KleidungView: User interaction detected - TTS now enabled')
      userInteracted.value = true
      simpleFlowController.setUserInteracted(true)
    }
  }

  // Kleidung-Items basierend auf dem gezeigten Interface
  const kleidungItems = [
    // Kopfbedeckungen
    { id: 'muetze', text: 'Mütze', type: 'kopf', emoji: '🧢' },
    { id: 'hut', text: 'Hut', type: 'kopf', emoji: '🎩' },
    { id: 'schal', text: 'Schal', type: 'hals', emoji: '🧣' },
    { id: 'handschuhe', text: 'Handschuhe', type: 'haende', emoji: '🧤' },
    
    // Oberbekleidung
    { id: 'tshirt', text: 'T-Shirt', type: 'oberteil', emoji: '👕' },
    { id: 'pullover', text: 'Pullover', type: 'oberteil', emoji: '🧥' },
    { id: 'jacke', text: 'Jacke', type: 'oberteil', emoji: '🧥' },
    { id: 'hose', text: 'Hose', type: 'unterteil', emoji: '👖' },
    
    // Unterbekleidung
    { id: 'socken', text: 'Socken', type: 'fuesse', emoji: '🧦' },
    { id: 'schuhe', text: 'Schuhe', type: 'fuesse', emoji: '👟' },
    { id: 'unterwaesche', text: 'Unterwäsche', type: 'unterteil', emoji: '🩲' },
    
    // Navigation
    { id: 'zurueck', text: 'zurück', type: 'navigation', emoji: '⬅️' }
  ]

  // Zentrale TTS-Funktion über FlowController
  const speakText = async (text: string) => {
    console.log('KleidungView: Requesting TTS for:', text)
    await simpleFlowController.speak(text)
  }

  // Kleidung-Item Auswahl
  function selectKleidung(kleidungId: string) {
    const selectedItem = kleidungItems.find(item => item.id === kleidungId)
    
    if (!selectedItem) {
      console.log('KleidungView: Item not found:', kleidungId)
      return
    }

    selectedKleidung.value = selectedItem.text
    console.log('KleidungView: Selected item:', selectedItem.text)

    switch (kleidungId) {
      case 'zurueck':
        console.log('KleidungView: Navigating back to /ich')
        router.push('/ich')
        break
      default:
        console.log('KleidungView: Selected Kleidung:', kleidungId)
        speakText(`${selectedItem.text} ausgewählt`)
        // Auto-Mode stoppt bei bewusster Auswahl
        simpleFlowController.stopAutoMode()
    }
  }

  // Blink Detection
  const handleBlink = () => {
    const now = Date.now()
    
    if (faceRecognition.isBlinking.value) {
      closedFrames.value++
      
      if (closedFrames.value >= blinkThreshold.value && !eyesClosed.value) {
        const currentItem = kleidungItems[currentTileIndex.value]
        console.log('KleidungView: Blink activation for tile:', currentTileIndex.value, 'kleidungId:', currentItem.id, 'text:', currentItem.text)
        
        // TTS + Auswahl - Auto-Mode stoppt bei Interaktion
        speakText(currentItem.text)
        selectKleidung(currentItem.id)
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

  // Right Click Handler
  const handleRightClick = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    console.log('KleidungView: Right click detected! Current tile index:', currentTileIndex.value, 'Items length:', kleidungItems.length)
    const currentItem = kleidungItems[currentTileIndex.value]
    if (currentItem) {
      console.log('KleidungView: Right click activation for tile:', currentTileIndex.value, 'kleidungId:', currentItem.id, 'text:', currentItem.text)
      
      // TTS + Auswahl - Auto-Mode stoppt bei Interaktion
      speakText(currentItem.text)
      selectKleidung(currentItem.id)
    } else {
      console.log('KleidungView: No current item found for right click')
    }
    return false
  }

  // Lifecycle
  onMounted(() => {
    // Setze KleidungView als aktiven View
    simpleFlowController.setActiveView('/kleidung')
    
    if (!faceRecognition.isActive.value) {
      faceRecognition.start()
    }
    
    // Add global event listeners to detect user interaction
    document.addEventListener('click', enableTTSOnInteraction)
    document.addEventListener('keydown', enableTTSOnInteraction)
    document.addEventListener('touchstart', enableTTSOnInteraction)
    
    // Add right-click handler
    console.log('KleidungView: Registering right-click handler')
    document.addEventListener('contextmenu', handleRightClick, { capture: true, passive: false })
    
    // Start auto-mode automatically über FlowController
    setTimeout(() => {
      simpleFlowController.startAutoMode(
        kleidungItems,
        (currentIndex, currentItem) => {
          currentTileIndex.value = currentIndex
          console.log('KleidungView: Auto-mode cycle:', currentItem.text, 'at index:', currentIndex)
          speakText(currentItem.text)
        },
        3000,
        3000
      )
    }, 1000)
    
    console.log('KleidungView: mounted - using central controllers')
  })

  onUnmounted(() => {
    // Stoppe Auto-Mode und TTS über FlowController
    simpleFlowController.stopAutoMode()
    simpleFlowController.stopTTS()
    
    // Clean up event listeners
    document.removeEventListener('click', enableTTSOnInteraction)
    document.removeEventListener('keydown', enableTTSOnInteraction)
    document.removeEventListener('touchstart', enableTTSOnInteraction)
    document.removeEventListener('contextmenu', handleRightClick, { capture: true })
    
    console.log('KleidungView: unmounted - Auto-mode stopped, TTS stopped')
  })

  return {
    // State
    currentTileIndex,
    selectedKleidung,
    isAutoMode,
    closedFrames,
    eyesClosed,
    blinkThreshold,
    lastBlinkTime,
    blinkCooldown,
    kleidungItems,
    
    // Methods
    speakText,
    enableTTSOnInteraction,
    selectKleidung,
    handleBlink,
    handleRightClick,
    
    // Stores
    settingsStore,
    faceRecognition
  }
}
