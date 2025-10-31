import type { PainRecord, PainSession, BodyPart } from '../../../core/domain/entities/PainRecord'
import { uiIdToDomainId } from '../data/painAssessmentMapping'

/**
 * Pain Assessment Service
 * Handles pain assessment business logic
 * 
 * Note: When recording pain with UI IDs (from painAssessmentData.ts),
 * use recordPainWithUiId() which automatically converts UI IDs to Domain IDs
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
   * Record a pain assessment with domain ID (e.g., 'forehead', 'back_of_head')
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
   * ✅ Record a pain assessment with UI ID (e.g., 'stirn', 'hinterkopf')
   * Automatically converts UI ID to Domain ID using the mapping table
   */
  recordPainWithUiId(
    uiBodyPartId: string,
    painLevel: number,
    userId: string,
    description?: string,
    affectsSleep?: boolean,
    affectsMobility?: boolean,
    affectsDailyActivities?: boolean
  ): PainRecord {
    // Convert UI ID to Domain ID
    const domainId = uiIdToDomainId(uiBodyPartId)
    
    // Record with domain ID
    return this.recordPain(
      domainId,
      painLevel,
      userId,
      description,
      affectsSleep,
      affectsMobility,
      affectsDailyActivities
    )
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

    // ✅ Verbesserte Berechnung: Durchschnitt statt Summe für "most painful body part"
    const bodyPartPain = userRecords.reduce((acc, record) => {
      if (!acc[record.bodyPart]) {
        acc[record.bodyPart] = { total: 0, count: 0 }
      }
      acc[record.bodyPart].total += record.painLevel
      acc[record.bodyPart].count += 1
      return acc
    }, {} as Record<string, { total: number; count: number }>)

    // Berechne Durchschnitte und finde das schmerzhafteste Körperteil
    const bodyPartAverages = Object.entries(bodyPartPain).map(([bodyPart, stats]) => ({
      bodyPart,
      average: stats.total / stats.count
    }))

    const mostPainfulBodyPart = bodyPartAverages
      .sort((a, b) => b.average - a.average)[0]?.bodyPart || ''

    // ✅ Verbesserte Trend-Berechnung mit zeitlichen Abständen
    const recentRecords = userRecords.slice(-5)
    const recentTrend = this.calculateTrendWithTime(
      recentRecords.map(r => ({ painLevel: r.painLevel, timestamp: r.timestamp }))
    )

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

  // ✅ Alte calculateTrend Methode (behalten für Rückwärtskompatibilität)
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

  // ✅ Neue verbesserte Trend-Berechnung mit Median und zeitlichen Abständen
  private calculateTrendWithTime(
    records: Array<{ painLevel: number; timestamp: Date }>
  ): 'increasing' | 'decreasing' | 'stable' {
    if (records.length < 2) return 'stable'

    // Sortiere nach Zeitstempel (älteste zuerst)
    const sortedRecords = [...records].sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    )

    // Teile in zwei Hälften
    const midpoint = Math.floor(sortedRecords.length / 2)
    const firstHalf = sortedRecords.slice(0, midpoint)
    const secondHalf = sortedRecords.slice(midpoint)

    // ✅ Verwende Median statt Durchschnitt (robuster gegen Ausreißer)
    const firstMedian = this.calculateMedian(firstHalf.map(r => r.painLevel))
    const secondMedian = this.calculateMedian(secondHalf.map(r => r.painLevel))

    // ✅ Berücksichtige zeitliche Abstände (gewichteter Trend)
    const timeSpan = sortedRecords[sortedRecords.length - 1].timestamp.getTime() - 
                     sortedRecords[0].timestamp.getTime()
    const daysDiff = timeSpan / (1000 * 60 * 60 * 24) // Konvertiere zu Tagen

    // Wenn weniger als 1 Tag zwischen den Daten, verwende normalen Threshold
    // Wenn mehr, passe Threshold an (Trend ist signifikanter über längere Zeit)
    const threshold = daysDiff < 1 ? 0.5 : 0.3

    const difference = secondMedian - firstMedian

    if (difference > threshold) return 'increasing'
    if (difference < -threshold) return 'decreasing'
    return 'stable'
  }

  // ✅ Helper: Median-Berechnung
  private calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0
    
    const sorted = [...numbers].sort((a, b) => a - b)
    const midpoint = Math.floor(sorted.length / 2)
    
    if (sorted.length % 2 === 0) {
      return (sorted[midpoint - 1] + sorted[midpoint]) / 2
    } else {
      return sorted[midpoint]
    }
  }

  // ✅ Verbesserte ID-Generierung mit UUID (kollisionssicher)
  private generateSessionId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID()
    }
    // Fallback für ältere Browser
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateRecordId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID()
    }
    // Fallback für ältere Browser
    return `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 9)}`
  }
}
