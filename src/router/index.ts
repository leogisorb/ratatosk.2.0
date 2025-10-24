import { createRouter, createWebHistory } from 'vue-router'
import StartView from '../features/navigation/views/StartView.vue'
import HomeView from '../features/navigation/views/HomeView.vue'
import WarningView from '../features/warning/views/WarningView.vue'
import UnterhaltenView from '../features/communication/views/UnterhaltenView.vue'
// Alte Ich-Views entfernt - ersetzt durch IchDialogView
// import IchView from '../features/settings/views/IchView.vue'
// import GefuehleView from '../features/feelings/views/GefuehleView.vue'
// import HygieneView from '../features/hygiene/views/HygieneView.vue'
import UmgebungView from '../features/environment/views/UmgebungView.vue'
import GegenstaendeView from '../features/environment/views/GegenstaendeView.vue'
import VerbenView from '../features/environment/views/VerbenView.vue'
import GegenstaendeVerbenView from '../features/environment/views/GegenstaendeVerbenView.vue'
import BettVerbenView from '../features/environment/views/BettVerbenView.vue'
import ZimmerVerbenView from '../features/environment/views/ZimmerVerbenView.vue'
import ZimmerView from '../features/environment/views/ZimmerView.vue'
import BettView from '../features/environment/views/BettView.vue'
// Alte Ich-Views entfernt - ersetzt durch IchDialogView
// import KleidungView from '../features/clothing/views/KleidungView.vue'
// import BewegungView from '../features/movement/views/BewegungView.vue'
// import ErnaehrungView from '../features/nutrition/views/ErnaehrungView.vue'
import PainScaleView from '../features/pain-assessment/views/PainScaleView.vue'
import PainDialogView from '../features/pain-assessment/views/PainDialogView.vue'
import IchDialogView from '../features/ich/views/IchDialogView.vue'
import SlashSettingsView from '../features/settings/views/SlashSettingsView.vue'
import LeuchtDauerView from '../features/settings/views/LeuchtDauerView.vue'
import BlinzeldauerView from '../features/settings/views/BlinzeldauerView.vue'
import BlitzdauerView from '../features/settings/views/BlitzdauerView.vue'
import FarbmodusView from '../features/settings/views/FarbmodusView.vue'
import ImpressumView from '../features/settings/views/ImpressumView.vue'
import KamerapositionView from '../features/settings/views/KamerapositionView.vue'
import KameraView from '../features/settings/views/KameraView.vue'

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
    {
      path: '/umgebung',
      name: 'umgebung',
      component: UmgebungView,
    },
    {
      path: '/gegenstaende',
      name: 'gegenstaende',
      component: GegenstaendeView,
    },
    {
      path: '/verben/:gegenstand',
      name: 'verben',
      component: VerbenView,
    },
    {
      path: '/gegenstaende-verben/:gegenstand',
      name: 'gegenstaende-verben',
      component: GegenstaendeVerbenView,
    },
    {
      path: '/bett-verben/:bettItem',
      name: 'bett-verben',
      component: BettVerbenView,
    },
    {
      path: '/zimmer-verben/:zimmerItem',
      name: 'zimmer-verben',
      component: ZimmerVerbenView,
    },
    {
      path: '/zimmer',
      name: 'zimmer',
      component: ZimmerView,
    },
    {
      path: '/bett',
      name: 'bett',
      component: BettView,
    },
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
      path: '/einstellungen',
      name: 'einstellungen',
      component: SlashSettingsView,
    },
    {
      path: '/einstellungen/leuchtdauer',
      name: 'einstellungen-leuchtdauer',
      component: LeuchtDauerView,
    },
    {
      path: '/einstellungen/blitzdauer',
      name: 'einstellungen-blitzdauer',
      component: BlitzdauerView,
    },
    {
      path: '/einstellungen/farbmodus',
      name: 'einstellungen-farbmodus',
      component: FarbmodusView,
    },
    {
      path: '/einstellungen/kamera',
      name: 'einstellungen-kamera',
      component: KameraView,
    },
    {
      path: '/einstellungen/kamerapositionen',
      name: 'einstellungen-kamerapositionen',
      component: KamerapositionView,
    },
    {
      path: '/einstellungen/impressum',
      name: 'einstellungen-impressum',
      component: ImpressumView,
    },
    // About route removed - was standard Vue.js template
  ],
})

export default router
