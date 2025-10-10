import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'

export function useBewegungViewLogic() {
  // Router
  const router = useRouter()

  // Stores
  const settingsStore = useSettingsStore()

  // Face Recognition
  const faceRecognition = useFaceRecognition()

  // State
  const currentTileIndex = ref(0)
  const selectedBewegung = ref('')
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
      console.log('BewegungView: User interaction detected - TTS now enabled')
      userInteracted.value = true
      simpleFlowController.setUserInteracted(true)
    }
  }

  // Bewegung-Items basierend auf dem gezeigten Interface
  const bewegungItems = [
    // Aktive Bewegungen
    { id: 'laufen', text: 'Laufen', type: 'aktiv', emoji: '🏃' },
    { id: 'gehen', text: 'Gehen', type: 'aktiv', emoji: '🚶' },
    { id: 'yoga', text: 'Yoga', type: 'aktiv', emoji: '🧘' },
    { id: 'tanzen', text: 'Tanzen', type: 'aktiv', emoji: '💃' },
    
    // Sport
    { id: 'sport', text: 'Sport', type: 'sport', emoji: '⚽' },
    { id: 'spazieren', text: 'Spazieren', type: 'sport', emoji: '🚶‍♂️' },
    { id: 'schwimmen', text: 'Schwimmen', type: 'sport', emoji: '🏊' },
    { id: 'radfahren', text: 'Radfahren', type: 'sport', emoji: '🚴' },
    
    // Therapie
    { id: 'physiotherapie', text: 'Physiotherapie', type: 'therapie', emoji: '🏥' },
    { id: 'massage', text: 'Massage', type: 'therapie', emoji: '💆' },
    { id: 'ruhe', text: 'Ruhe', type: 'therapie', emoji: '😴' },
    
    // Navigation
    { id: 'zurueck', text: 'zurück', type: 'navigation', emoji: '⬅️' }
  ]

  // Zentrale TTS-Funktion über FlowController
  const speakText = async (text: string) => {
    console.log('BewegungView: Requesting TTS for:', text)
    await simpleFlowController.speak(text)
  }

  // Bewegung-Item Auswahl
  function selectBewegung(bewegungId: string) {
    const selectedItem = bewegungItems.find(item => item.id === bewegungId)
    
    if (!selectedItem) {
      console.log('BewegungView: Item not found:', bewegungId)
      return
    }

    selectedBewegung.value = selectedItem.text
    console.log('BewegungView: Selected item:', selectedItem.text)

    switch (bewegungId) {
      case 'zurueck':
        console.log('BewegungView: Navigating back to /ich')
        router.push('/ich')
        break
      default:
        console.log('BewegungView: Selected Bewegung:', bewegungId)
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
        const currentItem = bewegungItems[currentTileIndex.value]
        console.log('BewegungView: Blink activation for tile:', currentTileIndex.value, 'bewegungId:', currentItem.id, 'text:', currentItem.text)
        
        // TTS + Auswahl - Auto-Mode stoppt bei Interaktion
        speakText(currentItem.text)
        selectBewegung(currentItem.id)
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
    const currentItem = bewegungItems[currentTileIndex.value]
    console.log('BewegungView: Right click activation for tile:', currentTileIndex.value, 'bewegungId:', currentItem.id, 'text:', currentItem.text)
    
    // TTS + Auswahl - Auto-Mode stoppt bei Interaktion
    speakText(currentItem.text)
    selectBewegung(currentItem.id)
  }

  // Lifecycle
  onMounted(() => {
    // Setze BewegungView als aktiven View
    simpleFlowController.setActiveView('/bewegung')
    
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
        bewegungItems,
        (currentIndex, currentItem) => {
          currentTileIndex.value = currentIndex
          console.log('BewegungView: Auto-mode cycle:', currentItem.text, 'at index:', currentIndex)
          speakText(currentItem.text)
        },
        3000,
        3000
      )
    }, 1000)
    
    console.log('BewegungView: mounted - using central controllers')
  })

  onUnmounted(() => {
    // Stoppe Auto-Mode und TTS über FlowController
    simpleFlowController.stopAutoMode()
    simpleFlowController.stopTTS()
    
    // Clean up event listeners
    document.removeEventListener('click', enableTTSOnInteraction)
    document.removeEventListener('keydown', enableTTSOnInteraction)
    document.removeEventListener('touchstart', enableTTSOnInteraction)
    
    console.log('BewegungView: unmounted - Auto-mode stopped, TTS stopped')
  })

  return {
    // State
    currentTileIndex,
    selectedBewegung,
    isAutoMode,
    closedFrames,
    eyesClosed,
    blinkThreshold,
    lastBlinkTime,
    blinkCooldown,
    bewegungItems,
    
    // Methods
    speakText,
    enableTTSOnInteraction,
    selectBewegung,
    handleBlink,
    handleRightClick,
    
    // Stores
    settingsStore,
    faceRecognition
  }
}
