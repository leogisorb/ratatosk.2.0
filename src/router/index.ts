import { createRouter, createWebHistory } from 'vue-router'
import StartView from '../views/StartView.vue'
import HomeView from '../views/HomeView.vue'
import WarningView from '../views/WarningView.vue'
import UnterhaltenView from '../views/UnterhaltenView.vue'
import IchView from '../views/IchView.vue'
import GefuehleView from '../views/GefuehleView.vue'
import SchmerzView from '../views/SchmerzView.vue'
import HygieneView from '../views/HygieneView.vue'
import UmgebungView from '../views/UmgebungView.vue'
import KleidungView from '../views/KleidungView.vue'
import BewegungView from '../views/BewegungView.vue'
import ErnaehrungView from '../views/ErnaehrungView.vue'
import KopfSchmerzView from '../features/pain-assessment/views/KopfSchmerzView.vue'
import TorsoSchmerzView from '../features/pain-assessment/views/TorsoSchmerzView.vue'
import BeineSchmerzView from '../features/pain-assessment/views/BeineSchmerzView.vue'
import ArmeSchmerzView from '../features/pain-assessment/views/ArmeSchmerzView.vue'
import EinstellungenView from '../features/settings/views/EinstellungenView.vue'
import LeuchtDauerView from '../views/LeuchtDauerView.vue'
import BlinzeldauerView from '../views/BlinzeldauerView.vue'
import KamerapositionView from '../views/KamerapositionView.vue'

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
      path: '/kameraposition',
      name: 'kameraposition',
      component: KamerapositionView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
  ],
})

export default router
