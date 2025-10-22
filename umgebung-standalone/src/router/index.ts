import { createRouter, createWebHistory } from 'vue-router'

// Import Umgebung Views
import UmgebungView from '../features/environment/views/UmgebungView.vue'
import BettView from '../features/environment/views/BettView.vue'
import BettVerbenView from '../features/environment/views/BettVerbenView.vue'
import GegenstaendeView from '../features/environment/views/GegenstaendeView.vue'
import GegenstaendeVerbenView from '../features/environment/views/GegenstaendeVerbenView.vue'
import ZimmerView from '../features/environment/views/ZimmerView.vue'
import ZimmerVerbenView from '../features/environment/views/ZimmerVerbenView.vue'
import VerbenView from '../features/environment/views/VerbenView.vue'

const router = createRouter({
  history: createWebHistory('/'),
  routes: [
    {
      path: '/',
      name: 'umgebung',
      component: UmgebungView,
    },
    {
      path: '/bett',
      name: 'bett',
      component: BettView,
    },
    {
      path: '/bett-verben/:bettItem',
      name: 'bett-verben',
      component: BettVerbenView,
    },
    {
      path: '/gegenstaende',
      name: 'gegenstaende',
      component: GegenstaendeView,
    },
    {
      path: '/gegenstaende-verben/:gegenstand',
      name: 'gegenstaende-verben',
      component: GegenstaendeVerbenView,
    },
    {
      path: '/zimmer',
      name: 'zimmer',
      component: ZimmerView,
    },
    {
      path: '/zimmer-verben/:zimmerItem',
      name: 'zimmer-verben',
      component: ZimmerVerbenView,
    },
    {
      path: '/verben/:gegenstand',
      name: 'verben',
      component: VerbenView,
    },
  ],
})

export default router