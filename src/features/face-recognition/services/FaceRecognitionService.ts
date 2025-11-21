import type { 
  FaceRecognitionState, 
  FaceRecognitionConfig, 
  BlinkEvent,
  EyeState 
} from '../../../core/domain/entities/FaceRecognition'
import { 
  createConfidence, 
  createAutoModeSpeed, 
  createBlinkSensitivity 
} from '../../../core/domain/types/Branded'

/**
 * Face Recognition Service
 * Handles face recognition and eye tracking business logic
 */
export class FaceRecognitionService {
  private state: FaceRecognitionState = {
    isActive: false,
    isDetected: false,
    confidence: createConfidence(0),
    eyeState: { left: true, right: true, confidence: createConfidence(0), blinkDuration: 0 },
    landmarks: [],
    lastBlinkTime: null,
    blinkCount: 0,
    sessionStartTime: Date.now() // Unix timestamp in milliseconds
  }

  private config: FaceRecognitionConfig = {
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: createConfidence(0.5),
    minTrackingConfidence: createConfidence(0.5),
    blinkThreshold: createConfidence(0.3),
    autoModeSpeed: createAutoModeSpeed(3), // 1-10 range, 3 is middle
    blinkSensitivity: createBlinkSensitivity(0.5)
  }

  private blinkEvents: BlinkEvent[] = []
  private isBlinking = false
  private blinkStartTime: number | null = null // Unix timestamp in milliseconds

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
    this.state.confidence = createConfidence(confidence)
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
    this.state.sessionStartTime = Date.now() // Unix timestamp in milliseconds
    this.state.blinkCount = 0
    this.blinkEvents = []
  }

  /**
   * Stop face recognition session
   */
  stopSession(): void {
    this.state.isActive = false
    this.state.isDetected = false
    this.state.confidence = createConfidence(0)
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
      .sort((a, b) => b.timestamp - a.timestamp) // timestamp is already number
      .slice(0, limit)
  }

  /**
   * Check if user has blinked for specified duration
   */
  hasBlinkedFor(duration: number): boolean {
    if (!this.state.lastBlinkTime) return false
    
    const now = Date.now() // Unix timestamp in milliseconds
    const blinkDuration = now - this.state.lastBlinkTime
    
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
    const now = Date.now() // Unix timestamp in milliseconds
    const sessionDuration = now - this.state.sessionStartTime
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
    const now = Date.now() // Unix timestamp in milliseconds

    if (bothEyesClosed && !this.isBlinking) {
      // Blinzeln gestartet
      this.isBlinking = true
      this.blinkStartTime = now
    } else if (!bothEyesClosed && this.isBlinking) {
      // Blinzeln beendet
      this.isBlinking = false
      
      if (this.blinkStartTime) {
        const blinkDuration = now - this.blinkStartTime
        
        // Zähle nur als Blinzeln wenn Dauer im vernünftigen Bereich liegt
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
          
          // Behalte nur die letzten 100 Blinzel-Ereignisse
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
