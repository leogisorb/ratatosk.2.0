// useIchDialog - Composable for ich-dialog functionality
// Based on usePainAssessment but adapted for ich-standalone content

import { ref, computed } from 'vue'
import { ichDialogService, type IchDialogData } from '../services/IchDialogService'
import { mainRegions, getSubRegionsByMainRegion } from '../data/ichDialogData'

export function useIchDialog() {
  // State management
  const currentState = ref<'mainView' | 'subView' | 'inputView' | 'confirmationView'>('mainView')
  const currentTileIndex = ref(0)
  const currentSubTileIndex = ref(0)
  const selectedMainRegion = ref('')
  const selectedSubRegion = ref('')

  // Input data
  const inputData = ref({
    description: '',
    intensity: 'mittel' as 'niedrig' | 'mittel' | 'hoch',
    date: new Date().toISOString().split('T')[0]
  })

  // Carousel state
  const carouselOffset = ref(0)
  const currentCarouselPage = ref(0)
  const itemsPerPage = ref(4)

  // Touch handling
  const touchState = ref({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isDragging: false
  })

  // Computed properties
  const currentSubRegions = computed(() => {
    if (!selectedMainRegion.value) return []
    return getSubRegionsByMainRegion(selectedMainRegion.value)
  })

  const carouselStyle = computed(() => ({
    transform: `translateX(${carouselOffset.value}px)`,
    transition: touchState.value.isDragging ? 'none' : 'transform 0.3s ease'
  }))

  const carouselIndicators = computed(() => {
    const totalPages = Math.ceil(currentSubRegions.value.length / itemsPerPage.value)
    return Array.from({ length: totalPages }, (_, i) => i)
  })

  // Navigation methods
  const selectMainRegion = (regionId: string) => {
    if (regionId === 'zurueck') {
      goBack()
      return
    }
    
    selectedMainRegion.value = regionId
    currentState.value = 'subView'
    currentSubTileIndex.value = 0
    carouselOffset.value = 0
    currentCarouselPage.value = 0
    
    // TTS announcement
    speakText(`Wählen Sie einen ${getCurrentMainRegionTitle()}bereich aus`)
  }

  const selectSubRegion = (subRegionId: string) => {
    if (subRegionId === 'zurueck') {
      goBackToMain()
      return
    }
    
    selectedSubRegion.value = subRegionId
    currentState.value = 'inputView'
    
    // TTS announcement
    speakText(`${getCurrentSubRegionTitle()} - Eingabe`)
  }

  const goBack = () => {
    if (currentState.value === 'subView') {
      goBackToMain()
    } else if (currentState.value === 'inputView') {
      goBackToSub()
    } else if (currentState.value === 'confirmationView') {
      goBackToMain()
    }
  }

  const goBackToMain = () => {
    currentState.value = 'mainView'
    selectedMainRegion.value = ''
    currentTileIndex.value = 0
    
    // TTS announcement
    speakText('Wählen Sie einen Bereich aus')
  }

  const goBackToSub = () => {
    currentState.value = 'subView'
    selectedSubRegion.value = ''
    currentSubTileIndex.value = 0
    
    // TTS announcement
    speakText(`Wählen Sie einen ${getCurrentMainRegionTitle()}bereich aus`)
  }

  // Input handling
  const saveInput = () => {
    const data: IchDialogData = {
      id: generateId(),
      category: selectedMainRegion.value,
      subcategory: selectedSubRegion.value,
      description: inputData.value.description,
      intensity: inputData.value.intensity,
      date: inputData.value.date,
      timestamp: Date.now()
    }

    ichDialogService.saveData(data)
    currentState.value = 'confirmationView'
    
    // TTS announcement
    speakText('Eingabe erfasst')
  }

  // Carousel navigation
  const handleTouchStart = (event: TouchEvent) => {
    touchState.value.startX = event.touches[0].clientX
    touchState.value.startY = event.touches[0].clientY
    touchState.value.isDragging = true
  }

  const handleTouchMove = (event: TouchEvent) => {
    if (!touchState.value.isDragging) return
    
    event.preventDefault()
    touchState.value.currentX = event.touches[0].clientX
    touchState.value.currentY = event.touches[0].clientY
  }

  const handleTouchEnd = () => {
    if (!touchState.value.isDragging) return
    
    const deltaX = touchState.value.currentX - touchState.value.startX
    const threshold = 50
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        navigatePrevious()
      } else {
        navigateNext()
      }
    }
    
    touchState.value.isDragging = false
  }

  const navigateNext = () => {
    const maxOffset = -(currentSubRegions.value.length - itemsPerPage.value) * 200
    if (carouselOffset.value > maxOffset) {
      carouselOffset.value -= 200
      currentCarouselPage.value = Math.min(
        currentCarouselPage.value + 1,
        carouselIndicators.value.length - 1
      )
    }
  }

  const navigatePrevious = () => {
    if (carouselOffset.value < 0) {
      carouselOffset.value += 200
      currentCarouselPage.value = Math.max(currentCarouselPage.value - 1, 0)
    }
  }

  const navigateToCarouselPage = (page: number) => {
    carouselOffset.value = -page * 200
    currentCarouselPage.value = page
  }

  // Helper methods
  const getCurrentMainRegionTitle = () => {
    const region = mainRegions.find(r => r.id === selectedMainRegion.value)
    return region ? region.title : ''
  }

  const getCurrentSubRegionTitle = () => {
    const subRegion = currentSubRegions.value.find(r => r.id === selectedSubRegion.value)
    return subRegion ? subRegion.title : ''
  }

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // TTS functionality
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'de-DE'
      utterance.rate = 0.8
      speechSynthesis.speak(utterance)
    }
  }

  // Right-click handlers
  const handleMainRegionRightClick = (event: MouseEvent, regionId: string) => {
    event.preventDefault()
    selectMainRegion(regionId)
  }

  const handleSubRegionRightClick = (event: MouseEvent, subRegionId: string) => {
    event.preventDefault()
    selectSubRegion(subRegionId)
  }

  // Keyboard navigation
  const handleKeyboardNavigation = (event: KeyboardEvent) => {
    if (currentState.value === 'mainView') {
      switch (event.key) {
        case 'ArrowRight':
          currentTileIndex.value = Math.min(currentTileIndex.value + 1, mainRegions.length - 1)
          break
        case 'ArrowLeft':
          currentTileIndex.value = Math.max(currentTileIndex.value - 1, 0)
          break
        case 'Enter':
          selectMainRegion(mainRegions[currentTileIndex.value].id)
          break
      }
    } else if (currentState.value === 'subView') {
      switch (event.key) {
        case 'ArrowRight':
          currentSubTileIndex.value = Math.min(currentSubTileIndex.value + 1, currentSubRegions.value.length - 1)
          break
        case 'ArrowLeft':
          currentSubTileIndex.value = Math.max(currentSubTileIndex.value - 1, 0)
          break
        case 'Enter':
          selectSubRegion(currentSubRegions.value[currentSubTileIndex.value].id)
          break
      }
    }
  }

  // Data management
  const getAllData = () => ichDialogService.getAllData()
  const getDataByCategory = (category: string) => ichDialogService.getDataByCategory(category)
  const getStatistics = () => ichDialogService.getStatistics()
  const exportData = () => ichDialogService.exportData()
  const importData = (jsonData: string) => ichDialogService.importData(jsonData)
  const clearData = () => ichDialogService.clearData()

  return {
    // State
    currentState,
    currentTileIndex,
    currentSubTileIndex,
    selectedMainRegion,
    selectedSubRegion,
    inputData,
    carouselOffset,
    currentCarouselPage,
    touchState,
    
    // Computed
    currentSubRegions,
    carouselStyle,
    carouselIndicators,
    
    // Navigation
    selectMainRegion,
    selectSubRegion,
    goBack,
    goBackToMain,
    goBackToSub,
    
    // Input
    saveInput,
    
    // Carousel
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    navigateNext,
    navigatePrevious,
    navigateToCarouselPage,
    
    // Helpers
    getCurrentMainRegionTitle,
    getCurrentSubRegionTitle,
    speakText,
    
    // Event handlers
    handleMainRegionRightClick,
    handleSubRegionRightClick,
    handleKeyboardNavigation,
    
    // Data management
    getAllData,
    getDataByCategory,
    getStatistics,
    exportData,
    importData,
    clearData
  }
}
