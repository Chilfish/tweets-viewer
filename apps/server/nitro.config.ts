import { defineNitroConfig } from 'nitro/config'
import { env } from '../../env.server'

export default defineNitroConfig({
  serverEntry: './index.ts',
  compatibilityDate: '2026-01-20',
  preset: 'cloudflare_module',
  cloudflare: {
    deployConfig: true,
    nodeCompat: true,
    wrangler: {
      name: 'tweet-api',
      observability: {
        logs: {
          enabled: true,
          head_sampling_rate: 0.9,
          invocation_logs: true,
        },
      },
      vars: {
        DATABASE_URL: env.DATABASE_URL,
        TWEET_KEYS: env.TWEET_KEYS,
      },
    },
  },
})
