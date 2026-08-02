import type { Config } from '@react-router/dev/config'
import { vercelPreset } from '@vercel/react-router/vite'

const isInVercel = process.env.VERCEL === 'true'

const config: Config = {
  ssr: true,
  presets: isInVercel
    ? ([vercelPreset()] as unknown as NonNullable<Config['presets']>)
    : [],
  prerender: ['/'],
  splitRouteModules: true,
}

export default config
