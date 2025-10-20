/**
 * User Domain Entity
 * Represents a user in the system with their preferences and settings
 */
export interface User {
  id: string
  name: string
  preferences: UserPreferences
  accessibility: AccessibilitySettings
  createdAt: Date
  updatedAt: Date
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: string
  soundEnabled: boolean
  voiceEnabled: boolean
  autoModeSpeed: number
  blinkSensitivity: number
}

export interface AccessibilitySettings {
  highContrast: boolean
  largeText: boolean
  reducedMotion: boolean
  keyboardLayout: 'alphabetical' | 'qwertz' | 'frequency'
}
