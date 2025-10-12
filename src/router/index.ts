import { createRouter, createWebHistory } from 'vue-router'
import StartView from '../features/navigation/views/StartView.vue'
import HomeView from '../features/navigation/views/HomeView.vue'
import WarningView from '../features/warning/views/WarningView.vue'
import UnterhaltenView from '../features/communication/views/UnterhaltenView.vue'
import IchView from '../features/settings/views/IchView.vue'
import GefuehleView from '../features/feelings/views/GefuehleView.vue'
import SchmerzView from '../features/pain-assessment/views/SchmerzView.vue'
import HygieneView from '../features/hygiene/views/HygieneView.vue'
import UmgebungView from '../features/environment/views/UmgebungView.vue'
import GegenstaendeView from '../features/environment/views/GegenstaendeView.vue'
import VerbenView from '../features/environment/views/VerbenView.vue'
import GegenstaendeVerbenView from '../features/environment/views/GegenstaendeVerbenView.vue'
import BettVerbenView from '../features/environment/views/BettVerbenView.vue'
import ZimmerVerbenView from '../features/environment/views/ZimmerVerbenView.vue'
import ZimmerView from '../features/environment/views/ZimmerView.vue'
import BettView from '../features/environment/views/BettView.vue'
import KleidungView from '../features/clothing/views/KleidungView.vue'
import BewegungView from '../features/movement/views/BewegungView.vue'
import ErnaehrungView from '../features/nutrition/views/ErnaehrungView.vue'
import KopfSchmerzView from '../features/pain-assessment/views/KopfSchmerzView.vue'
import TorsoSchmerzView from '../features/pain-assessment/views/TorsoSchmerzView.vue'
import BeineSchmerzView from '../features/pain-assessment/views/BeineSchmerzView.vue'
import ArmeSchmerzView from '../features/pain-assessment/views/ArmeSchmerzView.vue'
import PainScaleView from '../features/pain-assessment/views/PainScaleView.vue'
import PainDialogView from '../features/pain-assessment/views/PainDialogView.vue'
import EinstellungenView from '../features/settings/views/EinstellungenView.vue'
import SlashSettingsView from '../features/settings/views/SlashSettingsView.vue'
import LeuchtDauerView from '../features/light-duration/views/LeuchtDauerView.vue'
import BlinzeldauerView from '../features/blink-duration/views/BlinzeldauerView.vue'
import BlitzdauerView from '../features/settings/views/BlitzdauerView.vue'
import FarbmodusView from '../features/settings/views/FarbmodusView.vue'
import ImpressumView from '../features/settings/views/ImpressumView.vue'
import TastaturdesignView from '../features/communication/views/TastaturdesignView.vue'
import KamerapositionView from '../features/camera-position/views/KamerapositionView.vue'
import KameraView from '../features/camera/views/KameraView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
    {
      path: '/ich',
      name: 'ich',
      component: IchView,
    },
    {
      path: '/gefuehle',
      name: 'gefuehle',
      component: GefuehleView,
    },
    {
      path: '/schmerz',
      name: 'schmerz',
      component: SchmerzView,
    },
    {
      path: '/hygiene',
      name: 'hygiene',
      component: HygieneView,
    },
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
    {
      path: '/kleidung',
      name: 'kleidung',
      component: KleidungView,
    },
    {
      path: '/bewegung',
      name: 'bewegung',
      component: BewegungView,
    },
    {
      path: '/ernaehrung',
      name: 'ernaehrung',
      component: ErnaehrungView,
    },
    {
      path: '/kopf-schmerz',
      name: 'kopf-schmerz',
      component: KopfSchmerzView,
    },
    {
      path: '/torso-schmerz',
      name: 'torso-schmerz',
      component: TorsoSchmerzView,
    },
    {
      path: '/beine-schmerz',
      name: 'beine-schmerz',
      component: BeineSchmerzView,
    },
    {
      path: '/arme-schmerz',
      name: 'arme-schmerz',
      component: ArmeSchmerzView,
    },
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
    {
      path: '/leucht-dauer',
      name: 'leucht-dauer',
      component: LeuchtDauerView,
    },
    {
      path: '/blinzeldauer',
      name: 'blinzeldauer',
      component: BlinzeldauerView,
    },
    {
      path: '/tastaturdesign',
      name: 'tastaturdesign',
      component: TastaturdesignView,
    },
    {
      path: '/kameraposition',
      name: 'kameraposition',
      component: KamerapositionView,
    },
    {
      path: '/kamera',
      name: 'kamera',
      component: KameraView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../features/about/views/AboutView.vue'),
    },
  ],
})

export default router
