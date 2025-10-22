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

  // Computed für CSS-Transform
  const carouselStyle = computed(() => ({
    transform: `translate3d(0, ${position.offset}px, 0)`,
    transition: position.isAnimating 
      ? `transform ${CAROUSEL_CONFIG.TRANSITION_DURATION}s ${CAROUSEL_CONFIG.TRANSITION_EASING}`
      : `transform ${CAROUSEL_CONFIG.TRANSITION_DURATION}s ${CAROUSEL_CONFIG.TRANSITION_EASING}`,
    willChange: 'transform'
  }))

  /**
   * Aktualisiert die Karussell-Position
   */
  const updatePosition = (index: number, itemCount: number) => {
    if (index < 0 || index >= itemCount) return

    position.currentIndex = index
    
    // Prüfe ob mobile Gerät
    const isMobile = window.innerWidth <= CAROUSEL_CONFIG.MOBILE_BREAKPOINT
    
    if (isMobile) {
      // Mobile: ECHTES KARUSSELL - Die aktive Kachel soll IMMER in der gleichen Position bleiben
      const mainContent = document.querySelector('.main-content')
      if (mainContent) {
        const mainContentHeight = mainContent.clientHeight
        const tileHeight = 360 // Entspricht der CSS-Höhe (400px * 0.9 = 360px)
        
        // Die Mitte des main-content - DIESE Position soll IMMER die aktive Kachel sein
        const centerY = mainContentHeight / 2
        
        // Berechne den Offset so, dass die Kachel mit dem aktuellen Index in der Mitte erscheint
        // Das bedeutet: Wir verschieben das gesamte Karussell, aber die aktive Kachel bleibt immer in der Mitte
        // Index 0: Kachel 0 soll in der Mitte sein -> Offset = centerY - tileHeight/2
        // Index 1: Kachel 1 soll in der Mitte sein -> Offset = centerY - tileHeight/2 - tileHeight
        // Index 2: Kachel 2 soll in der Mitte sein -> Offset = centerY - tileHeight/2 - 2*tileHeight
        
        // KARUSSELL 5% WEITER NACH OBEN (nur leichte Anpassung)
        const offsetAdjustment = mainContentHeight * 0.05 // 5% der main-content Höhe nach oben
        const newOffset = centerY - (tileHeight / 2) - (index * tileHeight) - offsetAdjustment
        
        position.offset = newOffset
        console.log(`🎯 Mobile Karussell: index=${index}, offset=${newOffset}`)
        console.log(`🎯 Transform: translate3d(0, ${newOffset}px, 0)`)
        console.log(`🎯 Center Y: ${centerY}px, Tile height: ${tileHeight}px`)
        console.log(`🎯 Active tile ${index} wird in der Mitte zentriert`)
        console.log(`🎯 Berechnung: centerY(${centerY}) - tileHeight/2(${tileHeight/2}) - index* tileHeight(${index * tileHeight}) - offsetAdjustment(${offsetAdjustment}) = ${newOffset}`)
        console.log(`🎯 Karussell 5% weiter nach oben: ${offsetAdjustment}px`)
      } else {
        // Fallback: Viewport-basierte Berechnung
        const viewportHeight = window.innerHeight
        const tileHeight = 360 // Entspricht der CSS-Höhe (400px * 0.9 = 360px)
        const centerY = viewportHeight / 2
        
        // KARUSSELL 5% WEITER NACH OBEN (Fallback)
        const offsetAdjustment = viewportHeight * 0.05 // 5% der Viewport-Höhe nach oben
        const newOffset = centerY - (tileHeight / 2) - (index * tileHeight) - offsetAdjustment
        
        position.offset = newOffset
        console.log(`Mobile fallback: index=${index}, offset=${newOffset}, viewportHeight=${viewportHeight}`)
      }
    } else {
      // Desktop: Standard-Berechnung
      const centerOffset = window.innerHeight / 2 - CAROUSEL_CONFIG.TILE_HEIGHT / 2
      const newOffset = centerOffset - (index * CAROUSEL_CONFIG.TILE_HEIGHT)
      
      position.offset = newOffset
      console.log(`Desktop position: index=${index}, offset=${newOffset}`)
    }
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
