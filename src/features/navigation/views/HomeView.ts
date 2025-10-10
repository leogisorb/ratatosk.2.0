import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../settings/stores/settings'
import { useCommunicationStore } from '../../communication/stores/communication'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'

export function useHomeViewLogic() {
  // Router
  const router = useRouter()

  // Stores
  const settingsStore = useSettingsStore()
  const communicationStore = useCommunicationStore()

  // Face Recognition
  const faceRecognition = useFaceRecognition()

  // State
  const currentTileIndex = ref(0)
  const isAutoMode = ref(true)
  const closedFrames = ref(0)
  const eyesClosed = ref(false)
  const userInteracted = ref(false)
  
  // Instanz-ID für bessere Kontrolle
  const instanceId = Math.random().toString(36).substr(2, 9)
  console.log('HomeViewSimple instance created:', instanceId)
  
  // Verbesserte Blink-Detection Parameter - zentral gesteuert
  const blinkThreshold = computed(() => Math.ceil(settingsStore.settings.blinkSensitivity * 10))
  const lastBlinkTime = ref(0)
  const blinkCooldown = computed(() => settingsStore.settings.blinkSensitivity * 1000)
  
  // Computed
  const currentMenu = computed(() => {
    return 'main'
  })
  
  const appClasses = computed(() => {
    return {
      'dark-mode': settingsStore.isDarkMode,
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
  const menuItems = [
    {
      id: 'warning',
      title: 'WARNGERÄUSCH',
      icon: '/ratatosk.2.0/Glocke.svg',
      route: '/warning',
      category: 'main' as const
    },
    {
      id: 'communication',
      title: 'UNTERHALTEN',
      icon: '/ratatosk.2.0/Nachricht.svg',
      route: '/unterhalten',
      category: 'communication' as const
    },
    {
      id: 'ich',
      title: 'ICH',
      icon: '/ratatosk.2.0/user.svg',
      route: '/ich',
      category: 'main' as const
    },
    {
      id: 'pain',
      title: 'SCHMERZEN',
      icon: '/ratatosk.2.0/Schmerz.svg',
      route: '/pain-dialog',
      category: 'pain' as const
    },
    {
      id: 'environment',
      title: 'UMGEBUNG',
      icon: '/ratatosk.2.0/Umgebung.svg',
      route: '/umgebung',
      category: 'main' as const
    },
    {
      id: 'settings',
      title: 'EINSTELLUNGEN',
      icon: '/ratatosk.2.0/Einstellungen.svg',
      route: '/einstellungen',
      category: 'settings' as const
    }
  ]

  // Auto-Mode Funktionen - einfach und direkt
  const startAutoMode = () => {
    if (!isAutoMode.value) return

    console.log(`[${instanceId}] Starting auto-mode with`, menuItems.length, 'main categories')
    
    const success = simpleFlowController.startAutoMode(
      menuItems,
      (currentIndex, currentItem) => {
        currentTileIndex.value = currentIndex
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
    }
  }

  // Menu selection - verhindert Navigation ohne Interaktion
  const selectMenu = (menuId: string) => {
    console.log(`[${instanceId}] selectMenu called with menuId:`, menuId)
    
    // Enable TTS on user interaction
    enableTTSOnInteraction()
    
    // Stoppe Auto-Mode bei bewusster Navigation
    stopAutoMode()
    
    // Setze den aktuellen Tile-Index basierend auf der menuId
    const index = menuItems.findIndex(item => item.id === menuId)
    if (index !== -1) {
      currentTileIndex.value = index
    }

    // Navigate to the selected route
    const selectedItem = menuItems.find(item => item.id === menuId)
    if (selectedItem) {
      console.log(`[${instanceId}] Selected item:`, selectedItem.title, '- Navigation erlaubt')
    }
    
    router.push(selectedItem?.route || '/app')
  }

  // Blink detection
  const handleBlink = () => {
    const now = Date.now()
    
    if (faceRecognition.isBlinking()) {
      closedFrames.value++
      
      if (now - lastBlinkTime.value < blinkCooldown.value) {
        return
      }
      
      if (closedFrames.value >= blinkThreshold.value && !eyesClosed.value) {
        const currentItem = menuItems[currentTileIndex.value]
        if (currentItem) {
          console.log('Blink activation for item:', currentItem.title)
          
          // TTS + Navigation - Auto-Mode stoppt bei Interaktion
          speakText(currentItem.title)
          selectMenu(currentItem.id)
          eyesClosed.value = true
          lastBlinkTime.value = now
          closedFrames.value = 0
        }
      }
    } else {
      if (closedFrames.value > 0) {
        closedFrames.value = 0
        eyesClosed.value = false
      }
    }
  }

  // Right-click handler
  const handleRightClick = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    console.log('HomeView: Right click detected! Current tile index:', currentTileIndex.value, 'Items length:', menuItems.length)
    const currentItem = menuItems[currentTileIndex.value]
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
    
    // Stoppe TTS wenn deaktiviert
    if (!customEvent.detail.enabled) {
      simpleFlowController.stopTTS()
    }
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
    
    if (!faceRecognition.isActive.value) {
      faceRecognition.start()
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
      startAutoMode()
    }, 1000)
    
    console.log(`[${instanceId}] HomeViewSimple mounted - using simple controller`)
  })

  onUnmounted(() => {
    // Stoppe Auto-Mode und TTS
    stopAutoMode()
    simpleFlowController.stopTTS()
    
    // Clean up event listeners
    document.removeEventListener('click', enableTTSOnInteraction)
    document.removeEventListener('keydown', enableTTSOnInteraction)
    document.removeEventListener('touchstart', enableTTSOnInteraction)
    document.removeEventListener('contextmenu', handleRightClick, { capture: true })
    window.removeEventListener('volumeToggle', handleVolumeToggle)
    
    console.log(`[${instanceId}] HomeViewSimple unmounted - cleanup completed`)
  })

  return {
    // State
    currentMenu,
    currentTileIndex,
    isAutoMode,
    closedFrames,
    eyesClosed,
    blinkThreshold,
    lastBlinkTime,
    blinkCooldown,
    userInteracted,
    
    // TTS functions
    speakText,
    menuItems,
    appClasses,
    
    // Auto-mode functions
    startAutoMode,
    stopAutoMode,
    
    // Methods
    selectMenu,
    formatTime,
    handleBlink,
    handleRightClick,
    handleVolumeToggle,
    updateLeuchtdauer,
    
    // Stores
    settingsStore,
    communicationStore,
    faceRecognition
  }
}
