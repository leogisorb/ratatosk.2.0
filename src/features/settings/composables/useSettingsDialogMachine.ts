// State Machine für den Settings Dialog
// Verwendet Cancellation Token um Race Conditions zu vermeiden

import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useTTSWithCancellation } from './useTTSWithCancellation'
import { useAutoMode, type AutoModeConfig } from '../../../shared/composables/useAutoMode'
import { useSettingsDictionary } from './useSettingsDictionary'
import { useSettingsStore } from '../stores/settings'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'
import { useDialogTimerTracking } from '../../../shared/composables/useDialogTimerTracking'

// ===== CONSTANTS =====
const TIMER_DELAYS = {
  AUTO_MODE_START: 3000,
  CONFIRMATION_RESET: 3000,
  CONFIRMATION_DELAY: 1500
} as const

export type SettingsDialogState = 'mainView' | 'optionsView' | 'confirmation'

export function useSettingsDialogMachine() {
  const router = useRouter()
  const dict = useSettingsDictionary()
  const settingsStore = useSettingsStore()

  // ===== CANCELLATION TOKEN =====
  const isCancelled = ref(false)
  
  const cancel = () => {
    console.log('SettingsDialog: Cancellation requested')
    isCancelled.value = true
    cleanupTimers()
    window.speechSynthesis?.cancel()
  }
  
  const checkCancelled = () => {
    if (isCancelled.value) {
      throw new Error('Operation cancelled')
    }
  }

  // TTS mit Unterstützung für Abbruch
  const tts = useTTSWithCancellation(() => isCancelled.value)

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
    getTitle: () => title.value,
    initialDelay: settingsStore.settings.leuchtdauer * 1000,
    cycleDelay: settingsStore.settings.leuchtdauer * 1000
  }

  const autoMode = useAutoMode(autoModeConfig)
  
  // Timer-Tracking mit Cleanup-Logik
  const { scheduleTimer, cleanup: cleanupTimers } = useDialogTimerTracking({
    onCleanup: () => {
      autoMode.stop()
    },
    dialogName: 'SettingsDialog'
  })

  // Startet AutoMode nach einer Verzögerung
  // Wichtig: Setzt den Index auf 0, damit das Karussell bei 0 startet
  function scheduleAutoModeStart(expectedState: SettingsDialogState, delay: number = TIMER_DELAYS.AUTO_MODE_START) {
    // Index auf 0 setzen
    autoMode.index.value = 0
    
    scheduleTimer(async () => {
      checkCancelled()
      
      if (state.value === expectedState) {
        await nextTick()
        checkCancelled()
        
        // Nochmal prüfen ob alles passt
        if (items.value.length > 0 && state.value === expectedState) {
          // Index nochmal auf 0 setzen für Sicherheit
          autoMode.index.value = 0
          autoMode.start(true)
        }
      }
    }, delay)
  }

  /**
   * Error Handler für Operationen
   */
  function handleOperationError(operation: string, error: unknown) {
    if (error instanceof Error && error.message.includes('cancelled')) {
      console.log(`SettingsDialog: ${operation} cancelled`)
    } else {
      console.error(`SettingsDialog: ${operation} error:`, error)
      // TODO: User-Feedback hinzufügen bei kritischen Fehlern
    }
  }

  // ===== ACTIONS =====

  /**
   * Kategorie auswählen
   */
  async function selectCategory(id: string) {
    try {
      checkCancelled()
      
      if (id === dict.ID_BACK) {
        goBack()
        return
      }

      autoMode.stop()
      categoryId.value = id
      state.value = 'optionsView'
      optionId.value = null

      await tts.speak(title.value)
      scheduleAutoModeStart('optionsView')
      
    } catch (error) {
      handleOperationError('selectCategory', error)
    }
  }

  /**
   * Option auswählen
   */
  async function selectOption(id: string) {
    try {
      checkCancelled()
      
      if (id === dict.ID_BACK) {
        autoMode.stop()
        state.value = 'mainView'
        categoryId.value = null
        optionId.value = null

        await tts.speak(title.value)
        scheduleAutoModeStart('mainView')
        return
      }

      autoMode.stop()
      optionId.value = id
      state.value = 'confirmation'

      await saveSetting(categoryId.value!, id)
      checkCancelled()

      await tts.speak('Einstellung gespeichert')
      checkCancelled()
      
      await new Promise(resolve => setTimeout(resolve, TIMER_DELAYS.CONFIRMATION_DELAY))
      checkCancelled()
      
      await tts.speak(confirmationText.value)
      checkCancelled()

      scheduleTimer(() => {
        checkCancelled()
        if (state.value === 'confirmation') {
          resetToMainView()
        }
      }, TIMER_DELAYS.CONFIRMATION_RESET)
      
    } catch (error) {
      handleOperationError('selectOption', error)
    }
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
      case 'impressum':
        // Impressum ist nur zur Anzeige, keine Einstellung
        break
    }
  }

  /**
   * Zurück zur Haupt-View
   */
  async function resetToMainView() {
    try {
      checkCancelled()
      
      autoMode.stop()
      
      state.value = 'mainView'
      categoryId.value = null
      optionId.value = null

      await tts.speak(title.value)
      scheduleAutoModeStart('mainView')
      
    } catch (error) {
      handleOperationError('resetToMainView', error)
    }
  }

  // Stoppt alle Timer und verhindert weitere AutoMode-Starts
  // Setzt das Cancellation Flag und räumt alle Ressourcen auf
  function cleanup() {
    console.log('SettingsDialog: Cleaning up')
    
    // Erst das Cancellation Flag setzen
    isCancelled.value = true
    
    // Dann alle Ressourcen freigeben
    cleanupTimers() // Stoppt autoMode durch onCleanup
    tts.cancel() // TTS muss explizit gestoppt werden
  }

  // Zurück zur Haupt-App navigieren
  function goBack() {
    console.log('SettingsDialog: goBack() - Cleanup und Navigation')
    
    cleanup() // Räumt lokale Ressourcen auf
    
    // Globale Services auch stoppen
    simpleFlowController.stopTTS()
    simpleFlowController.stopAutoMode()
    simpleFlowController.setActiveView('')
    
    router.push('/app').catch((error) => {
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
    cleanup
  }
}

