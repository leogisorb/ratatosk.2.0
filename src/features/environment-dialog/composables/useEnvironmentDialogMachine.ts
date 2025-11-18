// State Machine für den Environment Dialog
// Nutzt die Shared Dialog Machine für gemeinsame Logik

import { computed } from 'vue'
import { useDialogMachine } from '../../../shared/composables/useDialogMachine'
import { useEnvironmentDictionary } from './useEnvironmentDictionary'
import type { UmgebungRegion, UmgebungSubRegion, UmgebungSubSubRegion } from '../data/environmentDialogData'

export type UmgebungDialogState = 'mainView' | 'subRegionView' | 'subSubRegionView' | 'confirmation'

export function useEnvironmentDialogMachine() {
  const dict = useEnvironmentDictionary()

  const machine = useDialogMachine<UmgebungDialogState, UmgebungRegion | UmgebungSubRegion | UmgebungSubSubRegion>({
    dialogName: 'EnvironmentDialog',
    states: ['mainView', 'subRegionView', 'subSubRegionView', 'confirmation'] as const,
    
    // Data providers
    getItems: (state, ...ids) => {
      switch (state) {
        case 'mainView':
          return dict.mainRegions
        case 'subRegionView':
          return dict.getSubRegions(ids[0] || null)
        case 'subSubRegionView':
          return dict.getSubSubRegions(ids[1] || null)
        default:
          return []
      }
    },
    
    getTitle: (state, ...ids) => {
      switch (state) {
        case 'mainView':
          return 'Was möchten Sie an ihrer Umgebung verändern?'
        case 'subRegionView':
          return dict.getSubRegionViewTitle(ids[0] || null)
        case 'subSubRegionView': {
          const subRegions = dict.getSubRegions(ids[0] || null)
          const subRegion = subRegions.find((item: any) => item.id === ids[1]) as UmgebungSubRegion | undefined
          return dict.getSubSubRegionViewTitle(subRegion || null)
        }
        case 'confirmation':
          return 'Auswahl erfasst'
        default:
          return ''
      }
    },
    
    getConfirmationText: (...ids) => {
      const subRegions = dict.getSubRegions(ids[0] || null)
      const subRegion = subRegions.find(r => r.id === ids[1]) || null
      const subSubRegions = dict.getSubSubRegions(ids[1] || null)
      const verb = subSubRegions.find(v => v.id === ids[2]) || null
      return dict.generateConfirmation(subRegion, verb)
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
          return 'subSubRegionView'
        case 'subSubRegionView':
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
  const subSubRegionId = computed(() => machine.stateIds.value[2] || null)

  // Legacy methods for backward compatibility with views
  const selectMainRegion = async (id: string) => {
    await machine.selectItem(id)
  }

  const selectSubRegion = async (id: string) => {
    await machine.selectItem(id)
  }

  const selectSubSubRegion = async (id: string) => {
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
    subSubRegionId,
    
    // Computed
    items: machine.items,
    title: machine.title,
    confirmationText: machine.confirmationText,
    autoMode: machine.autoMode,
    
    // Actions
    selectMainRegion,
    selectSubRegion,
    selectSubSubRegion,
    resetToMainView,
    goBack: machine.goBack,
    handleBlink: machine.handleBlink,
    cleanup: machine.cleanup
  }
}
