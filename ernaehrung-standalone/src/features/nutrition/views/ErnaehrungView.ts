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
  const userInteracted = ref(false)
  const isTTSActive = ref(false)

  // Verbesserte Blinzel-Erkennung mit Error Handling
  const handleFaceBlink = (event: any) => {
    try {
      console.log('ErnaehrungView: Face blink received:', event.detail)
      
      if (isTTSActive.value) {
        console.log('ErnaehrungView: TTS aktiv - Blinzel ignoriert')
        return
      }
      
      const currentItem = ernaehrungItems[currentTileIndex.value]
      if (currentItem) {
        console.log('ErnaehrungView: Blinzel für Item:', currentItem.id)
        selectErnaehrung(currentItem.id)
      } else {
        console.warn('ErnaehrungView: No current item found for face blink')
      }
    } catch (error) {
      console.error('ErnaehrungView: Face blink error:', error)
    }
  }

  // User interaction detection - aktiviert TTS
  const enableTTSOnInteraction = () => {
    if (!userInteracted.value) {
      console.log('ErnaehrungView: User interaction detected - TTS now enabled')
      userInteracted.value = true
      simpleFlowController.setUserInteracted(true)
    }
  }

  // Keyboard Navigation
  const handleKeydown = (event: KeyboardEvent) => {
    if (isTTSActive.value) return

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        goToErnaehrung(currentTileIndex.value - 1)
        break
      case 'ArrowRight':
        event.preventDefault()
        goToErnaehrung(currentTileIndex.value + 1)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        const currentItem = ernaehrungItems[currentTileIndex.value]
        if (currentItem) selectErnaehrung(currentItem.id)
        break
      case 'Escape':
        event.preventDefault()
        router.push('/ich')
        break
    }
  }

  // Accessibility: Screen Reader Support
  const getAriaLabel = (item: any, index: number) => {
    const isActive = currentTileIndex.value === index
    const position = `${index + 1} von ${ernaehrungItems.length}`
    return `${item.text}, ${item.description || ''}, ${position}${isActive ? ', aktuell ausgewählt' : ''}`
  }

  // Kategorien-basierte Ernährung-Items mit besserer Struktur
  const ernaehrungCategories = {
    hauptkategorien: {
      title: 'Was möchten Sie?',
      items: [
        { id: 'essen', text: 'Essen', emoji: '🍽️', description: 'Feste Nahrung' },
        { id: 'trinken', text: 'Trinken', emoji: '🥤', description: 'Flüssigkeiten' }
      ]
    },
    geschmack: {
      title: 'Geschmack',
      items: [
        { id: 'suess', text: 'süß', emoji: '🍰', description: 'Zuckerhaltig' },
        { id: 'herzhaft', text: 'herzhaft', emoji: '🍔', description: 'Würzig' },
        { id: 'scharf', text: 'scharf', emoji: '🌶️', description: 'Würzig' },
        { id: 'sauer', text: 'sauer', emoji: '🍋', description: 'Säuerlich' }
      ]
    },
    temperatur: {
      title: 'Temperatur',
      items: [
        { id: 'kalt', text: 'kalt', emoji: '❄️', description: 'Gekühlt' },
        { id: 'warm', text: 'warm', emoji: '🔥', description: 'Erhitzt' },
        { id: 'lauwarm', text: 'lauwarm', emoji: '🌡️', description: 'Zimmertemperatur' }
      ]
    },
    konsistenz: {
      title: 'Konsistenz',
      items: [
        { id: 'trocken', text: 'trocken', emoji: '🍪', description: 'Fest' },
        { id: 'nass', text: 'nass', emoji: '💧', description: 'Flüssig' },
        { id: 'breiig', text: 'breiig', emoji: '🥣', description: 'Weich' }
      ]
    },
    getraenke: {
      title: 'Getränke',
      items: [
        { id: 'wasser', text: 'Wasser', emoji: '💧', description: 'Still oder Sprudel' },
        { id: 'saft', text: 'Saft', emoji: '🧃', description: 'Fruchtsaft' },
        { id: 'milch', text: 'Milch', emoji: '🥛', description: 'Kuhmilch' },
        { id: 'tee', text: 'Tee', emoji: '🍵', description: 'Heißer Tee' }
      ]
    }
  }

  // Flache Liste für Karussell (kompatibel mit bestehender Logik)
  const ernaehrungItems = [
    // Hauptkategorien
    { id: 'essen', text: 'Essen', type: 'kategorie', emoji: '🍽️', description: 'Feste Nahrung' },
    { id: 'trinken', text: 'Trinken', type: 'kategorie', emoji: '🥤', description: 'Flüssigkeiten' },
    
    // Geschmacksrichtungen
    { id: 'suess', text: 'süß', type: 'geschmack', emoji: '🍰', description: 'Zuckerhaltig' },
    { id: 'herzhaft', text: 'herzhaft', type: 'geschmack', emoji: '🍔', description: 'Würzig' },
    { id: 'scharf', text: 'scharf', type: 'geschmack', emoji: '🌶️', description: 'Würzig' },
    { id: 'sauer', text: 'sauer', type: 'geschmack', emoji: '🍋', description: 'Säuerlich' },
    
    // Temperaturen
    { id: 'kalt', text: 'kalt', type: 'temperatur', emoji: '❄️', description: 'Gekühlt' },
    { id: 'warm', text: 'warm', type: 'temperatur', emoji: '🔥', description: 'Erhitzt' },
    { id: 'lauwarm', text: 'lauwarm', type: 'temperatur', emoji: '🌡️', description: 'Zimmertemperatur' },
    
    // Konsistenzen
    { id: 'trocken', text: 'trocken', type: 'konsistenz', emoji: '🍪', description: 'Fest' },
    { id: 'nass', text: 'nass', type: 'konsistenz', emoji: '💧', description: 'Flüssig' },
    { id: 'breiig', text: 'breiig', type: 'konsistenz', emoji: '🥣', description: 'Weich' },
    
    // Getränke
    { id: 'wasser', text: 'Wasser', type: 'getraenk', emoji: '💧', description: 'Still oder Sprudel' },
    { id: 'saft', text: 'Saft', type: 'getraenk', emoji: '🧃', description: 'Fruchtsaft' },
    { id: 'milch', text: 'Milch', type: 'getraenk', emoji: '🥛', description: 'Kuhmilch' },
    { id: 'tee', text: 'Tee', type: 'getraenk', emoji: '🍵', description: 'Heißer Tee' },
    
    // Navigation
    { id: 'zurueck', text: 'zurück', type: 'navigation', emoji: '⬅️', description: 'Zurück zur Hauptseite' }
  ]

  // Zentrale TTS-Funktion über FlowController mit verbessertem Error Handling
  const speakText = async (text: string) => {
    if (!text || text.trim().length === 0) {
      console.warn('ErnaehrungView: Empty text provided to speakText')
      return
    }

    console.log('ErnaehrungView: Requesting TTS for:', text)
    isTTSActive.value = true
    
    try {
      await simpleFlowController.speak(text)
    } catch (error) {
      console.error('ErnaehrungView: TTS Error:', error)
      // Fallback: Zeige Text als visuelles Feedback
      feedbackText.value = `TTS Fehler: ${text}`
      setTimeout(() => {
        feedbackText.value = ''
      }, 3000)
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

  // Blink Detection (ersetzt durch handleFaceBlink - alte Version)

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

  // Karussell-spezifische Handler
  const handleErnaehrungRightClick = (event: MouseEvent, ernaehrungId: string) => {
    if (isTTSActive.value) {
      event.preventDefault()
      return false
    }
    selectErnaehrung(ernaehrungId)
    return false
  }

  const goToErnaehrung = (index: number) => {
    console.log('goToErnaehrung called with index:', index, 'current:', currentTileIndex.value)
    if (index >= 0 && index < ernaehrungItems.length) {
      currentTileIndex.value = index
      console.log('currentTileIndex updated to:', currentTileIndex.value)
    } else {
      // Reibungsloser Loop - wenn Index außerhalb des Bereichs, loope zurück
      if (index < 0) {
        currentTileIndex.value = ernaehrungItems.length - 1
      } else if (index >= ernaehrungItems.length) {
        currentTileIndex.value = 0
      }
      console.log('Looped currentTileIndex to:', currentTileIndex.value)
    }
  }

  // Computed Classes - Pain Dialog Style (einfach und sauber)
  const getTileClass = (index: number) => {
    return currentTileIndex.value === index ? 'carousel-item-active' : 'carousel-item-inactive'
  }

  const getIconClass = (index: number) => {
    return currentTileIndex.value === index ? 'icon-active' : 'icon-inactive'
  }

  const getTextClass = (index: number) => {
    return currentTileIndex.value === index ? 'text-active' : 'text-inactive'
  }

  const getIndicatorClass = (index: number) => {
    return currentTileIndex.value === index ? 'carousel-indicator-active' : 'carousel-indicator-inactive'
  }

  // 3-Kacheln-Looping: Optimierte Offset-Berechnung mit v-if Filter
  const getCarouselOffset = (index: number) => {
    // Schutz vor undefined/index - lockern für bessere Kompatibilität
    if (typeof index !== 'number' || isNaN(index)) {
      console.warn(`getCarouselOffset: Invalid index: ${index}, treating as 0`)
      index = 0 // Fallback zu 0 statt null
    }
    
    const current = currentTileIndex.value || 0
    const total = ernaehrungItems.length || 0
    
    // Fallback falls total = 0
    if (total === 0) {
      console.warn(`getCarouselOffset: No items available`)
      return null
    }
    
    // Relativer Offset zum current Index
    let offset = index - current
    
    // Looping für negatives/positives Offset - korrigiert für 3-Kacheln-System
    if (offset > 1) offset = offset - total
    if (offset < -1) offset = offset + total
    
    // Debug-Log für Pain Dialog Style - erweitert
    console.log(`Pain Dialog Style: index=${index}, current=${current}, offset=${offset}, sichtbar=${offset >= -1 && offset <= 1}`)
    
    // Nur -1,0,1 sichtbar - alle anderen werden durch v-if gefiltert
    if (offset < -1 || offset > 1) return null // nicht sichtbar
    return offset
  }

  // 3-Kacheln-Looping: Berechne Rotation für smooth 3-Kacheln-System
  const getCarouselRotation = (index: number) => {
    const offset = getCarouselOffset(index)
    
    if (offset === 0) return 0      // Mittlere Kachel - keine Rotation
    if (offset === -1) return -20   // Linke Kachel - -20° Rotation
    if (offset === 1) return 20     // Rechte Kachel - +20° Rotation
    
    return 0 // Unsichtbare Kacheln - keine Rotation
  }

  // Optimierte Event Listener mit Debouncing
  let interactionTimeout: NodeJS.Timeout | null = null
  
  const debouncedEnableTTS = () => {
    if (interactionTimeout) {
      clearTimeout(interactionTimeout)
    }
    interactionTimeout = setTimeout(() => {
      enableTTSOnInteraction()
    }, 100)
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
    
    // Add optimized event listeners with debouncing
    document.addEventListener('click', debouncedEnableTTS, { passive: true })
    document.addEventListener('keydown', handleKeydown, { passive: false })
    document.addEventListener('touchstart', debouncedEnableTTS, { passive: true })
    
    // Add right-click handler
    console.log('ErnaehrungView: Registering right-click handler')
    document.addEventListener('contextmenu', handleRightClick, { capture: true, passive: false })
    
    // Event Listener für Face Blinzel-Erkennung
    window.addEventListener('faceBlinkDetected', handleFaceBlink)
    console.log('ErnaehrungView: Face Recognition mit alter Blinzel-Erkennung gestartet')
    
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
    document.removeEventListener('click', debouncedEnableTTS)
    document.removeEventListener('keydown', handleKeydown)
    document.removeEventListener('touchstart', debouncedEnableTTS)
    document.removeEventListener('contextmenu', handleRightClick, { capture: true })
    
    // Clean up Face Recognition
    faceRecognition.stop()
    window.removeEventListener('faceBlinkDetected', handleFaceBlink)
    
    // Clean up timeout
    if (interactionTimeout) {
      clearTimeout(interactionTimeout)
      interactionTimeout = null
    }
    
    console.log('ErnaehrungView: unmounted - Auto-mode stopped, TTS stopped')
  })

  return {
    // State
    currentTileIndex,
    selectedErnaehrung,
    feedbackText,
    isAutoMode,
    isTTSActive,
    ernaehrungItems,
    ernaehrungCategories,
    
    // Methods
    speakText,
    enableTTSOnInteraction,
    selectErnaehrung,
    handleFaceBlink,
    handleRightClick,
    handleErnaehrungRightClick,
    handleKeydown,
    goToErnaehrung,
    
    // Accessibility
    getAriaLabel,
    
    // Computed Classes
    getTileClass,
    getIconClass,
    getTextClass,
    getIndicatorClass,
    
    // 3-Kacheln-Looping Functions
    getCarouselOffset,
    getCarouselRotation,
    
    // Stores
    settingsStore,
    faceRecognition
  }
}
