/**
 * User Domain Entity
 * Represents a user in the system with their preferences and settings
 */
import type { UserId, AutoModeSpeed, BlinkSensitivity } from '../types/Branded'

export type SupportedLanguage = 'de' | 'en' | 'fr' | 'es'

export interface User {
  readonly id: UserId
  name: string
  preferences: UserPreferences
  accessibility: AccessibilitySettings
  readonly createdAt: number // Unix timestamp in milliseconds
  updatedAt: number // Unix timestamp in milliseconds
}

export interface UserPreferences {
  theme: 'light' | 'dark'
  followSystemTheme: boolean // if true, ignore theme and use system preference
  language: SupportedLanguage // ISO language code
  soundEnabled: boolean
  voiceEnabled: boolean
  autoModeSpeed: AutoModeSpeed // 1-10 range, branded type
  blinkSensitivity: BlinkSensitivity // 0-1 range, branded type
}

/**
 * Get effective theme based on user preference and system setting
 */
export function getEffectiveTheme(preferences: UserPreferences): 'light' | 'dark' {
  if (preferences.followSystemTheme) {
    // Check system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light' // Default if system preference unavailable
  }
  return preferences.theme
}

export interface AccessibilitySettings {
  highContrast: boolean
  largeText: boolean
  reducedMotion: boolean
  keyboardLayout: 'alphabetical' | 'qwertz' | 'frequency'
}
