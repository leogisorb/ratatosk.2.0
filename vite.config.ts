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
        // Pfade, die mit /ratatosk.2.0/images/ beginnen, sind externe Ressourcen
        return id.startsWith('/ratatosk.2.0/images/') || id.startsWith('/ratatosk.2.0/')
      },
      output: {
        manualChunks: undefined,
        assetFileNames: (assetInfo) => {
          // Dateien aus public/images/ behalten ihre Struktur
          // Vite kopiert public/images/ automatisch nach dist/images/
          // Nur für importierte Assets (aus src/) verwenden wir assets/
          const name = assetInfo.name || ''
          if (name.includes('images/') || name.startsWith('images/')) {
            // Entferne 'images/' aus dem Pfad, da es bereits im dist/images/ Ordner ist
            const fileName = name.replace(/^images\//, '')
            return `images/${fileName}[extname]`
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
  assetsInclude: ['**/*.svg'], // Behandle SVG-Dateien als Assets
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: true, // Vue DevTools auch in Production-Builds (für Debugging)
  },
})
