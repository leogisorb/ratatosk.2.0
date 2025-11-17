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
    load(id) {
      // Verhindere, dass SVG-Dateien als Module geladen werden
      if (id.startsWith('/ratatosk.2.0/') && id.endsWith('.svg')) {
        // Leere Datei zurückgeben, da externe Ressourcen nicht geladen werden sollen
        return ''
      }
      return null
    },
    generateBundle(options, bundle) {
      // Entferne SVG-Imports aus dem gebauten Code
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'chunk' && chunk.code) {
          // Entferne import-Statements für SVG-Dateien
          const svgImportRegex = /import\s+[\w\s,{}]+\s+from\s+["']\/ratatosk\.2\.0\/[^"']+\.svg["'];?/g
          if (svgImportRegex.test(chunk.code)) {
            // Entferne SVG-Imports und ersetze Verwendungen durch direkte Pfade
            chunk.code = chunk.code.replace(svgImportRegex, '')
            // Ersetze Verwendungen der importierten Variablen durch direkte Pfade
            // z.B. wa -> "/ratatosk.2.0/rattenkopf.svg"
            chunk.code = chunk.code.replace(/\bwa\b/g, '"/ratatosk.2.0/rattenkopf.svg"')
            chunk.code = chunk.code.replace(/\bhd\b/g, '"/ratatosk.2.0/GoHome.svg"')
            chunk.code = chunk.code.replace(/\bYo\b/g, '"/ratatosk.2.0/bell.svg"')
            chunk.code = chunk.code.replace(/\bdr\b/g, '"/ratatosk.2.0/comment-dots.svg"')
            chunk.code = chunk.code.replace(/\bfr\b/g, '"/ratatosk.2.0/user.svg"')
            chunk.code = chunk.code.replace(/\bhr\b/g, '"/ratatosk.2.0/headache.svg"')
            chunk.code = chunk.code.replace(/\bgr\b/g, '"/ratatosk.2.0/house-chimney.svg"')
            chunk.code = chunk.code.replace(/\bpr\b/g, '"/ratatosk.2.0/settings-sliders.svg"')
          }
        }
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    preventSvgAsModulePlugin(),
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
