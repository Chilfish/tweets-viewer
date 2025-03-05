import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Vue from '@vitejs/plugin-vue'
import VueJsx from '@vitejs/plugin-vue-jsx'
import autoprefixer from 'autoprefixer'
import tailwind from 'tailwindcss'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

const root = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '~': `${path.join(root, 'src')}`,
    },
  },
  plugins: [
    Vue({
      script: {
        propsDestructure: true,
        defineModel: true,
      },
    }),
    VueJsx(),

    // https://github.com/antfu/vite-plugin-components
    Components({
      dts: 'src/types/auto-components.d.ts',
    }),
  ],
  server: {
    proxy: {
      '/static': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/static/, ''),
      },
      '/api': {
        target: 'http://localhost:8787/v2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  css: {
    postcss: {
      plugins: [tailwind(), autoprefixer()],
    },
  },
})
