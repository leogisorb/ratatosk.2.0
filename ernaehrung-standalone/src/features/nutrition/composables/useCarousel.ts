import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'

export interface CarouselItem {
  id: string
  text: string
  emoji: string
  description?: string
  type: string
}

export function useCarousel(items: Ref<CarouselItem[]>) {
  const activeIndex = ref(0)
  const isTransitioning = ref(false)
  const userInteracted = ref(false)

  // Computed für aktuelle Position
  const currentItem = computed(() => items.value[activeIndex.value])
  
  // Position-Klassen für Sliding-Karussell
  const getPositionClass = (index: number) => {
    if (isTransitioning.value) return ''
    
    const total = items.value.length
    const current = activeIndex.value
    
    // Berechne relative Position
    let relativeIndex = index - current
    
    // Handle Looping
    if (relativeIndex > total / 2) {
      relativeIndex -= total
    } else if (relativeIndex < -total / 2) {
      relativeIndex += total
    }
    
    // Position-Klassen basierend auf relativer Position
    if (relativeIndex === 0) return 'active'
    if (relativeIndex === 1) return 'right'
    if (relativeIndex === -1) return 'left'
    if (Math.abs(relativeIndex) <= 2) return 'visible'
    
    return 'hidden'
  }

  // Navigation mit Debouncing - optimiert für flüssige Animationen
  const navigate = (direction: 'next' | 'prev') => {
    if (isTransitioning.value) return
    
    isTransitioning.value = true
    userInteracted.value = true
    
    // Modulo-Operation für endloses Looping
    if (direction === 'next') {
      activeIndex.value = (activeIndex.value + 1) % items.value.length
    } else {
      activeIndex.value = (activeIndex.value - 1 + items.value.length) % items.value.length
    }
    
    // Transition-Timeout für flüssige Animation
    setTimeout(() => {
      isTransitioning.value = false
    }, 400) // Leicht verlängert für bessere Animation
  }

  // Direkte Navigation zu Index
  const goToIndex = (index: number) => {
    if (isTransitioning.value || index === activeIndex.value) return
    
    isTransitioning.value = true
    userInteracted.value = true
    activeIndex.value = index
    
    setTimeout(() => {
      isTransitioning.value = false
    }, 300)
  }

  // Auto-Mode mit sauberer Steuerung
  let autoModeInterval: NodeJS.Timeout | null = null
  
  const startAutoMode = (intervalMs: number = 3000) => {
    if (autoModeInterval) return
    
    autoModeInterval = setInterval(() => {
      if (!userInteracted.value) {
        navigate('next')
      }
    }, intervalMs)
  }
  
  const stopAutoMode = () => {
    if (autoModeInterval) {
      clearInterval(autoModeInterval)
      autoModeInterval = null
    }
  }

  // Cleanup
  onUnmounted(() => {
    stopAutoMode()
  })

  return {
    activeIndex,
    currentItem,
    isTransitioning,
    userInteracted,
    getPositionClass,
    navigate,
    goToIndex,
    startAutoMode,
    stopAutoMode
  }
}

