import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import UnoCSS from 'unocss/vite'
import Components from 'unplugin-vue-components/vite'
import VueDevTools from 'vite-plugin-vue-devtools'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

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
    vueJsx(),

    // https://github.com/antfu/vite-plugin-components
    Components({
      dts: 'src/types/auto-components.d.ts',
      resolvers: [
        NaiveUiResolver(),
      ],
    }),

    // https://github.com/antfu/unocss
    UnoCSS(),

    // https://github.com/webfansplz/vite-plugin-vue-devtools
    VueDevTools(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const names = [
            'naive-ui',
          ]
          for (const name of names) {
            if (id.includes(`node_modules/${name}/`)) {
              return name
            }
          }
        },
      },
    },
  },
})
