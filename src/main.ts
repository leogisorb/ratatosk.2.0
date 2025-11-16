import './shared/styles/BaseLayout.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'

import App from './App.vue'

// Globale Fehlerbehandlung für Browser-Extensions
window.addEventListener('error', (event) => {
  // Unterdrücke Browser-Extension-Fehler
  if (event.message && event.message.includes('listener indicated an asynchronous response')) {
    event.preventDefault()
    console.log('Browser-Extension-Fehler unterdrückt (nicht kritisch)')
    return false
  }
})

window.addEventListener('unhandledrejection', (event) => {
  // Unterdrücke Browser-Extension-Promise-Fehler
  if (event.reason && event.reason.message && event.reason.message.includes('listener indicated an asynchronous response')) {
    event.preventDefault()
    console.log('Browser-Extension-Promise-Fehler unterdrückt (nicht kritisch)')
    return false
  }
})

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
