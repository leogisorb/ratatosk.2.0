/**
 * Pain Record Domain Entity
 * Represents a pain assessment record in the Ratatosk system
 */
import type { PainRecordId, UserId, SessionId, PainLevel } from '../types/Branded'
import type { BodyPartId } from '../types/BodyPart'

export interface PainRecord {
  readonly id: PainRecordId
  readonly userId: UserId
  location: BodyPartId // Use shared BodyPartId type (consistent with PainAssessment)
  painLevel: PainLevel // 0-10 scale, branded type
  description?: string
  readonly timestamp: number // Unix timestamp in milliseconds
  readonly sessionId: SessionId
  affectsSleep: boolean // Always present, defaults to false
  affectsMobility: boolean // Always present, defaults to false
  affectsDailyActivities: boolean // Always present, defaults to false
}

export interface PainSession {
  readonly id: SessionId
  readonly userId: UserId
  readonly startTime: number // Unix timestamp in milliseconds
  endTime?: number // Unix timestamp in milliseconds
  records: PainRecord[]
  // Calculated fields removed - use calculatePainStats() utility function instead
}

/**
 * Pain statistics calculated from session records
 * Use calculatePainStats() to compute these values
 */
export interface PainSessionStats {
  totalRecords: number
  averagePainLevel: number
  maxPainLevel: number
  minPainLevel: number
}

/**
 * Calculate pain statistics from a session
 * Single source of truth for computed values
 */
export function calculatePainStats(session: PainSession): PainSessionStats {
  if (session.records.length === 0) {
    return {
      totalRecords: 0,
      averagePainLevel: 0,
      maxPainLevel: 0,
      minPainLevel: 0
    }
  }

  const painLevels = session.records.map(r => r.painLevel as number)
  const sum = painLevels.reduce((acc, val) => acc + val, 0)

  return {
    totalRecords: session.records.length,
    averagePainLevel: sum / painLevels.length,
    maxPainLevel: Math.max(...painLevels),
    minPainLevel: Math.min(...painLevels)
  }
}

// Re-export BodyPartInfo from shared types (renamed from BodyPart interface)
export type { BodyPartInfo } from '../types/BodyPart'
