import { VueQueryPlugin } from '@tanstack/vue-query'
import { createHead } from '@unhead/vue'

import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import routes from './routes'

import './assets/index.css'
import './assets/style.css'

createApp(App)
  .use(routes)
  .use(createHead())
  .use(createPinia())
  .use(VueQueryPlugin)
  .mount('#app')
