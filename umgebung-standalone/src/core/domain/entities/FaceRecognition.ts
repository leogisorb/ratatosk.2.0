/**
 * Face Recognition Domain Entity
 * Represents face recognition state and eye tracking data
 */
export interface FaceRecognitionState {
  isActive: boolean
  isDetected: boolean
  confidence: number
  eyeState: EyeState
  landmarks: FaceLandmarks[]
  lastBlinkTime: Date | null
  blinkCount: number
  sessionStartTime: Date
}

export interface EyeState {
  left: boolean // true = open, false = closed
  right: boolean
  confidence: number
  blinkDuration: number // in milliseconds
}

export interface FaceLandmarks {
  x: number
  y: number
  z: number
  visibility?: number
}

export interface BlinkEvent {
  timestamp: Date
  duration: number
  eyeState: EyeState
  confidence: number
}

export interface FaceRecognitionConfig {
  maxNumFaces: number
  refineLandmarks: boolean
  minDetectionConfidence: number
  minTrackingConfidence: number
  blinkThreshold: number
  autoModeSpeed: number
  blinkSensitivity: number
}
