import type { UserSettings } from '../../../shared/types/index'

/**
 * Default Settings - Single Source of Truth
 * Alle Standardwerte für UserSettings werden hier zentral definiert
 */
export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  keyboardLayout: 'alphabetical',
  blinkDuration: 2,
  blinkSpeed: 2,
  autoModeSpeed: 3000, // 3 Sekunden in Millisekunden
  blinkSensitivity: 0.7, // 0.7 Sekunden
  soundEnabled: true,
  voiceEnabled: true, // TTS aktiviert
  // Neue Einstellungen
  leuchtdauer: 3, // 3 Sekunden
  blinzeldauer: 0.7, // 0.7 Sekunden - wie lange man blinzeln muss
  farbmodus: 'neutral', // neutral color mode
  kamera: 'back', // back camera
  cameraBrightness: 50, // camera brightness 0-100 (default: 50)
  cameraZoom: 1, // camera zoom 1-10 (default: 1)
  accessibility: {
    highContrast: false,
    largeText: false,
    reducedMotion: false
  }
} as const

/**
 * Storage Key für localStorage
 */
export const STORAGE_KEY = 'ratatosk-settings'

/**
 * Theme-Konstanten für Type Safety
 */
export const THEMES = ['light', 'dark', 'auto'] as const
export type Theme = typeof THEMES[number]

