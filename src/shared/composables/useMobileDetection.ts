import { ref, computed, readonly, onMounted, onUnmounted } from 'vue'

// Named Constants für Breakpoints
const BREAKPOINTS = {
  MOBILE_MAX_WIDTH: 768,
  IPAD_PORTRAIT_MAX_WIDTH: 821,
  IPAD_PORTRAIT_MAX_HEIGHT: 1181,
  TABLET_MAX_WIDTH: 1024
} as const

/**
 * Debounce-Funktion für Performance
 */
function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null
  
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = window.setTimeout(() => fn(...args), delay)
  }
}

/**
 * Erweiterte Mobile-Detection mit Tablet-Support
 * Erkennt Mobile (<= 768px), Tablet (769-1024px) und Desktop (> 1024px)
 */
export function useMobileDetection() {
  const isMobile = ref(false)
  const isTablet = ref(false)
  
  const deviceType = computed(() => {
    if (isMobile.value) return 'mobile'
    if (isTablet.value) return 'tablet'
    return 'desktop'
  })

  const checkDeviceType = () => {
    const { innerWidth: width, innerHeight: height } = window
    
    // Mobile: <= 768px ODER Bildschirme kleiner oder gleich 820x1180
    // iPad Pro 11": 834px x 1194px (Portrait) - verwendet Grid, nicht Karussell
    // iPad Pro 12.9": 1024px x 1366px (Portrait) - verwendet Grid, nicht Karussell
    const isSmallScreen = width <= BREAKPOINTS.MOBILE_MAX_WIDTH
    const isIPadPortrait = 
      width <= BREAKPOINTS.IPAD_PORTRAIT_MAX_WIDTH && 
      height <= BREAKPOINTS.IPAD_PORTRAIT_MAX_HEIGHT
    
    isMobile.value = isSmallScreen || isIPadPortrait
    isTablet.value = !isMobile.value && width <= BREAKPOINTS.TABLET_MAX_WIDTH
    
    // Debug log
    if (isIPadPortrait) {
      console.log('Mobile Detection: 820x1180 erkannt', { width, height, isMobile: isMobile.value })
    }
  }

  // Debounced version für resize (Performance)
  const debouncedCheck = debounce(checkDeviceType, 150)

  onMounted(() => {
    checkDeviceType() // Initial ohne Debounce
    window.addEventListener('resize', debouncedCheck)
    window.addEventListener('orientationchange', checkDeviceType) // Sofort bei Orientation
  })

  onUnmounted(() => {
    window.removeEventListener('resize', debouncedCheck)
    window.removeEventListener('orientationchange', checkDeviceType)
  })

  return {
    isMobile: readonly(isMobile),
    isTablet: readonly(isTablet),
    deviceType
  }
}

