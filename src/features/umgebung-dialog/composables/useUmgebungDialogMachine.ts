// useUmgebungDialogMachine.ts - Zentrale State Machine für Umgebungs-Dialog

import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useTTS } from './useTTS'
import { useAutoMode, type AutoModeConfig } from './useAutoMode'
import { useUmgebungDictionary } from './useUmgebungDictionary'
import type { UmgebungRegion, UmgebungSubRegion, UmgebungSubSubRegion } from '../data/umgebungDialogData'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'
import { useDialogTimerTracking } from '../../../shared/composables/useDialogTimerTracking'

export type UmgebungDialogState = 'mainView' | 'subRegionView' | 'subSubRegionView' | 'confirmation'

export function useUmgebungDialogMachine() {
  const router = useRouter()
  const tts = useTTS()
  const dict = useUmgebungDictionary()

  // State
  const state = ref<UmgebungDialogState>('mainView')
  const mainRegionId = ref<string | null>(null)
  const subRegionId = ref<string | null>(null)
  const subSubRegionId = ref<string | null>(null)

  // Computed: Aktuelle Items basierend auf State
  const items = computed(() => {
    switch (state.value) {
      case 'mainView':
        return dict.mainRegions
      case 'subRegionView':
        return dict.getSubRegions(mainRegionId.value)
      case 'subSubRegionView':
        return dict.getSubSubRegions(subRegionId.value)
      default:
        return []
    }
  })

  // Computed: Aktueller Titel basierend auf State
  const title = computed(() => {
    switch (state.value) {
      case 'mainView':
        return 'Was möchten Sie an ihrer Umgebung verändern?'
      case 'subRegionView':
        return dict.getSubRegionViewTitle(mainRegionId.value)
      case 'subSubRegionView': {
        const subRegion = items.value.find((item: any) => item.id === subRegionId.value) as UmgebungSubRegion | undefined
        return dict.getSubSubRegionViewTitle(subRegion || null)
      }
      case 'confirmation':
        return 'Auswahl erfasst'
      default:
        return ''
    }
  })

  // Computed: Confirmation Text
  const confirmationText = computed(() => {
    const subRegions = dict.getSubRegions(mainRegionId.value)
    const subRegion = subRegions.find(r => r.id === subRegionId.value) || null
    const subSubRegions = dict.getSubSubRegions(subRegionId.value)
    const verb = subSubRegions.find(v => v.id === subSubRegionId.value) || null
    
    return dict.generateConfirmation(subRegion, verb)
  })

  // AutoMode Configuration
  const autoModeConfig: AutoModeConfig = {
    speak: tts.speak,
    getItems: () => items.value,
    getTitle: () => title.value
  }

  const autoMode = useAutoMode(autoModeConfig)
  
  // Timer-Tracking mit Cleanup-Logik
  const { isActive, scheduleTimer, cleanup: cleanupTimers } = useDialogTimerTracking({
    onCleanup: () => {
      autoMode.stop()
    },
    dialogName: 'UmgebungDialog'
  })

  // Actions

  /**
   * Haupt-Region auswählen
   */
  async function selectMainRegion(id: string) {
    if (id === dict.ID_BACK) {
      goBack()
      return
    }

    autoMode.stop()
    mainRegionId.value = id
    state.value = 'subRegionView'
    subRegionId.value = null
    subSubRegionId.value = null

    // Titel sprechen
    await tts.speak(title.value)
    
    // Nach 3 Sekunden AutoMode starten (skipTitle = true, da Titel bereits gesprochen)
    // Warte auf Vue Reactivity Update mit nextTick, dann prüfe ob Items vorhanden sind
    scheduleTimer(async () => {
      await nextTick() // Warte auf Vue Reactivity Update
      if (items.value.length > 0) {
        autoMode.start(true)
      } else {
        console.warn('❌ useUmgebungDialogMachine: Keine Items verfügbar für AutoMode start (SubRegionView)')
      }
    }, 3000)
  }

  /**
   * Sub-Region auswählen
   */
  async function selectSubRegion(id: string) {
    if (id === dict.ID_BACK) {
      // Zurück zu Haupt-Regionen
      autoMode.stop()
      state.value = 'mainView'
      mainRegionId.value = null
      subRegionId.value = null
      subSubRegionId.value = null

      // Titel sprechen
      await tts.speak(title.value)
      
      // Nach 3 Sekunden AutoMode starten (skipTitle = true, da Titel bereits gesprochen)
      // Warte auf Vue Reactivity Update mit nextTick, dann prüfe ob Items vorhanden sind
      scheduleTimer(async () => {
        await nextTick() // Warte auf Vue Reactivity Update
        if (items.value.length > 0) {
          autoMode.start(true)
        } else {
          console.warn('❌ useUmgebungDialogMachine: Keine Items verfügbar für AutoMode start (Zurück zu MainView)')
        }
      }, 3000)
      return
    }

    autoMode.stop()
    subRegionId.value = id
    state.value = 'subSubRegionView'
    subSubRegionId.value = null

    // Titel sprechen
    await tts.speak(title.value)
    
    // Nach 3 Sekunden AutoMode starten (skipTitle = true, da Titel bereits gesprochen)
    // Warte auf Vue Reactivity Update mit nextTick, dann prüfe ob Items vorhanden sind
    scheduleTimer(async () => {
      await nextTick() // Warte auf Vue Reactivity Update
      if (items.value.length > 0) {
        autoMode.start(true)
      } else {
        console.warn('❌ useUmgebungDialogMachine: Keine Items verfügbar für AutoMode start (SubSubRegion)')
      }
    }, 3000)
  }

  /**
   * Sub-Sub-Region (Verb) auswählen
   */
  async function selectSubSubRegion(id: string) {
    if (id === dict.ID_BACK) {
      // Zurück zu Sub-Regionen
      autoMode.stop()
      state.value = 'subRegionView'
      subRegionId.value = null
      subSubRegionId.value = null

      // Titel sprechen
      await tts.speak(title.value)
      
      // Nach 3 Sekunden AutoMode starten (skipTitle = true, da Titel bereits gesprochen)
      // Warte auf Vue Reactivity Update mit nextTick, dann prüfe ob Items vorhanden sind
      scheduleTimer(async () => {
        await nextTick() // Warte auf Vue Reactivity Update
        if (items.value.length > 0) {
          autoMode.start(true)
        } else {
          console.warn('❌ useUmgebungDialogMachine: Keine Items verfügbar für AutoMode start (Zurück zu SubRegionView)')
        }
      }, 3000)
      return
    }

    autoMode.stop()
    subSubRegionId.value = id
    state.value = 'confirmation'

    // Confirmation Text sprechen
    await tts.speak(confirmationText.value)

    // Nach 3 Sekunden zurück zu Haupt-View
    scheduleTimer(() => {
      resetToMainView()
    }, 3000)
  }

  /**
   * Zurück zur Haupt-View
   */
  async function resetToMainView() {
    autoMode.stop()
    
    state.value = 'mainView'
    mainRegionId.value = null
    subRegionId.value = null
    subSubRegionId.value = null

    // Titel sprechen
    await tts.speak(title.value)
    
    // Nach 3 Sekunden AutoMode starten (skipTitle = true, da Titel bereits gesprochen)
    // Warte auf Vue Reactivity Update mit nextTick, dann prüfe ob Items vorhanden sind
    scheduleTimer(async () => {
      await nextTick() // Warte auf Vue Reactivity Update
      if (items.value.length > 0) {
        autoMode.start(true)
      } else {
        console.warn('❌ useUmgebungDialogMachine: Keine Items verfügbar für AutoMode start (SubSubRegion)')
      }
    }, 3000)
  }

  /**
   * Stoppt alle Timer und verhindert weitere AutoMode-Starts
   */
  function cleanup() {
    cleanupTimers()
  }

  /**
   * Zurück zur Haupt-App navigieren
   */
  function goBack() {
    console.log('UmgebungDialog: goBack() - Stoppe alle Services und navigiere zu /app')
    
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
      console.log('UmgebungDialog: Navigation zu /app erfolgreich - alle Services gestoppt')
    }).catch((error) => {
      console.error('UmgebungDialog: Navigation zu /app fehlgeschlagen:', error)
    })
  }

  /**
   * Blink-Handler: Wählt aktive Kachel aus
   */
  function handleBlink() {
    const currentItems = items.value
    const currentIndex = autoMode.index.value

    if (currentIndex < 0 || currentIndex >= currentItems.length) {
      return
    }

    const currentItem = currentItems[currentIndex]
    if (!currentItem) {
      return
    }

    // Handle "zurück" Button
    if (currentItem.id === dict.ID_BACK) {
      switch (state.value) {
        case 'subRegionView':
          selectSubRegion(dict.ID_BACK)
          break
        case 'subSubRegionView':
          selectSubSubRegion(dict.ID_BACK)
          break
        default:
          goBack()
          break
      }
      return
    }

    // Auswahl basierend auf State
    switch (state.value) {
      case 'mainView':
        selectMainRegion(currentItem.id)
        break
      case 'subRegionView':
        selectSubRegion(currentItem.id)
        break
      case 'subSubRegionView':
        selectSubSubRegion(currentItem.id)
        break
      default:
        break
    }
  }

  /**
   * Index zu einem bestimmten Item springen (für Carousel Indicators)
   */
  function goToIndex(index: number) {
    const currentItems = items.value
    if (index >= 0 && index < currentItems.length) {
      autoMode.stop()
      // Index direkt setzen
      autoMode.index.value = index
      // AutoMode neu starten mit skipTitle
      scheduleTimer(() => {
        autoMode.start(true)
      }, 100)
    }
  }

  return {
    // State
    state,
    mainRegionId,
    subRegionId,
    subSubRegionId,
    
    // Computed
    items,
    title,
    confirmationText,
    autoMode,
    
    // Actions
    selectMainRegion,
    selectSubRegion,
    selectSubSubRegion,
    resetToMainView,
    goBack,
    handleBlink,
    goToIndex,
    cleanup
  }
}

