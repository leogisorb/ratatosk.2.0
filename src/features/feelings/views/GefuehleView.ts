import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'

export function useGefuehleViewLogic() {
  // Router
  const router = useRouter()

  // Stores
  const settingsStore = useSettingsStore()

  // Face Recognition
  const faceRecognition = useFaceRecognition()

  // State
  const currentTileIndex = ref(0)
  const selectedGefuehl = ref('')
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
      console.log('GefuehleView: User interaction detected - TTS now enabled')
      userInteracted.value = true
      simpleFlowController.setUserInteracted(true)
    }
  }

  // Gefühle-Items basierend auf dem gezeigten Interface
  const gefuehleItems = [
    // Positive Gefühle
    { id: 'gluecklich', text: 'Glücklich', type: 'positiv', emoji: '😊' },
    { id: 'zufrieden', text: 'Zufrieden', type: 'positiv', emoji: '😌' },
    { id: 'stolz', text: 'Stolz', type: 'positiv', emoji: '😤' },
    { id: 'liebevoll', text: 'Liebevoll', type: 'positiv', emoji: '🥰' },
    
    // Negative Gefühle
    { id: 'wuetend', text: 'Wütend', type: 'negativ', emoji: '😠' },
    { id: 'einsam', text: 'Einsam', type: 'negativ', emoji: '😔' },
    { id: 'aengstlich', text: 'Ängstlich', type: 'negativ', emoji: '😰' },
    { id: 'gelangweilt', text: 'Gelangweilt', type: 'negativ', emoji: '😑' },
    
    // Neutrale/Andere Gefühle
    { id: 'aufgeregt', text: 'Aufgeregt', type: 'neutral', emoji: '🤩' },
    { id: 'muede', text: 'Müde', type: 'neutral', emoji: '😴' },
    { id: 'gestresst', text: 'Gestresst', type: 'neutral', emoji: '😵' },
    
    // Navigation
    { id: 'zurueck', text: 'zurück', type: 'navigation', emoji: '⬅️' }
  ]

  // Zentrale TTS-Funktion über FlowController
  const speakText = async (text: string) => {
    console.log('GefuehleView: Requesting TTS for:', text)
    await simpleFlowController.speak(text)
  }

  // Gefühle-Item Auswahl
  function selectGefuehl(gefuehlId: string) {
    const selectedItem = gefuehleItems.find(item => item.id === gefuehlId)
    
    if (!selectedItem) {
      console.log('GefuehleView: Item not found:', gefuehlId)
      return
    }

    selectedGefuehl.value = selectedItem.text
    console.log('GefuehleView: Selected item:', selectedItem.text)

    switch (gefuehlId) {
      case 'zurueck':
        console.log('GefuehleView: Navigating back to /ich')
        router.push('/ich')
        break
      default:
        console.log('GefuehleView: Selected Gefühl:', gefuehlId)
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
        const currentItem = gefuehleItems[currentTileIndex.value]
        console.log('GefuehleView: Blink activation for tile:', currentTileIndex.value, 'gefuehlId:', currentItem.id, 'text:', currentItem.text)
        
        // TTS + Auswahl - Auto-Mode stoppt bei Interaktion
        speakText(currentItem.text)
        selectGefuehl(currentItem.id)
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
    const currentItem = gefuehleItems[currentTileIndex.value]
    console.log('GefuehleView: Right click activation for tile:', currentTileIndex.value, 'gefuehlId:', currentItem.id, 'text:', currentItem.text)
    
    // TTS + Auswahl - Auto-Mode stoppt bei Interaktion
    speakText(currentItem.text)
    selectGefuehl(currentItem.id)
  }

  // Lifecycle
  onMounted(() => {
    // Setze GefuehleView als aktiven View
    simpleFlowController.setActiveView('/gefuehle')
    
    if (!faceRecognition.isActive.value) {
      faceRecognition.start()
    }
    
    // Add global event listeners to detect user interaction
    document.addEventListener('click', enableTTSOnInteraction)
    document.addEventListener('keydown', enableTTSOnInteraction)
    document.addEventListener('touchstart', enableTTSOnInteraction)
    
    // Start auto-mode automatically über FlowController
    setTimeout(() => {
      simpleFlowController.startAutoMode(
        gefuehleItems,
        (currentIndex, currentItem) => {
          currentTileIndex.value = currentIndex
          console.log('GefuehleView: Auto-mode cycle:', currentItem.text, 'at index:', currentIndex)
          speakText(currentItem.text)
        },
        3000,
        3000
      )
    }, 1000)
    
    console.log('GefuehleView: mounted - using central controllers')
  })

  onUnmounted(() => {
    // Stoppe Auto-Mode und TTS über FlowController
    simpleFlowController.stopAutoMode()
    simpleFlowController.stopTTS()
    
    // Clean up event listeners
    document.removeEventListener('click', enableTTSOnInteraction)
    document.removeEventListener('keydown', enableTTSOnInteraction)
    document.removeEventListener('touchstart', enableTTSOnInteraction)
    
    console.log('GefuehleView: unmounted - Auto-mode stopped, TTS stopped')
  })

  return {
    // State
    currentTileIndex,
    selectedGefuehl,
    isAutoMode,
    closedFrames,
    eyesClosed,
    blinkThreshold,
    lastBlinkTime,
    blinkCooldown,
    gefuehleItems,
    
    // Methods
    speakText,
    enableTTSOnInteraction,
    selectGefuehl,
    handleBlink,
    handleRightClick,
    
    // Stores
    settingsStore,
    faceRecognition
  }
}
