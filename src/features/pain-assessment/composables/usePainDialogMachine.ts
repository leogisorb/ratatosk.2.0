/**
 * ✅ MODUL 4 — usePainDialogMachine() (Zentrale State-Machine)
 * 
 * Die gesamte Logik wird zu einem klaren Automaten:
 * 
 * mainView
 *   ↓ selectMainRegion
 * subRegionView
 *   ↓ selectSubRegion
 * painScaleView
 *   ↓ selectPainLevel
 * confirmation
 *   ↓ 5s Timeout
 * mainView
 */

import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTTS } from './useTTS'
import { useAutoMode } from '../../../shared/composables/useAutoMode'
import { usePainDictionary } from './usePainDictionary'
import { useFaceRecognition } from '../../face-recognition/composables/useFaceRecognition'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'
import { useDialogTimerTracking } from '../../../shared/composables/useDialogTimerTracking'
import { debug, debugAutoMode, debugTTS } from '../../../shared/utils/debug'

export type PainDialogState = 'mainView' | 'subRegionView' | 'painScaleView' | 'confirmation'

export function usePainDialogMachine() {
  const router = useRouter()
  const tts = useTTS()
  const dict = usePainDictionary()
  const faceRecognition = useFaceRecognition()

  // ✅ State
  const state = ref<PainDialogState>('mainView')
  const mainRegionId = ref<string | null>(null)
  const subRegionId = ref<string | null>(null)
  const painLevel = ref<number | null>(null)

  // ✅ Computed: Aktuelle Items basierend auf State
  const items = computed(() => {
    if (state.value === 'mainView') return dict.mainRegions as unknown as any[]
    if (state.value === 'subRegionView') return dict.getSubRegions(mainRegionId.value) as unknown as any[]
    if (state.value === 'painScaleView') return dict.painLevels as unknown as any[]
    return [] as any[]
  })

  // ✅ Computed: Aktueller Titel basierend auf State
  const title = computed(() => {
    switch (state.value) {
      case 'mainView':
        return 'Wo haben Sie Schmerzen?'
      case 'subRegionView':
        return dict.getSubRegionViewTitle(mainRegionId.value)
      case 'painScaleView':
        return 'Wie stark sind Ihre Schmerzen?'
      case 'confirmation':
        return 'Bestätigung'
      default:
        return ''
    }
  })

  // ✅ Computed: Bestätigungstext
  const confirmationText = computed(() => {
    return dict.generateConfirmation(subRegionId.value, painLevel.value)
  })

  // ✅ AutoMode konfigurieren
  const autoMode = useAutoMode({
    speak: tts.speak,
    getItems: () => items.value,
    getTitle: () => title.value,
  })
  
  // Timer-Tracking mit Cleanup-Logik
  const { isActive, scheduleTimer, cleanup: cleanupTimers } = useDialogTimerTracking({
    onCleanup: () => {
      debug.log('PainDialogMachine', 'Timer Cleanup - stoppe AutoMode')
      autoMode.stop()
    },
    dialogName: 'PainDialog'
  })

  // Watch State changes
  watch(() => state.value, (newState, oldState) => {
    if (oldState !== undefined) {
      debug.log('PainDialogMachine', 'State-Wechsel', {
        from: oldState,
        to: newState,
        mainRegionId: mainRegionId.value,
        subRegionId: subRegionId.value,
        painLevel: painLevel.value
      })
    }
  })

  // ✅ Hauptregion auswählen
  async function selectMainRegion(id: string) {
    debug.log('PainDialogMachine', 'selectMainRegion', { id, currentState: state.value })
    
    // ✅ Blockiere "zurueck" in mainView
    if (id === 'zurueck') return
    
    // Stoppe AutoMode
    debugAutoMode.stop()
    autoMode.stop()
    
    // Setze State
    mainRegionId.value = id
    state.value = 'subRegionView'
    
    // ✅ Index explizit auf 0 setzen, damit immer bei 0 beginnt (nicht aus Cache)
    autoMode.index.value = 0
    
    // ✅ Spreche neuen Titel (skipTitle = true, da Titel hier schon gesprochen wird)
    debugTTS.speak(title.value, simpleFlowController.getTTSMuted())
    await tts.speak(title.value)
    
    // Starte AutoMode nach 3 Sekunden (skipTitle = true, Titel wurde bereits gesprochen)
    scheduleTimer(() => {
      if (state.value === 'subRegionView') {
        // ✅ Stelle sicher, dass Index noch bei 0 ist (falls State zwischenzeitlich geändert wurde)
        autoMode.index.value = 0
        debugAutoMode.start(true)
        autoMode.start(true) // ✅ skipTitle = true, da Titel bereits gesprochen
      }
    }, 3000)
  }

  // ✅ Unterregion auswählen
  async function selectSubRegion(id: string) {
    debug.log('PainDialogMachine', 'selectSubRegion', { id, currentState: state.value })
    
    // Stoppe AutoMode
    debugAutoMode.stop()
    autoMode.stop()
    
    // ✅ Robustes zurueck-Handling
    if (id === 'zurueck') {
      mainRegionId.value = null
      state.value = 'mainView'
      
      // ✅ Index explizit auf 0 setzen, damit immer bei 0 beginnt (nicht aus Cache)
      autoMode.index.value = 0
      
      debugTTS.speak(title.value, simpleFlowController.getTTSMuted())
      await tts.speak(title.value)
      
      // Starte AutoMode nach 3 Sekunden (skipTitle = true, Titel wurde bereits gesprochen)
      scheduleTimer(() => {
        if (state.value === 'mainView') {
          // ✅ Stelle sicher, dass Index noch bei 0 ist (falls State zwischenzeitlich geändert wurde)
          autoMode.index.value = 0
          debugAutoMode.start(true)
          autoMode.start(true) // ✅ skipTitle = true
        }
      }, 3000)
      return
    }
    
    // Setze State
    subRegionId.value = id
    state.value = 'painScaleView'
    
    // ✅ Index explizit auf 0 setzen, damit Schmerzskala immer bei 0 beginnt (nicht aus Cache)
    autoMode.index.value = 0
    
    // ✅ Spreche neuen Titel (skipTitle = true, da Titel hier schon gesprochen wird)
    debugTTS.speak(title.value, simpleFlowController.getTTSMuted())
    await tts.speak(title.value)
    
    // Starte AutoMode nach 3 Sekunden (skipTitle = true, Titel wurde bereits gesprochen)
    scheduleTimer(() => {
      if (state.value === 'painScaleView') {
        // ✅ Stelle sicher, dass Index noch bei 0 ist (falls State zwischenzeitlich geändert wurde)
        autoMode.index.value = 0
        debugAutoMode.start(true)
        autoMode.start(true) // ✅ skipTitle = true, da Titel bereits gesprochen
      }
    }, 3000)
  }

  // ✅ Schmerzlevel auswählen
  async function selectPainLevel(level: number) {
    debug.log('PainDialogMachine', 'selectPainLevel', { level, currentState: state.value })
    
    // Stoppe AutoMode
    debugAutoMode.stop()
    autoMode.stop()
    
    // Setze State
    painLevel.value = level
    state.value = 'confirmation'
    
    // Spreche Bestätigungstext
    const textToSpeak = confirmationText.value || 'Ihre Angabe wurde gespeichert.'
    debugTTS.speak(textToSpeak, simpleFlowController.getTTSMuted())
    await tts.speak(textToSpeak)
    
    // Nach 5 Sekunden zurück zum Start
    scheduleTimer(() => {
      // Reset State
      state.value = 'mainView'
      mainRegionId.value = null
      subRegionId.value = null
      painLevel.value = null
      
      // ✅ Index explizit auf 0 setzen, damit immer bei 0 beginnt (nicht aus Cache)
      autoMode.index.value = 0
      
      // Spreche Titel
      debugTTS.speak(title.value, simpleFlowController.getTTSMuted())
      tts.speak(title.value)
      
      // Starte AutoMode nach 3 Sekunden (skipTitle = true, Titel wurde bereits gesprochen)
      scheduleTimer(() => {
        if (state.value === 'mainView') {
          // ✅ Stelle sicher, dass Index noch bei 0 ist (falls State zwischenzeitlich geändert wurde)
          autoMode.index.value = 0
          debugAutoMode.start(true)
          autoMode.start(true) // ✅ skipTitle = true, da Titel bereits gesprochen
        }
      }, 3000)
    }, 5000)
  }

  /**
   * Stoppt alle Timer und verhindert weitere AutoMode-Starts
   */
  function cleanup() {
    console.log('PainDialog: cleanup() - Stoppe alle Timer und AutoMode')
    
    // Stoppe AutoMode explizit (wichtig: vor cleanupTimers, damit onCleanup nicht nochmal stoppt)
    autoMode.stop()
    
    // Stoppe alle Timer (dies ruft auch onCleanup auf, aber AutoMode ist bereits gestoppt)
    cleanupTimers()
    
    // Stoppe TTS (lokal)
    tts.cancel()
    
    console.log('PainDialog: cleanup() abgeschlossen')
  }

  /**
   * Zurück zur Haupt-App navigieren
   */
  function goBack() {
    console.log('PainDialog: goBack() - Stoppe alle Services und navigiere zu /app')
    
    // Cleanup: Stoppe alle Timer und verhindere weitere AutoMode-Starts
    cleanup()
    
    // Stoppe TTS (lokal)
    tts.cancel()
    
    // Stoppe alle TTS (SimpleFlowController)
    simpleFlowController.stopTTS()
    
    // Stoppe alle TTS (auch außerhalb SimpleFlowController)
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    
    // Stoppe Auto-Mode komplett (SimpleFlowController)
    simpleFlowController.stopAutoMode()
    
    // Setze aktiven View zurück
    simpleFlowController.setActiveView('')
    
    // Navigiere zu /app (Home-View)
    router.push('/app').then(() => {
      console.log('PainDialog: Navigation zu /app erfolgreich - alle Services gestoppt')
    }).catch((error) => {
      console.error('PainDialog: Navigation zu /app fehlgeschlagen:', error)
    })
  }

  // ✅ Blink-Handler
  function handleBlink() {
    debug.log('PainDialogMachine', 'handleBlink', {
      state: state.value,
      itemsCount: items.value.length,
      currentIndex: autoMode.index.value
    })
    
    const currentItems = items.value
    if (!currentItems || !currentItems.length) {
      debug.warn('PainDialogMachine', 'handleBlink - Keine Items verfügbar')
      return
    }
    
    const currentIndex = autoMode.index.value
    const currentItem = currentItems[currentIndex]
    
    if (!currentItem) {
      debug.warn('PainDialogMachine', 'handleBlink - Kein Item für Index', { currentIndex })
      return
    }
    
    debug.log('PainDialogMachine', 'handleBlink - Aktuelles Item', currentItem)
    
    // ✅ Robustes zurueck-Handling
    if (currentItem.id === 'zurueck') {
      debug.log('PainDialogMachine', 'handleBlink - Zurück-Button erkannt', { state: state.value })
      switch (state.value) {
        case 'subRegionView':
          selectSubRegion('zurueck')
          break
        default:
          goBack()
          break
      }
      return
    }
    
    // State-spezifische Auswahl
    if (state.value === 'mainView') {
      if (typeof currentItem.id === 'string') {
        debug.log('PainDialogMachine', 'handleBlink - Wähle Hauptregion', { id: currentItem.id })
        selectMainRegion(currentItem.id)
      }
    } else if (state.value === 'subRegionView') {
      if (typeof currentItem.id === 'string') {
        debug.log('PainDialogMachine', 'handleBlink - Wähle Unterregion', { id: currentItem.id })
        selectSubRegion(currentItem.id)
      }
    } else if (state.value === 'painScaleView') {
      // Pain levels haben level property
      const item = currentItem as any
      if ('level' in item && typeof item.level === 'number') {
        debug.log('PainDialogMachine', 'handleBlink - Wähle Schmerzlevel', { level: item.level })
        selectPainLevel(item.level)
      } else if ('id' in item && typeof item.id === 'number') {
        // Fallback: falls id als number verwendet wird
        debug.log('PainDialogMachine', 'handleBlink - Wähle Schmerzlevel (Fallback)', { id: item.id })
        selectPainLevel(item.id)
      } else {
        debug.warn('PainDialogMachine', 'handleBlink - Kein gültiges Level gefunden', { item })
      }
    } else {
      debug.warn('PainDialogMachine', 'handleBlink - Unbekannter State', { state: state.value })
    }
  }

  return {
    // State
    state: computed(() => state.value),
    mainRegionId: computed(() => mainRegionId.value),
    subRegionId: computed(() => subRegionId.value),
    painLevel: computed(() => painLevel.value),
    
    // Computed
    items,
    title,
    confirmationText,
    
    // AutoMode
    autoMode,
    
    // Actions
    selectMainRegion,
    selectSubRegion,
    selectPainLevel,
    goBack,
    handleBlink,
    cleanup,
    
    // TTS
    speak: tts.speak,
    isSpeaking: tts.isSpeaking,
    
    // Dictionary Helpers
    findMainRegion: dict.findMainRegion,
    findSubRegion: dict.findSubRegion,
    findPainLevel: dict.findPainLevel,
  }
}

