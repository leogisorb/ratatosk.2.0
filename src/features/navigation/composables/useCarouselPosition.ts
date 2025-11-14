import { ref, computed, reactive } from 'vue'
import { CAROUSEL_CONFIG, type CarouselPosition } from '../config/carouselConfig'

/**
 * Composable für Karussell-Position und Animation
 */
export function useCarouselPosition() {
  // Position State
  const position = reactive<CarouselPosition>({
    offset: 0,
    currentIndex: 0,
    isAnimating: false
  })

  // Computed für CSS-Transform - KEINE Container-Verschiebung mehr
  // Stattdessen wird CSS verwendet wie im Pain Dialog
  const carouselStyle = computed(() => ({}))

  /**
   * Aktualisiert die Karussell-Position
   * Nur Index setzen - Positionierung erfolgt über CSS wie im Pain Dialog
   */
  const updatePosition = (index: number, itemCount: number) => {
    if (index < 0 || index >= itemCount) {
      return
    }

    // Nur Index setzen - CSS macht die Positionierung
    position.currentIndex = index
    position.offset = 0 // Nicht mehr verwendet
  }

  /**
   * Animiert zur nächsten Position
   */
  const animateToPosition = (index: number, itemCount: number) => {
    position.isAnimating = true
    updatePosition(index, itemCount)
    
    // Animation beenden nach Transition
    setTimeout(() => {
      position.isAnimating = false
    }, CAROUSEL_CONFIG.TRANSITION_DURATION * 1000)
  }

  /**
   * Springt sofort zur Position (ohne Animation)
   */
  const jumpToPosition = (index: number, itemCount: number) => {
    position.isAnimating = false
    updatePosition(index, itemCount)
  }

  /**
   * Berechnet nächsten Index (mit Wrapping)
   */
  const getNextIndex = (itemCount: number) => {
    return (position.currentIndex + 1) % itemCount
  }

  /**
   * Berechnet vorherigen Index (mit Wrapping)
   */
  const getPreviousIndex = (itemCount: number) => {
    return position.currentIndex > 0 
      ? position.currentIndex - 1 
      : itemCount - 1
  }

  /**
   * Setzt Position zurück
   */
  const resetPosition = () => {
    position.offset = 0
    position.currentIndex = 0
    position.isAnimating = false
  }

  /**
   * Aktualisiert die Position bei Resize
   */
  const handleResize = (itemCount: number) => {
    updatePosition(position.currentIndex, itemCount)
  }

  return {
    // State
    position,
    carouselStyle,
    
    // Methods
    updatePosition,
    animateToPosition,
    jumpToPosition,
    getNextIndex,
    getPreviousIndex,
    resetPosition,
    handleResize
  }
}
