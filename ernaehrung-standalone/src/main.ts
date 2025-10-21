import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

// Import global CSS
import './assets/main.css'

// Performance-Optimierungen
import { optimizeGPU, cleanup } from './utils/performance'

// Router setup mit Lazy-Loading
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/ernaehrung'
    },
    {
      path: '/ernaehrung',
      component: () => import('./features/nutrition/views/ErnaehrungView.vue')
    }
  ]
})

// Create app
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Performance-Optimierungen aktivieren
optimizeGPU()

// Cleanup bei App-Unmount
app.config.globalProperties.$cleanup = cleanup

app.mount('#app')

