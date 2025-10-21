import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    port: 9999,
    host: '0.0.0.0' // Erlaubt Zugriff von anderen Geräten im Netzwerk
  }
})

