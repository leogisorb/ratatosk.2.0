import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../settings/stores/settings'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'

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
  const isAutoModePaused = ref(false)

  // Verbesserte Blink-Detection Parameter - zentral gesteuert
  const blinkThreshold = computed(() => Math.ceil(settingsStore.settings.blinkSensitivity * 10)) // Konvertiere Sekunden zu Frames (10 FPS)
  const lastBlinkTime = ref(0)
  const blinkCooldown = computed(() => settingsStore.settings.blinkSensitivity * 1000)

  // Text-to-Speech
  const speechSynthesis = window.speechSynthesis
  const isTTSEnabled = ref(true)

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
      icon: 'Goback.svg'
    }
  ]

  // Computed
  const appClasses = computed(() => [
    'min-h-screen flex flex-col',
    settingsStore.isDarkMode ? 'dark' : '',
    settingsStore.isHighContrast ? 'high-contrast' : '',
    settingsStore.isLargeText ? 'large-text' : ''
  ])

  // Text-to-Speech Functions
  const speakText = (text: string) => {
    if (!isTTSEnabled.value || !speechSynthesis) return
    
    // Stoppe vorherige Sprachausgabe
    speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'de-DE'
    utterance.rate = 0.8 // Etwas langsamer sprechen
    utterance.pitch = 1.0
    utterance.volume = 0.8
    
    speechSynthesis.speak(utterance)
  }

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
    speechSynthesis.cancel()
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
    speechSynthesis.cancel()
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
        console.log('Navigating to /ernaehrung')
        router.push('/ernaehrung')
        break
      case 'gefuehle':
        console.log('Navigating to /gefuehle')
        router.push('/gefuehle')
        break
      case 'kleidung':
        console.log('Navigating to /kleidung')
        router.push('/kleidung')
        break
      case 'hygiene':
        console.log('Navigating to /hygiene')
        router.push('/hygiene')
        break
      case 'bewegung':
        console.log('Navigating to /bewegung')
        router.push('/bewegung')
        break
      case 'zurueck':
        console.log('Navigating to /app')
        router.push('/app')
        break
      default:
        console.log('Unknown menu ID:', menuId)
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
    event.preventDefault() // Verhindert Kontextmenü
    console.log('Right click detected - treating as blink')
    const currentItem = menuItems[currentTileIndex.value]
    console.log('Right click activation for tile:', currentTileIndex.value, 'menuId:', currentItem.id, 'title:', currentItem.title)
    
    // Spreche den Menüpunkt vor, bevor er ausgewählt wird
    speakText(currentItem.title)
    
    selectMenu(currentItem.id)
  }

  // Lifecycle
  onMounted(() => {
    // Ensure face recognition is active
    if (!faceRecognition.isActive.value) {
      faceRecognition.start()
    }
    
    // Resume Auto Mode if it was paused (e.g., returning from sub-page)
    if (isAutoModePaused.value) {
      resumeAutoMode()
    } else {
      // Start Auto Mode
      startAutoMode()
    }
    
    // Watch for blinks using the isBlinking function
    const blinkCheckInterval = setInterval(() => {
      handleBlink()
    }, 100) // Check every 100ms
    
    // Add right click listener
    document.addEventListener('contextmenu', handleRightClick)
  })

  onUnmounted(() => {
    // Clean up event listeners
    document.removeEventListener('contextmenu', handleRightClick)
    stopAutoMode()
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
    isTTSEnabled,
    menuItems,
    appClasses,

    // Methods
    speakText,
    startAutoMode,
    pauseAutoMode,
    resumeAutoMode,
    stopAutoMode,
    selectMenu,
    formatTime,
    handleBlink,
    handleRightClick,

    // Stores
    settingsStore,
    faceRecognition
  }
}
