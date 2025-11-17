import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../settings/stores/settings'
import { useCommunicationStore } from '../../communication/stores/communication'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { simpleFlowController, SimpleFlowController } from '../../../core/application/SimpleFlowController'
import { useCarousel } from '../composables/useCarousel'
import { type CarouselItem } from '../config/carouselConfig'
import { useAutoMode } from '../../../shared/composables/useAutoMode'

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
    // Ignoriere Blink-Events wenn sie von Header-Buttons kommen
    if (event.detail && event.detail.source === 'fallback-interaction') {
      return
    }
    
    // Nur für aktive Kachel reagieren
    const currentItem = menuItems[position.currentIndex]
    if (currentItem) {
      // TTS + Navigation - Auto-Mode stoppt bei Interaktion
      speakText(currentItem.title)
      selectMenu(currentItem.id)
    }
  }

  // State
  const isAutoMode = ref(true)
  const userInteracted = ref(false)
  const isAutoModeNavigating = ref(false) // Flag um zu verhindern, dass Watcher bei Auto-Mode ausgelöst wird
  
  // Instanz-ID für bessere Kontrolle
  const instanceId = Math.random().toString(36).substr(2, 9)
  
  // Timeout-IDs für Cleanup (verhindert Memory Leaks)
  const timeoutIds: number[] = []
  
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
    await simpleFlowController.speak(text)
  }

  // Menu Items - Nur 6 Hauptkategorien
  const menuItems: CarouselItem[] = [
    {
      id: 'warning',
      title: 'WARNGERÄUSCH',
      icon: '/ratatosk.2.0/images/bell.svg',
      route: '/warning',
      category: 'main'
    },
    {
      id: 'communication',
      title: 'UNTERHALTEN',
      icon: '/ratatosk.2.0/images/comment-dots.svg',
      route: '/communication',
      category: 'communication'
    },
    {
      id: 'ich',
      title: 'ICH',
      icon: '/ratatosk.2.0/images/user.svg',
      route: '/self-dialog',
      category: 'main'
    },
    {
      id: 'pain',
      title: 'SCHMERZEN',
      icon: '/ratatosk.2.0/images/headache.svg',
      route: '/pain-dialog',
      category: 'pain'
    },
    {
      id: 'environment',
      title: 'UMGEBUNG',
      icon: '/ratatosk.2.0/images/house-chimney.svg',
      route: '/environment-dialog',
      category: 'main'
    },
    {
      id: 'settings',
      title: 'EINSTELLUNGEN',
      icon: '/ratatosk.2.0/images/settings-sliders.svg',
      route: '/settings',
      category: 'settings'
    }
  ]

  // Karussell Composable
  const {
    isMobile,
    position,
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
    setAutoModeStarting,
    checkIsMobile
  } = useCarousel(menuItems)

  // Auto-Mode mit useAutoMode
  const autoMode = useAutoMode({
    speak: speakText,
    getItems: () => menuItems,
    getTitle: () => 'Hauptmenü',
    onCycle: (currentIndex, currentItem) => {
      // Navigiere zu Index, damit die aktive Kachel korrekt ist
      navigateToIndex(currentIndex)
    },
    initialDelay: settingsStore.settings.leuchtdauer * 1000,
    cycleDelay: settingsStore.settings.leuchtdauer * 1000
  })

  // Computed für aktuellen Tile-Index - verwende autoMode.index wenn Auto-Mode läuft
  const currentTileIndex = computed(() => {
    if (autoMode.running.value) {
      return autoMode.index.value
    }
    return position.currentIndex
  })

  // Watch für Tile-Index-Änderungen - TTS aussprechen (nur bei manueller Navigation)
  watch(currentTileIndex, (newIndex, oldIndex) => {
    // Überspringe initiale Setzung (oldIndex ist undefined beim ersten Mal)
    if (oldIndex === undefined) return
    
    // Überspringe, wenn Auto-Mode aktiv ist (TTS wird bereits im Auto-Mode aufgerufen)
    if (autoMode.running.value) {
      return
    }
    
    // Nur TTS aussprechen, wenn Benutzer bereits interagiert hat
    if (userInteracted.value) {
      // Verwende den tatsächlichen Index aus position, um sicherzustellen, dass er korrekt ist
      const actualIndex = position.currentIndex
      const currentItem = menuItems[actualIndex]
      
      if (currentItem) {
        speakText(currentItem.title)
      } else {
        console.warn(`[${instanceId}] No item found at index ${actualIndex} (watcher index: ${newIndex})`)
      }
    }
  })

  // Auto-Mode Funktionen - verwende useAutoMode
  const startAutoMode = () => {
    if (!isAutoMode.value) return

    // Setze Flag, dass Auto-Mode gerade startet (verhindert Auto-Scroll-Start)
    setAutoModeStarting(true)
    
    // Stoppe Auto-Scroll, damit es die Position nicht ändert
    stopAutoScrollCompletely()
    
    // Stelle sicher, dass Position auf 0 initialisiert ist (für ersten Zyklus)
    navigateToIndex(0)
    
    // Starte Auto-Mode (skipTitle = true, da Titel bereits gesprochen wird)
    autoMode.start(true)
    
    // Reset Flag nach kurzer Verzögerung
    const timeoutId = window.setTimeout(() => {
      setAutoModeStarting(false)
    }, 200)
    timeoutIds.push(timeoutId)
  }

  // HomeView TTS Start nach 1 Sekunde
  const startHomeViewTTS = () => {
    const timeoutId = window.setTimeout(() => {
      // Starte Auto-Mode mit TTS
      startAutoMode()
      
      // Aktiviere TTS
      simpleFlowController.setUserInteracted(true)
      
    }, 1000) // 1 Sekunde Verzögerung
    timeoutIds.push(timeoutId)
  }

  const stopAutoMode = () => {
    autoMode.stop()
  }

  // User interaction detection - aktiviert TTS
  const enableTTSOnInteraction = () => {
    if (!userInteracted.value) {
      userInteracted.value = true
      simpleFlowController.setUserInteracted(true)
      
      // Für mobile Geräte: Teste TTS sofort nach Interaktion
      if (isMobile.value) {
        const timeoutId = window.setTimeout(() => {
          if (typeof speechSynthesis !== 'undefined' && speechSynthesis) {
            // Prüfen ob TTS stumm geschaltet ist - dann Volume auf 0 setzen
            const isMuted = simpleFlowController.getTTSMuted()
            // Teste TTS mit einem kurzen Text
            const testUtterance = new SpeechSynthesisUtterance('Test')
            testUtterance.volume = isMuted ? 0 : 0.1  // Volume basierend auf Mute-Status (sehr leise wenn nicht stumm)
            testUtterance.onerror = (e) => {
              console.warn(`[${instanceId}] Mobile TTS test failed:`, e)
            }
            speechSynthesis.speak(testUtterance)
          }
        }, 100)
        timeoutIds.push(timeoutId)
      }
    }
  }

  // Menu selection - verhindert Navigation ohne Interaktion
  const selectMenu = (menuIdOrItem: string | CarouselItem) => {
    const menuId = typeof menuIdOrItem === 'string' ? menuIdOrItem : menuIdOrItem.id
    
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
    
    router.push(selectedItem?.route || '/app')
  }


  // Right-click handler - nur für aktive Kachel
  const handleRightClick = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    
    // Nur für aktive Kachel reagieren
    const currentItem = menuItems[position.currentIndex]
    if (currentItem) {
      // TTS + Navigation - Auto-Mode stoppt bei Interaktion
      speakText(currentItem.title)
      selectMenu(currentItem.id)
    }
    return false
  }

  // Volume toggle handler - synchronisiert mit Header
  const handleVolumeToggle = (event: Event) => {
    // TTS wird automatisch über SimpleFlowController gesteuert
    // Keine manuelle TTS-Stoppung mehr nötig
  }

  // Funktion um Leuchtdauer dynamisch zu aktualisieren
  const updateLeuchtdauer = () => {
    if (isAutoMode.value) {
      stopAutoMode()
      const timeoutId = window.setTimeout(() => {
        startAutoMode()
      }, 100)
      timeoutIds.push(timeoutId)
    }
  }

  // Touch Event Handlers - nur für aktive Kachel
  const handleTouchStart = (event: TouchEvent) => {
    // Nur Touch-Events für aktive Kachel verarbeiten
    const target = event.target as HTMLElement
    const menuTile = target.closest('.menu-tile')
    
    if (menuTile && menuTile.classList.contains('tile-active')) {
      handleCarouselTouchStart(event)
    } else {
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
      handleCarouselTouchEnd(event)
    } else {
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
    // Stoppe alle laufenden Services für saubere Neuinitialisierung
    stopAutoMode()
    stopAutoScrollCompletely()
    simpleFlowController.stopTTS()
    
    // Setze HomeView als aktiven View (stoppt auch alle Services)
    simpleFlowController.setActiveView('/home')
    
    // Mobile Detection und Karussell-Initialisierung
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    // Prüfe ob Face Recognition bereits aktiv ist (von StartView)
    if (!faceRecognition.isActive.value) {
      faceRecognition.start()
    }
    
    // Add global event listeners to detect user interaction
    document.addEventListener('click', enableTTSOnInteraction)
    document.addEventListener('keydown', enableTTSOnInteraction)
    document.addEventListener('touchstart', enableTTSOnInteraction)
    
    // Add right-click handler
    document.addEventListener('contextmenu', handleRightClick, { capture: true, passive: false })
    
    // Add volume toggle listener
    window.addEventListener('volumeToggle', handleVolumeToggle)
    
    // Start HomeView TTS nach 1 Sekunde (saubere Neuinitialisierung)
    startHomeViewTTS()
    
    // Event Listener für Face Blinzel-Erkennung
    window.addEventListener('faceBlinkDetected', handleFaceBlink)
  })

  onUnmounted(() => {
    // Clear alle Timeouts (verhindert Memory Leaks)
    timeoutIds.forEach(id => clearTimeout(id))
    timeoutIds.length = 0
    
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
  })

  return {
    // State
    currentMenu,
    currentTileIndex,
    isAutoMode,
    userInteracted,
    
    // Mobile Carousel State (von Composable)
    isMobile,
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
