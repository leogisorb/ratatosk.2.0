import { ref, reactive } from 'vue'
import { CAROUSEL_CONFIG, type AutoScrollState } from '../config/carouselConfig'
import { simpleFlowController } from '../../../core/application/SimpleFlowController'

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
    
    // Prüfe, ob Auto-Mode aktiv ist - wenn ja, starte Auto-Scroll nicht
    const autoModeState = simpleFlowController.getState()
    if (autoModeState.isAutoModeActive) {
      return
    }
    autoScrollState.isActive = true
    autoScrollState.isPaused = false

    autoScrollState.intervalId = setInterval(() => {
      // Prüfe bei jedem Intervall, ob Auto-Mode aktiv ist
      const currentAutoModeState = simpleFlowController.getState()
      if (currentAutoModeState.isAutoModeActive) {
        // Auto-Mode wurde aktiviert, stoppe Auto-Scroll
        stopAutoScroll()
        return
      }
      
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
  }

  /**
   * Pausiert Auto-Scroll
   */
  const pauseAutoScroll = () => {
    autoScrollState.isPaused = true
  }

  /**
   * Setzt Auto-Scroll fort
   */
  const resumeAutoScroll = () => {
    autoScrollState.isPaused = false
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
