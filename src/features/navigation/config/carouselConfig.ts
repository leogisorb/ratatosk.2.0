/**
 * Konfiguration für das mobile Karussell
 */
export const CAROUSEL_CONFIG = {
  // Layout
  TILE_HEIGHT: 400, // Höhe einer Kachel inkl. Abstand (360px Kachel + 40px Margin)
  MOBILE_TILE_HEIGHT: 400, // Höhe für mobile Geräte (angepasst an CSS)
  TILE_WIDTH_PERCENTAGE: 85, // Breite der Kacheln in Prozent
  MAX_TILE_WIDTH: 450, // Maximale Breite der Kacheln
  
  // Auto-Scroll
  AUTO_SCROLL_INTERVAL: 3000, // Intervall für Auto-Scroll in ms
  AUTO_SCROLL_PAUSE_AFTER_TOUCH: 2000, // Pause nach Touch-Interaktion
  
  // Touch-Gesten
  SWIPE_THRESHOLD: 50, // Mindestbewegung für Swipe in px
  SWIPE_DURATION: 300, // Maximale Dauer für Swipe in ms
  TOUCH_DEBOUNCE: 16, // Debounce für Touch-Events in ms (60fps)
  
  // Animationen
  TRANSITION_DURATION: 0.8, // Dauer der Transform-Animation in s
  TRANSITION_EASING: 'cubic-bezier(0.4, 0, 0.2, 1)', // Easing-Funktion
  
  // Mobile Detection
  MOBILE_BREAKPOINT: 768, // Breakpoint für mobile Erkennung
  
  // Performance
  WILL_CHANGE_THRESHOLD: 5, // Anzahl der Tiles für will-change
} as const

/**
 * Typen für Karussell-Konfiguration
 */
export type CarouselConfig = typeof CAROUSEL_CONFIG

/**
 * Interface für Touch-State
 */
export interface TouchState {
  startY: number
  startTime: number
  isDragging: boolean
  currentY: number
  deltaY: number
}

/**
 * Interface für Karussell-Item
 */
export interface CarouselItem {
  id: string
  title: string
  icon: string
  route: string
  category: 'main' | 'communication' | 'pain' | 'settings'
}

/**
 * Interface für Karussell-Position
 * @deprecated offset wird nicht mehr verwendet - Positionierung erfolgt über CSS-Variablen
 */
export interface CarouselPosition {
  currentIndex: number
  isAnimating: boolean
}

/**
 * Interface für Auto-Scroll-State
 */
export interface AutoScrollState {
  isActive: boolean
  intervalId: number | null
  isPaused: boolean
}
