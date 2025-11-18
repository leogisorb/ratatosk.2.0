import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import StartView from '../features/navigation/views/StartView.vue'
import HomeView from '../features/navigation/views/HomeView.vue'
import WarningView from '../features/warning/views/WarningView.vue'
import CommunicationView from '../features/communication/views/CommunicationView.vue'
import PainDialogView from '../features/pain-assessment/views/PainDialogView.vue'
import SelfDialogView from '../features/self-dialog/views/SelfDialogView.vue'
import EnvironmentDialogView from '../features/environment-dialog/views/EnvironmentDialogView.vue'
import SettingsDialogView from '../features/settings/views/SettingsDialogView.vue'
import { simpleFlowController } from '../core/application/SimpleFlowController'
import { cleanupRegistry } from '../shared/utils/cleanupRegistry'
// Alte Settings-Views entfernt - werden durch SettingsDialogView ersetzt

const router = createRouter({
  // History-Mode für saubere URLs ohne Hash
  // URLs sehen dann so aus: /ratatosk.2.0/app statt /ratatosk.2.0/#/app
  // Benötigt Server-Konfiguration (.htaccess für Apache oder 404.html für GitHub Pages)
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
 * Verbesserte Cleanup-Reihenfolge mit async/await:
 * 1. View-spezifische Cleanups zuerst (setzt isCancelled = true)
 * 2. Dann globale Services stoppen
 * 3. Kleine Pause für Race Condition Prevention
 * 4. Navigation
 */
router.beforeEach(async (to, from, next) => {
  // Nur stoppen, wenn wir von einem View zu einem anderen navigieren (nicht beim ersten Laden)
  if (from.name && from.name !== to.name) {
    console.log(`Router: Navigation von ${String(from.name)} zu ${String(to.name)}`)
    
    try {
      // 1. View-spezifische Cleanups mit Timeout
      const fromName = String(from.name)
      await cleanupRegistry.cleanup(fromName, 1000)
      
      // 2. Globale Services stoppen
      simpleFlowController.stopTTS()
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      simpleFlowController.stopAutoMode()
      simpleFlowController.setActiveView('')
      
      // 3. Kleine Pause für Race Condition Prevention
      await new Promise(resolve => setTimeout(resolve, 50))
      
      console.log('Router: Alle Services gestoppt - Navigation wird fortgesetzt')
      
      // 4. Navigation
      next()
      
    } catch (error) {
      console.error('Router: Navigation error:', error)
      // Continue navigation even if cleanup fails
      next()
    }
  } else {
    // Navigation fortführen
    next()
  }
})

export default router

