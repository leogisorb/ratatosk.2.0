import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../settings/stores/settings'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'

export function useSlashSettingsLogic() {
  // Router
  const router = useRouter()

  // Stores
  const settingsStore = useSettingsStore()

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
  console.log('SlashSettingsView instance created:', instanceId)
  
  // Verbesserte Blink-Detection Parameter - zentral gesteuert
  const blinkThreshold = computed(() => Math.ceil(settingsStore.settings.blinkSensitivity * 10))
  const lastBlinkTime = ref(0)
  const blinkCooldown = computed(() => settingsStore.settings.blinkSensitivity * 1000)
  
  // Computed
  const appClasses = computed(() => {
    return {
      'dark-mode': settingsStore.isDarkMode,
      'auto-mode': isAutoMode.value,
      'auto-mode-paused': !isAutoMode.value
    }
  })

  // TTS über SimpleFlowController
  const speakText = async (text: string) => {
    console.log('SlashSettingsView: Requesting TTS for:', text)
    await simpleFlowController.speak(text)
  }

  // Settings Items - 6 Hauptkategorien
  const settingsItems = [
    {
      id: 'leuchtdauer',
      title: 'LEUCHTDAUER',
      icon: '/settings-sliders.svg',
      route: '/einstellungen/leuchtdauer',
      category: 'settings' as const
    },
    {
      id: 'blitzdauer',
      title: 'BLITZDAUER',
      icon: '/settings-sliders.svg',
      route: '/einstellungen/blitzdauer',
      category: 'settings' as const
    },
    {
      id: 'farbmodus',
      title: 'FARBMODUS',
      icon: '/settings-sliders.svg',
      route: '/einstellungen/farbmodus',
      category: 'settings' as const
    },
    {
      id: 'kamera',
      title: 'KAMERA',
      icon: '/settings-sliders.svg',
      route: '/einstellungen/kamera',
      category: 'settings' as const
    },
    {
      id: 'kamerapositionen',
      title: 'KAMERAPOSITIONEN',
      icon: '/settings-sliders.svg',
      route: '/einstellungen/kamerapositionen',
      category: 'settings' as const
    },
    {
      id: 'impressum',
      title: 'IMPRESSUM',
      icon: '/settings-sliders.svg',
      route: '/einstellungen/impressum',
      category: 'settings' as const
    }
  ]

  // Auto-Mode Funktionen - einfach und direkt
  const startAutoMode = () => {
    if (!isAutoMode.value) return

    console.log(`[${instanceId}] Starting auto-mode with`, settingsItems.length, 'settings categories')
    
    const success = simpleFlowController.startAutoMode(
      settingsItems,
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

  // Settings selection - verhindert Navigation ohne Interaktion
  const selectSetting = (settingId: string) => {
    console.log(`[${instanceId}] selectSetting called with settingId:`, settingId)
    
    // Enable TTS on user interaction
    enableTTSOnInteraction()
    
    // Stoppe Auto-Mode bei bewusster Navigation
    stopAutoMode()
    
    // Setze den aktuellen Tile-Index basierend auf der settingId
    const index = settingsItems.findIndex(item => item.id === settingId)
    if (index !== -1) {
      currentTileIndex.value = index
    }

    // Navigate to the selected route
    const selectedItem = settingsItems.find(item => item.id === settingId)
    if (selectedItem) {
      console.log(`[${instanceId}] Selected item:`, selectedItem.title, '- Navigation erlaubt')
    }
    
    router.push(selectedItem?.route || '/einstellungen')
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
        const currentItem = settingsItems[currentTileIndex.value]
        if (currentItem) {
          console.log('Blink activation for item:', currentItem.title)
          
          // TTS + Navigation - Auto-Mode stoppt bei Interaktion
          speakText(currentItem.title)
          selectSetting(currentItem.id)
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
    console.log('SlashSettingsView: Right click detected! Current tile index:', currentTileIndex.value, 'Items length:', settingsItems.length)
    const currentItem = settingsItems[currentTileIndex.value]
    if (currentItem) {
      console.log('SlashSettingsView: Right click activation for item:', currentItem.title)
      
      // TTS + Navigation - Auto-Mode stoppt bei Interaktion
      speakText(currentItem.title)
      selectSetting(currentItem.id)
    } else {
      console.log('SlashSettingsView: No current item found for right click')
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

  // Time formatting
  function formatTime(date: Date): string {
    return new Intl.DateTimeFormat('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  // Lifecycle
  onMounted(() => {
    // Setze SlashSettingsView als aktiven View
    simpleFlowController.setActiveView('/einstellungen')
    
    if (!faceRecognition.isActive.value) {
      faceRecognition.start()
    }
    
    // Add global event listeners to detect user interaction
    document.addEventListener('click', enableTTSOnInteraction)
    document.addEventListener('keydown', enableTTSOnInteraction)
    document.addEventListener('touchstart', enableTTSOnInteraction)
    
    // Add right-click handler
    console.log('SlashSettingsView: Registering right-click handler')
    document.addEventListener('contextmenu', handleRightClick, { capture: true, passive: false })
    
    // Add volume toggle listener
    window.addEventListener('volumeToggle', handleVolumeToggle)
    
    // Start auto-mode automatically
    setTimeout(() => {
      console.log(`[${instanceId}] Starting auto-mode automatically (TTS disabled until user interaction)`)
      startAutoMode()
    }, 1000)
    
    console.log(`[${instanceId}] SlashSettingsView mounted - using simple controller`)
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
    
    console.log(`[${instanceId}] SlashSettingsView unmounted - cleanup completed`)
  })

  return {
    // State
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
    settingsItems,
    appClasses,
    
    // Auto-mode functions
    startAutoMode,
    stopAutoMode,
    
    // Methods
    selectSetting,
    formatTime,
    handleBlink,
    handleRightClick,
    handleVolumeToggle,
    
    // Stores
    settingsStore,
    faceRecognition
  }
}
