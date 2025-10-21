import { ref, computed, watch } from 'vue'
import { useTouchCarousel } from './useTouchCarousel'
import { useAutoScroll } from './useAutoScroll'
import { useCarouselPosition } from './useCarouselPosition'
import { CAROUSEL_CONFIG, type CarouselItem } from '../config/carouselConfig'

/**
 * Haupt-Composable für das mobile Karussell
 */
export function useCarousel(items: CarouselItem[]) {
  // Mobile Detection
  const isMobile = ref(false)
  
  // Touch-Handling
  const { 
    touchState, 
    isSwipe, 
    swipeDirection,
    handleTouchStart, 
    handleTouchMove, 
    handleTouchEnd, 
    resetTouchState 
  } = useTouchCarousel()
  
  // Auto-Scroll
  const { 
    autoScrollState, 
    startAutoScroll, 
    stopAutoScroll, 
    pauseAfterTouch 
  } = useAutoScroll()
  
  // Position
  const { 
    position, 
    carouselStyle, 
    updatePosition, 
    animateToPosition, 
    getNextIndex, 
    getPreviousIndex 
  } = useCarouselPosition()

  // Computed
  const currentItem = computed(() => items[position.currentIndex])
  const itemCount = computed(() => items.length)

  /**
   * Mobile Detection
   */
  const checkIsMobile = () => {
    isMobile.value = window.innerWidth <= CAROUSEL_CONFIG.MOBILE_BREAKPOINT
    console.log(`🔍 Mobile check: ${isMobile.value} (width: ${window.innerWidth}px)`)
    console.log(`🔍 Desktop grid display:`, document.querySelector('.desktop-grid')?.style.display)
    console.log(`🔍 Mobile carousel display:`, document.querySelector('.mobile-carousel')?.style.display)
    // Position bei Resize neu berechnen
    if (isMobile.value) {
      updatePosition(position.currentIndex, items.length)
    }
  }

  /**
   * Startet Auto-Scroll mit Callback
   */
  const startAutoScrollWithCallback = () => {
    if (!isMobile.value) return

    startAutoScroll((index) => {
      const nextIndex = getNextIndex(itemCount.value)
      animateToPosition(nextIndex, itemCount.value)
    }, itemCount.value)
  }

  /**
   * Stoppt Auto-Scroll
   */
  const stopAutoScrollCompletely = () => {
    stopAutoScroll()
  }

  /**
   * Touch-Start Handler mit Auto-Scroll-Pause
   */
  const handleCarouselTouchStart = (event: TouchEvent) => {
    if (!isMobile.value) return
    
    handleTouchStart(event)
    pauseAfterTouch()
  }

  /**
   * Touch-Move Handler
   */
  const handleCarouselTouchMove = (event: TouchEvent) => {
    if (!isMobile.value) return
    
    handleTouchMove(event)
  }

  /**
   * Touch-End Handler mit Swipe-Erkennung
   */
  const handleCarouselTouchEnd = (event: TouchEvent) => {
    if (!isMobile.value) return
    
    const result = handleTouchEnd(event)
    
    if (result?.isSwipe) {
      if (result.direction === 'down') {
        // Swipe nach unten = vorherige Kachel
        const prevIndex = getPreviousIndex(itemCount.value)
        animateToPosition(prevIndex, itemCount.value)
      } else if (result.direction === 'up') {
        // Swipe nach oben = nächste Kachel
        const nextIndex = getNextIndex(itemCount.value)
        animateToPosition(nextIndex, itemCount.value)
      }
    }
    
    resetTouchState()
  }

  /**
   * Navigiert zu einem bestimmten Index
   */
  const navigateToIndex = (index: number) => {
    if (index < 0 || index >= itemCount.value) return
    
    animateToPosition(index, itemCount.value)
  }

  /**
   * Navigiert zum nächsten Item
   */
  const navigateNext = () => {
    const nextIndex = getNextIndex(itemCount.value)
    navigateToIndex(nextIndex)
  }

  /**
   * Navigiert zum vorherigen Item
   */
  const navigatePrevious = () => {
    const prevIndex = getPreviousIndex(itemCount.value)
    navigateToIndex(prevIndex)
  }

  /**
   * Initialisiert das Karussell
   */
  const initializeCarousel = () => {
    checkIsMobile()
    updatePosition(0, itemCount.value)
    
    // Starte Auto-Scroll nach kurzer Verzögerung
    setTimeout(() => {
      if (isMobile.value) {
        startAutoScrollWithCallback()
      }
    }, 1000)
  }

  /**
   * Cleanup
   */
  const cleanup = () => {
    stopAutoScrollCompletely()
    resetTouchState()
  }

  // Watch für Mobile-Änderungen
  watch(isMobile, (newValue) => {
    if (newValue) {
      initializeCarousel()
    } else {
      cleanup()
    }
  })

  return {
    // State
    isMobile,
    position,
    carouselStyle,
    currentItem,
    itemCount,
    autoScrollState,
    touchState,
    
    // Computed
    isSwipe,
    swipeDirection,
    
    // Methods
    initializeCarousel,
    cleanup,
    navigateToIndex,
    navigateNext,
    navigatePrevious,
    
    // Touch Handlers
    handleCarouselTouchStart,
    handleCarouselTouchMove,
    handleCarouselTouchEnd,
    
    // Auto-Scroll
    startAutoScrollWithCallback,
    stopAutoScrollCompletely,
    
    // Mobile Detection
    checkIsMobile
  }
}
