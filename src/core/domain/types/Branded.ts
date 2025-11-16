/**
 * Branded Types for Type Safety
 * Prevents mixing of different types that have the same underlying type
 */

// ID Types
export type UserId = string & { readonly __brand: 'UserId' }
export type SessionId = string & { readonly __brand: 'SessionId' }
export type MessageId = string & { readonly __brand: 'MessageId' }
export type PainAssessmentId = string & { readonly __brand: 'PainAssessmentId' }
export type PainRecordId = string & { readonly __brand: 'PainRecordId' }

// Value Types
export type Confidence = number & { readonly __brand: 'Confidence' } // 0-1 range
export type Percentage = number & { readonly __brand: 'Percentage' } // 0-100 range
export type PainLevel = number & { readonly __brand: 'PainLevel' } // 0-10 scale
export type AutoModeSpeed = number & { readonly __brand: 'AutoModeSpeed' } // 1-10 range
export type BlinkSensitivity = number & { readonly __brand: 'BlinkSensitivity' } // 0-1 range

// Helper functions to create branded types with validation
export function createConfidence(value: number): Confidence {
  if (value < 0 || value > 1) {
    throw new Error(`Confidence must be between 0 and 1, got ${value}`)
  }
  return value as Confidence
}

export function createPercentage(value: number): Percentage {
  if (value < 0 || value > 100) {
    throw new Error(`Percentage must be between 0 and 100, got ${value}`)
  }
  return value as Percentage
}

export function createPainLevel(value: number): PainLevel {
  if (value < 0 || value > 10) {
    throw new Error(`PainLevel must be between 0 and 10, got ${value}`)
  }
  return value as PainLevel
}

export function createAutoModeSpeed(value: number): AutoModeSpeed {
  if (value < 1 || value > 10) {
    throw new Error(`AutoModeSpeed must be between 1 and 10, got ${value}`)
  }
  return value as AutoModeSpeed
}

export function createBlinkSensitivity(value: number): BlinkSensitivity {
  if (value < 0 || value > 1) {
    throw new Error(`BlinkSensitivity must be between 0 and 1, got ${value}`)
  }
  return value as BlinkSensitivity
}

// ID creation helpers (optional, for consistency)
export function createUserId(id: string): UserId {
  return id as UserId
}

export function createSessionId(id: string): SessionId {
  return id as SessionId
}

export function createMessageId(id: string): MessageId {
  return id as MessageId
}

export function createPainAssessmentId(id: string): PainAssessmentId {
  return id as PainAssessmentId
}

export function createPainRecordId(id: string): PainRecordId {
  return id as PainRecordId
}

