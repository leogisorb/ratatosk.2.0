/**
 * Composable für globale Blink-Gesten
 * Initialisiert und verwaltet 5-second blink und SOS detection
 */

import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { globalBlinkGestureService } from '../../core/services/GlobalBlinkGestureService'
import { useFaceRecognition } from '../../features/face-recognition/composables/useFaceRecognition'

export function useGlobalBlinkGestures() {
  const router = useRouter()
  const faceRecognition = useFaceRecognition()
  
  let longBlinkCheckInterval: number | null = null

  onMounted(() => {
    // Initialize global blink gesture service with router
    // Note: The service singleton is already created and listening globally to faceBlinkDetected events
    // This initialization just sets the router for navigation
    globalBlinkGestureService.initialize(router)
    console.log('App: GlobalBlinkGestureService initialized - SOS and 5-second blink work in ALL views')
    
    // Start checking for 5-second blink (polling every 100ms)
    // This polling runs continuously and works in ALL views since it's in App.vue (root component)
    longBlinkCheckInterval = window.setInterval(() => {
      if (faceRecognition.isActive.value && faceRecognition.eyeState.value) {
        globalBlinkGestureService.checkLongBlinkForHome(faceRecognition.eyeState.value)
      }
    }, 100)
    console.log('App: 5-second blink polling started - works globally in all views')
  })

  onUnmounted(() => {
    // Cleanup global blink gesture service
    globalBlinkGestureService.cleanup()
    
    // Clear interval
    if (longBlinkCheckInterval) {
      clearInterval(longBlinkCheckInterval)
      longBlinkCheckInterval = null
    }
  })
}

