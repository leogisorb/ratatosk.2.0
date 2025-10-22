import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../settings/stores/settings'
import { useCommunicationStore } from '../../communication/stores/communication'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { simpleFlowController, SimpleFlowController } from '../../../core/application/SimpleFlowController'
import { useCarousel } from '../composables/useCarousel'
import { type CarouselItem } from '../config/carouselConfig'

export function useHomeViewLogic() {
  // Router
  const router = useRouter()

  // Stores
  const settingsStore = useSettingsStore()
  const communicationStore = useCommunicationStore()

  // Face Recognition
  const faceRecognition = useFaceRecognition()
  
  // Alte Blinzel-Erkennung (aus alter Version)
  const handleFaceBlink = (event: any) => {
    console.log('HomeView: Face blink received:', event.detail)
    
    const currentItem = menuItems[position.currentIndex]
    if (currentItem) {
      console.log('HomeView: Blinzel für Item:', currentItem.title)
      
      // TTS + Navigation - Auto-Mode stoppt bei Interaktion
      speakText(currentItem.title)
      selectMenu(currentItem.id)
    }
  }

  // State
  const isAutoMode = ref(true)
  const userInteracted = ref(false)
  
  // Instanz-ID für bessere Kontrolle
  const instanceId = Math.random().toString(36).substr(2, 9)
  console.log('HomeViewSimple instance created:', instanceId)
  
  // Computed
  const currentMenu = computed(() => {
    return 'main'
  })
  
  const appClasses = computed(() => {
    return {
      'dark': settingsStore.isDarkMode,
      'auto-mode': isAutoMode.value,
      'auto-mode-paused': !isAutoMode.value
    }
  })

  // TTS über SimpleFlowController
  const speakText = async (text: string) => {
    console.log('HomeViewSimple: Requesting TTS for:', text)
    await simpleFlowController.speak(text)
  }

  // Menu Items - Nur 6 Hauptkategorien
  const menuItems: CarouselItem[] = [
    {
      id: 'warning',
      title: 'WARNGERÄUSCH',
      icon: '/bell.svg',
      route: '/warning',
      category: 'main'
    },
    {
      id: 'communication',
      title: 'UNTERHALTEN',
      icon: '/comment-dots.svg',
      route: '/unterhalten',
      category: 'communication'
    },
    {
      id: 'ich',
      title: 'ICH',
      icon: '/user.svg',
      route: '/ich',
      category: 'main'
    },
    {
      id: 'ich-dialog',
      title: 'ICH-DIALOG',
      icon: '/user.svg',
      route: '/ich-dialog',
      category: 'ich-dialog'
    },
    {
      id: 'pain',
      title: 'SCHMERZEN',
      icon: '/headache.svg',
      route: '/pain-dialog',
      category: 'pain'
    },
    {
      id: 'environment',
      title: 'UMGEBUNG',
      icon: '/house-chimney.svg',
      route: '/umgebung',
      category: 'main'
    },
    {
      id: 'settings',
      title: 'EINSTELLUNGEN',
      icon: '/settings-sliders.svg',
      route: '/einstellungen',
      category: 'settings'
    }
  ]

  // Karussell Composable
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

  // Computed für aktuellen Tile-Index
  const currentTileIndex = computed(() => position.currentIndex)

  // Auto-Mode Funktionen - einfach und direkt
  const startAutoMode = () => {
    if (!isAutoMode.value) return

    console.log(`[${instanceId}] Starting auto-mode with`, menuItems.length, 'main categories')
    
    const success = simpleFlowController.startAutoMode(
      menuItems,
      (currentIndex, currentItem) => {
        navigateToIndex(currentIndex)
        console.log(`[${instanceId}] Auto-mode cycle:`, currentItem.title, 'at index:', currentIndex)
        speakText(currentItem.title)
      },
      settingsStore.settings.autoModeSpeed,
      settingsStore.settings.autoModeSpeed
    )

    if (!success) {
      console.log(`[${instanceId}] Auto-mode start failed`)
    }
  }

  const stopAutoMode = () => {
    console.log(`[${instanceId}] Stopping auto-mode`)
    simpleFlowController.stopAutoMode()
  }

  // User interaction detection - aktiviert TTS
  const enableTTSOnInteraction = () => {
    if (!userInteracted.value) {
      console.log(`[${instanceId}] User interaction detected - TTS now enabled`)
      userInteracted.value = true
      simpleFlowController.setUserInteracted(true)
      
      // Für mobile Geräte: Teste TTS sofort nach Interaktion
      if (isMobile.value) {
        console.log(`[${instanceId}] Mobile device - testing TTS after user interaction`)
        setTimeout(() => {
          if (typeof speechSynthesis !== 'undefined' && speechSynthesis) {
            // Teste TTS mit einem kurzen Text
            const testUtterance = new SpeechSynthesisUtterance('Test')
            testUtterance.volume = 0.1 // Sehr leise
            testUtterance.onend = () => {
              console.log(`[${instanceId}] Mobile TTS test successful`)
            }
            testUtterance.onerror = (e) => {
              console.warn(`[${instanceId}] Mobile TTS test failed:`, e)
            }
            speechSynthesis.speak(testUtterance)
          }
        }, 100)
      }
    }
  }

  // Menu selection - verhindert Navigation ohne Interaktion
  const selectMenu = (menuIdOrItem: string | CarouselItem) => {
    const menuId = typeof menuIdOrItem === 'string' ? menuIdOrItem : menuIdOrItem.id
    console.log(`[${instanceId}] selectMenu called with menuId:`, menuId)
    
    // Enable TTS on user interaction
    enableTTSOnInteraction()
    
    // Stoppe Auto-Mode bei bewusster Navigation
    stopAutoMode()
    
    // Stoppe TTS vor Navigation (sanft)
    simpleFlowController.stopTTSOnly()
    
    // Setze den aktuellen Tile-Index basierend auf der menuId
    const index = menuItems.findIndex(item => item.id === menuId)
    if (index !== -1) {
      navigateToIndex(index)
    }

    // Navigate to the selected route
    const selectedItem = menuItems.find(item => item.id === menuId)
    if (selectedItem) {
      console.log(`[${instanceId}] Selected item:`, selectedItem.title, '- Navigation erlaubt')
    }
    
    router.push(selectedItem?.route || '/app')
  }


  // Right-click handler
  const handleRightClick = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    console.log('HomeView: Right click detected! Current tile index:', position.currentIndex, 'Items length:', menuItems.length)
    const currentItem = menuItems[position.currentIndex]
    if (currentItem) {
      console.log('HomeView: Right click activation for item:', currentItem.title)
      
      // TTS + Navigation - Auto-Mode stoppt bei Interaktion
      speakText(currentItem.title)
      selectMenu(currentItem.id)
    } else {
      console.log('HomeView: No current item found for right click')
    }
    return false
  }

  // Volume toggle handler - synchronisiert mit Header
  const handleVolumeToggle = (event: Event) => {
    const customEvent = event as CustomEvent
    console.log(`[${instanceId}] Volume toggle received:`, customEvent.detail.enabled)
    
    // TTS wird automatisch über SimpleFlowController gesteuert
    // Keine manuelle TTS-Stoppung mehr nötig
    console.log(`[${instanceId}] Volume toggle handled by SimpleFlowController`)
  }

  // Funktion um Leuchtdauer dynamisch zu aktualisieren
  const updateLeuchtdauer = () => {
    if (isAutoMode.value) {
      console.log('Leuchtdauer geändert, Auto-Mode wird mit neuer Geschwindigkeit neu gestartet')
      stopAutoMode()
      setTimeout(() => {
        startAutoMode()
      }, 100)
    }
  }

  // Touch Event Handlers (delegiert an Karussell Composable)
  const handleTouchStart = (event: TouchEvent) => {
    handleCarouselTouchStart(event)
  }

  const handleTouchMove = (event: TouchEvent) => {
    handleCarouselTouchMove(event)
  }

  const handleTouchEnd = (event: TouchEvent) => {
    handleCarouselTouchEnd(event)
  }

  // Keyboard Navigation
  const handleKeyboardNavigation = (event: KeyboardEvent) => {
    if (!isMobile.value) return
    
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        navigatePrevious()
        break
      case 'ArrowDown':
        event.preventDefault()
        navigateNext()
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        selectMenu(currentItem.value)
        break
    }
  }

  // Time formatting
  function formatTime(date: Date): string {
    return new Intl.DateTimeFormat('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  // Lifecycle
  onMounted(() => {
    // Setze HomeView als aktiven View
    simpleFlowController.setActiveView('/home')
    
    // Mobile Detection und Karussell-Initialisierung
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    // Prüfe ob Face Recognition bereits aktiv ist (von StartView)
    if (!faceRecognition.isActive.value) {
      console.log('HomeView: Face Recognition nicht aktiv - starte sie')
      faceRecognition.start()
    } else {
      console.log('HomeView: Face Recognition bereits aktiv - verwende bestehende Instanz')
    }
    
    // Add global event listeners to detect user interaction
    document.addEventListener('click', enableTTSOnInteraction)
    document.addEventListener('keydown', enableTTSOnInteraction)
    document.addEventListener('touchstart', enableTTSOnInteraction)
    
    // Add right-click handler
    console.log('HomeView: Registering right-click handler')
    document.addEventListener('contextmenu', handleRightClick, { capture: true, passive: false })
    
    // Add volume toggle listener
    window.addEventListener('volumeToggle', handleVolumeToggle)
    
    // Start auto-mode automatically
    setTimeout(() => {
      console.log(`[${instanceId}] Starting auto-mode automatically (TTS disabled until user interaction)`)
      if (isMobile.value) {
        // Mobile: Starte Karussell
        initializeCarousel()
      } else {
        // Desktop: Starte normales Auto-Mode
        startAutoMode()
      }
    }, 1000)
    
    // Event Listener für Face Blinzel-Erkennung
    window.addEventListener('faceBlinkDetected', handleFaceBlink)
    console.log('HomeView: Face Recognition Event Listener registriert')
    
    console.log(`[${instanceId}] HomeViewSimple mounted - using simple controller`)
  })

  onUnmounted(() => {
    console.log(`[${instanceId}] HomeView unmounting - starting cleanup`)
    
    // Stoppe Auto-Mode und TTS
    stopAutoMode()
    stopAutoScrollCompletely()
    
    // Karussell-Cleanup
    cleanupCarousel()
    
    // Sanfte TTS-Stoppung beim Verlassen der HomeView
    simpleFlowController.stopTTS()
    
    // Clean up Face Recognition Event Listener (aber nicht die Face Recognition selbst)
    window.removeEventListener('faceBlinkDetected', handleFaceBlink)
    // faceRecognition.stop() - NICHT stoppen, da sie seitenübergreifend laufen soll
    
    // Clean up event listeners
    document.removeEventListener('click', enableTTSOnInteraction)
    document.removeEventListener('keydown', enableTTSOnInteraction)
    document.removeEventListener('touchstart', enableTTSOnInteraction)
    document.removeEventListener('contextmenu', handleRightClick, { capture: true })
    window.removeEventListener('volumeToggle', handleVolumeToggle)
    window.removeEventListener('resize', checkIsMobile)
    
    console.log(`[${instanceId}] HomeView unmounted - cleanup completed`)
  })

  return {
    // State
    currentMenu,
    currentTileIndex,
    isAutoMode,
    userInteracted,
    
    // Mobile Carousel State (von Composable)
    isMobile,
    carouselOffset: computed(() => position.offset),
    carouselStyle,
    currentItem,
    itemCount,
    autoScrollState,
    touchState,
    isSwipe,
    swipeDirection,
    
    // TTS functions
    speakText,
    menuItems,
    appClasses,
    
    // Auto-mode functions
    startAutoMode,
    stopAutoMode,
    
    // Mobile Carousel functions
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    
    // Karussell-Navigation
    navigateToIndex,
    navigateNext,
    navigatePrevious,
    
    // Keyboard Navigation
    handleKeyboardNavigation,
    
    // Methods
    selectMenu,
    formatTime,
    handleFaceBlink,
    handleRightClick,
    handleVolumeToggle,
    updateLeuchtdauer,
    
    // Stores
    settingsStore,
    communicationStore,
    faceRecognition
  }
}
