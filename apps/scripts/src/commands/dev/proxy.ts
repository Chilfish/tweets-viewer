import type { CommandSpec } from '../../cli/runtime'
/**
 * 本地开发代理：把 Neon 的 HTTP 查询协议转发到本机 Postgres。
 *
 * `@neondatabase/serverless` 的 HTTP 驱动只会说 Neon 的 `POST /sql`，
 * 本机 Postgres 只认 TCP；workerd 更是没有 socket。这层代理把两者接上，
 * 让本地与线上走同一份查询代码。
 */
import process from 'node:process'
import { Option } from 'commander'
import { Pool } from 'pg'
import { CliError, ConfigError } from '../../cli/exit'
import { isLocalDatabaseUrl, resolveDatabaseUrl } from '../../lib/local-config'

interface QueryRequest {
  query: string
  params?: unknown[]
}

interface QueryResult {
  command: string | null
  rowCount: number | null
  fields: { name: string, dataTypeID: number }[]
  rows: unknown[][]
}

interface DevProxyData {
  port: number
  databaseUrl: string
  host: string
  database: string
  listening: boolean
}

interface ProxyHealth {
  ok: boolean
  pid?: number
  host?: string
  database?: string
}

/** 端口优先级：`NEON_HTTP_ENDPOINT` 的端口 → `TWEETS_DB_PROXY_PORT` → 4444。 */
function defaultPort(): number {
  const endpoint = process.env.NEON_HTTP_ENDPOINT?.trim()
  if (endpoint) {
    try {
      const port = new URL(endpoint).port
      if (port)
        return Number(port)
    }
    catch {
      // 非法地址交给下面的回退值
    }
  }
  return Number(process.env.TWEETS_DB_PROXY_PORT ?? 4444)
}

/** 端口上已经有代理时读它的 /health，避免把别的库当成自己的。 */
async function probeHealth(port: number): Promise<ProxyHealth | undefined> {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`, {
      signal: AbortSignal.timeout(1500),
    })
    if (!response.ok)
      return undefined
    return await response.json() as ProxyHealth
  }
  catch {
    return undefined
  }
}

export const devProxySpec: CommandSpec<DevProxyData> = {
  id: 'dev.proxy',
  description: '前台启动 Neon HTTP 兼容代理，把 /sql 转发到本机 Postgres',
  details: '只接受本机 `DATABASE_URL`，避免把线上库暴露到 localhost。\n'
    + '服务在前台运行，Ctrl-C 结束。端口用 `TWEETS_DB_PROXY_PORT` 覆盖。',
  examples: [
    'bun run ig dev proxy',
    'TWEETS_DB_PROXY_PORT=4445 bun run ig dev proxy',
  ],
  options: [
    new Option('--port <n>', '监听端口，默认 TWEETS_DB_PROXY_PORT 或 4444'),
  ],
  async run(ctx) {
    const databaseUrl = resolveDatabaseUrl()
    if (!isLocalDatabaseUrl(databaseUrl)) {
      throw new CliError(`dev proxy 只接受本地数据库地址，当前是 ${new URL(databaseUrl).host}`, {
        code: 'NON_LOCAL_DATABASE',
        hint: '把 .env 的 DATABASE_URL 指回本机，或设置 LOCAL=1',
        context: { databaseUrl },
      })
    }

    const port = ctx.options.port === undefined
      ? defaultPort()
      : ctx.integer('port', 4444, 1)

    const target = new URL(databaseUrl)
    const database = target.pathname.slice(1)
    const data: DevProxyData = {
      port,
      databaseUrl,
      host: target.host,
      database,
      listening: false,
    }

    if (ctx.dryRun) {
      ctx.log.info(`dry-run：将在 http://127.0.0.1:${port}/sql 转发到 ${target.host}/${database}，不启动服务`)
      return { data }
    }

    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
      throw new ConfigError(`端口不合法：${port}`, {
        code: 'INVALID_PORT',
        context: { port },
      })
    }

    const existing = await probeHealth(port)
    if (existing?.ok) {
      if (existing.host === target.host && existing.database === database) {
        ctx.log.info(`复用已运行的代理（pid ${existing.pid ?? '?'}）：${target.host}/${database}`)
        return {
          data: { ...data, listening: true },
        }
      }
      throw new CliError(
        `端口 ${port} 已被另一个代理占用（pid ${existing.pid ?? '?'}，连着 ${existing.host ?? '?'}/${existing.database ?? '?'}）`,
        {
          code: 'PORT_IN_USE',
          hint: '换端口：TWEETS_DB_PROXY_PORT=4445 bun run ig dev proxy（同时改 .env 的 NEON_HTTP_ENDPOINT）',
          context: { port, occupiedBy: existing },
        },
      )
    }

    const pool = new Pool({
      connectionString: databaseUrl,
      // 返回原始文本，交给 Neon 驱动按 dataTypeID 解析。
      types: {
        getTypeParser: () => (value: string) => value,
      },
    })

    let queries = 0
    let requests = 0

    const runQuery = async (request: QueryRequest): Promise<QueryResult> => {
      queries += 1
      const result = await pool.query({
        text: request.query,
        values: (request.params ?? []) as unknown[],
        rowMode: 'array',
      })
      return {
        command: result.command,
        rowCount: result.rowCount,
        fields: result.fields.map(field => ({ name: field.name, dataTypeID: field.dataTypeID })),
        rows: result.rows as unknown[][],
      }
    }

    const server = Bun.serve({
      port,
      async fetch(request: Request) {
        const url = new URL(request.url)
        if (url.pathname === '/health') {
          return Response.json({
            ok: true,
            pid: process.pid,
            host: target.host,
            database,
            queries,
            requests,
          })
        }
        if (request.method !== 'POST' || url.pathname !== '/sql') {
          return new Response('not found', { status: 404 })
        }

        requests += 1
        try {
          const body = await request.json() as QueryRequest & { queries?: QueryRequest[] }
          if (Array.isArray(body.queries)) {
            const results: QueryResult[] = []
            for (const query of body.queries) {
              results.push(await runQuery(query))
            }
            return Response.json({ results })
          }
          return Response.json(await runQuery(body))
        }
        catch (error) {
          const message = error instanceof Error
            ? error.message
            : String(error)
          return Response.json({ message }, { status: 400 })
        }
      },
    })

    data.port = server.port ?? port
    data.listening = true
    ctx.log.info(`http://127.0.0.1:${data.port}/sql -> ${target.host}/${database}`)

    return { data }
  },
}
