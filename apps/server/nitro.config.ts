import { isLocalMode } from '@tweets-viewer/shared'
import { defineConfig } from 'nitro'
import { env } from '../../env.server'

const localMode = isLocalMode(process.env)
const productionBuild = process.env.NODE_ENV === 'production'

/**
 * 生产构建只允许线上目标。
 *
 * `LOCAL=1` 时 `env.server.ts` 会把数据库指向 localhost，构建产物里的 vars
 * 一旦带上它，部署后 Worker 查不到本机代理，所有请求都会 500。
 * 部署走 `bun run deploy`（固定按线上构建），本地开发用 `NODE_ENV=development`。
 */
if (localMode && productionBuild) {
  throw new Error(
    'LOCAL=1 时不能做生产构建：产物会指向 localhost，部署后数据库查询全部失败。\n'
    + '部署请用 bun run deploy（固定按线上构建），或先设置 LOCAL=0。',
  )
}

export default defineConfig({
  serverEntry: './index.ts',
  compatibilityDate: '2026-01-20',
  preset: 'cloudflare_module',
  cloudflare: {
    deployConfig: true,
    nodeCompat: true,
    wrangler: {
      // name: 'tweet-api-internal',
      name: 'tweet-api',
      observability: {
        logs: {
          enabled: true,
          head_sampling_rate: 0.9,
          invocation_logs: true,
        },
      },
      // 只有本地开发需要把库地址交给 `wrangler dev`；
      // 线上凭据走 Worker secret（`wrangler secret put`），绝不进构建产物。
      ...(localMode
        ? {
            vars: {
              DATABASE_URL: env.DATABASE_URL,
              TWEET_KEYS: env.TWEET_KEYS,
              // 本地开发（LOCAL=1）时指向 `ig dev proxy`；线上不设。
              ...(env.NEON_HTTP_ENDPOINT
                ? { NEON_HTTP_ENDPOINT: env.NEON_HTTP_ENDPOINT }
                : {}),
            },
          }
        : {}),
    },
  },
})
