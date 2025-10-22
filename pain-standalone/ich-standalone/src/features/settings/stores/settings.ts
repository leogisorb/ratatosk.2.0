// Settings Store for ich-standalone
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  // State
  const isDarkMode = ref(false)
  const isVolumeEnabled = ref(true)
  const autoModeSpeed = ref(3000)
  const language = ref('de-DE')
  
  // Settings object
  const settings = computed(() => ({
    isDarkMode: isDarkMode.value,
    isVolumeEnabled: isVolumeEnabled.value,
    autoModeSpeed: autoModeSpeed.value,
    language: language.value
  }))

  // Actions
  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value
  }

  const toggleVolume = () => {
    isVolumeEnabled.value = !isVolumeEnabled.value
  }

  const setAutoModeSpeed = (speed: number) => {
    autoModeSpeed.value = speed
  }

  const setLanguage = (lang: string) => {
    language.value = lang
  }

  const loadSettings = () => {
    try {
      const stored = localStorage.getItem('ich-settings')
      if (stored) {
        const parsed = JSON.parse(stored)
        isDarkMode.value = parsed.isDarkMode || false
        isVolumeEnabled.value = parsed.isVolumeEnabled !== false
        autoModeSpeed.value = parsed.autoModeSpeed || 3000
        language.value = parsed.language || 'de-DE'
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const saveSettings = () => {
    try {
      localStorage.setItem('ich-settings', JSON.stringify(settings.value))
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  return {
    // State
    isDarkMode,
    isVolumeEnabled,
    autoModeSpeed,
    language,
    settings,
    
    // Actions
    toggleDarkMode,
    toggleVolume,
    setAutoModeSpeed,
    setLanguage,
    loadSettings,
    saveSettings
  }
})
