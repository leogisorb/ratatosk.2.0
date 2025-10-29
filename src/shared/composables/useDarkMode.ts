import { watch } from 'vue'
import { useSettingsStore } from '@/features/settings/stores/settings'

export function useDarkMode() {
  const settingsStore = useSettingsStore()

  // Apply dark mode class to HTML element
  const applyDarkMode = () => {
    const html = document.documentElement
    if (settingsStore.isDarkMode) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  // Watch for changes in dark mode setting
  watch(
    () => settingsStore.isDarkMode,
    () => {
      applyDarkMode()
    },
    { immediate: true }
  )

  return {
    applyDarkMode
  }
}
