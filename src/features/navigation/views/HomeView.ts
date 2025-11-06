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
  
  // Blinzel-Erkennung - nur für aktive Kachel
  const handleFaceBlink = (event: any) => {
    console.log('HomeView: Face blink received:', event.detail)
    
    // Ignoriere Blink-Events wenn sie von Header-Buttons kommen
    if (event.detail && event.detail.source === 'fallback-interaction') {
      console.log('HomeView: Ignoring blink event from header button')
      return
    }
    
    // Nur für aktive Kachel reagieren
    const currentItem = menuItems[position.currentIndex]
    if (currentItem) {
      console.log('HomeView: Blinzel für aktive Item:', currentItem.title)
      
      // TTS + Navigation - Auto-Mode stoppt bei Interaktion
      speakText(currentItem.title)
      selectMenu(currentItem.id)
    } else {
      console.log('HomeView: Keine aktive Kachel für Blinzel-Interaktion')
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
      route: '/ich-dialog',
      category: 'main'
    },
    {
      id: 'pain',
      title: 'SCHMERZEN',
      icon: '/headache.svg',
      route: '/schmerz',
      category: 'pain'
    },
    {
      id: 'environment',
      title: 'UMGEBUNG',
      icon: '/house-chimney.svg',
      route: '/umgebung-dialog',
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

  // HomeView TTS Start nach 1 Sekunde
  const startHomeViewTTS = () => {
    console.log(`[${instanceId}] Starting HomeView TTS after 1 second delay`)
    
    setTimeout(() => {
      console.log(`[${instanceId}] HomeView: Starting TTS and rhythms`)
      
      // Starte Auto-Mode mit TTS
      startAutoMode()
      
      // Aktiviere TTS
      simpleFlowController.setUserInteracted(true)
      
    }, 1000) // 1 Sekunde Verzögerung
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
            // ✅ Prüfe ob TTS stumm geschaltet ist → Volume 0 setzen
            const isMuted = simpleFlowController.getTTSMuted()
            // Teste TTS mit einem kurzen Text
            const testUtterance = new SpeechSynthesisUtterance('Test')
            testUtterance.volume = isMuted ? 0 : 0.1  // ✅ Volume basierend auf Mute-Status (sehr leise wenn nicht stumm)
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


  // Right-click handler - nur für aktive Kachel
  const handleRightClick = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    
    console.log('HomeView: Right click detected! Current tile index:', position.currentIndex, 'Items length:', menuItems.length)
    
    // Nur für aktive Kachel reagieren
    const currentItem = menuItems[position.currentIndex]
    if (currentItem) {
      console.log('HomeView: Right click activation for aktive item:', currentItem.title)
      
      // TTS + Navigation - Auto-Mode stoppt bei Interaktion
      speakText(currentItem.title)
      selectMenu(currentItem.id)
    } else {
      console.log('HomeView: No aktive item found for right click')
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

  // Touch Event Handlers - nur für aktive Kachel
  const handleTouchStart = (event: TouchEvent) => {
    // Nur Touch-Events für aktive Kachel verarbeiten
    const target = event.target as HTMLElement
    const menuTile = target.closest('.menu-tile')
    
    if (menuTile && menuTile.classList.contains('tile-active')) {
      console.log('HomeView: Touch start on aktive tile')
      handleCarouselTouchStart(event)
    } else {
      console.log('HomeView: Touch start on inactive tile - ignoring')
      event.preventDefault()
      event.stopPropagation()
    }
  }

  const handleTouchMove = (event: TouchEvent) => {
    // Nur Touch-Events für aktive Kachel verarbeiten
    const target = event.target as HTMLElement
    const menuTile = target.closest('.menu-tile')
    
    if (menuTile && menuTile.classList.contains('tile-active')) {
      handleCarouselTouchMove(event)
    } else {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  const handleTouchEnd = (event: TouchEvent) => {
    // Nur Touch-Events für aktive Kachel verarbeiten
    const target = event.target as HTMLElement
    const menuTile = target.closest('.menu-tile')
    
    if (menuTile && menuTile.classList.contains('tile-active')) {
      console.log('HomeView: Touch end on aktive tile')
      handleCarouselTouchEnd(event)
    } else {
      console.log('HomeView: Touch end on inactive tile - ignoring')
      event.preventDefault()
      event.stopPropagation()
    }
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
    console.log(`[${instanceId}] HomeView mounting - cleaning up any existing services`)
    
    // ✅ Prüfe ob TTS bereits im StartView aktiviert wurde
    const globalUserInteracted = simpleFlowController.getState().userInteracted
    if (globalUserInteracted) {
      console.log(`[${instanceId}] TTS bereits im StartView aktiviert - synchronisiere lokalen Status`)
      userInteracted.value = true
    }
    
    // Stoppe alle laufenden Services für saubere Neuinitialisierung
    stopAutoMode()
    stopAutoScrollCompletely()
    simpleFlowController.stopTTS()
    simpleFlowController.stopAutoMode()
    
    // Setze HomeView als aktiven View (stoppt auch alle Services)
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
    
    // Start HomeView TTS nach 1 Sekunde (saubere Neuinitialisierung)
    startHomeViewTTS()
    
    // Event Listener für Face Blinzel-Erkennung
    window.addEventListener('faceBlinkDetected', handleFaceBlink)
    console.log('HomeView: Face Recognition Event Listener registriert')
    
    console.log(`[${instanceId}] HomeViewSimple mounted - all services initialized cleanly`)
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
    startHomeViewTTS,
    
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
