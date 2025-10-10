import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../settings/stores/settings'
import { useCommunicationStore } from '../../communication/stores/communication'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'

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
  const autoModeInterval = ref<number | null>(null)
  const closedFrames = ref(0)
  const eyesClosed = ref(false)
  const isAutoModePaused = ref(false)
  const restartTimeout = ref<number | null>(null)
  const userInteracted = ref(false)
  
  // TTS State
  const isVolumeEnabled = ref(true) // Standardmäßig aktiviert
  const speechSynthesis = window.speechSynthesis
  
  // Instanz-ID für bessere Kontrolle
  const instanceId = Math.random().toString(36).substr(2, 9)
  console.log('HomeView instance created:', instanceId)
  
  // Global HomeView Management - stoppe alle anderen Instanzen
  const stopAllOtherHomeViews = () => {
    console.log(`[${instanceId}] Stopping all other HomeView instances`)
    // Stoppe alle laufenden TTS
    speechSynthesis.cancel()
    // Sende Event an alle anderen Instanzen
    const event = new CustomEvent('stopHomeView', { 
      detail: { exceptInstanceId: instanceId } 
    })
    window.dispatchEvent(event)
    
    // Zusätzlich: Stoppe alle anderen Auto-Mode-Instanzen global
    const stopAllAutoModeEvent = new CustomEvent('stopAllAutoMode')
    window.dispatchEvent(stopAllAutoModeEvent)
  }
  
  // Neue TTS Funktion - klar und verständlich
  const speakText = (text: string) => {
    if (!isVolumeEnabled.value) {
      console.log(`[${instanceId}] TTS disabled - not speaking:`, text)
      return
    }
    
    // TTS nur nach Benutzerinteraktion
    if (!userInteracted.value) {
      console.log(`[${instanceId}] TTS not allowed yet - user must interact first:`, text)
      return
    }
    
    // Stoppe alle laufenden TTS (auch von anderen Instanzen)
    speechSynthesis.cancel()
    
    // Warte kurz für sauberen Stop
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text)
      
      // Optimale Einstellungen für klare Stimme
      utterance.lang = 'de-DE'
      utterance.rate = 0.8  // Etwas langsamer für bessere Verständlichkeit
      utterance.pitch = 1.0  // Normale Tonhöhe
      utterance.volume = 1.0 // Maximale Lautstärke
      
      // Beste deutsche Stimme finden
      const voices = speechSynthesis.getVoices()
      
      // Priorität: Deutsche weibliche Stimme > Deutsche männliche > Standard
      let selectedVoice = voices.find(voice => 
        voice.lang.startsWith('de') && 
        voice.name.toLowerCase().includes('female')
      )
      
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
          voice.lang.startsWith('de') && 
          voice.name.toLowerCase().includes('male')
        )
      }
      
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang.startsWith('de'))
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice
      }
      
      // Event-Handler für bessere Kontrolle
      utterance.onstart = () => {
        console.log(`[${instanceId}] TTS gestartet:`, text)
      }
      
      utterance.onend = () => {
        console.log(`[${instanceId}] TTS beendet:`, text)
      }
      
      utterance.onerror = (event) => {
        // Ignoriere "canceled" und "not-allowed" Fehler - das ist normal
        if (event.error !== 'canceled' && event.error !== 'not-allowed') {
          console.error(`[${instanceId}] TTS Fehler:`, event.error, 'für Text:', text)
        } else if (event.error === 'not-allowed') {
          console.log(`[${instanceId}] TTS not-allowed - Benutzer muss erst interagieren`)
        }
      }
      
      speechSynthesis.speak(utterance)
    }, 100)
  }

  // Verbesserte Blink-Detection Parameter - zentral gesteuert
  const blinkThreshold = computed(() => Math.ceil(settingsStore.settings.blinkSensitivity * 10)) // Konvertiere Sekunden zu Frames (10 FPS)
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
      'auto-mode-paused': isAutoModePaused.value
    }
  })

  // TTS removed

  // Menu Items mit echten SVG-Icons
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
      id: 'pain',
      title: 'SCHMERZEN',
      icon: '/ratatosk.2.0/Schmerz.svg',
      route: '/pain-dialog',
      category: 'pain' as const
    },
    {
      id: 'feelings',
      title: 'GEFÜHLE',
      icon: '/ratatosk.2.0/face-smile-upside-down.svg',
      route: '/gefuehle',
      category: 'main' as const
    },
    {
      id: 'environment',
      title: 'UMGEBUNG',
      icon: '/ratatosk.2.0/Umgebung.svg',
      route: '/umgebung',
      category: 'main' as const
    },
    {
      id: 'hygiene',
      title: 'HYGIENE',
      icon: '/ratatosk.2.0/Hygiene.svg',
      route: '/hygiene',
      category: 'main' as const
    },
    {
      id: 'clothing',
      title: 'KLEIDUNG',
      icon: '/ratatosk.2.0/clothes-hanger.svg',
      route: '/kleidung',
      category: 'main' as const
    },
    {
      id: 'movement',
      title: 'BEWEGUNG',
      icon: '/ratatosk.2.0/barefoot.svg',
      route: '/bewegung',
      category: 'main' as const
    },
    {
      id: 'nutrition',
      title: 'ERNÄHRUNG',
      icon: '/ratatosk.2.0/plate-wheat.svg',
      route: '/ernaehrung',
      category: 'main' as const
    },
    {
      id: 'settings',
      title: 'EINSTELLUNGEN',
      icon: '/ratatosk.2.0/Einstellungen.svg',
      route: '/einstellungen',
      category: 'settings' as const
    },
    {
      id: 'camera',
      title: 'KAMERA',
      icon: '/ratatosk.2.0/camera.svg',
      route: '/kamera',
      category: 'settings' as const
    },
    {
      id: 'camera-position',
      title: 'KAMERAPOSITION',
      icon: '/ratatosk.2.0/camera.svg',
      route: '/kameraposition',
      category: 'settings' as const
    }
  ]

  // Auto-Mode Funktionen - Verwendet Leuchtdauer aus Einstellungen
  const startAutoMode = () => {
    if (autoModeInterval.value || !isAutoMode.value) return

    // Stoppe alle anderen HomeView-Instanzen
    stopAllOtherHomeViews()

    const leuchtdauer = settingsStore.settings.autoModeSpeed
    console.log(`[${instanceId}] Starting auto-mode with`, menuItems.length, 'items, Leuchtdauer:', leuchtdauer, 'ms')

    const cycleTiles = () => {
      if (!isAutoMode.value || isAutoModePaused.value) {
        console.log(`[${instanceId}] Auto-mode stopped or paused`)
        return
      }

      // Aktuelle Leuchtdauer aus Einstellungen holen (kann sich dynamisch ändern)
      const currentLeuchtdauer = settingsStore.settings.autoModeSpeed
      
      // Move to next item ZUERST
      currentTileIndex.value = (currentTileIndex.value + 1) % menuItems.length
      console.log(`[${instanceId}] Moved to next item, new index:`, currentTileIndex.value)
      
      // Aktuelle Kachel SOFORT vorlesen (wenn sie leuchtet)
      const currentItem = menuItems[currentTileIndex.value]
      if (currentItem) {
        console.log(`[${instanceId}] Current item:`, currentItem.title, 'at index:', currentTileIndex.value, 'Leuchtdauer:', currentLeuchtdauer, 'ms')
        // TTS startet sofort wenn Kachel leuchtet
        speakText(currentItem.title)
      }

      // Schedule next cycle mit aktueller Leuchtdauer aus Einstellungen
      autoModeInterval.value = window.setTimeout(cycleTiles, currentLeuchtdauer)
    }

    // Start immediately
    cycleTiles()
  }

  const pauseAutoMode = () => {
    isAutoModePaused.value = true
    if (autoModeInterval.value) {
      clearTimeout(autoModeInterval.value)
      autoModeInterval.value = null
    }
    if (restartTimeout.value) {
      clearTimeout(restartTimeout.value)
      restartTimeout.value = null
    }
    // TTS removed
  }

  const stopAutoMode = () => {
    if (autoModeInterval.value) {
      clearTimeout(autoModeInterval.value)
      autoModeInterval.value = null
    }
    if (restartTimeout.value) {
      clearTimeout(restartTimeout.value)
      restartTimeout.value = null
    }
    // TTS removed
  }

  const resumeAutoMode = () => {
    if (isAutoModePaused.value) {
      isAutoModePaused.value = false
      // Starte den Auto-Modus bei der aktuellen Kachel
      const currentItem = menuItems[currentTileIndex.value]
      console.log('Resuming auto-mode with item:', currentItem.title)
      startAutoMode()
    }
  }

  // Funktion um Leuchtdauer dynamisch zu aktualisieren
  const updateLeuchtdauer = () => {
    if (isAutoMode.value && !isAutoModePaused.value) {
      console.log('Leuchtdauer geändert, Auto-Mode wird mit neuer Geschwindigkeit neu gestartet')
      stopAutoMode()
      setTimeout(() => {
        startAutoMode()
      }, 100)
    }
  }

  // User interaction detection - aktiviert TTS
  const enableTTSOnInteraction = () => {
    if (!userInteracted.value) {
      console.log(`[${instanceId}] User interaction detected - TTS now enabled`)
      userInteracted.value = true
    }
  }

  // Menu selection - verhindert Navigation ohne Interaktion
  const selectMenu = (menuId: string) => {
    console.log(`[${instanceId}] selectMenu called with menuId:`, menuId)
    
    // Enable TTS on user interaction
    enableTTSOnInteraction()
    
    // Stoppe Auto-Mode bei Navigation
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
          
          // TTS removed - just log
          console.log('Selected item:', currentItem.title, '- TTS removed')
          
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
    const currentItem = menuItems[currentTileIndex.value]
    if (currentItem) {
      console.log('Right click activation for item:', currentItem.title)
      
      // TTS removed - just log
      console.log('Selected item:', currentItem.title, '- TTS removed')
      
      selectMenu(currentItem.id)
    }
  }

  // Volume toggle handler - synchronisiert mit Header
  const handleVolumeToggle = (event: Event) => {
    const customEvent = event as CustomEvent
    isVolumeEnabled.value = customEvent.detail.enabled
    console.log(`[${instanceId}] Volume toggle received:`, customEvent.detail.enabled)
  }

  // Stop HomeView handler - stoppt diese Instanz wenn andere aktiv wird
  const handleStopHomeView = (event: Event) => {
    const customEvent = event as CustomEvent
    const exceptInstanceId = customEvent.detail.exceptInstanceId
    
    if (exceptInstanceId !== instanceId) {
      console.log(`[${instanceId}] Received stop signal from another HomeView instance`)
      stopAutoMode()
      speechSynthesis.cancel()
    }
  }

  // Stop All AutoMode handler - stoppt alle Auto-Mode-Instanzen
  const handleStopAllAutoMode = (event: Event) => {
    console.log(`[${instanceId}] Received stop all auto-mode signal`)
    stopAutoMode()
    speechSynthesis.cancel()
  }

  // Time formatting
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Lifecycle
  onMounted(() => {
    // Add global event listeners to detect user interaction
    document.addEventListener('click', enableTTSOnInteraction)
    document.addEventListener('keydown', enableTTSOnInteraction)
    document.addEventListener('touchstart', enableTTSOnInteraction)
    
    // Listen for volume toggle events from header
    window.addEventListener('volumeToggle', handleVolumeToggle as EventListener)
    
    // Listen for stop HomeView events from other instances
    window.addEventListener('stopHomeView', handleStopHomeView as EventListener)
    
    // Listen for stop all auto-mode events
    window.addEventListener('stopAllAutoMode', handleStopAllAutoMode as EventListener)
    
    // Lade TTS-Stimmen
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices()
      console.log('TTS Stimmen geladen:', voices.length)
      voices.forEach(voice => {
        if (voice.lang.startsWith('de')) {
          console.log('Deutsche Stimme gefunden:', voice.name, voice.lang)
        }
      })
    }
    
    // Stimmen laden (manchmal sind sie nicht sofort verfügbar)
    loadVoices()
    speechSynthesis.onvoiceschanged = loadVoices
    
    console.log(`[${instanceId}] HomeView mounted - TTS aktiviert`)
    
    // Start face recognition if not active
    if (!faceRecognition.isActive.value) {
      faceRecognition.start()
    }

    // Setup blink detection interval
    const blinkCheckInterval = setInterval(handleBlink, 100)

    // Setup event listeners
    const rightClickHandler = (event: MouseEvent) => handleRightClick(event)
    document.addEventListener('contextmenu', rightClickHandler)

    // Start auto-mode automatisch (ohne TTS bis Benutzerinteraktion)
    setTimeout(() => {
      console.log(`[${instanceId}] Starting auto-mode automatically (TTS disabled until user interaction)`)
      startAutoMode()
    }, 1000)

    // Cleanup function
    return () => {
      clearInterval(blinkCheckInterval)
      document.removeEventListener('contextmenu', rightClickHandler)
      stopAutoMode()
    }
  })

  onUnmounted(() => {
    // Clean up event listeners
    document.removeEventListener('click', enableTTSOnInteraction)
    document.removeEventListener('keydown', enableTTSOnInteraction)
    document.removeEventListener('touchstart', enableTTSOnInteraction)
    document.removeEventListener('contextmenu', handleRightClick)
    window.removeEventListener('volumeToggle', handleVolumeToggle as EventListener)
    window.removeEventListener('stopHomeView', handleStopHomeView as EventListener)
    window.removeEventListener('stopAllAutoMode', handleStopAllAutoMode as EventListener)
    
    // Stoppe Auto-Mode und TTS
    stopAutoMode()
    speechSynthesis.cancel()
    
    console.log(`[${instanceId}] HomeView unmounted - cleanup completed`)
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
    restartTimeout,
    blinkThreshold,
    lastBlinkTime,
    blinkCooldown,
    userInteracted,

    // TTS
    isVolumeEnabled,
    speakText,

    // Methods
    startAutoMode,
    pauseAutoMode,
    resumeAutoMode,
    stopAutoMode,
    enableTTSOnInteraction,
    selectMenu,
    formatTime,
    handleBlink,
    handleRightClick,
    handleVolumeToggle,

    // Data
    menuItems,
    appClasses,
    settingsStore,
    communicationStore,
    faceRecognition
  }
}