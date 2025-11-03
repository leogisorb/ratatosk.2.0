/**
 * Service für Tastendesign-Einstellungen
 * Architektur-konforme Verwaltung der Tastatur-Designs
 */

export interface KeyboardDesignSettings {
  keyWidth: number
  keyHeight: number
  fontSize: number
  borderRadius: number
  // Farben für aktive Tasten
  activeKeyBackground: string
  activeKeyBorder: string
  activeKeyText: string
  // Farben für spezielle Tasten
  spaceKeyBackground: string
  spaceKeyBorder: string
  deleteKeyBackground: string
  deleteKeyBorder: string
  backKeyBackground: string
  backKeyBorder: string
}

export class KeyboardDesignService {
  private static readonly STORAGE_KEY = 'keyboard-design-settings'
  
  /**
   * Lädt die gespeicherten Tastendesign-Einstellungen
   */
  static loadSettings(): KeyboardDesignSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
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
      borderRadius: 8,
      // Standard-Farben
      activeKeyBackground: 'white', // dark green
      activeKeyBorder: '#004D40',     // darker green
      activeKeyText: '#ffffff',       // white
      spaceKeyBackground: '#ef4444',  // red-500
      spaceKeyBorder: '#dc2626',     // red-600
      deleteKeyBackground: '#f97316', // orange-500
      deleteKeyBorder: '#ea580c',     // orange-600
      backKeyBackground: '#ef4444',   // red-500
      backKeyBorder: '#dc2626'        // red-600
    }
  }
  
  /**
   * Speichert die Tastendesign-Einstellungen
   */
  static saveSettings(settings: KeyboardDesignSettings): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings))
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
      borderRadius: 8,
      // Standard-Farben
      activeKeyBackground: '#00796B', // dark green
      activeKeyBorder: '#004D40',     // darker green
      activeKeyText: '#ffffff',       // white
      spaceKeyBackground: '#ef4444',  // red-500
      spaceKeyBorder: '#dc2626',     // red-600
      deleteKeyBackground: '#f97316', // orange-500
      deleteKeyBorder: '#ea580c',     // orange-600
      backKeyBackground: '#ef4444',   // red-500
      backKeyBorder: '#dc2626'        // red-600
    }
    this.saveSettings(defaultSettings)
    return defaultSettings
  }
}
