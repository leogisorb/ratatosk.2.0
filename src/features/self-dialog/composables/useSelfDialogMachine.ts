// State Machine für den Self Dialog
// Nutzt die Shared Dialog Machine für gemeinsame Logik

import { computed } from 'vue'
import { useDialogMachine } from '../../../shared/composables/useDialogMachine'
import { useSelfDictionary } from './useSelfDictionary'
import type { IchRegion, IchSubRegion } from '../data/selfDialogData'

export type IchDialogState = 'mainView' | 'subRegionView' | 'confirmation'

export function useSelfDialogMachine() {
  const dict = useSelfDictionary()

  const machine = useDialogMachine<IchDialogState, IchRegion | IchSubRegion>({
    dialogName: 'SelfDialog',
    states: ['mainView', 'subRegionView', 'confirmation'] as const,
    
    // Data providers
    getItems: (state, ...ids) => {
      switch (state) {
      case 'mainView':
          return dict.mainRegions
      case 'subRegionView':
          return dict.getSubRegions(ids[0] || null)
      default:
        return []
    }
    },

    getTitle: (state, ...ids) => {
      switch (state) {
      case 'mainView':
        return 'Was möchten Sie machen?'
      case 'subRegionView':
          return dict.getSubRegionViewTitle(ids[0] || null)
      case 'confirmation':
        return 'Auswahl erfasst'
      default:
        return ''
    }
    },
    
    getConfirmationText: (...ids) => {
      const mainRegionId = ids[0] || null
      const subRegions = dict.getSubRegions(mainRegionId)
      const subRegion = subRegions.find(r => r.id === ids[1]) || null
      return dict.generateConfirmation(mainRegionId, subRegion)
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
          return 'subRegionView'
        case 'subRegionView':
          return 'confirmation'
        default:
          return null
      }
    },
    
    shouldConfirm: (state) => state === 'confirmation'
  })

  // Expose state IDs as separate refs for backward compatibility
  const mainRegionId = computed(() => machine.stateIds.value[0] || null)
  const subRegionId = computed(() => machine.stateIds.value[1] || null)

  // Legacy methods for backward compatibility with views
  const selectMainRegion = async (id: string) => {
    await machine.selectItem(id)
  }

  const selectSubRegion = async (id: string) => {
    await machine.selectItem(id)
  }

  const resetToMainView = async () => {
    await machine.resetToInitialState()
  }

  return {
    // State
    state: machine.state,
    mainRegionId,
    subRegionId,
    
    // Computed
    items: machine.items,
    title: machine.title,
    confirmationText: machine.confirmationText,
    autoMode: machine.autoMode,
    
    // Actions
    selectMainRegion,
    selectSubRegion,
    resetToMainView,
    goBack: machine.goBack,
    handleBlink: machine.handleBlink,
    cleanup: machine.cleanup
  }
}
