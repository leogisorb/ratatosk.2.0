import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'
import { generateTTSText, getMainText, getPauseAfterTTS, getAutoStartDelay, getCycleDelay } from '../../../config/ttsConfig'
import { useCarousel } from '../../navigation/composables/useCarousel'
import type { CarouselItem } from '../../navigation/config/carouselConfig'

export function useGefuehleViewLogic() {
  // Router
  const router = useRouter()

  // Stores
  const settingsStore = useSettingsStore()

  // Face Recognition
  const faceRecognition = useFaceRecognition()

  // State
  const selectedGefuehl = ref('')
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

  // Alte Blinzel-Erkennung (aus alter Version)
  const handleFaceBlink = (event: any) => {
    console.log('GefuehleView: Face blink received:', event.detail)
    
    if (isTTSActive.value) {
      console.log('GefuehleView: TTS aktiv - Blinzel ignoriert')
      return
    }
    
    const currentItem = gefuehleItems[currentTileIndex.value]
    if (currentItem) {
      console.log('GefuehleView: Blinzel für Item:', currentItem.text)
      selectGefuehl(currentItem.id)
    }
  }

  // User interaction detection - aktiviert TTS
  const enableTTSOnInteraction = () => {
    if (!userInteracted.value) {
      console.log('GefuehleView: User interaction detected - TTS now enabled')
      userInteracted.value = true
      simpleFlowController.setUserInteracted(true)
    }
  }

  // Gefühle-Items für Karussell (CarouselItem Format)
  const menuItems: CarouselItem[] = [
    { id: 'gluecklich', title: 'GLÜCKLICH', icon: '😊', route: '/gefuehle/gluecklich', category: 'gefuehle' },
    { id: 'zufrieden', title: 'ZUFRIEDEN', icon: '😌', route: '/gefuehle/zufrieden', category: 'gefuehle' },
    { id: 'stolz', title: 'STOLZ', icon: '😤', route: '/gefuehle/stolz', category: 'gefuehle' },
    { id: 'liebevoll', title: 'LIEBEVOLL', icon: '🥰', route: '/gefuehle/liebevoll', category: 'gefuehle' },
    { id: 'wuetend', title: 'WÜTEND', icon: '😠', route: '/gefuehle/wuetend', category: 'gefuehle' },
    { id: 'einsam', title: 'EINSAM', icon: '😔', route: '/gefuehle/einsam', category: 'gefuehle' },
    { id: 'aengstlich', title: 'ÄNGSTLICH', icon: '😰', route: '/gefuehle/aengstlich', category: 'gefuehle' },
    { id: 'gelangweilt', title: 'GELANGWEILT', icon: '😑', route: '/gefuehle/gelangweilt', category: 'gefuehle' },
    { id: 'aufgeregt', title: 'AUFGEREGT', icon: '🤩', route: '/gefuehle/aufgeregt', category: 'gefuehle' },
    { id: 'muede', title: 'MÜDE', icon: '😴', route: '/gefuehle/muede', category: 'gefuehle' },
    { id: 'gestresst', title: 'GESTRESST', icon: '😵', route: '/gefuehle/gestresst', category: 'gefuehle' },
    { id: 'zurueck', title: 'ZURÜCK', icon: '⬅️', route: '/ich', category: 'main' }
  ]

  // Karussell-System für Mobile
  const {
    isMobile,
    position,
    carouselStyle,
    currentItem,
    itemCount,
    autoScrollState,
    touchState,
    isSwipe,
    swipeDirection,
    initializeCarousel,
    cleanup: cleanupCarousel,
    navigateToIndex,
    navigateNext,
    navigatePrevious,
    handleCarouselTouchStart,
    handleCarouselTouchMove,
    handleCarouselTouchEnd,
    startAutoScrollWithCallback,
    stopAutoScrollCompletely,
    checkIsMobile
  } = useCarousel(menuItems)

  // Ref für aktuellen Tile-Index - kann geschrieben werden
  const currentTileIndex = ref(0)

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

  // Zentrale TTS-Funktion über FlowController mit Event-Handling
  const speakText = async (text: string) => {
    console.log('GefuehleView: Requesting TTS for:', text)
    isTTSActive.value = true
    
    try {
      await simpleFlowController.speak(text)
    } finally {
      isTTSActive.value = false
    }
  }

  // Gefühle-Item Auswahl
  async function selectGefuehl(gefuehlId: string) {
    // Verhindere Interaktion während TTS
    if (isTTSActive.value) {
      console.log('GefuehleView: Interaction blocked during TTS')
      return
    }

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
        
        // Auto-Mode stoppt bei bewusster Auswahl
        simpleFlowController.stopAutoMode()
        
        // Verwende die neue TTS-Konfiguration
        const ttsText = generateTTSText('gefuehle', selectedItem.text)
        
        // Zeige orange Rückmeldung an
        feedbackText.value = ttsText
        console.log('GefuehleView: Setting feedback text:', ttsText)
        
        // Spreche die Rückmeldung
        await speakText(ttsText)
        
        // Pause nach TTS-Ende - länger warten, damit der Benutzer die orange Nachricht sehen kann
        const pauseAfterTTS = getPauseAfterTTS('gefuehle')
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
        const currentItem = gefuehleItems[currentTileIndex.value]
        console.log('GefuehleView: Blink activation for tile:', currentTileIndex.value, 'gefuehlId:', currentItem.id, 'text:', currentItem.text)
        
        // Nur Auswahl - TTS wird in selectGefuehl gemacht
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

  // Gefühle-spezifische Handler
  const handleGefuehlRightClick = (event: MouseEvent, gefuehlId: string) => {
    if (isTTSActive.value) {
      event.preventDefault()
      return false
    }
    selectGefuehl(gefuehlId)
    return false
  }

  const goToGefuehl = (index: number) => {
    console.log('goToGefuehl called with index:', index, 'current:', currentTileIndex.value)
    if (index >= 0 && index < gefuehleItems.length) {
      currentTileIndex.value = index
      console.log('currentTileIndex updated to:', currentTileIndex.value)
    } else {
      // Reibungsloser Loop - wenn Index außerhalb des Bereichs, loope zurück
      if (index < 0) {
        currentTileIndex.value = gefuehleItems.length - 1
      } else if (index >= gefuehleItems.length) {
        currentTileIndex.value = 0
      }
      console.log('Looped currentTileIndex to:', currentTileIndex.value)
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
    console.log('GefuehleView: Right click detected! Current tile index:', currentTileIndex.value, 'Items length:', gefuehleItems.length)
    const currentItem = gefuehleItems[currentTileIndex.value]
    if (currentItem) {
      console.log('GefuehleView: Right click activation for tile:', currentTileIndex.value, 'gefuehlId:', currentItem.id, 'text:', currentItem.text)
      
      // Nur Auswahl - TTS wird in selectGefuehl gemacht
      selectGefuehl(currentItem.id)
    } else {
      console.log('GefuehleView: No current item found for right click')
    }
    return false
  }

  // Lifecycle
  onMounted(() => {
    // Mobile Detection
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    // Setze GefuehleView als aktiven View
    simpleFlowController.setActiveView('/gefuehle')
    
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
    console.log('GefuehleView: Registering right-click handler')
    document.addEventListener('contextmenu', handleRightClick, { capture: true, passive: false })
    
    // Start auto-mode automatically über FlowController
    // Zuerst den Haupttext sprechen, dann nach Pause die automatische Durchlauf-Logik starten
    const mainText = getMainText('gefuehle')
    const autoStartDelay = getAutoStartDelay('gefuehle')
    const cycleDelay = getCycleDelay('gefuehle')
    
    setTimeout(async () => {
      await speakText(mainText)
      
      // Pause nach TTS-Ende
      const pauseAfterTTS = getPauseAfterTTS('gefuehle')
      await new Promise(resolve => setTimeout(resolve, pauseAfterTTS))
      
      // Starte automatische Durchlauf-Logik
      simpleFlowController.startAutoMode(
        gefuehleItems,
        (currentIndex, currentItem) => {
          // Setze currentTileIndex nur wenn es sich geändert hat
          if (currentTileIndex.value !== currentIndex) {
            currentTileIndex.value = currentIndex
          }
          console.log('GefuehleView: Auto-mode cycle:', currentItem.text, 'at index:', currentIndex)
          speakText(currentItem.text)
        },
        cycleDelay,
        cycleDelay
      )
    }, autoStartDelay)
    
    // Mobile Karussell initialisieren
    if (isMobile.value) {
      initializeCarousel()
      startAutoScrollWithCallback()
    }
    
    console.log('GefuehleView: mounted - using central controllers')
  })

  onUnmounted(() => {
    // Mobile Karussell cleanup
    cleanupCarousel()
    window.removeEventListener('resize', checkIsMobile)
    
    // Stoppe Auto-Mode und TTS über FlowController
    simpleFlowController.stopAutoMode()
    simpleFlowController.stopTTS()
    
    // Clean up event listeners
    document.removeEventListener('click', enableTTSOnInteraction)
    document.removeEventListener('keydown', enableTTSOnInteraction)
    document.removeEventListener('touchstart', enableTTSOnInteraction)
    document.removeEventListener('contextmenu', handleRightClick, { capture: true })
    
    console.log('GefuehleView: unmounted - Auto-mode stopped, TTS stopped')
  })

  return {
    // State
    currentTileIndex,
    selectedGefuehl,
    feedbackText,
    isAutoMode,
    closedFrames,
    eyesClosed,
    blinkThreshold,
    lastBlinkTime,
    blinkCooldown,
    gefuehleItems,
    isTTSActive,
    
    // Mobile Karussell State
    isMobile,
    position,
    carouselStyle,
    currentItem,
    itemCount,
    autoScrollState,
    touchState,
    isSwipe,
    swipeDirection,
    
    // Methods
    speakText,
    enableTTSOnInteraction,
    selectGefuehl,
    handleBlink,
    handleRightClick,
    handleGefuehlRightClick,
    goToGefuehl,
    
    // Mobile Karussell Methods
    navigateToIndex,
    navigateNext,
    navigatePrevious,
    handleCarouselTouchStart,
    handleCarouselTouchMove,
    handleCarouselTouchEnd,
    startAutoScrollWithCallback,
    stopAutoScrollCompletely,
    checkIsMobile,
    
    // Stores
    settingsStore,
    faceRecognition
  }
}
