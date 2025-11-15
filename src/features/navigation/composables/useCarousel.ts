import { ref, computed, watch } from 'vue'
import { useTouchCarousel } from './useTouchCarousel'
import { useAutoScroll } from './useAutoScroll'
import { useCarouselPosition } from './useCarouselPosition'
import { CAROUSEL_CONFIG, type CarouselItem } from '../config/carouselConfig'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'

/**
 * Haupt-Composable für das mobile Karussell
 */
export function useCarousel(items: CarouselItem[]) {
  // Mobile Detection
  const isMobile = ref(false)
  
  // Flag um zu verhindern, dass Auto-Scroll startet, wenn Auto-Mode gerade startet
  const isAutoModeStarting = ref(false)
  
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
   * iPad Pro im Hochformat (Portrait) wird auch als Mobile behandelt
   * iPad im Querformat (Landscape) verwendet das normale Grid
   */
  const checkIsMobile = () => {
    const width = window.innerWidth
    const height = window.innerHeight
    const isPortrait = height > width
    const isLandscape = width > height
    
    // WICHTIG: Im Landscape-Modus IMMER Grid verwenden (nie Karussell)
    if (isLandscape) {
      if (isMobile.value !== false) {
        isMobile.value = false
      }
      return
    }
    
    // Mobile: Nur im Portrait-Modus
    // <= 768px ODER iPad Pro im Hochformat (Portrait)
    // iPad Pro 11": 834px x 1194px (Portrait) / 1194px x 834px (Landscape)
    // iPad Pro 12.9": 1024px x 1366px (Portrait) / 1366px x 1024px (Landscape)
    const newIsMobile = isPortrait && (
      width <= CAROUSEL_CONFIG.MOBILE_BREAKPOINT || 
      (width <= 1366 && width >= 768)
    )
    
    // Nur aktualisieren, wenn sich der Wert tatsächlich ändert (verhindert unnötige Watcher-Auslösung bei Rotation)
    if (isMobile.value !== newIsMobile) {
      isMobile.value = newIsMobile
    }
    
    // Position bei Resize neu berechnen, aber NUR wenn Auto-Mode nicht aktiv ist
    // (verhindert, dass Rotation den Auto-Mode stoppt)
    if (isMobile.value) {
      const autoModeState = simpleFlowController.getState()
      if (!autoModeState.isAutoModeActive) {
      updatePosition(position.currentIndex, items.length)
      }
    }
  }

  /**
   * Startet Auto-Scroll mit Callback
   */
  const startAutoScrollWithCallback = () => {
    if (!isMobile.value) return
    
    // Prüfe, ob Auto-Mode aktiv ist oder gerade startet - wenn ja, starte Auto-Scroll nicht
    if (isAutoModeStarting.value) {
      return
    }
    
    const autoModeState = simpleFlowController.getState()
    if (autoModeState.isAutoModeActive) {
      return
    }

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
   * @param resetPosition - Wenn true, wird die Position auf 0 zurückgesetzt (Standard: false, um Auto-Mode nicht zu stören)
   */
  const initializeCarousel = (resetPosition = false) => {
    checkIsMobile()
    
    // Position nur zurücksetzen, wenn explizit gewünscht UND Auto-Mode nicht aktiv ist
    // (verhindert, dass Rotation den Auto-Mode stoppt)
    if (resetPosition) {
      const autoModeState = simpleFlowController.getState()
      if (!autoModeState.isAutoModeActive) {
    updatePosition(0, itemCount.value)
      }
    } else {
      // Position nur aktualisieren, wenn Auto-Mode nicht aktiv ist
      const autoModeState = simpleFlowController.getState()
      if (!autoModeState.isAutoModeActive) {
        updatePosition(position.currentIndex, itemCount.value)
      }
    }
    
    // Starte Auto-Scroll nach kurzer Verzögerung, NUR wenn Auto-Mode nicht aktiv ist
    // Auto-Mode steuert die Navigation selbst, daher sollte Auto-Scroll nicht laufen
    setTimeout(() => {
      if (isMobile.value && !autoScrollState.isActive) {
        // Prüfe, ob Auto-Mode aktiv ist oder gerade startet
        if (isAutoModeStarting.value) {
          return
        }
        
        const autoModeState = simpleFlowController.getState()
        if (!autoModeState.isAutoModeActive) {
        startAutoScrollWithCallback()
        }
      }
    }, 1000)
  }
  
  /**
   * Setzt Flag, dass Auto-Mode gerade startet
   */
  const setAutoModeStarting = (starting: boolean) => {
    isAutoModeStarting.value = starting
  }

  /**
   * Cleanup
   */
  const cleanup = () => {
    stopAutoScrollCompletely()
    resetTouchState()
  }

  // Watch für Mobile-Änderungen
  // WICHTIG: Nur reagieren, wenn sich isMobile tatsächlich ändert (nicht bei jeder Rotation)
  // resetPosition = false, um Auto-Mode nicht zu stören
  watch(isMobile, (newValue, oldValue) => {
    // Nur reagieren, wenn sich der Wert tatsächlich geändert hat
    if (newValue === oldValue) return
    
    if (newValue) {
      // Position NICHT zurücksetzen, um Auto-Mode nicht zu stören
      initializeCarousel(false)
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
    
    // Auto-Mode Flag
    setAutoModeStarting,
    
    // Mobile Detection
    checkIsMobile
  }
}
