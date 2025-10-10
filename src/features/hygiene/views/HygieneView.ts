import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'

export function useHygieneViewLogic() {
  // Router
  const router = useRouter()

  // Stores
  const settingsStore = useSettingsStore()

  // Face Recognition
  const faceRecognition = useFaceRecognition()

  // State
  const currentTileIndex = ref(0)
  const selectedHygiene = ref('')
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
      console.log('HygieneView: User interaction detected - TTS now enabled')
      userInteracted.value = true
      simpleFlowController.setUserInteracted(true)
    }
  }

  // Hygiene-Items basierend auf dem gezeigten Interface
  const hygieneItems = [
    // Körperpflege
    { id: 'duschen', text: 'duschen', type: 'koerper', emoji: '🚿' },
    { id: 'baden', text: 'baden', type: 'koerper', emoji: '🛁' },
    { id: 'zaehneputzen', text: 'Zähneputzen', type: 'mund', emoji: '🦷' },
    { id: 'haare_waschen', text: 'Haare waschen', type: 'kopf', emoji: '🧴' },
    
    // Pflege
    { id: 'rasieren', text: 'Rasieren', type: 'pflege', emoji: '🪒' },
    { id: 'deo', text: 'Deo', type: 'pflege', emoji: '🧴' },
    { id: 'creme', text: 'Creme', type: 'pflege', emoji: '🧴' },
    { id: 'parfuem', text: 'Parfüm', type: 'pflege', emoji: '🌸' },
    
    // Toilette
    { id: 'toilette', text: 'Toilette', type: 'toilette', emoji: '🚽' },
    { id: 'windel_wechseln', text: 'Windel wechseln', type: 'toilette', emoji: '👶' },
    { id: 'medikamente', text: 'Medikamente', type: 'gesundheit', emoji: '💊' },
    
    // Navigation
    { id: 'zurueck', text: 'zurück', type: 'navigation', emoji: '⬅️' }
  ]

  // Zentrale TTS-Funktion über FlowController
  const speakText = async (text: string) => {
    console.log('HygieneView: Requesting TTS for:', text)
    await simpleFlowController.speak(text)
  }

  // Hygiene-Item Auswahl
  function selectHygiene(hygieneId: string) {
    const selectedItem = hygieneItems.find(item => item.id === hygieneId)
    
    if (!selectedItem) {
      console.log('HygieneView: Item not found:', hygieneId)
      return
    }

    selectedHygiene.value = selectedItem.text
    console.log('HygieneView: Selected item:', selectedItem.text)

    switch (hygieneId) {
      case 'zurueck':
        console.log('HygieneView: Navigating back to /ich')
        router.push('/ich')
        break
      default:
        console.log('HygieneView: Selected Hygiene:', hygieneId)
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
        const currentItem = hygieneItems[currentTileIndex.value]
        console.log('HygieneView: Blink activation for tile:', currentTileIndex.value, 'hygieneId:', currentItem.id, 'text:', currentItem.text)
        
        // TTS + Auswahl - Auto-Mode stoppt bei Interaktion
        speakText(currentItem.text)
        selectHygiene(currentItem.id)
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
    const currentItem = hygieneItems[currentTileIndex.value]
    console.log('HygieneView: Right click activation for tile:', currentTileIndex.value, 'hygieneId:', currentItem.id, 'text:', currentItem.text)
    
    // TTS + Auswahl - Auto-Mode stoppt bei Interaktion
    speakText(currentItem.text)
    selectHygiene(currentItem.id)
  }

  // Lifecycle
  onMounted(() => {
    // Setze HygieneView als aktiven View
    simpleFlowController.setActiveView('/hygiene')
    
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
        hygieneItems,
        (currentIndex, currentItem) => {
          currentTileIndex.value = currentIndex
          console.log('HygieneView: Auto-mode cycle:', currentItem.text, 'at index:', currentIndex)
          speakText(currentItem.text)
        },
        3000,
        3000
      )
    }, 1000)
    
    console.log('HygieneView: mounted - using central controllers')
  })

  onUnmounted(() => {
    // Stoppe Auto-Mode und TTS über FlowController
    simpleFlowController.stopAutoMode()
    simpleFlowController.stopTTS()
    
    // Clean up event listeners
    document.removeEventListener('click', enableTTSOnInteraction)
    document.removeEventListener('keydown', enableTTSOnInteraction)
    document.removeEventListener('touchstart', enableTTSOnInteraction)
    
    console.log('HygieneView: unmounted - Auto-mode stopped, TTS stopped')
  })

  return {
    // State
    currentTileIndex,
    selectedHygiene,
    isAutoMode,
    closedFrames,
    eyesClosed,
    blinkThreshold,
    lastBlinkTime,
    blinkCooldown,
    hygieneItems,
    
    // Methods
    speakText,
    enableTTSOnInteraction,
    selectHygiene,
    handleBlink,
    handleRightClick,
    
    // Stores
    settingsStore,
    faceRecognition
  }
}
