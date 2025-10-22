import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './assets/main.css'

// Import Views
import HomeView from './features/navigation/views/HomeView.vue'
import IchDialogView from './features/ich-dialog/views/IchDialogView.vue'
import ErnaehrungView from './features/nutrition/views/ErnaehrungView.vue'
import BewegungView from './features/movement/views/BewegungView.vue'
import HygieneView from './features/hygiene/views/HygieneView.vue'
import GefuehleView from './features/feelings/views/GefuehleView.vue'
import KleidungView from './features/clothing/views/KleidungView.vue'

// Router Setup
const routes = [
  { path: '/', component: HomeView },
  { path: '/ich-dialog', component: IchDialogView },
  { path: '/ernaehrung', component: ErnaehrungView },
  { path: '/bewegung', component: BewegungView },
  { path: '/hygiene', component: HygieneView },
  { path: '/gefuehle', component: GefuehleView },
  { path: '/kleidung', component: KleidungView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// App Setup
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')