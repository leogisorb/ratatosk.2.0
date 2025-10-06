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
  
  // Farben für aktive Tasten
  const activeKeyBackground = computed(() => settings.value.activeKeyBackground)
  const activeKeyBorder = computed(() => settings.value.activeKeyBorder)
  const activeKeyText = computed(() => settings.value.activeKeyText)
  
  // Farben für spezielle Tasten
  const spaceKeyBackground = computed(() => settings.value.spaceKeyBackground)
  const spaceKeyBorder = computed(() => settings.value.spaceKeyBorder)
  const deleteKeyBackground = computed(() => settings.value.deleteKeyBackground)
  const deleteKeyBorder = computed(() => settings.value.deleteKeyBorder)
  const backKeyBackground = computed(() => settings.value.backKeyBackground)
  const backKeyBorder = computed(() => settings.value.backKeyBorder)
  
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
    
    // Farben für aktive Tasten
    activeKeyBackground,
    activeKeyBorder,
    activeKeyText,
    
    // Farben für spezielle Tasten
    spaceKeyBackground,
    spaceKeyBorder,
    deleteKeyBackground,
    deleteKeyBorder,
    backKeyBackground,
    backKeyBorder,
    
    // Actions
    updateSettings,
    resetToDefault,
    loadSettings
  }
})
