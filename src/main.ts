import '@unocss/reset/tailwind.css'
import 'virtual:uno.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@unhead/vue'
import App from './App.vue'
import routes from './routes'

createApp(App)
  .use(routes)
  .use(createHead())
  .use(createPinia())
  .mount('#app')
