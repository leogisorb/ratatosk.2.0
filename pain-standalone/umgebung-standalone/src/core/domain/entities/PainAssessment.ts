/**
 * Pain Assessment Domain Entity
 * Represents a pain assessment in the system
 */
export interface PainAssessment {
  id: string
  userId: string
  location: PainLocation
  intensity: PainIntensity
  description?: string
  timestamp: Date
  sessionId: string
}

export interface PainLocation {
  id: string
  name: string
  category: PainCategory
  subCategory?: string
  bodyPart: BodyPart
}

export type PainCategory = 'head' | 'torso' | 'arms' | 'legs' | 'general'

export type BodyPart = 
  | 'forehead' | 'back_of_head' | 'temple' | 'ear' | 'eye' | 'sinus'
  | 'nose' | 'mouth' | 'jaw' | 'neck' | 'throat' | 'esophagus'
  | 'heart' | 'chest' | 'shoulder' | 'lung' | 'stomach' | 'bladder' | 'hip'
  | 'shoulder_blade' | 'spine' | 'toes' | 'ball_of_foot' | 'top_of_foot'
  | 'ankle' | 'lower_leg' | 'knee' | 'thigh' | 'genital_organ'
  | 'fingers' | 'hand' | 'wrist' | 'forearm' | 'elbow' | 'upper_arm'

export interface PainIntensity {
  level: number // 0-10 scale
  description: string
  affectsSleep: boolean
  affectsMobility: boolean
  affectsDailyActivities: boolean
}
