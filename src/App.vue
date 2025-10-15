<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useSettingsStore } from './features/settings/stores/settings'

// App.vue serves as the main router container
// TTSActivator removed

// Settings Store
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
</script>

<template>
  <div id="app" :class="appClasses">
    <router-view />
    <!-- TTSActivator removed -->
  </div>
</template>

<style>
/* Nur Tailwind - keine base.css die das Layout stört */
</style>
