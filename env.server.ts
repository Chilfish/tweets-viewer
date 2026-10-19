import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseDatabaseUrls } from '@tweets-viewer/shared'
import { config } from 'dotenv'
import { z } from 'zod'

const rootPath = path.dirname(fileURLToPath(import.meta.url))

config({
  path: path.join(rootPath, '.env'),
  quiet: true,
})

/**
 * Server environment schema definition with validation rules
 */
const serverEnvSchema = z.object({
  ENVIRONMENT: z.enum(['development', 'production']).default('development'),
  TWEET_KEYS: z.string().min(1),
  /**
   * Postgres 连接串。支持逗号分隔多地址（`url1,url2`），
   * 供定时抓取（`apps/scripts/src/dailyUpdate.ts`）对多个归档库并发更新；
   * 地址本身若含逗号需写成 `%2C`。单连接消费者只用主库（首个地址）。
   */
  DATABASE_URL: z
    .string()
    .min(1)
    .superRefine((value, ctx) => {
      const urls = parseDatabaseUrls(value)

      if (!urls.length) {
        ctx.addIssue({ code: 'custom', message: 'DATABASE_URL is empty' })
        return
      }

      if (urls.some(url => !z.url().safeParse(url).success))
        ctx.addIssue({ code: 'custom', message: 'DATABASE_URL contains an entry that is not a valid url' })
    }),
  // 前端 web-react 的 API 基址（不含 `/v3`，`/v3` 由客户端拼接）。
  // 由 vite.config.ts 注入到客户端 bundle（`import.meta.env.VITE_API_URL`），
  // 也用于 dev server 的 `/api` 反向代理。
  API_URL: z.url().default('https://tweet-api.chilfish.top'),
})

/**
 * Validated server environment variables
 */
const validatedEnv = (() => {
  const parsed = serverEnvSchema.safeParse(process.env)

  if (parsed.success === false) {
    console.error(
      '❌ Invalid environment variables:',
      z.treeifyError(parsed.error).properties,
    )
    throw new Error('Invalid environment variables')
  }

  return parsed.data
})()

/**
 * 全部目标库地址（`DATABASE_URL` 以逗号分隔，首个为主库）。
 *
 * 每日抓取按此列表对每个归档库并发执行一轮更新；其余单连接消费者用 `env.DATABASE_URL`。
 */
export const DATABASE_URLS: readonly string[] = parseDatabaseUrls(validatedEnv.DATABASE_URL)

/**
 * Validated server environment variables
 * （`DATABASE_URL` 收敛为主库 = 首个地址，`DATABASE_URLS` 为完整列表）
 */
export const env = Object.freeze({
  ...validatedEnv,
  DATABASE_URL: DATABASE_URLS[0]!,
})

// Environment convenience exports
export const isDevelopment = env.ENVIRONMENT === 'development'
export const isProduction = env.ENVIRONMENT === 'production'

/**
 * Returns a subset of environment variables that are safe to expose to the client.
 * SECURITY WARNING: Be careful what you expose here - never include API keys,
 * secrets, or sensitive information as these will be visible in the browser.
 */
export function getPublicEnv() {
  return {
    // 暴露给客户端的公共变量（均非敏感信息）
    API_URL: env.API_URL,
  }
}

export type PublicEnv = ReturnType<typeof getPublicEnv>
