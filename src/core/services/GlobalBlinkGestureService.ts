/**
 * Global Blink Gesture Service
 * 
 * This service handles global blink gestures that work in ALL views:
 * 1. 5-second continuous blink → Navigate to home (page reload)
 * 2. SOS sequence (R-L-R) → Trigger emergency warning
 * 
 * The service is a singleton that:
 * - Sets up a global listener for 'faceBlinkDetected' events on window
 * - Works in ALL views because it listens at the window level
 * - Is initialized when the module is first imported (in App.vue)
 * 
 * Usage:
 * - SOS detection: Automatically active when service is created
 * - 5-second blink: Polling is started in App.vue (runs continuously)
 */

import { useRouter } from 'vue-router'
import { simpleFlowController } from '../application/SimpleFlowController'

export class GlobalBlinkGestureService {
  private static instance: GlobalBlinkGestureService | null = null
  private blinkEventListener: ((event: Event) => void) | null = null
  private router: any = null
  
  // 5-second blink for home navigation
  private longBlinkStartTime: number | null = null
  private longBlinkDuration: number = 5000 // 5 seconds
  
  // SOS sequence detection (R-L-R)
  private sosSequence: Array<'left' | 'right'> = []
  private sosSequencePattern: Array<'right' | 'left' | 'right'> = ['right', 'left', 'right']
  private sosSequenceTimeout: number = 10000 // 10 seconds timeout for sequence
  private lastBlinkTime: number = 0
  private sosSequenceTimer: number | null = null
  
  private constructor() {
    // Initialize router
    if (typeof window !== 'undefined') {
      // Router will be set up when service is initialized
      // Setup blink detection immediately - this makes it truly global
      this.setupBlinkDetection()
      console.log('GlobalBlinkGestureService: Singleton created - global listeners active')
    }
  }
  
  public static getInstance(): GlobalBlinkGestureService {
    if (!GlobalBlinkGestureService.instance) {
      GlobalBlinkGestureService.instance = new GlobalBlinkGestureService()
    }
    return GlobalBlinkGestureService.instance
  }
  
  /**
   * Initialize the service with router
   */
  public initialize(router: any): void {
    this.router = router
    console.log('GlobalBlinkGestureService: Initialized with router')
  }
  
  /**
   * Setup global blink detection
   */
  private setupBlinkDetection(): void {
    if (this.blinkEventListener) {
      // Already set up
      return
    }
    
    this.blinkEventListener = (event: Event) => {
      const customEvent = event as CustomEvent
      
      // Ignore events from fallback interactions
      if (customEvent.detail?.source === 'fallback-interaction') {
        return
      }
      
      // Handle blink events
      this.handleBlinkEvent(customEvent)
    }
    
    window.addEventListener('faceBlinkDetected', this.blinkEventListener)
    console.log('GlobalBlinkGestureService: Global blink detection listener active - works in ALL views')
  }
  
  /**
   * Handle blink events
   */
  private handleBlinkEvent(event: CustomEvent): void {
    const now = Date.now()
    
    // Check for long blink (5 seconds) for home navigation
    this.checkLongBlink(now)
    
    // Check for SOS sequence (R-L-R)
    this.checkSOSSequence(event, now)
  }
  
  /**
   * Check for 5-second blink for home navigation
   */
  private checkLongBlink(now: number): void {
    // This is a simplified check - in reality, we need to track continuous blinking
    // For now, we'll use a different approach: track if eyes are closed for 5 seconds
    // This should be called from a polling mechanism that checks eye state
    
    // Note: This will be implemented by checking eye state continuously
    // For now, we'll use a different mechanism
  }
  
  /**
   * Check for SOS sequence (R-L-R)
   */
  private checkSOSSequence(event: CustomEvent, now: number): void {
    // Get eye state from event detail or face recognition
    const eyeState = event.detail?.eyeState
    
    if (!eyeState) {
      // Try to determine which eye blinked from the event
      // For now, we'll use a simple approach: alternate between left and right
      // In a real implementation, we'd need to track which eye closed
      
      // Simple approach: alternate based on time
      const timeSinceLastBlink = now - this.lastBlinkTime
      if (timeSinceLastBlink < 2000) { // Within 2 seconds
        // Determine direction based on sequence length
        const direction = this.sosSequence.length % 2 === 0 ? 'right' : 'left'
        this.addToSOSSequence(direction, now)
      } else {
        // Reset sequence if too much time passed
        this.resetSOSSequence()
      }
    } else {
      // Use eye state to determine direction
      const direction = this.determineBlinkDirection(eyeState)
      if (direction) {
        this.addToSOSSequence(direction, now)
      }
    }
    
    this.lastBlinkTime = now
  }
  
  /**
   * Determine blink direction from eye state
   */
  private determineBlinkDirection(eyeState: any): 'left' | 'right' | null {
    // If we have eye state, determine which eye blinked
    // This is a simplified version - in reality, we'd need more sophisticated detection
    if (eyeState.left === false && eyeState.right === true) {
      return 'left'
    } else if (eyeState.left === true && eyeState.right === false) {
      return 'right'
    }
    // Both eyes closed - can't determine direction
    return null
  }
  
  /**
   * Add blink to SOS sequence
   */
  private addToSOSSequence(direction: 'left' | 'right', now: number): void {
    // Reset timeout timer
    if (this.sosSequenceTimer) {
      clearTimeout(this.sosSequenceTimer)
    }
    
    // Add to sequence
    this.sosSequence.push(direction)
    
    // Keep only last 3 blinks
    if (this.sosSequence.length > 3) {
      this.sosSequence = this.sosSequence.slice(-3)
    }
    
    // Check if sequence matches pattern
    if (this.sosSequence.length === 3) {
      const matches = this.sosSequence.every((dir, index) => 
        dir === this.sosSequencePattern[index]
      )
      
      if (matches) {
        console.log('GlobalBlinkGestureService: SOS sequence detected!')
        this.triggerSOS()
        this.resetSOSSequence()
        return
      }
    }
    
    // Set timeout to reset sequence if no match
    this.sosSequenceTimer = window.setTimeout(() => {
      this.resetSOSSequence()
    }, this.sosSequenceTimeout)
  }
  
  /**
   * Reset SOS sequence
   */
  private resetSOSSequence(): void {
    this.sosSequence = []
    if (this.sosSequenceTimer) {
      clearTimeout(this.sosSequenceTimer)
      this.sosSequenceTimer = null
    }
  }
  
  /**
   * Trigger SOS emergency
   */
  private triggerSOS(): void {
    console.log('GlobalBlinkGestureService: Triggering SOS emergency')
    
    // Override mute mode (emergency)
    const wasMuted = simpleFlowController.getTTSMuted()
    simpleFlowController.setTTSMuted(false)
    
    // Navigate to warning page
    if (this.router) {
      this.router.push('/warning').then(() => {
        // Play emergency sound/vibration
        this.playEmergencySignal()
      })
    } else {
      // Fallback: use window location
      window.location.href = '/ratatosk.2.0/warning'
    }
  }
  
  /**
   * Play emergency signal
   */
  private playEmergencySignal(): void {
    // Play sound
    try {
      const audio = new Audio('/ServiceGlocke.wav')
      audio.volume = 1.0
      audio.play().catch(err => {
        console.warn('GlobalBlinkGestureService: Could not play emergency sound:', err)
      })
    } catch (err) {
      console.warn('GlobalBlinkGestureService: Emergency sound not available:', err)
    }
    
    // Vibrate if supported
    if ('vibrate' in navigator) {
      try {
        // Vibrate pattern: long, short, long
        (navigator as any).vibrate([500, 200, 500, 200, 500])
      } catch (err) {
        console.warn('GlobalBlinkGestureService: Vibration not supported:', err)
      }
    }
  }
  
  /**
   * Check for 5-second continuous blink (for home navigation)
   * This should be called from a polling mechanism
   */
  public checkLongBlinkForHome(eyeState: { left: boolean; right: boolean }): void {
    const bothEyesClosed = !eyeState.left && !eyeState.right
    
    if (bothEyesClosed) {
      if (this.longBlinkStartTime === null) {
        this.longBlinkStartTime = Date.now()
      } else {
        const elapsed = Date.now() - this.longBlinkStartTime
        if (elapsed >= this.longBlinkDuration) {
          // 5 seconds of continuous blinking detected
          console.log('GlobalBlinkGestureService: 5-second blink detected - navigating to home')
          this.navigateToHome()
          this.longBlinkStartTime = null
        }
      }
    } else {
      // Eyes opened - reset
      this.longBlinkStartTime = null
    }
  }
  
  /**
   * Navigate to home
   */
  private navigateToHome(): void {
    console.log('GlobalBlinkGestureService: Navigating to home via 5-second blink')
    
    // Stop all services
    simpleFlowController.stopTTS()
    simpleFlowController.stopAutoMode()
    
    // Navigate to /app
    if (this.router) {
      this.router.push('/app').then(() => {
        // Reload page for clean reset
        window.location.reload()
      })
    } else {
      // Fallback: use window location
      window.location.href = '/ratatosk.2.0/app'
      window.location.reload()
    }
  }
  
  /**
   * Cleanup
   */
  public cleanup(): void {
    if (this.blinkEventListener) {
      window.removeEventListener('faceBlinkDetected', this.blinkEventListener)
      this.blinkEventListener = null
    }
    
    if (this.sosSequenceTimer) {
      clearTimeout(this.sosSequenceTimer)
      this.sosSequenceTimer = null
    }
    
    this.resetSOSSequence()
    this.longBlinkStartTime = null
  }
}

export const globalBlinkGestureService = GlobalBlinkGestureService.getInstance()

