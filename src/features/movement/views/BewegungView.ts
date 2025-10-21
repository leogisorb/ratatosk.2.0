import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'
import { generateTTSText, getMainText, getPauseAfterTTS, getAutoStartDelay, getCycleDelay } from '../../../config/ttsConfig'

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
  const feedbackText = ref('')
  const isAutoMode = ref(true)
  const userInteracted = ref(false)
  const isTTSActive = ref(false)

  // Alte Blinzel-Erkennung (aus alter Version)
  const handleFaceBlink = (event: any) => {
    console.log('BewegungView: Face blink received:', event.detail)
    
    if (isTTSActive.value) {
      console.log('BewegungView: TTS aktiv - Blinzel ignoriert')
      return
    }
    
    const currentItem = bewegungItems[currentTileIndex.value]
    if (currentItem) {
      console.log('BewegungView: Blinzel für Item:', currentItem.id)
      selectBewegung(currentItem.id)
    }
  }

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
    // Körperbewegungen
    { id: 'aufstehen', text: 'aufstehen', type: 'bewegung', emoji: '🚶' },
    { id: 'sitzen', text: 'sitzen', type: 'bewegung', emoji: '🪑' },
    { id: 'liegen', text: 'liegen', type: 'bewegung', emoji: '🛏️' },
    { id: 'gehen', text: 'gehen', type: 'bewegung', emoji: '🚶‍♂️' },
    
    // Aktivitäten
    { id: 'laufen', text: 'laufen', type: 'aktivitaet', emoji: '🏃' },
    { id: 'springen', text: 'springen', type: 'aktivitaet', emoji: '🦘' },
    { id: 'tanzen', text: 'tanzen', type: 'aktivitaet', emoji: '💃' },
    { id: 'schwimmen', text: 'schwimmen', type: 'aktivitaet', emoji: '🏊' },
    
    // Entspannung
    { id: 'dehnen', text: 'dehnen', type: 'entspannung', emoji: '🧘' },
    { id: 'meditieren', text: 'meditieren', type: 'entspannung', emoji: '🧘‍♀️' },
    { id: 'atmen', text: 'atmen', type: 'entspannung', emoji: '🫁' },
    
    // Navigation
    { id: 'zurueck', text: 'zurück', type: 'navigation', emoji: '⬅️' }
  ]

  // Zentrale TTS-Funktion über FlowController mit Event-Handling
  const speakText = async (text: string) => {
    console.log('BewegungView: Requesting TTS for:', text)
    isTTSActive.value = true
    
    try {
      await simpleFlowController.speak(text)
    } finally {
      isTTSActive.value = false
    }
  }

  // Bewegung-Item Auswahl
  async function selectBewegung(bewegungId: string) {
    // Verhindere Interaktion während TTS
    if (isTTSActive.value) {
      console.log('BewegungView: Interaction blocked during TTS')
      return
    }

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
        
        // Auto-Mode stoppt bei bewusster Auswahl
        simpleFlowController.stopAutoMode()
        
        // Verwende die neue TTS-Konfiguration
        const ttsText = generateTTSText('bewegung', selectedItem.text)
        
        // Zeige orange Rückmeldung an
        feedbackText.value = ttsText
        console.log('BewegungView: Setting feedback text:', ttsText)
        
        // Spreche die Rückmeldung
        await speakText(ttsText)
        
        // Pause nach TTS-Ende - länger warten, damit der Benutzer die orange Nachricht sehen kann
        const pauseAfterTTS = getPauseAfterTTS('bewegung')
        await new Promise(resolve => setTimeout(resolve, pauseAfterTTS + 2000)) // 2 Sekunden extra
        
        // Nach der TTS-Ausgabe zurück zum Ich-View-Hauptgrid
        router.push('/ich')
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
    console.log('BewegungView: Right click detected! Current tile index:', currentTileIndex.value, 'Items length:', bewegungItems.length)
    const currentItem = bewegungItems[currentTileIndex.value]
    if (currentItem) {
      console.log('BewegungView: Right click activation for tile:', currentTileIndex.value, 'bewegungId:', currentItem.id, 'text:', currentItem.text)
      
      // Nur Auswahl - TTS wird in selectBewegung gemacht
      selectBewegung(currentItem.id)
    } else {
      console.log('BewegungView: No current item found for right click')
    }
    return false
  }

  // Karussell-spezifische Handler
  const handleBewegungRightClick = (event: MouseEvent, bewegungId: string) => {
    if (isTTSActive.value) {
      event.preventDefault()
      return false
    }
    selectBewegung(bewegungId)
    return false
  }

  const goToBewegung = (index: number) => {
    console.log('goToBewegung called with index:', index, 'current:', currentTileIndex.value)
    if (index >= 0 && index < bewegungItems.length) {
      currentTileIndex.value = index
      console.log('currentTileIndex updated to:', currentTileIndex.value)
    } else {
      // Reibungsloser Loop - wenn Index außerhalb des Bereichs, loope zurück
      if (index < 0) {
        currentTileIndex.value = bewegungItems.length - 1
      } else if (index >= bewegungItems.length) {
        currentTileIndex.value = 0
      }
      console.log('Looped currentTileIndex to:', currentTileIndex.value)
    }
  }

  // Computed Classes - Pain Dialog Style (einfach und sauber)
  const getTileClass = (index: number) => {
    return currentTileIndex.value === index ? 'carousel-item-active' : 'carousel-item-inactive'
  }

  const getIconClass = (index: number) => {
    return currentTileIndex.value === index ? 'icon-active' : 'icon-inactive'
  }

  const getTextClass = (index: number) => {
    return currentTileIndex.value === index ? 'text-active' : 'text-inactive'
  }

  const getIndicatorClass = (index: number) => {
    return currentTileIndex.value === index ? 'carousel-indicator-active' : 'carousel-indicator-inactive'
  }

  // 3-Kacheln-Looping: Optimierte Offset-Berechnung mit v-if Filter
  const getCarouselOffset = (index: number) => {
    // Schutz vor undefined/index - lockern für bessere Kompatibilität
    if (typeof index !== 'number' || isNaN(index)) {
      console.warn(`getCarouselOffset: Invalid index: ${index}, treating as 0`)
      index = 0 // Fallback zu 0 statt null
    }
    
    const current = currentTileIndex.value || 0
    const total = bewegungItems.length || 0
    
    // Fallback falls total = 0
    if (total === 0) {
      console.warn(`getCarouselOffset: No items available`)
      return null
    }
    
    // Relativer Offset zum current Index
    let offset = index - current
    
    // Looping für negatives/positives Offset - korrigiert für 3-Kacheln-System
    if (offset > 1) offset = offset - total
    if (offset < -1) offset = offset + total
    
    // Debug-Log für Pain Dialog Style - erweitert
    console.log(`Pain Dialog Style: index=${index}, current=${current}, offset=${offset}, sichtbar=${offset >= -1 && offset <= 1}`)
    
    // Nur -1,0,1 sichtbar - alle anderen werden durch v-if gefiltert
    if (offset < -1 || offset > 1) return null // nicht sichtbar
    return offset
  }

  // 3-Kacheln-Looping: Berechne Rotation für smooth 3-Kacheln-System
  const getCarouselRotation = (index: number) => {
    const offset = getCarouselOffset(index)
    
    if (offset === 0) return 0      // Mittlere Kachel - keine Rotation
    if (offset === -1) return -20   // Linke Kachel - -20° Rotation
    if (offset === 1) return 20     // Rechte Kachel - +20° Rotation
    
    return 0 // Unsichtbare Kacheln - keine Rotation
  }

  // Lifecycle
  onMounted(() => {
    // Setze BewegungView als aktiven View
    simpleFlowController.setActiveView('/bewegung')
    
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
    console.log('BewegungView: Registering right-click handler')
    document.addEventListener('contextmenu', handleRightClick, { capture: true, passive: false })
    
    // Event Listener für Face Blinzel-Erkennung
    window.addEventListener('faceBlinkDetected', handleFaceBlink)
    console.log('BewegungView: Face Recognition mit alter Blinzel-Erkennung gestartet')
    
    // Start auto-mode automatically über FlowController
    // Zuerst den Haupttext sprechen, dann nach Pause die automatische Durchlauf-Logik starten
    const mainText = getMainText('bewegung')
    const autoStartDelay = getAutoStartDelay('bewegung')
    const cycleDelay = getCycleDelay('bewegung')
    
    setTimeout(async () => {
      await speakText(mainText)
      
      // Pause nach TTS-Ende
      const pauseAfterTTS = getPauseAfterTTS('bewegung')
      await new Promise(resolve => setTimeout(resolve, pauseAfterTTS))
      
      // Starte automatische Durchlauf-Logik
      simpleFlowController.startAutoMode(
        bewegungItems,
        (currentIndex, currentItem) => {
          currentTileIndex.value = currentIndex
          console.log('BewegungView: Auto-mode cycle:', currentItem.text, 'at index:', currentIndex)
          speakText(currentItem.text)
        },
        cycleDelay,
        cycleDelay
      )
    }, autoStartDelay)
    
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
    document.removeEventListener('contextmenu', handleRightClick, { capture: true })
    
    // Clean up Face Recognition
    faceRecognition.stop()
    window.removeEventListener('faceBlinkDetected', handleFaceBlink)
    
    console.log('BewegungView: unmounted - Auto-mode stopped, TTS stopped')
  })

  return {
    // State
    currentTileIndex,
    selectedBewegung,
    feedbackText,
    isAutoMode,
    isTTSActive,
    bewegungItems,
    
    // Methods
    speakText,
    enableTTSOnInteraction,
    selectBewegung,
    handleFaceBlink,
    handleRightClick,
    handleBewegungRightClick,
    goToBewegung,
    
    // Computed Classes
    getTileClass,
    getIconClass,
    getTextClass,
    getIndicatorClass,
    
    // 3-Kacheln-Looping Functions
    getCarouselOffset,
    getCarouselRotation,
    
    // Stores
    settingsStore,
    faceRecognition
  }
}