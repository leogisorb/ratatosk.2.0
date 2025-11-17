import { createRouter, createWebHistory } from 'vue-router'
import StartView from '../features/navigation/views/StartView.vue'
import HomeView from '../features/navigation/views/HomeView.vue'
import WarningView from '../features/warning/views/WarningView.vue'
import CommunicationView from '../features/communication/views/CommunicationView.vue'
import PainDialogView from '../features/pain-assessment/views/PainDialogView.vue'
import SelfDialogView from '../features/self-dialog/views/SelfDialogView.vue'
import EnvironmentDialogView from '../features/environment-dialog/views/EnvironmentDialogView.vue'
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
      path: '/communication',
      name: 'communication',
      component: CommunicationView,
    },
    {
      path: '/pain-dialog',
      name: 'pain-dialog',
      component: PainDialogView,
    },
    {
      path: '/self-dialog',
      name: 'self-dialog',
      component: SelfDialogView,
    },
    {
      path: '/environment-dialog',
      name: 'environment-dialog',
      component: EnvironmentDialogView,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsDialogView,
    },
    // Alte Settings-Routes entfernt - werden durch /einstellungen (SettingsDialogView) ersetzt
  ]
})

/**
 * Router Guard: Stoppt alle laufenden Services vor jeder Navigation
 * Verhindert, dass Views im Hintergrund weiterlaufen
 * 
 * ✅ Verbesserte Cleanup-Reihenfolge:
 * 1. View-spezifische Cleanups ZUERST (setzt isCancelled = true)
 * 2. Dann globale Services stoppen
 * 3. Timer löschen
 */
router.beforeEach((to, from, next) => {
  // Nur stoppen, wenn wir von einem View zu einem anderen navigieren (nicht beim ersten Laden)
  if (from.name && from.name !== to.name) {
    console.log(`Router: Navigation von ${String(from.name)} zu ${String(to.name)}`)
    
    // ✅ 1. CLEANUP ZUERST (bevor andere Stops)
    // View-spezifische Cleanups setzen isCancelled = true und stoppen alle async-Operationen
    const cleanupFunctions: Record<string, string> = {
      'warning': '__warningCleanup',
      'pain-dialog': '__painDialogCleanup',
      'environment-dialog': '__environmentDialogCleanup',
      'self-dialog': '__selfDialogCleanup',
      'settings': '__settingsDialogCleanup',
      'communication': '__communicationViewCleanup'
    }
    
    const fromName = String(from.name)
    const cleanupKey = cleanupFunctions[fromName]
    
    if (cleanupKey) {
      const cleanup = (window as any)[cleanupKey]
      if (cleanup && typeof cleanup === 'function') {
        console.log(`Router: Cleanup für ${fromName}`)
        cleanup() // ✅ Dies setzt jetzt isCancelled = true!
      }
    }
    
    // ✅ 2. DANN: Globale Services stoppen
    simpleFlowController.stopTTS()
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    simpleFlowController.stopAutoMode()
    simpleFlowController.setActiveView('')
    
    // ✅ 3. Timer löschen
    const globalTimers = (window as any).__globalTimers || []
    globalTimers.forEach((id: number) => {
      clearTimeout(id)
      clearInterval(id)
    })
    ;(window as any).__globalTimers = []
    
    console.log('Router: Alle Services gestoppt - Navigation wird fortgesetzt')
  }
  
  // Navigation fortführen
  next()
})

export default router

