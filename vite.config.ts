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



  base: '/',



  resolve: {

    alias: {

      '@': fileURLToPath(new URL('./src', import.meta.url))

    },

    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue']

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



  build: {

    outDir: 'dist',

    assetsDir: 'assets',

    sourcemap: true,

    minify: 'esbuild',

    rollupOptions: {

      output: {

        assetFileNames: 'assets/[name]-[hash][extname]',

        chunkFileNames: 'assets/[name]-[hash].js',

        entryFileNames: 'assets/[name]-[hash].js',

      },

    },

  },



  define: {

    __VUE_OPTIONS_API__: true,

    __VUE_PROD_DEVTOOLS__: true,

  },



  assetsInclude: ['**/*.svg'],

})
