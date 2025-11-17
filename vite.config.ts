import { fileURLToPath, URL } from 'node:url'

import { defineConfig, Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
// @ts-ignore - basicSsl has type issues but works correctly
import basicSsl from '@vitejs/plugin-basic-ssl'

// Plugin, das verhindert, dass absolute SVG-Pfade als Module behandelt werden
const preventSvgAsModulePlugin = (): Plugin => {
  return {
    name: 'prevent-svg-as-module',
    enforce: 'pre',
    resolveId(id) {
      // Verhindere, dass absolute Pfade, die mit /ratatosk.2.0/ beginnen und auf .svg enden, als Module behandelt werden
      if (id.startsWith('/ratatosk.2.0/') && id.endsWith('.svg')) {
        // Markiere als externe Ressource, damit Vite sie nicht als Modul behandelt
        return { id, external: true }
      }
      return null
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    preventSvgAsModulePlugin(),
    vue({
      template: {
        compilerOptions: {
          // Verhindere, dass Vite SVG-Pfade in Templates zu Imports transformiert
          isCustomElement: (tag) => false,
        },
        transformAssetUrls: {
          // Behandle absolute Pfade nicht als Assets
          base: null,
        },
      },
    }),
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
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  server: {
    host: true,
    port: 5555,
    https: {} as any, // HTTPS wird durch basicSsl() Plugin konfiguriert, {} als Fallback
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
