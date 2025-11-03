/**
 * Pinia Store für Tastendesign-Einstellungen
 * Architektur-konforme State-Verwaltung
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { KeyboardDesignService, type KeyboardDesignSettings } from '../services/KeyboardDesignService'

export const useKeyboardDesignStore = defineStore('keyboardDesign', () => {
  // State
  const settings = ref<KeyboardDesignSettings>(KeyboardDesignService.loadSettings())
  
  // Getters
  const keyWidth = computed(() => settings.value.keyWidth)
  const keyHeight = computed(() => settings.value.keyHeight)
  const fontSize = computed(() => settings.value.fontSize)
  const borderRadius = computed(() => settings.value.borderRadius)
  
  // Actions
  const updateSettings = (newSettings: Partial<KeyboardDesignSettings>) => {
    settings.value = { ...settings.value, ...newSettings }
    KeyboardDesignService.saveSettings(settings.value)
  }
  
  const resetToDefault = () => {
    settings.value = KeyboardDesignService.resetToDefault()
  }
  
  const loadSettings = () => {
    settings.value = KeyboardDesignService.loadSettings()
  }
  
  return {
    // State
    settings,
    
    // Getters
    keyWidth,
    keyHeight,
    fontSize,
    borderRadius,
    
    // Actions
    updateSettings,
    resetToDefault,
    loadSettings
  }
})
