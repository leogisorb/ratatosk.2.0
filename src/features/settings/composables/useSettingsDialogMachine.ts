// useSettingsDialogMachine.ts - Zentrale State Machine für Settings-Dialog

import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useTTS } from './useTTS'
import { useAutoMode, type AutoModeConfig } from './useAutoMode'
import { useSettingsDictionary } from './useSettingsDictionary'
import { useSettingsStore } from '../stores/settings'
import type { SettingsOption } from '../data/options'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'
import { useDialogTimerTracking } from '../../../shared/composables/useDialogTimerTracking'

export type SettingsDialogState = 'mainView' | 'optionsView' | 'confirmation'

export function useSettingsDialogMachine() {
  const router = useRouter()
  const tts = useTTS()
  const dict = useSettingsDictionary()
  const settingsStore = useSettingsStore()

  // State
  const state = ref<SettingsDialogState>('mainView')
  const categoryId = ref<string | null>(null)
  const optionId = ref<string | null>(null)

  // Computed: Aktuelle Items basierend auf State
  const items = computed(() => {
    switch (state.value) {
      case 'mainView':
        return dict.settingsCategories
      case 'optionsView':
        return dict.getOptions(categoryId.value)
      default:
        return []
    }
  })

  // Computed: Aktueller Titel basierend auf State
  const title = computed(() => {
    switch (state.value) {
      case 'mainView':
        return 'Welche Einstellung möchten Sie ändern?'
      case 'optionsView': {
        const categoryTitle = dict.getCategoryTitle(categoryId.value)
        const currentValue = dict.getCurrentValue(categoryId.value)
        return `${categoryTitle} - Aktuell: ${currentValue}`
      }
      case 'confirmation':
        return 'Einstellung gespeichert'
      default:
        return ''
    }
  })

  // Computed: Confirmation Text
  const confirmationText = computed(() => {
    return dict.generateConfirmation(categoryId.value, optionId.value)
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
    dialogName: 'SettingsDialog'
  })

  // Actions

  /**
   * Kategorie auswählen
   */
  async function selectCategory(id: string) {
    if (id === dict.ID_BACK) {
      goBack()
      return
    }

    autoMode.stop()
    categoryId.value = id
    state.value = 'optionsView'
    optionId.value = null

    // Titel sprechen
    await tts.speak(title.value)
    
    // Nach 3 Sekunden AutoMode starten (skipTitle = true, da Titel bereits gesprochen)
    scheduleTimer(async () => {
      await nextTick() // Warte auf Vue Reactivity Update
      if (items.value.length > 0) {
        autoMode.start(true)
      } else {
        console.warn('❌ useSettingsDialogMachine: Keine Items verfügbar für AutoMode start (OptionsView)')
      }
    }, 3000)
  }

  /**
   * Option auswählen
   */
  async function selectOption(id: string) {
    if (id === dict.ID_BACK) {
      // Zurück zu Kategorien
      autoMode.stop()
      state.value = 'mainView'
      categoryId.value = null
      optionId.value = null

      // Titel sprechen
      await tts.speak(title.value)
      
      // Nach 3 Sekunden AutoMode starten (skipTitle = true, da Titel bereits gesprochen)
      scheduleTimer(async () => {
        await nextTick() // Warte auf Vue Reactivity Update
        if (items.value.length > 0) {
          autoMode.start(true)
        } else {
          console.warn('❌ useSettingsDialogMachine: Keine Items verfügbar für AutoMode start (Zurück zu MainView)')
        }
      }, 3000)
      return
    }

    autoMode.stop()
    optionId.value = id
    state.value = 'confirmation'

    // Einstellung speichern
    await saveSetting(categoryId.value!, id)

    // Confirmation Text sprechen
    await tts.speak('Einstellung gespeichert')
    await new Promise(resolve => setTimeout(resolve, 1500))
    await tts.speak(confirmationText.value)

    // Nach 3 Sekunden zurück zu Haupt-View
    scheduleTimer(() => {
      resetToMainView()
    }, 3000)
  }

  /**
   * Einstellung speichern
   */
  async function saveSetting(categoryId: string, optionId: string) {
    const options = dict.getOptions(categoryId)
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

  /**
   * Zurück zur Haupt-View
   */
  async function resetToMainView() {
    autoMode.stop()
    
    state.value = 'mainView'
    categoryId.value = null
    optionId.value = null

    // Titel sprechen
    await tts.speak(title.value)
    
    // Nach 3 Sekunden AutoMode starten (skipTitle = true, da Titel bereits gesprochen)
    scheduleTimer(async () => {
      await nextTick() // Warte auf Vue Reactivity Update
      if (items.value.length > 0 && state.value === 'mainView') {
        autoMode.start(true)
      } else {
        console.warn('❌ useSettingsDialogMachine: Keine Items verfügbar für AutoMode start (Reset to MainView)')
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
    console.log('SettingsDialog: goBack() - Stoppe alle Services und navigiere zu /app')
    
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
      console.log('SettingsDialog: Navigation zu /app erfolgreich - alle Services gestoppt')
    }).catch((error) => {
      console.error('SettingsDialog: Navigation zu /app fehlgeschlagen:', error)
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
        case 'optionsView':
          selectOption(dict.ID_BACK)
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
        selectCategory(currentItem.id)
        break
      case 'optionsView':
        selectOption(currentItem.id)
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
    categoryId,
    optionId,
    
    // Computed
    items,
    title,
    confirmationText,
    autoMode,
    
    // Actions
    selectCategory,
    selectOption,
    resetToMainView,
    goBack,
    handleBlink,
    goToIndex,
    cleanup
  }
}

