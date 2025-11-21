/**
 * Event-Konstanten
 * Eliminiert Magic Strings im gesamten Codebase
 */

export const EVENTS = {
  /**
   * Face Recognition Events
   */
  FACE_BLINK_DETECTED: 'faceBlinkDetected',
  FACE_SINGLE_EYE_BLINK_DETECTED: 'faceSingleEyeBlinkDetected',
  
  /**
   * Input Events
   */
  INPUT_SELECT: 'inputSelect',
  INPUT_CANCEL: 'inputCancel',
  
  /**
   * TTS Events
   */
  TTS_START: 'ttsStart',
  TTS_END: 'ttsEnd',
  TTS_ERROR: 'ttsError',
  TTS_CANCEL: 'ttsCancel',
  
  /**
   * Navigation Events
   */
  NAVIGATION_START: 'navigationStart',
  NAVIGATION_END: 'navigationEnd',
  
  /**
   * Dialog Events
   */
  DIALOG_OPEN: 'dialogOpen',
  DIALOG_CLOSE: 'dialogClose',
  
  /**
   * AutoMode Events
   */
  AUTO_MODE_START: 'autoModeStart',
  AUTO_MODE_STOP: 'autoModeStop',
  AUTO_MODE_CYCLE: 'autoModeCycle',
} as const

/**
 * Typisierte Event-Namen
 */
export type EventName = typeof EVENTS[keyof typeof EVENTS]

/**
 * Event-Detail-Typen für Custom Events
 */
export interface FaceBlinkDetectedDetail {
  source?: string
  timestamp?: number
  confidence?: number
}

export interface FaceSingleEyeBlinkDetectedDetail {
  eye: 'left' | 'right'
  source?: string
  timestamp?: number
}

export interface InputSelectDetail {
  type: 'blink' | 'click' | 'touch' | 'voice' | 'gesture'
  timestamp: number
  source?: string
  data?: any
}

