import { ref, reactive, computed } from 'vue'
import { CAROUSEL_CONFIG, type TouchState } from '../config/carouselConfig'

/**
 * Composable für Touch-Handling im Karussell
 */
export function useTouchCarousel() {
  // Touch-State
  const touchState = reactive<TouchState>({
    startY: 0,
    startTime: 0,
    isDragging: false,
    currentY: 0,
    deltaY: 0
  })

  // Computed für Touch-Erkennung
  const isSwipe = computed(() => {
    return Math.abs(touchState.deltaY) > CAROUSEL_CONFIG.SWIPE_THRESHOLD && 
           (Date.now() - touchState.startTime) < CAROUSEL_CONFIG.SWIPE_DURATION
  })

  const swipeDirection = computed(() => {
    if (!isSwipe.value) return null
    return touchState.deltaY > 0 ? 'down' : 'up'
  })

  /**
   * Touch-Start Handler
   */
  const handleTouchStart = (event: TouchEvent) => {
    if (!event.touches.length) return

    touchState.startY = event.touches[0].clientY
    touchState.startTime = Date.now()
    touchState.isDragging = true
    touchState.currentY = touchState.startY
    touchState.deltaY = 0

    console.log('Touch start:', touchState.startY)
  }

  /**
   * Touch-Move Handler mit Debouncing
   */
  const handleTouchMove = (event: TouchEvent) => {
    if (!touchState.isDragging || !event.touches.length) return

    event.preventDefault()
    
    touchState.currentY = event.touches[0].clientY
    touchState.deltaY = touchState.currentY - touchState.startY

    // Debounced handling für Performance
    if (Date.now() - touchState.startTime > CAROUSEL_CONFIG.TOUCH_DEBOUNCE) {
      console.log('Touch move:', touchState.deltaY)
    }
  }

  /**
   * Touch-End Handler
   */
  const handleTouchEnd = (event: TouchEvent) => {
    if (!touchState.isDragging) return

    const touchEndTime = Date.now()
    const touchDuration = touchEndTime - touchState.startTime
    const currentY = event.changedTouches[0]?.clientY || touchState.currentY
    const deltaY = currentY - touchState.startY

    // Aktualisiere State
    touchState.deltaY = deltaY
    touchState.isDragging = false

    console.log('Touch end:', { deltaY, duration: touchDuration, isSwipe: isSwipe.value })

    return {
      isSwipe: isSwipe.value,
      direction: swipeDirection.value,
      deltaY,
      duration: touchDuration
    }
  }

  /**
   * Reset Touch-State
   */
  const resetTouchState = () => {
    touchState.startY = 0
    touchState.startTime = 0
    touchState.isDragging = false
    touchState.currentY = 0
    touchState.deltaY = 0
  }

  /**
   * Touch-Cancel Handler
   */
  const handleTouchCancel = () => {
    console.log('Touch cancelled')
    resetTouchState()
  }

  return {
    // State
    touchState,
    isSwipe,
    swipeDirection,
    
    // Handlers
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    resetTouchState
  }
}
