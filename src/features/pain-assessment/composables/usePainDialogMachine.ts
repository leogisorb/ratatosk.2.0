// State Machine für den Pain Dialog
// Nutzt die Shared Dialog Machine für gemeinsame Logik

import { computed } from 'vue'
import { useDialogMachine } from '../../../shared/composables/useDialogMachine'
import { usePainDictionary } from './usePainDictionary'
import type { mainRegions } from '../data/regions'
import type { painLevels } from '../data/painLevels'

// Types - simplified
type PainRegion = typeof mainRegions[number]
type PainSubRegion = { id: string; title: string; icon: string }
type PainLevel = typeof painLevels[number]

export type PainDialogState = 'mainView' | 'subRegionView' | 'painScaleView' | 'confirmation'

export function usePainDialogMachine() {
  const dict = usePainDictionary()

  const machine = useDialogMachine<PainDialogState, PainRegion | PainSubRegion | PainLevel>({
    dialogName: 'PainDialog',
    states: ['mainView', 'subRegionView', 'painScaleView', 'confirmation'] as const,
    
    // Data providers
    getItems: (state, ...ids) => {
      switch (state) {
        case 'mainView':
          return dict.mainRegions
        case 'subRegionView':
          return dict.getSubRegions(ids[0] || null)
        case 'painScaleView':
          return dict.painLevels
        default:
          return []
      }
    },
    
    getTitle: (state, ...ids) => {
      switch (state) {
        case 'mainView':
          return 'Wo haben Sie Schmerzen?'
        case 'subRegionView':
          return dict.getSubRegionViewTitle(ids[0] || null)
        case 'painScaleView':
          return 'Wie stark sind Ihre Schmerzen?'
        case 'confirmation':
          return 'Bestätigung'
        default:
          return ''
      }
    },
    
    getConfirmationText: (...ids) => {
      const subRegionId = ids[1] || null
      // painLevel ID is stored as string, need to find the level value
      const painLevelId = ids[2]
      let painLevel: number | null = null
      if (painLevelId) {
        const painLevelItem = dict.painLevels.find(p => String(p.id) === painLevelId)
        painLevel = painLevelItem ? painLevelItem.level : null
      }
      return dict.generateConfirmation(subRegionId, painLevel)
    },
    
    // Navigation
    backButtonId: 'zurueck',
    homeRoute: '/app',
    
    // State transitions
    getNextState: (currentState, itemId) => {
      if (itemId === 'zurueck') {
        return null // Handled separately
      }
      
      switch (currentState) {
        case 'mainView':
          return 'subRegionView'
        case 'subRegionView':
          return 'painScaleView'
        case 'painScaleView':
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
  const painLevel = computed(() => {
    const levelId = machine.stateIds.value[2]
    if (!levelId) return null
    // painLevel can be either a number (from painLevels) or a string ID
    const level = typeof levelId === 'number' ? levelId : Number(levelId)
    return isNaN(level) ? null : level
  })

  // Legacy methods for backward compatibility with views
  const selectMainRegion = async (id: string) => {
    if (id === 'zurueck') return
    await machine.selectItem(id)
  }

  const selectSubRegion = async (id: string) => {
    if (id === 'zurueck') {
      // Go back to mainView
      await machine.resetToInitialState()
      return
    }
    await machine.selectItem(id)
  }

  const selectPainLevel = async (level: number) => {
    // Find pain level item by level value
    const painLevelItem = dict.painLevels.find(p => p.level === level)
    if (painLevelItem) {
      // Convert id to string for stateIds
      await machine.selectItem(String(painLevelItem.id))
    }
  }

  const resetToMainView = async () => {
    await machine.resetToInitialState()
  }

  return {
    // State
    state: machine.state,
    mainRegionId,
    subRegionId,
    painLevel,
    
    // Computed
    items: machine.items,
    title: machine.title,
    confirmationText: machine.confirmationText,
    autoMode: machine.autoMode,
    
    // Actions
    selectMainRegion,
    selectSubRegion,
    selectPainLevel,
    resetToMainView,
    goBack: machine.goBack,
    handleBlink: machine.handleBlink,
    cleanup: machine.cleanup
  }
}
