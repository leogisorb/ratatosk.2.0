import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  mainRegions, 
  ernaehrungSubRegions, 
  gefuehleSubRegions, 
  kleidungSubRegions, 
  hygieneSubRegions, 
  bewegungSubRegions,
  getSubRegionsByMainRegion,
  getMainRegionTitle,
  getSubRegionTitle
} from '../data/ichDialogData'

// Ich dialog states
export type IchDialogState = 'mainView' | 'subRegionView' | 'confirmation'

export function useIchDialogFlow() {
  const router = useRouter()

  // Zustand der Dialog-Maschine
  const currentState = ref<IchDialogState>('mainView')
  const currentTileIndex = ref(0)
  const selectedMainRegion = ref<string | null>(null)
  const selectedSubRegion = ref<string | null>(null)

  // Aktuelle Items basierend auf Zustand
  const currentItems = computed(() => {
    switch (currentState.value) {
      case 'mainView':
        return mainRegions
      case 'subRegionView':
        if (selectedMainRegion.value === 'ernaehrung') return ernaehrungSubRegions
        if (selectedMainRegion.value === 'gefuehle') return gefuehleSubRegions
        if (selectedMainRegion.value === 'kleidung') return kleidungSubRegions
        if (selectedMainRegion.value === 'hygiene') return hygieneSubRegions
        if (selectedMainRegion.value === 'bewegung') return bewegungSubRegions
        return []
      default:
        return []
    }
  })

  // Aktueller Titel basierend auf Zustand
  const currentTitle = computed(() => {
    switch (currentState.value) {
      case 'mainView':
        return 'Was möchten Sie machen?'
      case 'subRegionView':
        const region = mainRegions.find(r => r.id === selectedMainRegion.value)
        return region ? `Wählen Sie eine ${region.title}option aus.` : 'Wählen Sie eine Option aus.'
      case 'confirmation':
        return 'Bestätigung'
      default:
        return ''
    }
  })

  // Aktuelles Item
  const currentItem = computed(() => {
    return currentItems.value[currentTileIndex.value] || null
  })

  // Bestätigungstext
  const confirmationText = computed(() => {
    if (selectedMainRegion.value && selectedSubRegion.value) {
      const mainTitle = getMainRegionTitle(selectedMainRegion.value)
      const subTitle = getSubRegionTitle(selectedSubRegion.value)
      return `${subTitle} - ${mainTitle}`
    }
    return ''
  })

  // TTS-Funktion (vereinfacht für Standalone)
  const speakText = async (text: string) => {
    console.log('IchDialog: TTS would speak:', text)
    // In einer echten Implementierung würde hier TTS aufgerufen werden
  }

  // Main Region Auswahl
  const selectMainRegion = async (regionId: string) => {
    console.log('IchDialog: Selecting main region:', regionId)
    
    if (regionId === 'zurueck') {
      goBack()
      return
    }

    selectedMainRegion.value = regionId
    currentState.value = 'subRegionView'
    currentTileIndex.value = 0

    // Spreche den Titel der Sub-View
    const region = mainRegions.find(r => r.id === regionId)
    if (region) {
      await speakText(`Wählen Sie eine ${region.title}option aus.`)
    }
  }

  // Sub Region Auswahl
  const selectSubRegion = async (subRegionId: string) => {
    console.log('IchDialog: Selecting sub region:', subRegionId)
    
    if (subRegionId === 'zurueck') {
      currentState.value = 'mainView'
      selectedMainRegion.value = null
      currentTileIndex.value = 0
      await speakText('Was möchten Sie machen?')
      return
    }

    selectedSubRegion.value = subRegionId
    currentState.value = 'confirmation'

    // Spreche die Bestätigung
    const mainTitle = getMainRegionTitle(selectedMainRegion.value)
    const subTitle = getSubRegionTitle(subRegionId)
    await speakText(`${subTitle} - ${mainTitle} erfasst`)

    // Nach 3 Sekunden zurück zur Hauptansicht
    setTimeout(() => {
      currentState.value = 'mainView'
      selectedMainRegion.value = null
      selectedSubRegion.value = null
      currentTileIndex.value = 0
    }, 3000)
  }

  // Zurück-Navigation
  const goBack = () => {
    console.log('IchDialog: Going back')
    
    if (currentState.value === 'subRegionView') {
      currentState.value = 'mainView'
      selectedMainRegion.value = null
      currentTileIndex.value = 0
      speakText('Was möchten Sie machen?')
    } else if (currentState.value === 'confirmation') {
      currentState.value = 'subRegionView'
      selectedSubRegion.value = null
      currentTileIndex.value = 0
    } else {
      // Zurück zur Hauptanwendung
      router.push('/app')
    }
  }

  // Right Click Handler für Main Regions
  const handleMainRegionRightClick = (event: MouseEvent, regionId: string) => {
    event.preventDefault()
    event.stopPropagation()
    console.log('IchDialog: Main region right click:', regionId)
    selectMainRegion(regionId)
    return false
  }

  // Right Click Handler für Sub Regions
  const handleSubRegionRightClick = (event: MouseEvent, subRegionId: string) => {
    event.preventDefault()
    event.stopPropagation()
    console.log('IchDialog: Sub region right click:', subRegionId)
    selectSubRegion(subRegionId)
    return false
  }

  return {
    // State
    currentState,
    currentTileIndex,
    selectedMainRegion,
    selectedSubRegion,
    
    // Computed
    currentItems,
    currentTitle,
    currentItem,
    confirmationText,
    
    // Methods
    selectMainRegion,
    selectSubRegion,
    goBack,
    handleMainRegionRightClick,
    handleSubRegionRightClick,
    speakText,
    
    // Helper functions
    getMainRegionTitle,
    getSubRegionTitle
  }
}
