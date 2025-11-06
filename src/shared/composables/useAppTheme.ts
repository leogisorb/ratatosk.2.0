/**
 * Composable für App-Theme-Management
 * Handles dark mode and theme synchronization with document
 */

import { computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '../../features/settings/stores/settings'

export function useAppTheme() {
  const settingsStore = useSettingsStore()

  // Computed
  const appClasses = computed(() => ({
    'dark': settingsStore.isDarkMode
  }))

  // Watch for theme changes and apply to document
  watch(() => settingsStore.isDarkMode, (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, { immediate: true })

  // Initialize theme on mount
  onMounted(() => {
    if (settingsStore.isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  })

  return {
    appClasses
  }
}

