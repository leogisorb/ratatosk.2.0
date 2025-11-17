import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { UserSettings } from '../../../shared/types/index'
import { DEFAULT_SETTINGS, THEMES, type Theme } from '../constants/defaults'
import { SettingsStorage } from '../services/settingsStorage'

/**
 * Deep Merge Helper - ersetzt lodash.merge
 * Führt ein Deep Merge von Objekten durch
 */
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const output = { ...target }
  
  for (const key in source) {
    if (source[key] !== undefined) {
      const sourceValue = source[key]
      const targetValue = target[key]
      
      // Deep merge für verschachtelte Objekte (aber nicht Arrays)
      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        output[key] = deepMerge(targetValue as Record<string, any>, sourceValue as Record<string, any>) as T[Extract<keyof T, string>]
      } else {
        output[key] = sourceValue as T[Extract<keyof T, string>]
      }
    }
  }
  
  return output
}

export const useSettingsStore = defineStore('settings', () => {
  // State - Initialisiere mit Defaults
  const settings = ref<UserSettings>({ ...DEFAULT_SETTINGS })

  // Getters
  const isDarkMode = computed(() => {
    if (settings.value.theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return settings.value.theme === 'dark'
  })

  const isHighContrast = computed(() => settings.value.accessibility.highContrast)
  const isLargeText = computed(() => settings.value.accessibility.largeText)
  const isReducedMotion = computed(() => settings.value.accessibility.reducedMotion)

  // Actions
  /**
   * Aktualisiert Settings mit Deep Merge
   * Unterstützt verschachtelte Objekte (z.B. accessibility)
   */
  function updateSettings(newSettings: Partial<UserSettings>) {
    settings.value = deepMerge(settings.value, newSettings)
    // saveSettings() wird automatisch durch watch aufgerufen
  }

  /**
   * Rotiert durch alle Themes: light -> dark -> auto -> light
   */
  function toggleTheme() {
    const currentIndex = THEMES.indexOf(settings.value.theme as Theme)
    const nextIndex = (currentIndex + 1) % THEMES.length
    settings.value.theme = THEMES[nextIndex] as UserSettings['theme']
    // saveSettings() wird automatisch durch watch aufgerufen
  }

  /**
   * Togglet zwischen light und dark (ohne auto)
   * Wird für einfache Dark Mode Toggle verwendet
   */
  function toggleDarkMode() {
    settings.value.theme = settings.value.theme === 'dark' ? 'light' : 'dark'
    // saveSettings() wird automatisch durch watch aufgerufen
  }

  /**
   * Togglet eine Accessibility-Funktion
   */
  function toggleAccessibility(feature: keyof UserSettings['accessibility']) {
    settings.value.accessibility[feature] = !settings.value.accessibility[feature]
    // saveSettings() wird automatisch durch watch aufgerufen
  }

  /**
   * Setzt alle Settings auf Default-Werte zurück
   */
  function resetSettings() {
    settings.value = { ...DEFAULT_SETTINGS }
    // saveSettings() wird automatisch durch watch aufgerufen
  }

  /**
   * Speichert Settings in localStorage
   * Wird automatisch durch watch aufgerufen
   */
  function saveSettings() {
    SettingsStorage.save(settings.value)
  }

  /**
   * Lädt Settings aus localStorage
   * Fallback zu Defaults bei Fehler oder ungültigen Daten
   */
  function loadSettings() {
    const loaded = SettingsStorage.load()
    if (loaded) {
      // Merge mit Defaults um sicherzustellen, dass alle Felder vorhanden sind
      settings.value = deepMerge(DEFAULT_SETTINGS, loaded)
    } else {
      // Keine gespeicherten Settings oder Fehler → verwende Defaults
      settings.value = { ...DEFAULT_SETTINGS }
    }
  }

  // Reactive Persistence - Auto-save bei Änderungen
  watch(
    settings,
    (newSettings) => {
      SettingsStorage.save(newSettings)
    },
    { deep: true }
  )

  // Initialize - Lade Settings beim Start
  loadSettings()

  return {
    // State
    settings,
    
    // Getters
    isDarkMode,
    isHighContrast,
    isLargeText,
    isReducedMotion,
    
    // Actions
    updateSettings,
    toggleTheme,
    toggleDarkMode,
    toggleAccessibility,
    resetSettings,
    saveSettings,
    loadSettings
  }
})