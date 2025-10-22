import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import PainDialogView from './features/pain-assessment/views/PainDialogView.vue'
import PainScaleView from './features/pain-assessment/views/PainScaleView.vue'
import IchDialogView from './features/ich-dialog/views/IchDialogView.vue'
import UmgebungDialogView from './features/umgebung-dialog/views/UmgebungDialogView.vue'

// Import global CSS
import './assets/main.css'

// Router setup
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/pain-dialog'
    },
    {
      path: '/test-ich',
      redirect: '/ich-dialog'
    },
    {
      path: '/pain-dialog',
      component: PainDialogView
    },
    {
      path: '/pain-scale',
      component: PainScaleView,
      props: route => ({
        selectedBodyPart: route.query.bodyPart || 'Unbekannter Bereich',
        returnRoute: route.query.returnRoute || '/pain-dialog'
      })
    },
    {
      path: '/ich-dialog',
      component: IchDialogView
    },
    {
      path: '/umgebung-dialog',
      component: UmgebungDialogView
    }
  ]
})

// Create app
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')

