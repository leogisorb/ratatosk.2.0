import { createRouter, createWebHistory } from 'vue-router'
import StartView from '../features/navigation/views/StartView.vue'
import HomeView from '../features/navigation/views/HomeView.vue'
import WarningView from '../features/warning/views/WarningView.vue'
import UnterhaltenView from '../features/communication/views/UnterhaltenView.vue'
import PainDialogView from '../features/pain-assessment/views/PainDialogView.vue'
import IchDialogView from '../features/ich/views/IchDialogView.vue'
import UmgebungDialogView from '../features/umgebung-dialog/views/UmgebungDialogView.vue'
import SettingsDialogView from '../features/settings/views/SettingsDialogView.vue'
import { simpleFlowController } from '../core/application/SimpleFlowController'
// Alte Settings-Views entfernt - werden durch SettingsDialogView ersetzt

const router = createRouter({
  history: createWebHistory('/ratatosk.2.0/'),
  routes: [
    {
      path: '/',
      name: 'start',
      component: StartView,
    },
    {
      path: '/app',
      name: 'app',
      component: HomeView,
    },
    {
      path: '/warning',
      name: 'warning',
      component: WarningView,
    },
    {
      path: '/unterhalten',
      name: 'unterhalten',
      component: UnterhaltenView,
    },
    // Alte Ich-Routes entfernt - ersetzt durch /ich-dialog
    {
      path: '/schmerz',
      name: 'schmerz',
      component: PainDialogView,
    },
    {
      path: '/pain-dialog',
      name: 'pain-dialog',
      component: PainDialogView,
    },
    {
      path: '/ich-dialog',
      name: 'ich-dialog',
      component: IchDialogView,
    },
    {
      path: '/umgebung-dialog',
      name: 'umgebung-dialog',
      component: UmgebungDialogView,
    },
    {
      path: '/einstellungen',
      name: 'einstellungen',
      component: SettingsDialogView,
    },
    // Alte Settings-Routes entfernt - werden durch /einstellungen (SettingsDialogView) ersetzt
  ]
})

/**
 * Router Guard: Stoppt alle laufenden Services vor jeder Navigation
 * Verhindert, dass Views im Hintergrund weiterlaufen
 */
router.beforeEach((to, from, next) => {
  // Nur stoppen, wenn wir von einem View zu einem anderen navigieren (nicht beim ersten Laden)
  if (from.name && from.name !== to.name) {
    console.log(`Router: Navigation von ${String(from.name)} zu ${String(to.name)} - stoppe alle Services`)
    
    // 1. Stoppe TTS komplett (SimpleFlowController)
    simpleFlowController.stopTTS()
    
    // 2. Stoppe alle TTS (auch außerhalb SimpleFlowController)
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    
    // 3. Stoppe Auto-Mode komplett
    simpleFlowController.stopAutoMode()
    
    // 4. Setze aktiven View zurück
    simpleFlowController.setActiveView('')
    
    // 5. Spezifische View-Cleanups (falls nötig)
    // Rufe View-spezifische Cleanup-Funktionen auf
    const viewCleanups: Record<string, string> = {
      'warning': '__warningCleanup',
      'pain-dialog': '__painDialogCleanup',
      'schmerz': '__painDialogCleanup',
      'umgebung-dialog': '__umgebungDialogCleanup',
      'ich-dialog': '__ichDialogCleanup',
      'einstellungen': '__settingsDialogCleanup',
      'unterhalten': '__unterhaltenViewCleanup'
    }
    
    const fromName = String(from.name)
    const cleanupKey = viewCleanups[fromName]
    
    if (cleanupKey) {
      console.log(`Router: Rufe Cleanup-Funktion für ${fromName} auf`)
      const cleanup = (window as any)[cleanupKey]
      if (cleanup && typeof cleanup === 'function') {
        cleanup()
      }
    }
    
    // 6. Stoppe alle globalen Timer (falls vorhanden)
    // Alle Interval-IDs, die in window gespeichert sind, stoppen
    const globalTimers = (window as any).__globalTimers || []
    globalTimers.forEach((timerId: number) => {
      clearTimeout(timerId)
      clearInterval(timerId)
    })
    ;(window as any).__globalTimers = []
    
    console.log('Router: Alle Services gestoppt - Navigation wird fortgesetzt')
  }
  
  // Navigation fortführen
  next()
})

export default router
