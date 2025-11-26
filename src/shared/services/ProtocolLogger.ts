/**
 * ProtocolLogger - Protokolliert Confirmation-Texte und Warngeräusche
 * Speichert alle Events in sessionStorage für PDF-Export
 */

export interface ProtocolEntry {
  id: string
  timestamp: number
  type: 'confirmation' | 'warning'
  text: string
  dialogName?: string
}

const STORAGE_KEY = 'ratatosk-protocol'
const MAX_ENTRIES = 1000 // Begrenze auf 1000 Einträge

class ProtocolLogger {
  private entries: ProtocolEntry[] = []

  constructor() {
    this.loadEntries()
  }

  /**
   * Lädt Einträge aus sessionStorage
   */
  private loadEntries(): void {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        this.entries = JSON.parse(stored)
      }
    } catch (error) {
      console.warn('ProtocolLogger: Failed to load entries from sessionStorage', error)
      this.entries = []
    }
  }

  /**
   * Speichert Einträge in sessionStorage
   */
  private saveEntries(): void {
    try {
      // Begrenze auf MAX_ENTRIES (älteste zuerst entfernen)
      if (this.entries.length > MAX_ENTRIES) {
        this.entries = this.entries.slice(-MAX_ENTRIES)
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries))
    } catch (error) {
      console.warn('ProtocolLogger: Failed to save entries to sessionStorage', error)
    }
  }

  /**
   * Loggt einen Confirmation-Text
   */
  logConfirmation(text: string, dialogName?: string): void {
    const entry: ProtocolEntry = {
      id: `confirmation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: 'confirmation',
      text,
      dialogName
    }
    
    this.entries.push(entry)
    this.saveEntries()
    
    console.log('ProtocolLogger: Confirmation logged', entry)
  }

  /**
   * Loggt ein Warngeräusch-Event
   */
  logWarning(action: 'started' | 'stopped'): void {
    const text = action === 'started' 
      ? 'Warngeräusch wurde ausgelöst'
      : 'Warngeräusch wurde gestoppt'
    
    const entry: ProtocolEntry = {
      id: `warning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: 'warning',
      text
    }
    
    this.entries.push(entry)
    this.saveEntries()
    
    console.log('ProtocolLogger: Warning logged', entry)
  }

  /**
   * Gibt alle Einträge zurück
   */
  getEntries(): ProtocolEntry[] {
    return [...this.entries] // Kopie zurückgeben
  }

  /**
   * Gibt Einträge gefiltert nach Typ zurück
   */
  getEntriesByType(type: ProtocolEntry['type']): ProtocolEntry[] {
    return this.entries.filter(entry => entry.type === type)
  }

  /**
   * Löscht alle Einträge
   */
  clearEntries(): void {
    this.entries = []
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn('ProtocolLogger: Failed to clear entries from sessionStorage', error)
    }
    console.log('ProtocolLogger: All entries cleared')
  }

  /**
   * Gibt die Anzahl der Einträge zurück
   */
  getEntryCount(): number {
    return this.entries.length
  }
}

// Singleton-Instanz
export const protocolLogger = new ProtocolLogger()

