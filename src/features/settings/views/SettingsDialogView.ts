import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../settings/stores/settings'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'
import { useAutoMode } from '../../../shared/composables/useAutoMode'

// Import icons
import leuchtdauerIcon from '@/assets/leuchtdauer.svg'
import blinzeldauerIcon from '@/assets/blinzeldauer.svg'
import farbmodusIcon from '@/assets/farbmodus.svg'
import kameraIcon from '@/assets/kamera.svg'
import kamerapositionIcon from '@/assets/kameraposition.svg'
import impressumIcon from '@/assets/impressum.svg'

export function useSettingsDialogLogic() {
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
  console.log('SettingsDialogView instance created:', instanceId)
  
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

  // TTS direkt über Browser API (umgeht SimpleFlowController-Blockierung)
  const speakText = async (text: string) => {
    console.log('SettingsDialogView: Requesting TTS for:', text)
    
    // Prüfe ob TTS gemutet ist
    // ✅ Prüfe ob TTS stumm geschaltet ist → Volume 0 setzen
    const isMuted = simpleFlowController.getTTSMuted()
    if (isMuted) {
      console.log('SettingsDialogView: TTS is muted - setting volume to 0')
    }
    
    // Direkt über Browser TTS API sprechen
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'de-DE'
      utterance.rate = 0.8
      utterance.pitch = 1.0
      utterance.volume = isMuted ? 0 : 1.0  // ✅ Volume basierend auf Mute-Status
      
      // Stoppe vorherige TTS
      window.speechSynthesis.cancel()
      
      // Spreche Text
      window.speechSynthesis.speak(utterance)
      
      console.log('SettingsDialogView: TTS started directly for:', text)
    } else {
      console.warn('SettingsDialogView: Speech synthesis not supported')
    }
  }

  // Settings Categories - 6 Hauptkategorien
  const settingsCategories = [
    {
      id: 'leuchtdauer',
      title: 'ANZEIGE-INTERVALL',
      icon: leuchtdauerIcon,
      category: 'settings' as const
    },
    {
      id: 'blinzeldauer',
      title: 'EMPFINDLICHKEIT',
      icon: blinzeldauerIcon,
      category: 'settings' as const
    },
    {
      id: 'farbmodus',
      title: 'FARBMODUS',
      icon: farbmodusIcon,
      category: 'settings' as const
    },
    {
      id: 'kamera',
      title: 'KAMERA',
      icon: kameraIcon,
      category: 'settings' as const
    },
    {
      id: 'kamerapositionen',
      title: 'KAMERA-POSITIONEN',
      icon: kamerapositionIcon,
      category: 'settings' as const
    },
    {
      id: 'impressum',
      title: 'IMPRESSUM',
      icon: impressumIcon,
      category: 'settings' as const
    }
  ]

  // Settings Options für jede Kategorie - basierend auf den alten Views
  const settingsOptions = {
    leuchtdauer: [
      { id: 'schnell', title: 'Schnell', description: '1,5 Sekunden', value: 1.5, emoji: '⚡' },
      { id: 'normal', title: 'Normal', description: '2 Sekunden', value: 2, emoji: '⚡' },
      { id: 'langsam', title: 'Langsam', description: '3 Sekunden', value: 3, emoji: '🐌' },
      { id: 'sehr-langsam', title: 'Sehr langsam', description: '4 Sekunden', value: 4, emoji: '🐢' },
      { id: 'lang', title: 'Lang', description: '5 Sekunden', value: 5, emoji: '⏰' },
      { id: 'zurueck', title: 'Zurück', description: '', value: null, emoji: '↩️' }
    ],
    blinzeldauer: [
      { id: 'sehr-kurz', title: 'Sehr kurz', description: '0,3 Sekunden', value: 0.3, emoji: '⚡' },
      { id: 'kurz', title: 'Kurz', description: '0,5 Sekunden', value: 0.5, emoji: '💫' },
      { id: 'normal', title: 'Normal', description: '0,7 Sekunden', value: 0.7, emoji: '✨' },
      { id: 'lang', title: 'Lang', description: '0,9 Sekunden', value: 0.9, emoji: '🌟' },
      { id: 'zurueck', title: 'Zurück', description: '', value: null, emoji: '↩️' }
    ],
    farbmodus: [
      { id: 'hell', title: 'Hell', description: 'Heller Modus', value: false, emoji: '☀️' },
      { id: 'dunkel', title: 'Dunkel', description: 'Dunkler Modus', value: true, emoji: '🌙' },
      { id: 'zurueck', title: 'Zurück', description: '', value: null, emoji: '↩️' }
    ],
    kamera: [
      { id: 'ein', title: 'KAMERA EIN', description: 'Kamera aktivieren', value: true, emoji: '📹' },
      { id: 'aus', title: 'KAMERA AUS', description: 'Kamera deaktivieren', value: false, emoji: '📷' },
      { id: 'zurueck', title: 'Zurück', description: '', value: null, emoji: '↩️' }
    ],
    kamerapositionen: [
      { id: 'oben', title: 'Oben', description: 'Kamera oben positionieren', value: 'top', emoji: '⬆️' },
      { id: 'mitte', title: 'Mitte', description: 'Kamera mittig positionieren', value: 'center', emoji: '↔️' },
      { id: 'unten', title: 'Unten', description: 'Kamera unten positionieren', value: 'bottom', emoji: '⬇️' },
      { id: 'zurueck', title: 'Zurück', description: '', value: null, emoji: '↩️' }
    ],
    impressum: [
      { id: 'info', title: 'Informationen', description: 'App-Informationen anzeigen', value: 'info', emoji: 'ℹ️' },
      { id: 'version', title: 'Version', description: 'Version anzeigen', value: 'version', emoji: '📋' },
      { id: 'kontakt', title: 'Kontakt', description: 'Kontaktinformationen', value: 'contact', emoji: '📞' },
      { id: 'zurueck', title: 'Zurück', description: '', value: null, emoji: '↩️' }
    ]
  }

  // Helper functions
  const getCategoryOptions = (categoryId: string) => {
    const options = settingsOptions[categoryId as keyof typeof settingsOptions] || []
    
    // Markiere die aktuelle Einstellung als aktiv
    return options.map(option => {
      if (option.id === 'zurueck') return option
      
      const isCurrent = isCurrentSetting(categoryId, option.value)
      return {
        ...option,
        isCurrent
      }
    })
  }

  const isCurrentSetting = (categoryId: string, value: any) => {
    switch (categoryId) {
      case 'leuchtdauer':
        return settingsStore.settings.leuchtdauer === value
      case 'blinzeldauer':
        return settingsStore.settings.blinzeldauer === value
      case 'farbmodus':
        return settingsStore.isDarkMode === value
      case 'kamera':
        return settingsStore.settings.kamera === (value ? 'back' : 'off')
      case 'kamerapositionen':
        return settingsStore.settings.kamera === value
      default:
        return false
    }
  }

  const getCategoryTitle = (categoryId: string | null) => {
    if (!categoryId) return ''
    const category = settingsCategories.find(c => c.id === categoryId)
    return category ? category.title : categoryId
  }

  const getOptionTitle = (categoryId: string, optionId: string) => {
    const options = getCategoryOptions(categoryId)
    const option = options.find(o => o.id === optionId)
    return option ? option.title : optionId
  }

  const getCurrentValue = (categoryId: string) => {
    switch (categoryId) {
      case 'leuchtdauer':
        return `${settingsStore.settings.leuchtdauer} Sekunden`
      case 'blinzeldauer':
        return `${settingsStore.settings.blinzeldauer} Sekunden`
      case 'farbmodus':
        return settingsStore.isDarkMode ? 'Dunkel' : 'Hell'
      case 'kamera':
        return settingsStore.settings.kamera === 'back' ? 'Ein' : 'Aus'
      case 'kamerapositionen':
        return settingsStore.settings.kamera === 'top' ? 'Oben' : 
               settingsStore.settings.kamera === 'center' ? 'Mitte' : 'Unten'
      default:
        return ''
    }
  }

  // Get carousel item style for 3D positioning
  const getCarouselItemStyle = (index: number) => {
    const offset = index - currentTileIndex.value
    const rotation = offset < 0 ? -20 : 20
    
    return {
      '--offset': offset,
      '--rotation': `${rotation}deg`
    }
  }

  // Save setting to store
  const saveSetting = async (categoryId: string, optionId: string) => {
    const options = getCategoryOptions(categoryId)
    const option = options.find(o => o.id === optionId)
    
    if (!option || option.value === null) return

    console.log(`Saving setting: ${categoryId} = ${option.value}`)

    // Update settings store based on category
    switch (categoryId) {
      case 'leuchtdauer':
        settingsStore.updateSettings({ leuchtdauer: option.value as number })
        break
      case 'blinzeldauer':
        settingsStore.updateSettings({ blinzeldauer: option.value as number })
        break
      case 'farbmodus':
        settingsStore.toggleDarkMode()
        break
      case 'kamera':
        settingsStore.updateSettings({ kamera: option.value ? 'back' : 'off' })
        break
      case 'kamerapositionen':
        settingsStore.updateSettings({ kamera: option.value as string })
        break
      case 'impressum':
        // Impressum ist nur zur Anzeige, keine Einstellung
        break
    }
  }

  // Auto-Mode Funktionen
  const startAutoMode = (items: any[], speed: number = 2000, delay: number = 3000) => {
    if (!isAutoMode.value) return

    console.log(`[${instanceId}] Starting auto-mode with`, items.length, 'items')
    
    // Erstelle neue Auto-Mode Instanz
    const autoModeInstance = useAutoMode({
      speak: speakText,
      getItems: () => items,
      getTitle: () => 'Einstellungen',
      onCycle: (currentIndex, currentItem) => {
        currentTileIndex.value = currentIndex
      },
      initialDelay: speed,
      cycleDelay: delay
    })
    
    // Starte Auto-Mode (skipTitle = true, da Titel bereits gesprochen wird)
    autoModeInstance.start(true)
    
    // Speichere Instanz für späteres Stoppen
    ;(window as any)[`__settingsAutoMode_${instanceId}`] = autoModeInstance
  }

  const pauseAutoMode = () => {
    console.log(`[${instanceId}] Pausing auto-mode`)
    const autoModeInstance = (window as any)[`__settingsAutoMode_${instanceId}`]
    if (autoModeInstance) {
      autoModeInstance.stop()
    }
  }

  const stopAutoMode = () => {
    console.log(`[${instanceId}] Stopping auto-mode`)
    const autoModeInstance = (window as any)[`__settingsAutoMode_${instanceId}`]
    if (autoModeInstance) {
      autoModeInstance.stop()
      delete (window as any)[`__settingsAutoMode_${instanceId}`]
    }
  }

  // User interaction detection - aktiviert TTS
  const enableTTSOnInteraction = () => {
    if (!userInteracted.value) {
      console.log(`[${instanceId}] User interaction detected - TTS now enabled`)
      userInteracted.value = true
      simpleFlowController.setUserInteracted(true)
    }
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
        // This will be handled by the specific view components
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

  // Right-click handler
  const handleRightClick = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    console.log('SettingsDialogView: Right click detected! Current tile index:', currentTileIndex.value)
    return false
  }

  // Volume toggle handler
  const handleVolumeToggle = (event: Event) => {
    const customEvent = event as CustomEvent
    console.log(`[${instanceId}] Volume toggle received:`, customEvent.detail.enabled)
    
    if (!customEvent.detail.enabled) {
      // Stoppe alle TTS (SimpleFlowController und Browser API)
      simpleFlowController.stopTTS()
      window.speechSynthesis.cancel()
    }
  }

  // Setup lifecycle for different views
  const setupLifecycle = (items: any[], selectionHandler: (item: any) => void) => {
    console.log(`[${instanceId}] Setting up lifecycle for`, items.length, 'items')
    
    // Enable TTS on user interaction
    const enableTTS = () => {
      enableTTSOnInteraction()
    }
    
    // Add event listeners
    document.addEventListener('click', enableTTS)
    document.addEventListener('keydown', enableTTS)
    document.addEventListener('touchstart', enableTTS)
    document.addEventListener('contextmenu', handleRightClick, { capture: true, passive: false })
    window.addEventListener('volumeToggle', handleVolumeToggle)
    
    // Start auto-mode
    setTimeout(() => {
      startAutoMode(items)
    }, 1000)
    
    // Return cleanup function
    return () => {
      console.log(`[${instanceId}] Cleaning up lifecycle`)
      stopAutoMode()
      document.removeEventListener('click', enableTTS)
      document.removeEventListener('keydown', enableTTS)
      document.removeEventListener('touchstart', enableTTS)
      document.removeEventListener('contextmenu', handleRightClick, { capture: true })
      window.removeEventListener('volumeToggle', handleVolumeToggle)
    }
  }

  // Lifecycle
  onMounted(() => {
    // Setze SettingsDialogView als aktiven View
    simpleFlowController.setActiveView('/einstellungen')
    
    if (!faceRecognition.isActive.value) {
      faceRecognition.start()
    }
    
    console.log(`[${instanceId}] SettingsDialogView mounted - using simple controller`)
  })

  onUnmounted(() => {
    // Stoppe Auto-Mode und TTS
    stopAutoMode()
    simpleFlowController.stopTTS()
    
    console.log(`[${instanceId}] SettingsDialogView unmounted - cleanup completed`)
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
    settingsCategories,
    appClasses,
    
    // Auto-mode functions
    startAutoMode,
    pauseAutoMode,
    stopAutoMode,
    
    // Helper functions
    getCategoryOptions,
    getCategoryTitle,
    getOptionTitle,
    getCurrentValue,
    getCarouselItemStyle,
    saveSetting,
    
    // Methods
    handleBlink,
    handleRightClick,
    handleVolumeToggle,
    setupLifecycle,
    
    // Stores
    settingsStore,
    faceRecognition
  }
}
