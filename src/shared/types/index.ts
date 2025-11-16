/**
 * Shared Types Barrel Export
 * Re-exports types from Domain Entities for convenience
 * 
 * NOTE: Domain Entities in core/domain/entities/ are the Single Source of Truth
 * This file only re-exports them for easier imports
 */

// Re-export Message types from Domain Entity
export type {
  Message,
  UserMessage,
  SystemMessage,
  QuickMessage,
  PainAssessmentMessage,
  MessageType,
  MessageCategory,
  QuickMessageMetadata,
  UserMessageMetadata,
  SystemMessageMetadata,
  PainAssessmentMessageMetadata
} from '../../core/domain/entities/Message'

// Re-export Face Recognition types from Domain Entity
export type {
  FaceRecognitionState,
  EyeState,
  FaceLandmarks,
  BlinkEvent,
  FaceRecognitionConfig
} from '../../core/domain/entities/FaceRecognition'

// Re-export User types from Domain Entity
export type {
  User,
  UserPreferences,
  AccessibilitySettings,
  SupportedLanguage
} from '../../core/domain/entities/User'

// Re-export Pain Assessment types from Domain Entity
export type {
  PainAssessment,
  PainLocation,
  PainIntensity
} from '../../core/domain/entities/PainAssessment'

// Re-export Pain Record types from Domain Entity
export type {
  PainRecord,
  PainSession,
  PainSessionStats
} from '../../core/domain/entities/PainRecord'

// Re-export BodyPart types
export type {
  BodyPartId,
  PainCategory,
  BodyPartInfo
} from '../../core/domain/types/BodyPart'

// Re-export Branded types
export type {
  UserId,
  SessionId,
  MessageId,
  PainAssessmentId,
  PainRecordId,
  Confidence,
  Percentage,
  PainLevel,
  AutoModeSpeed,
  BlinkSensitivity
} from '../../core/domain/types/Branded'

// Legacy UserSettings interface for backwards compatibility with stores
// TODO: Migrate stores to use UserPreferences from User entity
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
  leuchtdauer: number // in seconds (default: 3)
  blinzeldauer: number // in seconds (default: 0.7) - wie lange man blinzeln muss
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

// ============================================
// UNUSED TYPES (removed - not used anywhere)
// ============================================
// The following types were removed as they are not used:
// - MenuItem (use CarouselItem from navigation/config/carouselConfig.ts)
// - AudioSettings (not implemented)
// - AppState (not implemented)
// - AppError (not implemented)
// - UsageAnalytics (not implemented) 