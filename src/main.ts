import '@unocss/reset/tailwind.css'
import 'virtual:uno.css'

import { createApp } from 'vue'
import App from './App.vue'
import routes from './routes'

createApp(App)
  .use(routes)
  .mount('#app')
