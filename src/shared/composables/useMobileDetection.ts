import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Einfaches Composable für Mobile-Detection
 * Erkennt Mobile (<= 768px) und iPad im Hochformat (Portrait)
 */
export function useMobileDetection() {
  const isMobile = ref(false)

  const checkIsMobile = () => {
    const width = window.innerWidth
    const height = window.innerHeight
    
    // Mobile: <= 768px ODER Bildschirme kleiner oder gleich 820x1180
    // iPad Pro 11": 834px x 1194px (Portrait) - verwendet Grid, nicht Karussell
    // iPad Pro 12.9": 1024px x 1366px (Portrait) - verwendet Grid, nicht Karussell
    const isSmallScreen = width <= 768
    const is820x1180 = width <= 821 && height <= 1181
    isMobile.value = isSmallScreen || is820x1180
    
    // Debug log
    if (is820x1180) {
      console.log('Mobile Detection: 820x1180 erkannt', { width, height, isMobile: isMobile.value })
    }
  }

  onMounted(() => {
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    window.addEventListener('orientationchange', checkIsMobile)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', checkIsMobile)
    window.removeEventListener('orientationchange', checkIsMobile)
  })

  return {
    isMobile
  }
}

