import type { PainRecord, PainSession, BodyPart } from '../../../core/domain/entities/PainRecord'

/**
 * Pain Assessment Service
 * Handles pain assessment business logic
 */
export class PainAssessmentService {
  private painRecords: PainRecord[] = []
  private currentSession: PainSession | null = null

  /**
   * Start a new pain assessment session
   */
  startSession(userId: string): PainSession {
    const session: PainSession = {
      id: this.generateSessionId(),
      userId,
      startTime: new Date(),
      records: [],
      totalRecords: 0,
      averagePainLevel: 0,
      maxPainLevel: 0,
      minPainLevel: 10
    }
    
    this.currentSession = session
    return session
  }

  /**
   * Record a pain assessment
   */
  recordPain(
    bodyPart: string,
    painLevel: number,
    userId: string,
    description?: string,
    affectsSleep?: boolean,
    affectsMobility?: boolean,
    affectsDailyActivities?: boolean
  ): PainRecord {
    if (!this.currentSession) {
      throw new Error('No active pain session. Start a session first.')
    }

    const record: PainRecord = {
      id: this.generateRecordId(),
      userId,
      bodyPart,
      painLevel,
      description,
      timestamp: new Date(),
      sessionId: this.currentSession.id,
      affectsSleep,
      affectsMobility,
      affectsDailyActivities
    }

    this.painRecords.push(record)
    this.currentSession.records.push(record)
    this.updateSessionStats()

    return record
  }

  /**
   * Get pain records for a user
   */
  getPainRecords(userId: string): PainRecord[] {
    return this.painRecords.filter(record => record.userId === userId)
  }

  /**
   * Get current session
   */
  getCurrentSession(): PainSession | null {
    return this.currentSession
  }

  /**
   * End current session
   */
  endSession(): PainSession | null {
    if (!this.currentSession) {
      return null
    }

    this.currentSession.endTime = new Date()
    const session = this.currentSession
    this.currentSession = null
    
    return session
  }

  /**
   * Get pain statistics for a user
   */
  getPainStats(userId: string): {
    totalRecords: number
    averagePainLevel: number
    maxPainLevel: number
    minPainLevel: number
    mostPainfulBodyPart: string
    recentTrend: 'increasing' | 'decreasing' | 'stable'
  } {
    const userRecords = this.getPainRecords(userId)
    
    if (userRecords.length === 0) {
      return {
        totalRecords: 0,
        averagePainLevel: 0,
        maxPainLevel: 0,
        minPainLevel: 0,
        mostPainfulBodyPart: '',
        recentTrend: 'stable'
      }
    }

    const painLevels = userRecords.map(r => r.painLevel)
    const averagePainLevel = painLevels.reduce((sum, level) => sum + level, 0) / painLevels.length
    const maxPainLevel = Math.max(...painLevels)
    const minPainLevel = Math.min(...painLevels)

    // Find most painful body part
    const bodyPartPain = userRecords.reduce((acc, record) => {
      acc[record.bodyPart] = (acc[record.bodyPart] || 0) + record.painLevel
      return acc
    }, {} as Record<string, number>)

    const mostPainfulBodyPart = Object.entries(bodyPartPain)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || ''

    // Calculate recent trend (last 5 records)
    const recentRecords = userRecords.slice(-5)
    const recentTrend = this.calculateTrend(recentRecords.map(r => r.painLevel))

    return {
      totalRecords: userRecords.length,
      averagePainLevel: Math.round(averagePainLevel * 10) / 10,
      maxPainLevel,
      minPainLevel,
      mostPainfulBodyPart,
      recentTrend
    }
  }

  /**
   * Get predefined body parts
   */
  getBodyParts(): BodyPart[] {
    return [
      // Head
      { id: 'forehead', name: 'Stirn', category: 'head', icon: 'head.png' },
      { id: 'back_of_head', name: 'Hinterkopf', category: 'head', icon: 'head.png' },
      { id: 'temple', name: 'Schläfe', category: 'head', icon: 'head.png' },
      { id: 'ear', name: 'Ohr', category: 'head', icon: 'head.png' },
      { id: 'eye', name: 'Auge', category: 'head', icon: 'head.png' },
      { id: 'sinus', name: 'Nebenhöhlen', category: 'head', icon: 'head.png' },
      { id: 'nose', name: 'Nase', category: 'head', icon: 'head.png' },
      { id: 'mouth', name: 'Mund', category: 'head', icon: 'head.png' },
      { id: 'jaw', name: 'Kiefer', category: 'head', icon: 'head.png' },
      { id: 'neck', name: 'Nacken', category: 'head', icon: 'head.png' },
      { id: 'throat', name: 'Hals', category: 'head', icon: 'head.png' },
      { id: 'esophagus', name: 'Speiseröhre', category: 'head', icon: 'head.png' },
      
      // Torso
      { id: 'heart', name: 'Herz', category: 'torso', icon: 'torso.png' },
      { id: 'chest', name: 'Brust', category: 'torso', icon: 'torso.png' },
      { id: 'shoulder', name: 'Schulter', category: 'torso', icon: 'torso.png' },
      { id: 'lung', name: 'Lunge', category: 'torso', icon: 'torso.png' },
      { id: 'stomach', name: 'Magen', category: 'torso', icon: 'torso.png' },
      { id: 'bladder', name: 'Blase', category: 'torso', icon: 'torso.png' },
      { id: 'hip', name: 'Hüfte', category: 'torso', icon: 'torso.png' },
      { id: 'shoulder_blade', name: 'Schulterblatt', category: 'torso', icon: 'torso.png' },
      { id: 'spine', name: 'Wirbelsäule', category: 'torso', icon: 'torso.png' },
      
      // Arms
      { id: 'fingers', name: 'Finger', category: 'arms', icon: 'elbow-2.png' },
      { id: 'hand', name: 'Hand', category: 'arms', icon: 'elbow-2.png' },
      { id: 'wrist', name: 'Handgelenk', category: 'arms', icon: 'elbow-2.png' },
      { id: 'forearm', name: 'Unterarm', category: 'arms', icon: 'elbow-2.png' },
      { id: 'elbow', name: 'Ellenbogen', category: 'arms', icon: 'elbow-2.png' },
      { id: 'upper_arm', name: 'Oberarm', category: 'arms', icon: 'elbow-2.png' },
      { id: 'shoulder_arm', name: 'Schulter', category: 'arms', icon: 'elbow-2.png' },
      { id: 'armpit', name: 'Achsel', category: 'arms', icon: 'elbow-2.png' },
      
      // Legs
      { id: 'toes', name: 'Zehen', category: 'legs', icon: 'leg.png' },
      { id: 'ball_of_foot', name: 'Fußballen', category: 'legs', icon: 'leg.png' },
      { id: 'top_of_foot', name: 'Fußrücken', category: 'legs', icon: 'leg.png' },
      { id: 'ankle', name: 'Knöchel', category: 'legs', icon: 'leg.png' },
      { id: 'lower_leg', name: 'Unterschenkel', category: 'legs', icon: 'leg.png' },
      { id: 'knee', name: 'Knie', category: 'legs', icon: 'leg.png' },
      { id: 'thigh', name: 'Oberschenkel', category: 'legs', icon: 'leg.png' },
      { id: 'genital_organ', name: 'Geschlechtsorgan', category: 'legs', icon: 'leg.png' }
    ]
  }

  private updateSessionStats(): void {
    if (!this.currentSession) return

    const records = this.currentSession.records
    if (records.length === 0) return

    const painLevels = records.map(r => r.painLevel)
    this.currentSession.totalRecords = records.length
    this.currentSession.averagePainLevel = painLevels.reduce((sum, level) => sum + level, 0) / painLevels.length
    this.currentSession.maxPainLevel = Math.max(...painLevels)
    this.currentSession.minPainLevel = Math.min(...painLevels)
  }

  private calculateTrend(painLevels: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (painLevels.length < 2) return 'stable'

    const firstHalf = painLevels.slice(0, Math.floor(painLevels.length / 2))
    const secondHalf = painLevels.slice(Math.floor(painLevels.length / 2))

    const firstAvg = firstHalf.reduce((sum, level) => sum + level, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, level) => sum + level, 0) / secondHalf.length

    const difference = secondAvg - firstAvg
    const threshold = 0.5

    if (difference > threshold) return 'increasing'
    if (difference < -threshold) return 'decreasing'
    return 'stable'
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateRecordId(): string {
    return `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
