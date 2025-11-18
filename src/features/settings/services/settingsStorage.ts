import type { UserSettings } from '../../../shared/types/index'
import { DEFAULT_SETTINGS, STORAGE_KEY } from '../constants/defaults'

/**
 * Settings Storage Service
 * Kapselt alle sessionStorage-Operationen für Settings (gerätespezifisch)
 * Separation of Concerns: Store-Logik getrennt von Storage-Logik
 */
export class SettingsStorage {
  private static readonly KEY = STORAGE_KEY

  /**
   * Speichert Settings in sessionStorage (gerätespezifisch, nicht zwischen Geräten geteilt)
   * @param settings Die zu speichernden Settings
   */
  static save(settings: UserSettings): void {
    try {
      sessionStorage.setItem(this.KEY, JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  /**
   * Lädt Settings aus sessionStorage (gerätespezifisch, nicht zwischen Geräten geteilt)
   * @returns Die geladenen Settings oder null wenn keine vorhanden
   */
  static load(): UserSettings | null {
    try {
      const saved = sessionStorage.getItem(this.KEY)
      if (!saved) {
        return null
      }

      const parsed = JSON.parse(saved)
      
      // Validiere geladene Daten
      if (this.validateSettings(parsed)) {
        return parsed
      } else {
        console.warn('Loaded settings are invalid, using defaults')
        return null
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      return null
    }
  }

  /**
   * Validiert ob ein Objekt die Struktur von UserSettings hat
   * @param settings Das zu validierende Objekt
   * @returns true wenn valide, false sonst
   */
  private static validateSettings(settings: unknown): settings is UserSettings {
    if (typeof settings !== 'object' || settings === null) {
      return false
    }

    const s = settings as Record<string, unknown>

    // Prüfe erforderliche Felder
    if (
      typeof s.theme !== 'string' ||
      typeof s.keyboardLayout !== 'string' ||
      typeof s.blinkDuration !== 'number' ||
      typeof s.blinkSpeed !== 'number' ||
      typeof s.autoModeSpeed !== 'number' ||
      typeof s.blinkSensitivity !== 'number' ||
      typeof s.soundEnabled !== 'boolean' ||
      typeof s.voiceEnabled !== 'boolean' ||
      typeof s.leuchtdauer !== 'number' ||
      typeof s.blinzeldauer !== 'number' ||
      typeof s.farbmodus !== 'string' ||
      typeof s.kamera !== 'string' ||
      typeof s.cameraBrightness !== 'number' ||
      typeof s.cameraZoom !== 'number'
    ) {
      return false
    }

    // Prüfe accessibility Objekt
    if (
      typeof s.accessibility !== 'object' ||
      s.accessibility === null ||
      typeof (s.accessibility as Record<string, unknown>).highContrast !== 'boolean' ||
      typeof (s.accessibility as Record<string, unknown>).largeText !== 'boolean' ||
      typeof (s.accessibility as Record<string, unknown>).reducedMotion !== 'boolean'
    ) {
      return false
    }

    return true
  }

  /**
   * Löscht alle gespeicherten Settings
   */
  static clear(): void {
    try {
      sessionStorage.removeItem(this.KEY)
    } catch (error) {
      console.error('Failed to clear settings:', error)
    }
  }
}

