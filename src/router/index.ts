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
import { ViewCleanupRegistry } from '../shared/utils/UnifiedCleanup'
// Alte Settings-Views entfernt - werden durch SettingsDialogView ersetzt

const router = createRouter({
  // History-Mode für saubere URLs ohne Hash
  // URLs sehen dann so aus: /ratatosk.2.0/app statt /ratatosk.2.0/#/app
  // Benötigt Server-Konfiguration (.htaccess für Apache oder 404.html für GitHub Pages)
  history: createWebHistory('/'),
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
 * Router Guard: Koordiniert Navigation und Cleanup
 * 
 * Prinzip: Router koordiniert nur, Views räumen sich selbst auf
 * - View-Cleanup via UnifiedCleanup (ViewCleanupRegistry)
 * - Global State zurücksetzen
 * - Keine View-internen Details (TTS, Timer, etc.) im Router
 */
router.beforeEach(async (to, from, next) => {
  // Nur stoppen, wenn wir von einem View zu einem anderen navigieren (nicht beim ersten Laden)
  if (from.name && from.name !== to.name) {
    console.log(`Router: Navigation von ${String(from.name)} zu ${String(to.name)}`)
    
    try {
      // View räumt sich selbst auf via UnifiedCleanup
      const fromName = String(from.name)
      await ViewCleanupRegistry.cleanup(fromName)
      
      // Global State zurücksetzen (nur Koordination, keine Business Logic)
      simpleFlowController.setActiveView('')
      
      console.log('Router: Navigation vorbereitet')
      
      // Navigation
      next()
      
    } catch (error) {
      console.error('Router: Navigation error:', error)
      // Setze Navigation fort auch wenn Cleanup fehlschlägt
      next()
    }
  } else {
    // Navigation fortführen
    next()
  }
})

export default router

