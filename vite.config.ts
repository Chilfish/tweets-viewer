import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import Components from 'unplugin-vue-components/vite'
import VueDevTools from 'vite-plugin-vue-devtools'

const root = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '~/': `${path.join(root, 'src')}/`,
    },
  },
  plugins: [
    Vue({
      script: {
        propsDestructure: true,
        defineModel: true,
      },
    }),

    // https://github.com/antfu/vite-plugin-components
    Components({
      dts: 'src/types/auto-components.d.ts',
    }),

    // https://github.com/antfu/unocss
    UnoCSS(),

    // https://github.com/webfansplz/vite-plugin-vue-devtools
    VueDevTools(),
  ],
})
