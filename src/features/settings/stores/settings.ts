import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserSettings } from '../../../shared/types/index'

export const useSettingsStore = defineStore('settings', () => {
  // State
  const settings = ref<UserSettings>({
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
  })

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
  function updateSettings(newSettings: Partial<UserSettings>) {
    settings.value = { ...settings.value, ...newSettings }
    saveSettings()
  }

  function toggleTheme() {
    const themes: Array<'light' | 'dark' | 'auto'> = ['light', 'dark', 'auto']
    const currentIndex = themes.indexOf(settings.value.theme)
    const nextIndex = (currentIndex + 1) % themes.length
    settings.value.theme = themes[nextIndex]
    saveSettings()
  }

  function toggleDarkMode() {
    settings.value.theme = settings.value.theme === 'dark' ? 'light' : 'dark'
    saveSettings()
  }

  function toggleAccessibility(feature: keyof UserSettings['accessibility']) {
    settings.value.accessibility[feature] = !settings.value.accessibility[feature]
    saveSettings()
  }

  function resetSettings() {
    settings.value = {
      theme: 'light',
      keyboardLayout: 'alphabetical',
      blinkDuration: 2,
      blinkSpeed: 2,
      autoModeSpeed: 3000,
      blinkSensitivity: 0.7,
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
    }
    saveSettings()
  }

  function saveSettings() {
    localStorage.setItem('ratatosk-settings', JSON.stringify(settings.value))
  }

  function loadSettings() {
    const saved = localStorage.getItem('ratatosk-settings')
    if (saved) {
      try {
        settings.value = JSON.parse(saved)
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }
  }

  // Initialize
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