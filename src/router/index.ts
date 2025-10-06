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
import KleidungView from '../features/clothing/views/KleidungView.vue'
import BewegungView from '../features/movement/views/BewegungView.vue'
import ErnaehrungView from '../features/nutrition/views/ErnaehrungView.vue'
import KopfSchmerzView from '../features/pain-assessment/views/KopfSchmerzView.vue'
import TorsoSchmerzView from '../features/pain-assessment/views/TorsoSchmerzView.vue'
import BeineSchmerzView from '../features/pain-assessment/views/BeineSchmerzView.vue'
import ArmeSchmerzView from '../features/pain-assessment/views/ArmeSchmerzView.vue'
import PainScaleView from '../features/pain-assessment/views/PainScaleView.vue'
import EinstellungenView from '../features/settings/views/EinstellungenView.vue'
import LeuchtDauerView from '../features/light-duration/views/LeuchtDauerView.vue'
import BlinzeldauerView from '../features/blink-duration/views/BlinzeldauerView.vue'
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
      path: '/einstellungen',
      name: 'einstellungen',
      component: EinstellungenView,
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
