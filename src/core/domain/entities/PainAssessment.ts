/**
 * Pain Assessment Domain Entity
 * Represents a pain assessment in the system
 */
import type { PainAssessmentId, UserId, SessionId, PainLevel } from '../types/Branded'
import type { BodyPartId, PainCategory, BodyPartInfo } from '../types/BodyPart'

export interface PainAssessment {
  readonly id: PainAssessmentId
  readonly userId: UserId
  location: PainLocation
  intensity: PainIntensity
  description?: string
  readonly timestamp: number // Unix timestamp in milliseconds
  readonly sessionId: SessionId
}

export interface PainLocation {
  readonly id: string
  name: string
  category: PainCategory
  subCategory?: string
  bodyPart: BodyPartId // Use shared BodyPartId type
}

export interface PainIntensity {
  level: PainLevel // 0-10 scale, branded type
  description: string
  affectsSleep: boolean
  affectsMobility: boolean
  affectsDailyActivities: boolean
}

// Re-export types from BodyPart for convenience
export type { BodyPartId, PainCategory, BodyPartInfo } from '../types/BodyPart'
