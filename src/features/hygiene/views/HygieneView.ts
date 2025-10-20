import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'
import { generateTTSText, getMainText, getPauseAfterTTS, getAutoStartDelay, getCycleDelay } from '../../../config/ttsConfig'

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
  const feedbackText = ref('') // Orange Rückmeldung für ausgewählte Items
  const isAutoMode = ref(true)
  const closedFrames = ref(0)
  const eyesClosed = ref(false)
  const userInteracted = ref(false)
  const isTTSActive = ref(false)

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

  // Zentrale TTS-Funktion über FlowController mit Event-Handling
  const speakText = async (text: string) => {
    console.log('HygieneView: Requesting TTS for:', text)
    isTTSActive.value = true
    
    try {
      await simpleFlowController.speak(text)
    } finally {
      isTTSActive.value = false
    }
  }

  // Hygiene-Item Auswahl
  async function selectHygiene(hygieneId: string) {
    // Verhindere Interaktion während TTS
    if (isTTSActive.value) {
      console.log('HygieneView: Interaction blocked during TTS')
      return
    }

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
        
        // Auto-Mode stoppt bei bewusster Auswahl
        simpleFlowController.stopAutoMode()
        
        // Verwende die neue TTS-Konfiguration
        const ttsText = generateTTSText('hygiene', selectedItem.text)
        
        // Zeige orange Rückmeldung an
        feedbackText.value = ttsText
        console.log('HygieneView: Setting feedback text:', ttsText)
        
        // Spreche die Rückmeldung
        await speakText(ttsText)
        
        // Pause nach TTS-Ende - länger warten, damit der Benutzer die orange Nachricht sehen kann
        const pauseAfterTTS = getPauseAfterTTS('hygiene')
        await new Promise(resolve => setTimeout(resolve, pauseAfterTTS + 2000)) // 2 Sekunden extra
        
        // Nach der TTS-Ausgabe zurück zum Ich-View-Hauptgrid
        router.push('/ich')
    }
  }

  // Blink Detection
  const handleBlink = () => {
    // Verhindere Blink-Interaktion während TTS
    if (isTTSActive.value) {
      return
    }

    const now = Date.now()
    
    if (faceRecognition.isBlinking.value) {
      closedFrames.value++
      
      if (closedFrames.value >= blinkThreshold.value && !eyesClosed.value) {
        const currentItem = hygieneItems[currentTileIndex.value]
        console.log('HygieneView: Blink activation for tile:', currentTileIndex.value, 'hygieneId:', currentItem.id, 'text:', currentItem.text)
        
        // Nur Auswahl - TTS wird in selectHygiene gemacht
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
    // Verhindere Right-Click-Interaktion während TTS
    if (isTTSActive.value) {
      event.preventDefault()
      return false
    }

    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    console.log('HygieneView: Right click detected! Current tile index:', currentTileIndex.value, 'Items length:', hygieneItems.length)
    const currentItem = hygieneItems[currentTileIndex.value]
    if (currentItem) {
      console.log('HygieneView: Right click activation for tile:', currentTileIndex.value, 'hygieneId:', currentItem.id, 'text:', currentItem.text)
      
      // Nur Auswahl - TTS wird in selectHygiene gemacht
      selectHygiene(currentItem.id)
    } else {
      console.log('HygieneView: No current item found for right click')
    }
    return false
  }

  // Lifecycle
  onMounted(() => {
    // Setze HygieneView als aktiven View
    simpleFlowController.setActiveView('/hygiene')
    
    // Reset feedback text when view is mounted
    feedbackText.value = ''
    
    if (!faceRecognition.isActive.value) {
      faceRecognition.start()
    }
    
    // Add global event listeners to detect user interaction
    document.addEventListener('click', enableTTSOnInteraction)
    document.addEventListener('keydown', enableTTSOnInteraction)
    document.addEventListener('touchstart', enableTTSOnInteraction)
    
    // Add right-click handler
    console.log('HygieneView: Registering right-click handler')
    document.addEventListener('contextmenu', handleRightClick, { capture: true, passive: false })
    
    // Start auto-mode automatically über FlowController
    // Zuerst den Haupttext sprechen, dann nach Pause die automatische Durchlauf-Logik starten
    const mainText = getMainText('hygiene')
    const autoStartDelay = getAutoStartDelay('hygiene')
    const cycleDelay = getCycleDelay('hygiene')
    
    setTimeout(async () => {
      await speakText(mainText)
      
      // Pause nach TTS-Ende
      const pauseAfterTTS = getPauseAfterTTS('hygiene')
      await new Promise(resolve => setTimeout(resolve, pauseAfterTTS))
      
      // Starte automatische Durchlauf-Logik
      simpleFlowController.startAutoMode(
        hygieneItems,
        (currentIndex, currentItem) => {
          currentTileIndex.value = currentIndex
          console.log('HygieneView: Auto-mode cycle:', currentItem.text, 'at index:', currentIndex)
          speakText(currentItem.text)
        },
        cycleDelay,
        cycleDelay
      )
    }, autoStartDelay)
    
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
    document.removeEventListener('contextmenu', handleRightClick, { capture: true })
    
    console.log('HygieneView: unmounted - Auto-mode stopped, TTS stopped')
  })

  return {
    // State
    currentTileIndex,
    selectedHygiene,
    feedbackText,
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
