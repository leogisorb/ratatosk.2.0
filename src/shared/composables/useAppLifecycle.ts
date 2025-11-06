/**
 * Composable für App-Lifecycle-Management
 * Handles mobile app pause/resume, visibility changes, etc.
 */

import { onMounted, onUnmounted } from 'vue'
import { useFaceRecognition } from '../../features/face-recognition/composables/useFaceRecognition'

export function useAppLifecycle() {
  const faceRecognition = useFaceRecognition()

  function handleVisibilityChange() {
    if (document.hidden) {
      // App went to background
      console.log('App: Visibility changed - app in background')
      handleAppPause()
    } else {
      // App came to foreground
      console.log('App: Visibility changed - app in foreground')
      handleAppResume()
    }
  }

  function handleBeforeUnload() {
    // Save state before page unload
    console.log('App: Before unload - saving state')
    // State is already saved in localStorage via settings store
  }

  function handleFocus() {
    console.log('App: Window focused')
    handleAppResume()
  }

  function handleBlur() {
    console.log('App: Window blurred')
    handleAppPause()
  }

  function handlePageHide(event: PageTransitionEvent) {
    // Mobile: App is being hidden
    console.log('App: Page hide - app paused')
    handleAppPause()
  }

  function handlePageShow(event: PageTransitionEvent) {
    // Mobile: App is being shown
    console.log('App: Page show - app resumed')
    handleAppResume()
  }

  function handleAppPause() {
    // Stop camera/tracking when app goes to background
    console.log('App: Pausing services')
    
    // Note: We don't stop face recognition completely, but we can pause processing
    // The camera will be handled by the browser automatically
  }

  function handleAppResume() {
    // Resume camera/tracking when app comes to foreground
    console.log('App: Resuming services')
    
    // Reconnect camera if needed
    if (faceRecognition.isActive.value) {
      // Face recognition should automatically reconnect
      console.log('App: Face recognition should reconnect automatically')
    } else {
      // Try to restart face recognition
      console.log('App: Attempting to restart face recognition')
      faceRecognition.start().catch(err => {
        console.warn('App: Failed to restart face recognition:', err)
      })
    }
  }

  onMounted(() => {
    // Mobile lifecycle listeners
    if (typeof document !== 'undefined') {
      // Handle visibility change (app goes to background/foreground)
      document.addEventListener('visibilitychange', handleVisibilityChange)
      
      // Handle page unload (save state)
      window.addEventListener('beforeunload', handleBeforeUnload)
      
      // Handle page focus/blur
      window.addEventListener('focus', handleFocus)
      window.addEventListener('blur', handleBlur)
    }
    
    // Mobile-specific: handle app pause/resume
    if (typeof window !== 'undefined' && 'onpagehide' in window) {
      window.addEventListener('pagehide', handlePageHide)
      window.addEventListener('pageshow', handlePageShow)
    }
  })

  onUnmounted(() => {
    // Remove event listeners
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
    
    if (typeof window !== 'undefined' && 'onpagehide' in window) {
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('pageshow', handlePageShow)
    }
  })
}

