import { ref, computed, reactive } from 'vue'
import { CAROUSEL_CONFIG, type CarouselPosition } from '../config/carouselConfig'

/**
 * Composable für Karussell-Position und Animation
 */
export function useCarouselPosition() {
  // Position State
  const position = reactive<CarouselPosition>({
    currentIndex: 0,
    isAnimating: false
  })

  // HINWEIS: carouselStyle wurde entfernt
  // Positionierung erfolgt über CSS-Variablen (--offset) direkt im Template
  // Siehe HomeView.vue: :style="{ '--offset': 0 - currentTileIndex }"

  /**
   * Aktualisiert die Karussell-Position
   * Nur Index setzen - Positionierung erfolgt über CSS wie im Pain Dialog
   */
  const updatePosition = (index: number, itemCount: number) => {
    if (index < 0 || index >= itemCount) {
      return
    }

    // Nur Index setzen - CSS macht die Positionierung über CSS-Variablen (--offset)
    position.currentIndex = index
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
