import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'

import vue from '@vitejs/plugin-vue'

import vueDevTools from 'vite-plugin-vue-devtools'

// @ts-ignore - basicSsl has type issues but works correctly

import basicSsl from '@vitejs/plugin-basic-ssl'



// https://vite.dev/config/

export default defineConfig({

  plugins: [

    vue(),

    vueDevTools(),

    basicSsl(),

  ],

  base: '/ratatosk.2.0/',

  build: {

    outDir: 'dist',

    assetsDir: 'assets',

    sourcemap: true,

    minify: 'esbuild',

    rollupOptions: {

      // Markiere absolute Pfade als externe Ressourcen (werden nicht als Imports behandelt)

      external: (id) => {

        // Alle Pfade, die mit /ratatosk.2.0/ beginnen, sind externe Ressourcen aus public/

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

    https: {} as any,

    fs: {

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

    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue']

  },

  define: {

    __VUE_OPTIONS_API__: true,

    __VUE_PROD_DEVTOOLS__: true,

  },

  // Stelle sicher, dass SVGs als Assets behandelt werden

  assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.ico', '**/*.wav'],

})
