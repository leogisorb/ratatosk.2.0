/**
 * Service für Tastendesign-Einstellungen
 * Architektur-konforme Verwaltung der Tastatur-Designs
 */

export interface KeyboardDesignSettings {
  keyWidth: number
  keyHeight: number
  fontSize: number
  borderRadius: number
}

export class KeyboardDesignService {
  private static readonly STORAGE_KEY = 'keyboard-design-settings'
  
  /**
   * Lädt die gespeicherten Tastendesign-Einstellungen (gerätespezifisch)
   */
  static loadSettings(): KeyboardDesignSettings {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load keyboard design settings:', error)
    }
    
    // Standard-Einstellungen
    return {
      keyWidth: 150,
      keyHeight: 60,
      fontSize: 24,
      borderRadius: 8
    }
  }
  
  /**
   * Speichert die Tastendesign-Einstellungen (gerätespezifisch)
   */
  static saveSettings(settings: KeyboardDesignSettings): void {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save keyboard design settings:', error)
    }
  }
  
  /**
   * Setzt die Einstellungen auf Standard zurück
   */
  static resetToDefault(): KeyboardDesignSettings {
    const defaultSettings = {
      keyWidth: 150,
      keyHeight: 60,
      fontSize: 24,
      borderRadius: 8
    }
    this.saveSettings(defaultSettings)
    return defaultSettings
  }
}
