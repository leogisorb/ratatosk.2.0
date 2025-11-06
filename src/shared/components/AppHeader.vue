<template>
  <header class="global-header">
    <div class="header-content">
      <!-- Linke Seite - RATATOSK Logo -->
      <div class="header-left">
        <h1 class="header-title">RATATOSK</h1>
        <img src="/rattenkopf.svg" alt="Ratatosk Logo" class="header-logo" />
      </div>

      <!-- Rechte Seite - 3 Buttons -->
      <div class="header-right">
        <!-- Lautstärke Button -->
        <button
          @click="toggleVolume"
          class="header-button"
          :class="{ active: isVolumeEnabled }"
          :title="isVolumeEnabled ? 'Lautstärke deaktivieren' : 'Lautstärke aktivieren'"
        >
          <svg class="header-button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              v-if="isVolumeEnabled"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
            <path
              v-else
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
            <path
              v-if="!isVolumeEnabled"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
            />
          </svg>
        </button>

        <!-- Dark Mode Button -->
        <button
          @click="toggleDarkMode"
          class="header-button"
          :class="{ active: isDarkMode }"
          :title="isDarkMode ? 'Hell-Modus aktivieren' : 'Dunkel-Modus aktivieren'"
        >
          <svg class="header-button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              v-if="isDarkMode"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
            <path
              v-else
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        </button>

        <!-- Home Button -->
        <button
          @click="goHome"
          class="header-button"
          title="Zurück zum Hauptmenü"
        >
          <svg class="header-button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSettingsStore } from '../../features/settings/stores/settings'
import { simpleFlowController } from '../../core/application/SimpleFlowController'

// Router
const router = useRouter()
const route = useRoute()

// Stores
const settingsStore = useSettingsStore()

// State - TTS enabled by default (synchronized with global state)
const isVolumeEnabled = ref(true)

// Computed
const isDarkMode = computed(() => settingsStore.isDarkMode)

// Sync with global mute state
watch(() => simpleFlowController.getTTSMuted(), (isMuted) => {
  isVolumeEnabled.value = !isMuted
  console.log('AppHeader: Volume state synced with global state:', isVolumeEnabled.value)
}, { immediate: true })

// Methods
const toggleVolume = () => {
  isVolumeEnabled.value = !isVolumeEnabled.value
  console.log('Volume button clicked:', isVolumeEnabled.value)
  
  // Steuere globalen TTS über SimpleFlowController
  simpleFlowController.setTTSMuted(!isVolumeEnabled.value)
  
  // Sende Event an alle Views (für Kompatibilität)
  const event = new CustomEvent('volumeToggle', {
    detail: { enabled: isVolumeEnabled.value }
  })
  window.dispatchEvent(event)
}

// Sende initialen Volume-Status beim Mount
onMounted(() => {
  // Setze initialen TTS-Status im SimpleFlowController
  simpleFlowController.setTTSMuted(!isVolumeEnabled.value)
  
  const event = new CustomEvent('volumeToggle', {
    detail: { enabled: isVolumeEnabled.value }
  })
  window.dispatchEvent(event)
  console.log('Initial volume status sent:', isVolumeEnabled.value)
})

const toggleDarkMode = () => {
  settingsStore.toggleDarkMode()
  console.log('Dark mode toggled:', isDarkMode.value)
}

const goHome = () => {
  // Hard Reset: Reload page to /app (wie ein "Hard Reset")
  console.log(`Header: Home button clicked - reloading page to /app`)
  
  // Stoppe alle laufenden TTS komplett
  simpleFlowController.stopTTS()
  
  // Stoppe Auto-Mode komplett
  simpleFlowController.stopAutoMode()
  
  // Navigate to /app and reload page for clean reset
  router.push('/app').then(() => {
    // Reload page for complete reset
    window.location.reload()
  })
}

const goBack = () => {
  // Normal back navigation: only go one level back
  console.log(`Header: Back button clicked - navigating one level back`)
  
  // Check if we can go back in history
  if (window.history.length > 1) {
    // Use router.back() to go one level back
    router.back()
  } else {
    // If no history, go to /app
    router.push('/app')
  }
}
</script>

<style scoped>
/* AppHeader verwendet globale CSS-Klassen aus main.css */
</style>
