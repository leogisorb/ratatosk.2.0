// State Machine für den Settings Dialog
// Nutzt die Shared Dialog Machine für gemeinsame Logik

import { computed } from 'vue'
import { useDialogMachine } from '../../../shared/composables/useDialogMachine'
import { useSettingsDictionary } from './useSettingsDictionary'
import { useSettingsStore } from '../stores/settings'
import type { SettingsCategory } from '../data/categories'
import type { SettingsOption } from '../data/options'

export type SettingsDialogState = 'mainView' | 'optionsView' | 'confirmation'

export function useSettingsDialogMachine() {
  const dict = useSettingsDictionary()
  const settingsStore = useSettingsStore()

  const machine = useDialogMachine<SettingsDialogState, SettingsCategory | SettingsOption>({
    dialogName: 'SettingsDialog',
    states: ['mainView', 'optionsView', 'confirmation'] as const,
    
    // Data providers
    getItems: (state, ...ids) => {
      switch (state) {
        case 'mainView':
          return dict.settingsCategories
        case 'optionsView':
          return dict.getOptions(ids[0] || null)
        default:
          return []
      }
    },
    
    getTitle: (state, ...ids) => {
      switch (state) {
        case 'mainView':
          return 'Welche Einstellung möchten Sie ändern?'
        case 'optionsView': {
          const categoryTitle = dict.getCategoryTitle(ids[0] || null)
          const currentValue = dict.getCurrentValue(ids[0] || null)
          return `${categoryTitle} - Aktuell: ${currentValue}`
        }
        case 'confirmation':
          return 'Einstellung gespeichert'
        default:
          return ''
      }
    },
    
    getConfirmationText: (...ids) => {
      return dict.generateConfirmation(ids[0] || null, ids[1] || null)
    },
    
    // Navigation
    backButtonId: dict.ID_BACK,
    homeRoute: '/app',
    
    // State transitions
    getNextState: (currentState, itemId) => {
      if (itemId === dict.ID_BACK) {
        return null // Handled separately
      }
      
      switch (currentState) {
        case 'mainView':
          return 'optionsView'
        case 'optionsView':
          return 'confirmation'
        default:
          return null
      }
    },
    
    shouldConfirm: (state) => state === 'confirmation'
  })

  // Expose state IDs as separate refs for backward compatibility
  const categoryId = computed(() => machine.stateIds.value[0] || null)
  const optionId = computed(() => machine.stateIds.value[1] || null)

  // Override selectItem to save settings when option is selected
  const originalSelectItem = machine.selectItem
  const selectItemWithSave = async (id: string) => {
    if (id === dict.ID_BACK) {
      if (machine.state.value === 'optionsView') {
        // Go back to mainView
        await machine.resetToInitialState()
        return
      } else {
        machine.goBack()
        return
      }
    }

    // If we're selecting an option (in optionsView), save it before state change
    if (machine.state.value === 'optionsView' && categoryId.value) {
      await saveSetting(categoryId.value, id)
    }

    // Use the standard selectItem from machine
    await originalSelectItem(id)
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

  // Legacy methods for backward compatibility with views
  const selectCategory = async (id: string) => {
    if (id === dict.ID_BACK) {
      machine.goBack()
      return
    }
    await selectItemWithSave(id)
  }

  const selectOption = async (id: string) => {
    await selectItemWithSave(id)
  }

  const resetToMainView = async () => {
    await machine.resetToInitialState()
  }

  // Custom handleBlink that uses selectItemWithSave
  const handleBlink = () => {
    const currentItems = machine.items.value
    const currentIndex = machine.autoMode.index.value

    if (currentIndex < 0 || currentIndex >= currentItems.length) {
      return
    }

    const currentItem = currentItems[currentIndex]
    if (!currentItem) {
      return
    }

    // Handle "zurück" Button
    if (currentItem.id === dict.ID_BACK) {
      switch (machine.state.value) {
        case 'optionsView':
          selectOption(dict.ID_BACK)
          break
        default:
          machine.goBack()
          break
      }
      return
    }

    // Use selectItemWithSave for normal items
    selectItemWithSave(currentItem.id).catch(error => {
      console.error('SettingsDialog: handleBlink error:', error)
    })
  }

  return {
    // State
    state: machine.state,
    categoryId,
    optionId,
    
    // Computed
    items: machine.items,
    title: machine.title,
    confirmationText: machine.confirmationText,
    autoMode: machine.autoMode,
    
    // Actions
    selectCategory,
    selectOption,
    resetToMainView,
    goBack: machine.goBack,
    handleBlink,
    cleanup: machine.cleanup
  }
}
