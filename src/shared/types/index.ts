// Communication Types
export interface Message {
  id: string
  text: string
  timestamp: Date
  type: 'user' | 'system' | 'quick'
}

export interface QuickMessage {
  id: string
  text: string
  category: 'greeting' | 'pain' | 'need' | 'feeling'
  icon?: string
}

// Pain Assessment Types
export interface PainLocation {
  id: string
  name: string
  category: 'head' | 'torso' | 'arms' | 'legs'
  subCategory: string
  icon: string
}

export interface PainAssessment {
  id: string
  location: PainLocation
  intensity: number // 0-10
  description?: string
  timestamp: Date
}

// Settings Types
export interface UserSettings {
  theme: 'light' | 'dark' | 'auto'
  keyboardLayout: 'alphabetical' | 'qwertz' | 'frequency'
  blinkDuration: number // in seconds
  blinkSpeed: number // in seconds
  autoModeSpeed: number // in milliseconds (default: 3000)
  blinkSensitivity: number // in seconds (default: 0.5)
  soundEnabled: boolean
  voiceEnabled: boolean // TTS aktiviert
  // Neue Einstellungen
  leuchtdauer?: number // in seconds (default: 3) - deprecated, use zeigezeit
  blinzeldauer?: number // in seconds (default: 0.7) - deprecated, use empfindlichkeit
  zeigezeit?: number // in seconds (default: 3) - neue Bezeichnung für "Leuchtdauer"
  empfindlichkeit?: number // in seconds (default: 0.7) - neue Bezeichnung für "Blinzeldauer"
  farbmodus: string // color mode (default: 'neutral')
  kamera: string // camera setting (default: 'back')
  cameraBrightness: number // camera brightness 0-100 (default: 50)
  cameraZoom: number // camera zoom 1-10 (default: 1)
  accessibility: {
    highContrast: boolean
    largeText: boolean
    reducedMotion: boolean
  }
}

// Face Recognition Types
export interface FaceLandmarks {
  x: number
  y: number
  z: number
}

export interface EyeState {
  left: boolean // true = open, false = closed
  right: boolean
  confidence: number
}

export interface FaceRecognitionState {
  isDetected: boolean
  eyes: EyeState
  landmarks: FaceLandmarks[]
  confidence: number
}

// Navigation Types
export interface MenuItem {
  id: string
  title: string
  icon: string
  route: string
  category: 'main' | 'communication' | 'pain' | 'settings'
  requiresFaceRecognition?: boolean
}

// Audio Types
export interface AudioSettings {
  volume: number
  enabled: boolean
  soundEffects: {
    bell: string
    notification: string
    confirm: string
  }
}

// App State Types
export interface AppState {
  currentMenu: string
  isFaceRecognitionActive: boolean
  isAudioPlaying: boolean
  lastActivity: Date
  sessionStart: Date
}

// Error Types
export interface AppError {
  id: string
  message: string
  type: 'face_recognition' | 'audio' | 'camera' | 'network' | 'general'
  timestamp: Date
  resolved: boolean
}

// Analytics Types
export interface UsageAnalytics {
  sessionDuration: number
  messagesSent: number
  painAssessments: number
  faceRecognitionAccuracy: number
  errors: AppError[]
}

// All types are already exported above with their interface declarations 