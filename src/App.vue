<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from './features/settings/stores/settings'
import { useSingleEyeBlinkHandler } from './shared/composables/useSingleEyeBlinkHandler'
import { simpleFlowController } from './core/application/SimpleFlowController'

// App.vue serves as the main router container
// TTSActivator removed

// Router
const router = useRouter()

// Settings Store
const settingsStore = useSettingsStore()

// Computed
const appClasses = computed(() => ({
  'dark': settingsStore.isDarkMode
}))

// Zentrale Funktion: Beendet alle laufenden Services und Algorithmen
function stopAllServices() {
  console.log('App: Stoppe alle laufenden Services und Algorithmen...')
  
  // 1. Stoppe TTS komplett (SimpleFlowController)
  simpleFlowController.stopTTS()
  
  // 2. Stoppe alle TTS (auch außerhalb SimpleFlowController)
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
  
  // 3. Stoppe Auto-Mode komplett (globaler SimpleFlowController Auto-Mode)
  simpleFlowController.stopAutoMode()
  
  // 4. Setze aktiven View zurück
  simpleFlowController.setActiveView('')
  
  // 5. Rufe alle View-spezifischen Cleanup-Funktionen auf
  // Diese stoppen lokale Auto-Mode Instanzen und Timer in den Views
  const viewCleanups: Record<string, string> = {
    'warning': '__warningCleanup',
    'pain-dialog': '__painDialogCleanup',
    'schmerz': '__painDialogCleanup',
    'umgebung-dialog': '__umgebungDialogCleanup',
    'ich-dialog': '__ichDialogCleanup',
    'einstellungen': '__settingsDialogCleanup',
    'unterhalten': '__unterhaltenViewCleanup',
    'app': '__homeViewCleanup' // HomeView hat möglicherweise auch Cleanup
  }
  
  // Rufe alle Cleanup-Funktionen auf (auch wenn sie nicht für den aktuellen View sind)
  // Dies stellt sicher, dass alle Services gestoppt werden
  Object.values(viewCleanups).forEach((cleanupKey) => {
    const cleanup = (window as any)[cleanupKey]
    if (cleanup && typeof cleanup === 'function') {
      console.log(`App: Rufe Cleanup-Funktion ${cleanupKey} auf`)
      try {
        cleanup()
      } catch (error) {
        console.warn(`App: Fehler beim Aufrufen von ${cleanupKey}:`, error)
      }
    }
  })
  
  // 6. Stoppe alle globalen Timer (falls vorhanden)
  const globalTimers = (window as any).__globalTimers || []
  globalTimers.forEach((timerId: number) => {
    clearTimeout(timerId)
    clearInterval(timerId)
  })
  ;(window as any).__globalTimers = []
  
  console.log('App: Alle Services gestoppt')
}

// Navigation zum Home-View mit sauberem Reset (ohne Hard Reload)
function navigateToHome() {
  console.log('App: Navigiere zu /app mit sauberem Reset')
  
  // Stoppe alle Services vor Navigation
  stopAllServices()
  
  // Navigiere zu /app
  router.push('/app').then(() => {
    console.log('App: Navigation zu /app erfolgreich - alle Services wurden zurückgesetzt')
  }).catch((error) => {
    console.error('App: Navigation zu /app fehlgeschlagen:', error)
  })
}

// Navigation zum Warngeräusch mit sauberem Reset (ohne Hard Reload)
function navigateToWarning() {
  console.log('App: Navigiere zu /warning mit sauberem Reset')
  
  // Stoppe alle Services vor Navigation
  stopAllServices()
  
  // Navigiere zu /warning
  router.push('/warning').then(() => {
    console.log('App: Navigation zu /warning erfolgreich - alle Services wurden zurückgesetzt')
  }).catch((error) => {
    console.error('App: Navigation zu /warning fehlgeschlagen:', error)
  })
}

// Einseitiges Blinzeln Handler für Shortcuts
const singleEyeBlinkHandler = useSingleEyeBlinkHandler({
  onLeftEyeBlink: () => {
    console.log('App: Linkes Auge geblinzelt - Navigiere zum Warngeräusch')
    navigateToWarning()
  },
  onRightEyeBlink: () => {
    console.log('App: Rechtes Auge geblinzelt - Navigiere zu Home')
    navigateToHome()
  },
  cooldown: 500 // 500ms Cooldown zwischen Shortcuts
})

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
  
  // Starte einseitiges Blinzeln Handler
  singleEyeBlinkHandler.start()
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
