import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../settings/stores/settings'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'

export function useIchViewLogic() {
  // Router
  const router = useRouter()

  // Stores
  const settingsStore = useSettingsStore()

  // Face Recognition
  const faceRecognition = useFaceRecognition()

  // State
  const currentMenu = ref('')
  const currentTileIndex = ref(0)
  const isAutoMode = ref(true)
  const autoModeInterval = ref<number | null>(null)
  const closedFrames = ref(0)
  const eyesClosed = ref(false)
  const timeClosed = 2 // 2 Sekunden für Blinzeln
  const userInteracted = ref(false)
  const isAutoModePaused = ref(false)
  const gridContainer = ref<HTMLElement | null>(null)

  // Verbesserte Blink-Detection Parameter - zentral gesteuert
  const blinkThreshold = computed(() => Math.ceil(settingsStore.settings.blinkSensitivity * 10)) // Konvertiere Sekunden zu Frames (10 FPS)
  const lastBlinkTime = ref(0)
  const blinkCooldown = computed(() => settingsStore.settings.blinkSensitivity * 1000)

  // User interaction detection - aktiviert TTS
  const enableTTSOnInteraction = () => {
    if (!userInteracted.value) {
      console.log('IchView: User interaction detected - TTS now enabled')
      userInteracted.value = true
      simpleFlowController.setUserInteracted(true)
    }
  }

  // Zentrale TTS-Funktion über SimpleFlowController
  const speakText = async (text: string) => {
    console.log('IchView: Requesting TTS for:', text)
    await simpleFlowController.speak(text)
  }

  // Carousel zur aktiven Kachel scrollen
  const scrollToActiveTile = (index: number) => {
    if (!gridContainer.value) return
    
    const tiles = gridContainer.value.children
    if (tiles[index]) {
      const tile = tiles[index] as HTMLElement
      const containerWidth = gridContainer.value.clientWidth
      const tileWidth = tile.offsetWidth
      const tileLeft = tile.offsetLeft
      
      // Berechne die Position, um die Kachel in die Mitte zu bringen
      const scrollPosition = tileLeft - (containerWidth / 2) + (tileWidth / 2)
      
      gridContainer.value.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      })
      
      console.log('IchView: Scrolling to tile', index, 'at position', scrollPosition)
    }
  }

  // Menu Items für Ich-Seite - 6 Bereiche
  const menuItems = [
    {
      id: 'ernaehrung',
      title: 'ERNÄHRUNG',
      description: 'Ernährung verwalten',
      icon: 'hamburger-soda.svg'
    },
    {
      id: 'gefuehle',
      title: 'GEFÜHLE',
      description: 'Gefühle dokumentieren',
      icon: 'face-smile-upside-down.svg'
    },
    {
      id: 'kleidung',
      title: 'KLEIDUNG',
      description: 'Kleidung verwalten',
      icon: 'clothes-hanger.svg'
    },
    {
      id: 'hygiene',
      title: 'HYGIENE',
      description: 'Hygiene verwalten',
      icon: 'bath.svg'
    },
    {
      id: 'bewegung',
      title: 'BEWEGUNG',
      description: 'Bewegung dokumentieren',
      icon: 'barefoot.svg'
    },
    {
      id: 'zurueck',
      title: 'ZURÜCK',
      description: 'Zurück zur Hauptseite',
      icon: 'zurueck.svg'
    }
  ]

  // Computed
  const appClasses = computed(() => [
    'min-h-screen flex flex-col',
    settingsStore.isDarkMode ? 'dark' : '',
    settingsStore.isHighContrast ? 'high-contrast' : '',
    settingsStore.isLargeText ? 'large-text' : ''
  ])

  // Alte TTS-Funktion entfernt - verwende zentrale Version

  // Auto Mode Functions
  const startAutoMode = () => {
    if (autoModeInterval.value) return
    
    // Stelle sicher, dass wir bei Index 0 starten
    currentTileIndex.value = 0
    
    const cycleTiles = () => {
      if (!isAutoMode.value || isAutoModePaused.value) {
        return
      }
      
      currentTileIndex.value = (currentTileIndex.value + 1) % menuItems.length
      
      // Spreche den aktuellen Menüpunkt vor
      const currentItem = menuItems[currentTileIndex.value]
      speakText(currentItem.title)
      
      autoModeInterval.value = window.setTimeout(cycleTiles, 3000) // 3 Sekunden
    }
    
    // Spreche den ersten Menüpunkt vor
    const firstItem = menuItems[currentTileIndex.value]
    speakText(firstItem.title)
    
    // Starte den ersten Zyklus nach 3 Sekunden
    autoModeInterval.value = window.setTimeout(cycleTiles, 3000)
  }

  const pauseAutoMode = () => {
    isAutoModePaused.value = true
    if (autoModeInterval.value) {
      clearTimeout(autoModeInterval.value)
      autoModeInterval.value = null
    }
    // TTS wird zentral gesteuert
  }

  const resumeAutoMode = () => {
    isAutoModePaused.value = false
    if (!autoModeInterval.value) {
      // Starte den Auto-Modus bei der aktuellen Kachel
      const currentItem = menuItems[currentTileIndex.value]
      speakText(currentItem.title)
      startAutoMode()
    }
  }

  const stopAutoMode = () => {
    if (autoModeInterval.value) {
      clearTimeout(autoModeInterval.value)
      autoModeInterval.value = null
    }
    // Stoppe auch die Sprachausgabe
    // TTS wird zentral gesteuert
  }

  // Methods
  function selectMenu(menuId: string) {
    console.log('selectMenu called with menuId:', menuId)
    
    // Setze den aktuellen Tile-Index basierend auf der menuId
    const index = menuItems.findIndex(item => item.id === menuId)
    if (index !== -1) {
      currentTileIndex.value = index
    }
    
    currentMenu.value = menuId
    pauseAutoMode() // Pausiere Auto-Modus statt zu stoppen
    
    // Spreche den ausgewählten Menüpunkt vor
    const selectedItem = menuItems.find(item => item.id === menuId)
    if (selectedItem) {
      speakText(selectedItem.title)
    }
    
    // Navigate to corresponding route based on menu ID
    switch (menuId) {
      case 'ernaehrung':
        console.log('IchView: Navigating to /ernaehrung')
        router.push('/ernaehrung')
        break
      case 'gefuehle':
        console.log('IchView: Navigating to /gefuehle')
        router.push('/gefuehle')
        break
      case 'kleidung':
        console.log('IchView: Navigating to /kleidung')
        router.push('/kleidung')
        break
      case 'hygiene':
        console.log('IchView: Navigating to /hygiene')
        router.push('/hygiene')
        break
      case 'bewegung':
        console.log('IchView: Navigating to /bewegung')
        router.push('/bewegung')
        break
      case 'zurueck':
        console.log('IchView: Navigating to /app')
        router.push('/app')
        break
      default:
        console.log('IchView: Unknown menu ID:', menuId)
        // Auto-Mode stoppt bei bewusster Auswahl
        simpleFlowController.stopAutoMode()
    }
  }

  function formatTime(date: Date): string {
    return new Intl.DateTimeFormat('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  // Blink Detection - Verbessert und weniger sensibel
  const handleBlink = () => {
    const now = Date.now()
    
    if (faceRecognition.isBlinking()) {
      closedFrames.value++
      
      // Nur verarbeiten wenn genug Zeit seit letztem Blink vergangen ist
      if (now - lastBlinkTime.value < blinkCooldown.value) {
        return
      }
      
      // Menü-Auswahl bei kurzem Blinzeln
      if (closedFrames.value >= blinkThreshold.value && !eyesClosed.value) {
        const currentItem = menuItems[currentTileIndex.value]
        console.log('Blink activation for tile:', currentTileIndex.value, 'menuId:', currentItem.id, 'title:', currentItem.title, 'frames:', closedFrames.value, 'threshold:', blinkThreshold)
        
        // Spreche den Menüpunkt vor, bevor er ausgewählt wird
        speakText(currentItem.title)
        
        // Scroll zur aktiven Kachel (nur auf Mobile)
        if (window.innerWidth <= 768) {
          scrollToActiveTile(currentTileIndex.value)
        }
        
        selectMenu(currentItem.id)
        eyesClosed.value = true
        lastBlinkTime.value = now
        // Reset frames after successful detection
        closedFrames.value = 0
      }
    } else {
      // Reset nur wenn Augen wirklich offen sind
      if (closedFrames.value > 0) {
        closedFrames.value = 0
        eyesClosed.value = false
      }
    }
  }

  // Rechte Maustaste als Blinzeln-Ersatz
  const handleRightClick = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    console.log('IchView: Right click detected! Current tile index:', currentTileIndex.value, 'Items length:', menuItems.length)
    const currentItem = menuItems[currentTileIndex.value]
    if (currentItem) {
      console.log('IchView: Right click activation for tile:', currentTileIndex.value, 'menuId:', currentItem.id, 'title:', currentItem.title)
      
      // Spreche den Menüpunkt vor, bevor er ausgewählt wird
      speakText(currentItem.title)
      
      // Scroll zur aktiven Kachel (nur auf Mobile)
      if (window.innerWidth <= 768) {
        scrollToActiveTile(currentTileIndex.value)
      }
      
      selectMenu(currentItem.id)
    } else {
      console.log('IchView: No current item found for right click')
    }
    return false
  }

  // Lifecycle
  onMounted(() => {
    // Setze IchView als aktiven View
    simpleFlowController.setActiveView('/ich')
    
    // Ensure face recognition is active
    if (!faceRecognition.isActive.value) {
      faceRecognition.start()
    }
    
    // Watch for blinks using the isBlinking function
    const blinkCheckInterval = setInterval(() => {
      handleBlink()
    }, 100) // Check every 100ms
    
    // Add right click listener
    document.addEventListener('contextmenu', handleRightClick, { capture: true, passive: false })
    
    // Add global event listeners to detect user interaction
    document.addEventListener('click', enableTTSOnInteraction)
    document.addEventListener('keydown', enableTTSOnInteraction)
    document.addEventListener('touchstart', enableTTSOnInteraction)
    
    // Start auto-mode automatically über FlowController
    setTimeout(() => {
      simpleFlowController.startAutoMode(
        menuItems,
        (currentIndex, currentItem) => {
          currentTileIndex.value = currentIndex
          console.log('IchView: Auto-mode cycle:', currentItem.title, 'at index:', currentIndex)
          speakText(currentItem.title)
          
          // Scroll zur aktiven Kachel (nur auf Mobile)
          if (window.innerWidth <= 768) {
            setTimeout(() => {
              scrollToActiveTile(currentIndex)
            }, 100) // Kurze Verzögerung für bessere Performance
          }
        },
        3000,
        3000
      )
    }, 1000)
    
    console.log('IchView: mounted - using central controllers')
    
    // Event-Handler entfernt - FlowController übernimmt die Koordination
  })

  onUnmounted(() => {
    // Stoppe Auto-Mode und TTS über FlowController
    simpleFlowController.stopAutoMode()
    simpleFlowController.stopTTS()
    
    // Clean up event listeners
    document.removeEventListener('contextmenu', handleRightClick, { capture: true })
    document.removeEventListener('click', enableTTSOnInteraction)
    document.removeEventListener('keydown', enableTTSOnInteraction)
    document.removeEventListener('touchstart', enableTTSOnInteraction)
    
    console.log('IchView: unmounted - Auto-mode stopped, TTS stopped')
  })

  return {
    // State
    currentMenu,
    currentTileIndex,
    isAutoMode,
    autoModeInterval,
    closedFrames,
    eyesClosed,
    isAutoModePaused,
    blinkThreshold,
    lastBlinkTime,
    blinkCooldown,
    gridContainer,
    // isTTSEnabled entfernt - TTS wird zentral gesteuert
    menuItems,
    appClasses,

    // Methods
    speakText,
    enableTTSOnInteraction,
    // Auto-Mode-Funktionen entfernt - verwende zentrale ViewFlowController-Methoden
    selectMenu,
    formatTime,
    handleBlink,
    handleRightClick,

    // Stores
    settingsStore,
    faceRecognition
  }
}
