import { createRouter, createWebHistory } from 'vue-router'
import StartView from '../features/navigation/views/StartView.vue'
import HomeView from '../features/navigation/views/HomeView.vue'
import WarningView from '../features/warning/views/WarningView.vue'
import UnterhaltenView from '../features/communication/views/UnterhaltenView.vue'
import PainScaleView from '../features/pain-assessment/views/PainScaleView.vue'
import PainDialogView from '../features/pain-assessment/views/PainDialogView.vue'
import IchDialogView from '../features/ich/views/IchDialogView.vue'
import UmgebungDialogView from '../features/umgebung-dialog/views/UmgebungDialogView.vue'
import SlashSettingsView from '../features/settings/views/SlashSettingsView.vue'
import SettingsDialogView from '../features/settings/views/SettingsDialogView.vue'
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
    // Alte Hygiene-Route entfernt - ersetzt durch /ich-dialog
    // Environment routes removed - replaced by /umgebung-dialog
    // All environment routes removed - replaced by /umgebung-dialog
    // Alte Ich-Routes entfernt - ersetzt durch /ich-dialog
    // /kleidung, /bewegung, /ernaehrung
    {
      path: '/pain-scale',
      name: 'pain-scale',
      component: PainScaleView,
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
      component: SlashSettingsView,
    },
    {
      path: '/einstellungen-dialog',
      name: 'einstellungen-dialog',
      component: SettingsDialogView,
    },
    // Alte Settings-Routes entfernt - werden durch /einstellungen (SettingsDialogView) ersetzt
  ]})

export default router
