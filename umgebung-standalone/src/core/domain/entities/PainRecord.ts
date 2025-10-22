/**
 * Pain Record Domain Entity
 * Represents a pain assessment record in the Ratatosk system
 */
export interface PainRecord {
  id: string
  userId: string
  bodyPart: string
  painLevel: number // 1-10 scale
  description?: string
  timestamp: Date
  sessionId: string
  affectsSleep?: boolean
  affectsMobility?: boolean
  affectsDailyActivities?: boolean
}

export interface PainSession {
  id: string
  userId: string
  startTime: Date
  endTime?: Date
  records: PainRecord[]
  totalRecords: number
  averagePainLevel: number
  maxPainLevel: number
  minPainLevel: number
}

export interface BodyPart {
  id: string
  name: string
  category: 'head' | 'torso' | 'arms' | 'legs'
  subCategory?: string
  icon: string
  description?: string
}
