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
      // Try to get eye state from face recognition
      let eyeState: { left: boolean; right: boolean } | null = null
      
      if (faceRecognition.isActive.value) {
        const state = faceRecognition.eyeState.value
        if (state) {
          eyeState = {
            left: state.left,
            right: state.right
          }
        }
      }
      
      // Fallback: Use isBlinking() method if eye state is not available
      if (!eyeState && faceRecognition.isActive.value) {
        // Create a synthetic eye state from isBlinking()
        const isBlinking = faceRecognition.isBlinking()
        eyeState = {
          left: !isBlinking,
          right: !isBlinking
        }
      }
      
      // Check for 5-second blink if we have eye state
      if (eyeState) {
        // Debug: Log eye state occasionally (every 2 seconds)
        const now = Date.now()
        if (!(window as any).lastEyeStateLog || now - (window as any).lastEyeStateLog > 2000) {
          console.log('5-sec blink check: Eye state:', eyeState, 'isActive:', faceRecognition.isActive.value, 'isBlinking:', faceRecognition.isBlinking())
          ;(window as any).lastEyeStateLog = now
        }
        
        globalBlinkGestureService.checkLongBlinkForHome(eyeState)
      } else {
        // Debug: Log when face recognition is not active or no eye state
        if (!(window as any).lastInactiveLog || Date.now() - (window as any).lastInactiveLog > 10000) {
          console.warn('5-sec blink check: Face recognition not active or no eye state - cannot detect 5-second blink. isActive:', faceRecognition.isActive.value)
          ;(window as any).lastInactiveLog = Date.now()
        }
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

