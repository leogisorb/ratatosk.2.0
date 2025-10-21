import { ref, reactive } from 'vue'
import { CAROUSEL_CONFIG, type AutoScrollState } from '../config/carouselConfig'

/**
 * Composable für Auto-Scroll-Funktionalität
 */
export function useAutoScroll() {
  // Auto-Scroll State
  const autoScrollState = reactive<AutoScrollState>({
    isActive: false,
    intervalId: null,
    isPaused: false
  })

  /**
   * Startet Auto-Scroll
   */
  const startAutoScroll = (onScroll: (index: number) => void, itemCount: number) => {
    if (autoScrollState.isActive || autoScrollState.intervalId) return

    console.log('Starting auto-scroll')
    autoScrollState.isActive = true
    autoScrollState.isPaused = false

    autoScrollState.intervalId = setInterval(() => {
      if (!autoScrollState.isPaused) {
        // Simuliere nächsten Index (wird von außen verwaltet)
        onScroll(0) // Placeholder - wird von außen überschrieben
      }
    }, CAROUSEL_CONFIG.AUTO_SCROLL_INTERVAL)
  }

  /**
   * Stoppt Auto-Scroll
   */
  const stopAutoScroll = () => {
    if (autoScrollState.intervalId) {
      clearInterval(autoScrollState.intervalId)
      autoScrollState.intervalId = null
    }
    autoScrollState.isActive = false
    autoScrollState.isPaused = false
    console.log('Auto-scroll stopped')
  }

  /**
   * Pausiert Auto-Scroll
   */
  const pauseAutoScroll = () => {
    autoScrollState.isPaused = true
    console.log('Auto-scroll paused')
  }

  /**
   * Setzt Auto-Scroll fort
   */
  const resumeAutoScroll = () => {
    autoScrollState.isPaused = false
    console.log('Auto-scroll resumed')
  }

  /**
   * Pausiert Auto-Scroll nach Touch-Interaktion
   */
  const pauseAfterTouch = () => {
    pauseAutoScroll()
    setTimeout(() => {
      if (autoScrollState.isActive) {
        resumeAutoScroll()
      }
    }, CAROUSEL_CONFIG.AUTO_SCROLL_PAUSE_AFTER_TOUCH)
  }

  return {
    // State
    autoScrollState,
    
    // Methods
    startAutoScroll,
    stopAutoScroll,
    pauseAutoScroll,
    resumeAutoScroll,
    pauseAfterTouch
  }
}
