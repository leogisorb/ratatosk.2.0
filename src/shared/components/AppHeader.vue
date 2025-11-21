<template>
  <header class="global-header">
    <div class="header-content">
      <!-- Linke Seite - RATATOSK Logo -->
      <div class="header-left" @click="goToApp" style="cursor: pointer;">
        <h1 class="header-title">RATATOSK</h1>
        <img :src="rattenkopfIcon" alt="Ratatosk Logo" class="header-logo" />
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

        <!-- Zurück Button (Hard Reset) -->
        <button
          @click="goBack"
          class="header-button header-button-home"
          title="Zurück zum Hauptmenü (Hard Reset)"
        >
          <img :src="goHomeIcon" alt="Home" class="header-button-icon" />
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../features/settings/stores/settings'
import { simpleFlowController } from '../../core/application/SimpleFlowController'

// Importiere Assets
import rattenkopfIcon from '@/assets/icons/rattenkopf.svg'
import goHomeIcon from '@/assets/icons/GoHome.svg'

// Router
const router = useRouter()

// Stores
const settingsStore = useSettingsStore()

// Reaktiver State - synchronisiert mit globalem SimpleFlowController State
const isVolumeEnabled = ref(!simpleFlowController.getTTSMuted())

// State aktualisieren wenn sich der globale Mute-State ändert
const updateVolumeState = () => {
  isVolumeEnabled.value = !simpleFlowController.getTTSMuted()
  console.log('Header: Volume state updated from global state:', isVolumeEnabled.value)
}

// Computed
const isDarkMode = computed(() => settingsStore.isDarkMode)

// Methods
// Nur der Header-Button darf den Mute-State ändern!
const toggleVolume = () => {
  const currentMuted = simpleFlowController.getTTSMuted()
  const newMuted = !currentMuted
  
  console.log('Header: Volume button clicked - changing mute state from', currentMuted, 'to', newMuted)
  
  // Globalen TTS-State über SimpleFlowController ändern (einzige Quelle der Wahrheit)
  simpleFlowController.setTTSMuted(newMuted)

  // Lokalen State sofort aktualisieren
  isVolumeEnabled.value = !newMuted

  // Wenn TTS aktiviert oder deaktiviert wird, View neu laden
  // (damit Begrüßungstexte und andere TTS-abhängige Inhalte neu gestartet werden)
  if (currentMuted !== newMuted) {
    console.log('Header: TTS wurde geändert (von', currentMuted, 'zu', newMuted, ') - lade aktuellen View neu')
    // Aktuelle Route neu laden mit router.go(0) für vollständigen Reload
    // Das stellt sicher, dass alle Views (UnterhaltenView, WarningView, etc.) neu initialisiert werden
    router.go(0)
  }
  
  // Sende Event an alle Views (für Kompatibilität)
  const event = new CustomEvent('volumeToggle', {
    detail: { enabled: !newMuted }
  })
  window.dispatchEvent(event)
  
  console.log('Header: Mute state changed to', newMuted, '- isVolumeEnabled:', !newMuted)
}

// Lebenszyklus - Initialen Zustand laden und auf Ereignisse hören
onMounted(() => {
  // Lade initialen State aus SimpleFlowController
  updateVolumeState()
  
  // Höre auf volumeToggle Events (falls von außen geändert)
  window.addEventListener('volumeToggle', updateVolumeState)
})

onUnmounted(() => {
  // Entferne Event Listener
  window.removeEventListener('volumeToggle', updateVolumeState)
})

const toggleDarkMode = () => {
  settingsStore.toggleDarkMode()
  console.log('Dark mode toggled:', isDarkMode.value)
}

// Logo/Titel Klick - Navigiert zu /app
const goToApp = () => {
  console.log('Header: Logo geklickt - Navigation zu /app')
  router.push('/app').then(() => {
    console.log('Header: Logo - Navigation zu /app erfolgreich')
  }).catch((error) => {
    console.error('Header: Logo - Navigation fehlgeschlagen:', error)
  })
}

// Zurück Button (Hard Reset) - Stoppt alle Services und navigiert zu /
const goBack = () => {
  console.log('Header: Zurück Button geklickt - Hard Reset zu /')
  
  // Stoppe alle laufenden TTS komplett
  simpleFlowController.stopTTS()
  
  // Stoppe alle TTS (auch außerhalb SimpleFlowController)
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
  
  // Stoppe Auto-Mode komplett
  simpleFlowController.stopAutoMode()
  
  // Setze aktiven View zurück
  simpleFlowController.setActiveView('')
  
  // Navigiere zu / (Home-View)
  router.push('/').then(() => {
    console.log('Header: Zurück Button - Navigation zu / erfolgreich, alle Services gestoppt')
  }).catch((error) => {
    console.error('Header: Zurück Button - Navigation fehlgeschlagen:', error)
  })
}
</script>

<style scoped>
/* AppHeader verwendet globale CSS-Klassen aus BaseLayout.css */
</style>
