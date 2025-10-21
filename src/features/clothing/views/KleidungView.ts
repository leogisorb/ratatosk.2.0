import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'
import { generateTTSText, getMainText, getPauseAfterTTS, getAutoStartDelay, getCycleDelay } from '../../../config/ttsConfig'

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
  const feedbackText = ref('')
  const isAutoMode = ref(true)
  const userInteracted = ref(false)
  const isTTSActive = ref(false)

  // Alte Blinzel-Erkennung (aus alter Version)
  const handleFaceBlink = (event: any) => {
    console.log('KleidungView: Face blink received:', event.detail)
    
    if (isTTSActive.value) {
      console.log('KleidungView: TTS aktiv - Blinzel ignoriert')
      return
    }
    
    const currentItem = kleidungItems[currentTileIndex.value]
    if (currentItem) {
      console.log('KleidungView: Blinzel für Item:', currentItem.id)
      selectKleidung(currentItem.id)
    }
  }

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
    // Oberbekleidung
    { id: 'muetze', text: 'Mütze', type: 'oberbekleidung', emoji: '🧢' },
    { id: 'ohrstoepsel', text: 'Ohrstöpsel', type: 'oberbekleidung', emoji: '🎧' },
    { id: 'schaal', text: 'Schal', type: 'oberbekleidung', emoji: '🧣' },
    { id: 'hemd', text: 'Hemd', type: 'oberbekleidung', emoji: '👔' },
    
    // Kleidung
    { id: 'tshirt', text: 'T-Shirt', type: 'kleidung', emoji: '👕' },
    { id: 'pullover', text: 'Pullover', type: 'kleidung', emoji: '🧥' },
    { id: 'jacke', text: 'Jacke', type: 'kleidung', emoji: '🧥' },
    { id: 'hose', text: 'Hose', type: 'kleidung', emoji: '👖' },
    
    // Schuhe und Accessoires
    { id: 'socken', text: 'Socken', type: 'accessoires', emoji: '🧦' },
    { id: 'schuhe', text: 'Schuhe', type: 'accessoires', emoji: '👟' },
    { id: 'unterwaesche', text: 'Unterwäsche', type: 'accessoires', emoji: '🩲' },
    
    // Navigation
    { id: 'zurueck', text: 'zurück', type: 'navigation', emoji: '⬅️' }
  ]

  // Zentrale TTS-Funktion über FlowController mit Event-Handling
  const speakText = async (text: string) => {
    console.log('KleidungView: Requesting TTS for:', text)
    isTTSActive.value = true
    
    try {
      await simpleFlowController.speak(text)
    } finally {
      isTTSActive.value = false
    }
  }

  // Kleidung-Item Auswahl
  async function selectKleidung(kleidungId: string) {
    // Verhindere Interaktion während TTS
    if (isTTSActive.value) {
      console.log('KleidungView: Interaction blocked during TTS')
      return
    }

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
        
        // Auto-Mode stoppt bei bewusster Auswahl
        simpleFlowController.stopAutoMode()
        
        // Verwende die neue TTS-Konfiguration
        const ttsText = generateTTSText('kleidung', selectedItem.text)
        
        // Zeige orange Rückmeldung an
        feedbackText.value = ttsText
        console.log('KleidungView: Setting feedback text:', ttsText)
        
        // Spreche die Rückmeldung
        await speakText(ttsText)
        
        // Pause nach TTS-Ende - länger warten, damit der Benutzer die orange Nachricht sehen kann
        const pauseAfterTTS = getPauseAfterTTS('kleidung')
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
    console.log('KleidungView: Right click detected! Current tile index:', currentTileIndex.value, 'Items length:', kleidungItems.length)
    const currentItem = kleidungItems[currentTileIndex.value]
    if (currentItem) {
      console.log('KleidungView: Right click activation for tile:', currentTileIndex.value, 'kleidungId:', currentItem.id, 'text:', currentItem.text)
      
      // Nur Auswahl - TTS wird in selectKleidung gemacht
      selectKleidung(currentItem.id)
    } else {
      console.log('KleidungView: No current item found for right click')
    }
    return false
  }

  // Karussell-spezifische Handler
  const handleKleidungRightClick = (event: MouseEvent, kleidungId: string) => {
    if (isTTSActive.value) {
      event.preventDefault()
      return false
    }
    selectKleidung(kleidungId)
    return false
  }

  const goToKleidung = (index: number) => {
    console.log('goToKleidung called with index:', index, 'current:', currentTileIndex.value)
    if (index >= 0 && index < kleidungItems.length) {
      currentTileIndex.value = index
      console.log('currentTileIndex updated to:', currentTileIndex.value)
    } else {
      // Reibungsloser Loop - wenn Index außerhalb des Bereichs, loope zurück
      if (index < 0) {
        currentTileIndex.value = kleidungItems.length - 1
      } else if (index >= kleidungItems.length) {
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
    const total = kleidungItems.length || 0
    
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
    // Setze KleidungView als aktiven View
    simpleFlowController.setActiveView('/kleidung')
    
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
    console.log('KleidungView: Registering right-click handler')
    document.addEventListener('contextmenu', handleRightClick, { capture: true, passive: false })
    
    // Event Listener für Face Blinzel-Erkennung
    window.addEventListener('faceBlinkDetected', handleFaceBlink)
    console.log('KleidungView: Face Recognition mit alter Blinzel-Erkennung gestartet')
    
    // Start auto-mode automatically über FlowController
    // Zuerst den Haupttext sprechen, dann nach Pause die automatische Durchlauf-Logik starten
    const mainText = getMainText('kleidung')
    const autoStartDelay = getAutoStartDelay('kleidung')
    const cycleDelay = getCycleDelay('kleidung')
    
    setTimeout(async () => {
      await speakText(mainText)
      
      // Pause nach TTS-Ende
      const pauseAfterTTS = getPauseAfterTTS('kleidung')
      await new Promise(resolve => setTimeout(resolve, pauseAfterTTS))
      
      // Starte automatische Durchlauf-Logik
      simpleFlowController.startAutoMode(
        kleidungItems,
        (currentIndex, currentItem) => {
          currentTileIndex.value = currentIndex
          console.log('KleidungView: Auto-mode cycle:', currentItem.text, 'at index:', currentIndex)
          speakText(currentItem.text)
        },
        cycleDelay,
        cycleDelay
      )
    }, autoStartDelay)
    
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
    
    // Clean up Face Recognition
    faceRecognition.stop()
    window.removeEventListener('faceBlinkDetected', handleFaceBlink)
    
    console.log('KleidungView: unmounted - Auto-mode stopped, TTS stopped')
  })

  return {
    // State
    currentTileIndex,
    selectedKleidung,
    feedbackText,
    isAutoMode,
    isTTSActive,
    kleidungItems,
    
    // Methods
    speakText,
    enableTTSOnInteraction,
    selectKleidung,
    handleFaceBlink,
    handleRightClick,
    handleKleidungRightClick,
    goToKleidung,
    
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