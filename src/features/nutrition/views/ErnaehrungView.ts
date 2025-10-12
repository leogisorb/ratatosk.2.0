import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { useSettingsStore } from '../../settings/stores/settings'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'
import { generateTTSText, getMainText, getPauseAfterTTS, getAutoStartDelay, getCycleDelay } from '../../../config/ttsConfig'

export function useErnaehrungViewLogic() {
  // Router
  const router = useRouter()

  // Stores
  const settingsStore = useSettingsStore()

  // Face Recognition
  const faceRecognition = useFaceRecognition()

  // State
  const currentTileIndex = ref(0)
  const selectedErnaehrung = ref('')
  const feedbackText = ref('')
  const isAutoMode = ref(true)
  const closedFrames = ref(0)
  const eyesClosed = ref(false)
  const userInteracted = ref(false)
  const isTTSActive = ref(false)

  // Verbesserte Blink-Detection Parameter - zentral gesteuert
  const blinkThreshold = computed(() => Math.ceil(settingsStore.settings.blinkSensitivity * 10))
  const lastBlinkTime = ref(0)
  const blinkCooldown = computed(() => settingsStore.settings.blinkSensitivity * 1000)

  // User interaction detection - aktiviert TTS
  const enableTTSOnInteraction = () => {
    if (!userInteracted.value) {
      console.log('ErnaehrungView: User interaction detected - TTS now enabled')
      userInteracted.value = true
      simpleFlowController.setUserInteracted(true)
    }
  }

  // Ernährung-Items basierend auf dem gezeigten Interface
  const ernaehrungItems = [
    // Hauptkategorien
    { id: 'essen', text: 'Essen', type: 'kategorie', emoji: '🍽️' },
    { id: 'trinken', text: 'Trinken', type: 'kategorie', emoji: '🥤' },
    
    // Geschmacksrichtungen
    { id: 'suess', text: 'süß', type: 'geschmack', emoji: '🍰' },
    { id: 'herzhaft', text: 'herzhaft', type: 'geschmack', emoji: '🍔' },
    { id: 'scharf', text: 'scharf', type: 'geschmack', emoji: '🌶️' },
    
    // Temperaturen
    { id: 'kalt', text: 'kalt', type: 'temperatur', emoji: '❄️' },
    { id: 'warm', text: 'warm', type: 'temperatur', emoji: '🔥' },
    { id: 'lauwarm', text: 'lauwarm', type: 'temperatur', emoji: '🌡️' },
    
    // Konsistenzen
    { id: 'trocken', text: 'trocken', type: 'konsistenz', emoji: '🍪' },
    { id: 'nass', text: 'nass', type: 'konsistenz', emoji: '💧' },
    { id: 'breiig', text: 'breiig', type: 'konsistenz', emoji: '🥣' },
    
    // Getränke
    { id: 'wasser', text: 'Wasser', type: 'getraenk', emoji: '💧' },
    { id: 'saft', text: 'Saft', type: 'getraenk', emoji: '🧃' },
    { id: 'milch', text: 'Milch', type: 'getraenk', emoji: '🥛' },
    
    // Navigation
    { id: 'zurueck', text: 'zurück', type: 'navigation', emoji: '⬅️' }
  ]

  // Zentrale TTS-Funktion über FlowController mit Event-Handling
  const speakText = async (text: string) => {
    console.log('ErnaehrungView: Requesting TTS for:', text)
    isTTSActive.value = true
    
    try {
      await simpleFlowController.speak(text)
    } finally {
      isTTSActive.value = false
    }
  }

  // Ernährung-Item Auswahl
  async function selectErnaehrung(ernaehrungId: string) {
    // Verhindere Interaktion während TTS
    if (isTTSActive.value) {
      console.log('ErnaehrungView: Interaction blocked during TTS')
      return
    }

    const selectedItem = ernaehrungItems.find(item => item.id === ernaehrungId)
    
    if (!selectedItem) {
      console.log('ErnaehrungView: Item not found:', ernaehrungId)
      return
    }

    selectedErnaehrung.value = selectedItem.text
    console.log('ErnaehrungView: Selected item:', selectedItem.text)

    switch (ernaehrungId) {
      case 'zurueck':
        console.log('ErnaehrungView: Navigating back to /ich')
        router.push('/ich')
        break
      default:
        console.log('ErnaehrungView: Selected Ernährung:', ernaehrungId)
        
        // Auto-Mode stoppt bei bewusster Auswahl
        simpleFlowController.stopAutoMode()
        
        // Verwende die neue TTS-Konfiguration
        const ttsText = generateTTSText('ernaehrung', selectedItem.text)
        
        // Zeige orange Rückmeldung an
        feedbackText.value = ttsText
        console.log('ErnaehrungView: Setting feedback text:', ttsText)
        
        // Spreche die Rückmeldung
        await speakText(ttsText)
        
        // Pause nach TTS-Ende - länger warten, damit der Benutzer die orange Nachricht sehen kann
        const pauseAfterTTS = getPauseAfterTTS('ernaehrung')
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
        const currentItem = ernaehrungItems[currentTileIndex.value]
        console.log('ErnaehrungView: Blink activation for tile:', currentTileIndex.value, 'ernaehrungId:', currentItem.id, 'text:', currentItem.text)
        
        // Nur Auswahl - TTS wird in selectErnaehrung gemacht
        selectErnaehrung(currentItem.id)
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
    console.log('ErnaehrungView: Right click detected! Current tile index:', currentTileIndex.value, 'Items length:', ernaehrungItems.length)
    const currentItem = ernaehrungItems[currentTileIndex.value]
    if (currentItem) {
      console.log('ErnaehrungView: Right click activation for tile:', currentTileIndex.value, 'ernaehrungId:', currentItem.id, 'text:', currentItem.text)
      
      // Nur Auswahl - TTS wird in selectErnaehrung gemacht
      selectErnaehrung(currentItem.id)
    } else {
      console.log('ErnaehrungView: No current item found for right click')
    }
    return false
  }

  // Lifecycle
  onMounted(() => {
    // Setze ErnaehrungView als aktiven View
    simpleFlowController.setActiveView('/ernaehrung')
    
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
    console.log('ErnaehrungView: Registering right-click handler')
    document.addEventListener('contextmenu', handleRightClick, { capture: true, passive: false })
    
    // Start auto-mode automatically über FlowController
    // Zuerst den Haupttext sprechen, dann nach Pause die automatische Durchlauf-Logik starten
    const mainText = getMainText('ernaehrung')
    const autoStartDelay = getAutoStartDelay('ernaehrung')
    const cycleDelay = getCycleDelay('ernaehrung')
    
    setTimeout(async () => {
      await speakText(mainText)
      
      // Pause nach TTS-Ende
      const pauseAfterTTS = getPauseAfterTTS('ernaehrung')
      await new Promise(resolve => setTimeout(resolve, pauseAfterTTS))
      
      // Starte automatische Durchlauf-Logik
      simpleFlowController.startAutoMode(
        ernaehrungItems,
        (currentIndex, currentItem) => {
          currentTileIndex.value = currentIndex
          console.log('ErnaehrungView: Auto-mode cycle:', currentItem.text, 'at index:', currentIndex)
          speakText(currentItem.text)
        },
        cycleDelay,
        cycleDelay
      )
    }, autoStartDelay)
    
    console.log('ErnaehrungView: mounted - using central controllers')
  })

  onUnmounted(() => {
    // Stoppe Auto-Mode und TTS über FlowController
    simpleFlowController.stopAutoMode()
    simpleFlowController.stopTTS()
    
    // Clean up event listeners
    document.removeEventListener('click', enableTTSOnInteraction)
    document.removeEventListener('keydown', enableTTSOnInteraction)
    document.removeEventListener('touchstart', enableTTSOnInteraction)
    document.removeEventListener('contextmenu', handleRightClick, { capture: true })
    
    console.log('ErnaehrungView: unmounted - Auto-mode stopped, TTS stopped')
  })

  return {
    // State
    currentTileIndex,
    selectedErnaehrung,
    feedbackText,
    isAutoMode,
    closedFrames,
    eyesClosed,
    blinkThreshold,
    lastBlinkTime,
    blinkCooldown,
    ernaehrungItems,
    
    // Methods
    speakText,
    enableTTSOnInteraction,
    selectErnaehrung,
    handleBlink,
    handleRightClick,
    
    // Stores
    settingsStore,
    faceRecognition
  }
}
