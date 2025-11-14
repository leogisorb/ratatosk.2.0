import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import type { CSSProperties } from 'vue'

/**
 * Composable für responsive Carousel-Tile-Sizing
 * Berechnet Größen basierend auf der tatsächlichen Container-Größe
 */
export function useCarouselSizing() {
  const containerRef = ref<HTMLElement | null>(null)
  const containerWidth = ref(0)
  const containerHeight = ref(0)

  /**
   * Aktualisiert die Container-Dimensionen
   */
  const updateContainerSize = () => {
    if (!containerRef.value) return
    
    const rect = containerRef.value.getBoundingClientRect()
    containerWidth.value = rect.width
    containerHeight.value = rect.height
  }

  /**
   * Resize Observer für automatische Updates
   */
  let resizeObserver: ResizeObserver | null = null

  onMounted(async () => {
    await nextTick()
    updateContainerSize()

    // Resize Observer für automatische Updates
    if (containerRef.value && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        updateContainerSize()
      })
      resizeObserver.observe(containerRef.value)
    }

    // Fallback: Window resize listener
    window.addEventListener('resize', updateContainerSize)
  })

  onUnmounted(() => {
    if (resizeObserver) {
      resizeObserver.disconnect()
    }
    window.removeEventListener('resize', updateContainerSize)
  })

  /**
   * Icon-Container Größe: 60% der kleinsten Container-Dimension
   */
  const iconContainerSize = computed(() => {
    const minDimension = Math.min(containerWidth.value, containerHeight.value)
    return minDimension * 0.6 // 60% der Container-Größe
  })

  /**
   * Icon-Größe: 105% des Icon-Containers (für SVGs) - 50% größer als vorher (0.7 * 1.5 = 1.05)
   */
  const iconSize = computed(() => {
    return iconContainerSize.value * 1.05
  })

  /**
   * Emoji-Größe: 105% des Icon-Containers (für Emojis) - 50% größer als vorher (0.7 * 1.5 = 1.05)
   */
  const emojiSize = computed(() => {
    return iconContainerSize.value * 1.05
  })

  /**
   * Text-Breite: 90% der Container-Breite
   */
  const textWidth = computed(() => {
    return containerWidth.value * 0.9
  })

  /**
   * Responsive Font-Size basierend auf Container-Größe
   */
  const textFontSize = computed(() => {
    const minDimension = Math.min(containerWidth.value, containerHeight.value)
    // Font-Size: ~4% der kleinsten Dimension, mit Min/Max, dann +30% und nochmal +15% größer
    const baseSize = Math.max(12, Math.min(minDimension * 0.04, 32))
    return baseSize * 1.3 * 1.15 // 30% + 15% größer
  })

  /**
   * Active Text Font-Size (etwas größer)
   */
  const activeTextFontSize = computed(() => {
    return textFontSize.value * 1.3
  })

  /**
   * Styles für Icon-Container
   */
  const iconContainerStyle = computed<CSSProperties>(() => ({
    width: `${iconContainerSize.value}px`,
    height: `${iconContainerSize.value}px`,
    minWidth: `${iconContainerSize.value}px`,
    minHeight: `${iconContainerSize.value}px`,
    maxWidth: `${iconContainerSize.value}px`,
    maxHeight: `${iconContainerSize.value}px`
  }))

  /**
   * Styles für Icon (SVG)
   */
  const iconStyle = computed<CSSProperties>(() => ({
    width: `${iconSize.value}px`,
    height: `${iconSize.value}px`,
    minWidth: `${iconSize.value}px`,
    minHeight: `${iconSize.value}px`,
    maxWidth: `${iconSize.value}px`,
    maxHeight: `${iconSize.value}px`
  }))

  /**
   * Styles für Emoji
   */
  const emojiStyle = computed<CSSProperties>(() => ({
    fontSize: `${emojiSize.value}px`,
    lineHeight: 1,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }))

  /**
   * Styles für Text
   */
  const textStyle = computed<CSSProperties>(() => ({
    width: `${textWidth.value}px`,
    maxWidth: `${textWidth.value}px`,
    fontSize: `${textFontSize.value}px`,
    whiteSpace: 'normal' as const, // Text darf umbrechen
    overflow: 'visible' as const, // Kein Overflow-Hiding
    wordWrap: 'break-word' as const, // Wörter umbrechen wenn nötig
    overflowWrap: 'break-word' as const, // Moderne Alternative
    hyphens: 'auto' as const // Automatische Silbentrennung
  }))

  /**
   * Styles für aktiven Text
   */
  const activeTextStyle = computed<CSSProperties>(() => ({
    fontSize: `${activeTextFontSize.value}px`,
    whiteSpace: 'normal' as const, // Text darf umbrechen
    overflow: 'visible' as const, // Kein Overflow-Hiding
    wordWrap: 'break-word' as const, // Wörter umbrechen wenn nötig
    overflowWrap: 'break-word' as const, // Moderne Alternative
    hyphens: 'auto' as const // Automatische Silbentrennung
  }))

  return {
    containerRef,
    containerWidth,
    containerHeight,
    iconContainerSize,
    iconSize,
    emojiSize,
    textWidth,
    textFontSize,
    activeTextFontSize,
    iconContainerStyle,
    iconStyle,
    emojiStyle,
    textStyle,
    activeTextStyle,
    updateContainerSize
  }
}

