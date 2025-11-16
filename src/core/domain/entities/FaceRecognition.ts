/**
 * Face Recognition Domain Entity
 * Represents face recognition state and eye tracking data
 */
import type { Confidence, AutoModeSpeed, BlinkSensitivity } from '../types/Branded'

export interface FaceRecognitionState {
  isActive: boolean
  isDetected: boolean
  confidence: Confidence // 0-1 range
  eyeState: EyeState
  landmarks: FaceLandmarks[]
  lastBlinkTime: number | null // Unix timestamp in milliseconds
  blinkCount: number
  sessionStartTime: number // Unix timestamp in milliseconds
}

export interface EyeState {
  left: boolean // true = open, false = closed
  right: boolean
  confidence: Confidence // 0-1 range
  blinkDuration: number // in milliseconds
}

export interface FaceLandmarks {
  x: number
  y: number
  z: number
  visibility: number // 0-1, always present, 0 if not detected
}

export interface BlinkEvent {
  timestamp: number // Unix timestamp in milliseconds
  duration: number // in milliseconds
  eyeState: EyeState
  confidence: Confidence // 0-1 range
}

export interface FaceRecognitionConfig {
  maxNumFaces: number // min: 1, max: 10
  refineLandmarks: boolean
  minDetectionConfidence: Confidence // 0-1 range
  minTrackingConfidence: Confidence // 0-1 range
  blinkThreshold: Confidence // 0-1 range
  autoModeSpeed: AutoModeSpeed // 1-10 range
  blinkSensitivity: BlinkSensitivity // 0-1 range
}
