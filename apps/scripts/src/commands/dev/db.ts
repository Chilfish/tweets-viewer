import type { CommandSpec } from '../../cli/runtime'
import { Option } from 'commander'
import {
  applyMigrations,
  ensureDatabaseReachable,
  ensureDevDatabase,
  ensureLocalEnv,
  ensurePostgresRunning,
} from '../../lib/dev-services'
import { DEFAULT_LOCAL_DATABASE_URL, DEFAULT_LOCAL_PROXY_ENDPOINT } from '../../lib/local-config'

interface DevDbData {
  url: string
  endpoint: string
  steps: string[]
}

export const devDbSpec: CommandSpec<DevDbData> = {
  id: 'dev.db',
  description: '本地库初始化：启动 Postgres、建库、跑迁移、对齐 .env',
  details: '默认地址 `postgres://postgres@localhost:5432/tweets_dev`。\n'
    + '全局 `--dry-run` 只报告步骤，不启服务、不写库、不改 `.env`。',
  examples: [
    'bun run ig dev db',
    'bun run ig dev db --url postgres://postgres@localhost:5433/tweets_dev',
  ],
  options: [
    new Option('--url <url>', '目标数据库地址，默认本机 tweets_dev'),
  ],
  async run(ctx) {
    // 默认只动本机库：绝不能因为 .env 里配了线上地址就顺手建表。
    const url = (ctx.options.url as string | undefined) || DEFAULT_LOCAL_DATABASE_URL
    // 保留已有的本地代理端口（4444 被别的项目占用时常用 4445）。
    const endpoint = process.env.NEON_HTTP_ENDPOINT?.trim() || DEFAULT_LOCAL_PROXY_ENDPOINT
    const steps = [
      'ensurePostgresRunning',
      'ensureDevDatabase',
      'applyMigrations',
      'ensureLocalEnv',
    ]

    if (ctx.dryRun) {
      ctx.log.info(`dry-run：将初始化 ${url}（${steps.join(' → ')}），不启服务、不写库、不改 .env`)
      return {
        data: { url, endpoint, steps },
      }
    }

    ensurePostgresRunning()
    await ensureDevDatabase(url)
    await applyMigrations(url)
    ensureLocalEnv(url, endpoint)
    await ensureDatabaseReachable(url)

    ctx.log.info(`数据库与迁移就绪：${new URL(url).host}${new URL(url).pathname}`)
    ctx.log.line(`
下一步：
  1. 启动代理：bun run ig dev proxy
  2. 抓取入库：bun run ig ins add <账号> --twitter <userName>
`)

    return {
      data: { url, endpoint, steps },
    }
  },
}
