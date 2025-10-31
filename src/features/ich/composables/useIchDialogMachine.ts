// useIchDialogMachine.ts - Zentrale State Machine für Ich-Dialog

import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useTTS } from './useTTS'
import { useAutoMode, type AutoModeConfig } from './useAutoMode'
import { useIchDictionary } from './useIchDictionary'
import type { IchRegion, IchSubRegion } from '../data/ichDialogData'

export type IchDialogState = 'mainView' | 'subRegionView' | 'confirmation'

export function useIchDialogMachine() {
  const router = useRouter()
  const tts = useTTS()
  const dict = useIchDictionary()

  // State
  const state = ref<IchDialogState>('mainView')
  const mainRegionId = ref<string | null>(null)
  const subRegionId = ref<string | null>(null)

  // Computed: Aktuelle Items basierend auf State
  const items = computed(() => {
    switch (state.value) {
      case 'mainView':
        return dict.mainRegions
      case 'subRegionView':
        return dict.getSubRegions(mainRegionId.value)
      default:
        return []
    }
  })

  // Computed: Aktueller Titel basierend auf State
  const title = computed(() => {
    switch (state.value) {
      case 'mainView':
        return 'Was möchten Sie machen?'
      case 'subRegionView':
        return dict.getSubRegionViewTitle(mainRegionId.value)
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
    
    return dict.generateConfirmation(mainRegionId.value, subRegion)
  })

  // AutoMode Configuration
  const autoModeConfig: AutoModeConfig = {
    speak: tts.speak,
    getItems: () => items.value,
    getTitle: () => title.value
  }

  const autoMode = useAutoMode(autoModeConfig)

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

    // Titel sprechen
    await tts.speak(title.value)
    
    // Nach 3 Sekunden AutoMode starten (skipTitle = true, da Titel bereits gesprochen)
    // Warte auf Vue Reactivity Update mit nextTick, dann prüfe ob Items vorhanden sind
    setTimeout(async () => {
      await nextTick() // Warte auf Vue Reactivity Update
      if (items.value.length > 0) {
        autoMode.start(true)
      } else {
        console.warn('❌ useIchDialogMachine: Keine Items verfügbar für AutoMode start (SubRegionView)')
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

      // Titel sprechen
      await tts.speak(title.value)
      
      // Nach 3 Sekunden AutoMode starten (skipTitle = true, da Titel bereits gesprochen)
      // Warte auf Vue Reactivity Update mit nextTick, dann prüfe ob Items vorhanden sind
      setTimeout(async () => {
        await nextTick() // Warte auf Vue Reactivity Update
        if (items.value.length > 0) {
          autoMode.start(true)
        } else {
          console.warn('❌ useIchDialogMachine: Keine Items verfügbar für AutoMode start (Zurück zu MainView)')
        }
      }, 3000)
      return
    }

    autoMode.stop()
    subRegionId.value = id
    state.value = 'confirmation'

    // Confirmation Text sprechen
    await tts.speak(confirmationText.value)

    // Nach 3 Sekunden zurück zu Haupt-View
    setTimeout(() => {
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

    // Titel sprechen
    await tts.speak(title.value)
    
    // Nach 3 Sekunden AutoMode starten (skipTitle = true, da Titel bereits gesprochen)
    // Warte auf Vue Reactivity Update mit nextTick, dann prüfe ob Items vorhanden sind
    setTimeout(async () => {
      await nextTick() // Warte auf Vue Reactivity Update
      if (items.value.length > 0 && state.value === 'mainView') {
        autoMode.start(true)
      } else {
        console.warn('❌ useIchDialogMachine: Keine Items verfügbar für AutoMode start (Reset to MainView)')
      }
    }, 3000)
  }

  /**
   * Zurück zur Haupt-App navigieren
   */
  function goBack() {
    autoMode.stop()
    tts.cancel()
    router.push('/app')
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
      setTimeout(() => {
        autoMode.start(true)
      }, 100)
    }
  }

  return {
    // State
    state,
    mainRegionId,
    subRegionId,
    
    // Computed
    items,
    title,
    confirmationText,
    autoMode,
    
    // Actions
    selectMainRegion,
    selectSubRegion,
    resetToMainView,
    goBack,
    handleBlink,
    goToIndex
  }
}

