import type { Config } from '@react-router/dev/config'
import { vercelPreset } from '@vercel/react-router/vite'

const isInVercel = process.env.VERCEL === 'true'

const config: Config = {
  ssr: true,
  presets: [vercelPreset()],
  prerender: ['/'],
  splitRouteModules: true,
}

if (!isInVercel) {
  config.presets = []
}

export default config
