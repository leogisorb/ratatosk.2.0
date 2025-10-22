import type { 
  FaceRecognitionState, 
  FaceRecognitionConfig, 
  BlinkEvent,
  EyeState 
} from '../../../core/domain/entities/FaceRecognition'

/**
 * Face Recognition Service
 * Handles face recognition and eye tracking business logic
 */
export class FaceRecognitionService {
  private state: FaceRecognitionState = {
    isActive: false,
    isDetected: false,
    confidence: 0,
    eyeState: { left: true, right: true, confidence: 0, blinkDuration: 0 },
    landmarks: [],
    lastBlinkTime: null,
    blinkCount: 0,
    sessionStartTime: new Date()
  }

  private config: FaceRecognitionConfig = {
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
    blinkThreshold: 0.3,
    autoModeSpeed: 3000,
    blinkSensitivity: 0.5
  }

  private blinkEvents: BlinkEvent[] = []
  private isBlinking = false
  private blinkStartTime: Date | null = null

  /**
   * Get current face recognition state
   */
  getState(): FaceRecognitionState {
    return { ...this.state }
  }

  /**
   * Update face detection state
   */
  updateDetection(isDetected: boolean, confidence: number): void {
    this.state.isDetected = isDetected
    this.state.confidence = confidence
  }

  /**
   * Update eye state
   */
  updateEyeState(eyeState: EyeState): void {
    this.state.eyeState = eyeState
    this.detectBlink(eyeState)
  }

  /**
   * Update face landmarks
   */
  updateLandmarks(landmarks: any[]): void {
    this.state.landmarks = landmarks.map(landmark => ({
      x: landmark.x,
      y: landmark.y,
      z: landmark.z,
      visibility: landmark.visibility
    }))
  }

  /**
   * Start face recognition session
   */
  startSession(): void {
    this.state.isActive = true
    this.state.sessionStartTime = new Date()
    this.state.blinkCount = 0
    this.blinkEvents = []
  }

  /**
   * Stop face recognition session
   */
  stopSession(): void {
    this.state.isActive = false
    this.state.isDetected = false
    this.state.confidence = 0
    this.state.landmarks = []
    this.blinkEvents = []
  }

  /**
   * Check if user is currently blinking
   */
  isUserBlinking(): boolean {
    return this.isBlinking
  }

  /**
   * Get blink count for current session
   */
  getBlinkCount(): number {
    return this.state.blinkCount
  }

  /**
   * Get recent blink events
   */
  getRecentBlinks(limit: number = 10): BlinkEvent[] {
    return this.blinkEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Check if user has blinked for specified duration
   */
  hasBlinkedFor(duration: number): boolean {
    if (!this.state.lastBlinkTime) return false
    
    const now = new Date()
    const blinkDuration = now.getTime() - this.state.lastBlinkTime.getTime()
    
    return blinkDuration >= duration
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    sessionDuration: number
    totalBlinks: number
    averageBlinkDuration: number
    blinkRate: number // blinks per minute
  } {
    const now = new Date()
    const sessionDuration = now.getTime() - this.state.sessionStartTime.getTime()
    const sessionMinutes = sessionDuration / (1000 * 60)
    
    const totalBlinks = this.state.blinkCount
    const averageBlinkDuration = this.blinkEvents.length > 0
      ? this.blinkEvents.reduce((sum, event) => sum + event.duration, 0) / this.blinkEvents.length
      : 0
    
    const blinkRate = sessionMinutes > 0 ? totalBlinks / sessionMinutes : 0

    return {
      sessionDuration,
      totalBlinks,
      averageBlinkDuration,
      blinkRate
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<FaceRecognitionConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get current configuration
   */
  getConfig(): FaceRecognitionConfig {
    return { ...this.config }
  }

  /**
   * Detect blink from eye state
   */
  private detectBlink(eyeState: EyeState): void {
    const bothEyesClosed = !eyeState.left && !eyeState.right
    const now = new Date()

    if (bothEyesClosed && !this.isBlinking) {
      // Blink started
      this.isBlinking = true
      this.blinkStartTime = now
    } else if (!bothEyesClosed && this.isBlinking) {
      // Blink ended
      this.isBlinking = false
      
      if (this.blinkStartTime) {
        const blinkDuration = now.getTime() - this.blinkStartTime.getTime()
        
        // Only count as blink if duration is within reasonable range
        if (blinkDuration >= 100 && blinkDuration <= 2000) {
          this.state.blinkCount++
          this.state.lastBlinkTime = now
          
          const blinkEvent: BlinkEvent = {
            timestamp: now,
            duration: blinkDuration,
            eyeState: { ...eyeState },
            confidence: eyeState.confidence
          }
          
          this.blinkEvents.push(blinkEvent)
          
          // Keep only last 100 blink events
          if (this.blinkEvents.length > 100) {
            this.blinkEvents = this.blinkEvents.slice(-100)
          }
        }
      }
    }
  }

  /**
   * Reset session data
   */
  resetSession(): void {
    this.state.blinkCount = 0
    this.state.lastBlinkTime = null
    this.blinkEvents = []
    this.isBlinking = false
    this.blinkStartTime = null
  }
}
