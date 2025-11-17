import { fileURLToPath, URL } from 'node:url'

import { defineConfig, Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
// @ts-ignore - basicSsl has type issues but works correctly
import basicSsl from '@vitejs/plugin-basic-ssl'

// Plugin, das absolute Pfade in Vue-Templates unverändert lässt
const preserveAbsolutePathsPlugin = (): Plugin => {
  return {
    name: 'preserve-absolute-paths',
    enforce: 'pre',
    resolveId(id) {
      // Ignoriere absolute Pfade, die mit /ratatosk.2.0/ beginnen
      // Diese werden als externe Ressourcen behandelt (nicht als Module)
      if (id.startsWith('/ratatosk.2.0/')) {
        return { id, external: true }
      }
      // SVG-Dateien sollen nicht als Module behandelt werden
      if (id.endsWith('.svg') && !id.startsWith('.')) {
        return null // Lass Vite SVG-Dateien als Assets behandeln
      }
      return null
    },
    load(id) {
      // Verhindere, dass SVG-Dateien als JavaScript-Module geladen werden
      if (id.endsWith('.svg')) {
        return null // Lass Vite SVG-Dateien als Assets behandeln
      }
      return null
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    preserveAbsolutePathsPlugin(),
    vue(),
    vueDevTools(), // Vue DevTools für Debugging aktivieren
    basicSsl(), // HTTPS für localhost (erforderlich für Kamera-API)
  ],
  base: '/ratatosk.2.0/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true, // Sourcemaps für besseres Debugging aktivieren
    minify: 'esbuild',
    rollupOptions: {
      // Markiere absolute Pfade als externe Ressourcen (werden nicht als Imports behandelt)
      external: (id) => {
        // Pfade, die mit /ratatosk.2.0/ beginnen, sind externe Ressourcen
        return id.startsWith('/ratatosk.2.0/')
      },
      output: {
        manualChunks: undefined,
        assetFileNames: (assetInfo) => {
          // Alle Assets in assets/ Ordner (außer favicon)
          const name = assetInfo.name || ''
          if (name === 'favicon.ico' || name === 'favicon.svg') {
            return '[name][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  server: {
    host: true,
    port: 5555,
    https: {} as any, // HTTPS wird durch basicSsl() Plugin konfiguriert, {} als Fallback
    fs: {
      // Erlaube Zugriff auf Dateien außerhalb des Projektverzeichnisses
      strict: false,
    },
    middlewareMode: false,
    hmr: {
      protocol: 'wss',
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: true, // Vue DevTools auch in Production-Builds (für Debugging)
  },
})
