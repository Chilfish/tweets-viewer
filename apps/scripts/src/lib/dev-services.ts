import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, openSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { connect } from 'node:net'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Client, Pool } from 'pg'
import { projectRoot } from './env'
import { DEFAULT_LOCAL_PROXY_ENDPOINT, isLocalMode } from './local-config'

/**
 * 本地 Postgres 的编排：定位可执行文件、启停、建库、跑迁移、把本地段写进 `.env`。
 *
 * 与 yumemita-stream-dashboard 的做法一致：Postgres 是独立后台进程，
 * 不随命令退出而停止（`dev proxy` 除外，它在前台跑）。
 */

export interface PostgresInstall {
  pgCtl: string
  dataDir: string
}

function commandOutput(command: string, args: string[]): string | undefined {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    windowsHide: true,
  })
  if (result.status !== 0)
    return undefined
  return result.stdout.trim()
}

function listDir(path: string): string[] {
  try {
    return readdirSync(path).map(name => join(path, name))
  }
  catch {
    return []
  }
}

function firstExisting(paths: (string | undefined)[]): string | undefined {
  return paths.find(path => path !== undefined && existsSync(path))
}

function findBinary(dirs: (string | undefined)[], names: string[]): string | undefined {
  const paths = dirs.flatMap(dir => (dir
    ? names.map(name => join(dir, name))
    : []))
  return firstExisting(paths)
}

function resolveScoopPrefix(): string | undefined {
  if (process.platform !== 'win32')
    return undefined
  const fromCli = commandOutput('scoop', ['prefix', 'postgresql'])
  if (fromCli && existsSync(fromCli))
    return fromCli
  return undefined
}

export function resolvePostgresInstall(): PostgresInstall | undefined {
  if (process.platform === 'win32') {
    const scoopPrefix = resolveScoopPrefix()
    const programDirs = listDir(join(process.env.ProgramFiles ?? 'C:\\Program Files', 'PostgreSQL'))
      .sort()
      .reverse()

    const fromWhere = commandOutput('where', ['pg_ctl'])?.split(/\r?\n/)[0]?.trim()
    const pgCtl = firstExisting([
      process.env.PG_CTL,
      fromWhere,
      scoopPrefix && join(scoopPrefix, 'bin', 'pg_ctl.exe'),
      process.env.SCOOP && join(process.env.SCOOP, 'apps', 'postgresql', 'current', 'bin', 'pg_ctl.exe'),
      join(process.env.USERPROFILE ?? '', 'scoop', 'apps', 'postgresql', 'current', 'bin', 'pg_ctl.exe'),
      join('C:\\', 'Scoop', 'apps', 'postgresql', 'current', 'bin', 'pg_ctl.exe'),
      ...programDirs.map(dir => join(dir, 'bin', 'pg_ctl.exe')),
    ])

    if (!pgCtl)
      return undefined

    const dataDir = firstExisting([
      process.env.PGDATA,
      scoopPrefix && join(scoopPrefix, 'data'),
      process.env.SCOOP && join(process.env.SCOOP, 'persist', 'postgresql', 'data'),
      join(process.env.USERPROFILE ?? '', 'scoop', 'persist', 'postgresql', 'data'),
      join('C:\\', 'Scoop', 'persist', 'postgresql', 'data'),
      ...programDirs.map(dir => join(dir, 'data')),
    ])

    return dataDir
      ? { pgCtl, dataDir }
      : undefined
  }

  const pgConfigBindir = commandOutput('pg_config', ['--bindir'])
  const versionedBins = [
    ...listDir('/usr/lib/postgresql').map(dir => join(dir, 'bin')),
    ...listDir('/opt/homebrew/opt').filter(dir => /postgresql/.test(dir)).map(dir => join(dir, 'bin')),
    ...listDir('/usr/local/opt').filter(dir => /postgresql/.test(dir)).map(dir => join(dir, 'bin')),
  ]
  const fromPath = commandOutput('which', ['pg_ctl'])

  const pgCtl = firstExisting([
    process.env.PG_CTL,
    fromPath,
    pgConfigBindir && join(pgConfigBindir, 'pg_ctl'),
    findBinary(versionedBins, ['pg_ctl']),
  ])
  if (!pgCtl)
    return undefined

  const dataDir = firstExisting([
    process.env.PGDATA,
    ...listDir('/opt/homebrew/var').filter(dir => /postgres/.test(dir)),
    ...listDir('/usr/local/var').filter(dir => /postgres/.test(dir)),
    ...listDir('/var/lib/postgresql').map(dir => join(dir, 'main')),
  ])

  return dataDir
    ? { pgCtl, dataDir }
    : undefined
}

async function isPortOpen(host: string, port: number, timeoutMs = 1000): Promise<boolean> {
  return await new Promise((resolvePort) => {
    const socket = connect({ host, port })
    const finish = (open: boolean) => {
      socket.destroy()
      resolvePort(open)
    }
    socket.setTimeout(timeoutMs)
    socket.once('connect', () => finish(true))
    socket.once('timeout', () => finish(false))
    socket.once('error', () => finish(false))
  })
}

function logPath(name: string): string {
  const path = resolve(projectRoot, 'logs', name)
  mkdirSync(dirname(path), { recursive: true })
  return path
}

function readLogTail(path: string, lines = 10): string {
  if (!existsSync(path))
    return ''
  const content = readFileSync(path, 'utf8').trimEnd().split(/\r?\n/)
  return content.slice(-lines).join('\n')
}

/** 启动本机 Postgres；已在运行则跳过。 */
export function ensurePostgresRunning(): void {
  const install = resolvePostgresInstall()
  if (!install) {
    throw new Error(
      '未找到 pg_ctl（或数据目录）。请安装 PostgreSQL，并设置 PGDATA 指向数据目录；'
      + '详见 docs/engineering/local-database.md',
    )
  }

  const status = spawnSync(install.pgCtl, ['status', '-D', install.dataDir], {
    encoding: 'utf8',
    windowsHide: true,
  })
  if (status.status === 0) {
    console.log(`[dev] Postgres 已在运行（${install.dataDir}）`)
    return
  }
  if (status.status === 4) {
    throw new Error(`Postgres 数据目录不可用：${install.dataDir}（${status.stderr?.trim() || status.stdout?.trim()}）`)
  }

  const log = logPath('postgres.log')
  console.log(`[dev] 启动 Postgres（${install.dataDir}）…`)
  // stdio 必须 ignore：postmaster 会继承 pg_ctl 的管道，Bun 的 spawnSync 会一直等 EOF。
  const start = spawnSync(
    install.pgCtl,
    [
      'start',
      '-D',
      install.dataDir,
      '-l',
      log,
      '-w',
      '-t',
      '60',
    ],
    { stdio: 'ignore', windowsHide: true },
  )
  if (start.status !== 0) {
    const tail = readLogTail(log)
    throw new Error(`Postgres 启动失败（退出码 ${start.status ?? 'signal'}，日志 ${log}）${tail
      ? `：\n${tail}`
      : ''}`)
  }
}

/** 创建目标数据库（不存在时）。 */
export async function ensureDevDatabase(databaseUrl: string): Promise<void> {
  const database = new URL(databaseUrl).pathname.replace(/^\//, '')
  if (!/^[a-z0-9_]+$/.test(database)) {
    throw new Error(`数据库名不合法：${database}`)
  }

  const admin = new URL(databaseUrl)
  admin.pathname = '/postgres'
  const client = new Client({
    connectionString: admin.toString(),
  })

  await client.connect()
  try {
    const { rowCount } = await client.query('select 1 from pg_database where datname = $1', [database])
    if (!rowCount) {
      // 标识符不能参数化；database 已用白名单校验。
      await client.query(`create database "${database}"`)
      console.log(`[dev] 已创建数据库：${database}`)
    }
  }
  finally {
    await client.end()
  }
}

/** 应用 `packages/database/migrations` 下的迁移。 */
export async function applyMigrations(databaseUrl: string): Promise<void> {
  const pool = new Pool({ connectionString: databaseUrl })
  try {
    await migrate(drizzle({ client: pool }), {
      migrationsFolder: resolve(projectRoot, 'packages/database/migrations'),
    })
  }
  finally {
    await pool.end()
  }
}

/** 覆盖已有 key、保留其他行；用于把 `.env` 的本地段指向本机。 */
function upsertEnvValues(content: string, values: Record<string, string>): string {
  const pending = new Map(Object.entries(values))
  const lines = content.length > 0
    ? content.split(/\r?\n/)
    : []
  const result = lines.map((line) => {
    const match = /^\s*(\w+)\s*=/.exec(line)
    if (!match)
      return line
    const key = match[1] as string
    if (!pending.has(key))
      return line
    const value = pending.get(key) as string
    pending.delete(key)
    return `${key}=${value}`
  })
  for (const [key, value] of pending) result.push(`${key}=${value}`)
  return `${result.join('\n').replace(/\n+$/, '')}\n`
}

/** 把本地库配置写回根目录 `.env`，不动 `TWEET_KEYS` 等既有行。 */
export function ensureLocalEnv(databaseUrl: string, endpoint = DEFAULT_LOCAL_PROXY_ENDPOINT): void {
  const path = resolve(projectRoot, '.env')
  const values: Record<string, string> = {
    LOCAL: '1',
    DATABASE_URL: databaseUrl,
    NEON_HTTP_ENDPOINT: endpoint,
  }

  if (!existsSync(path)) {
    writeFileSync(
      path,
      `# 本地开发配置（LOCAL=1 时生效）；见 docs/engineering/local-database.md\n${Object.entries(values)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n')}\n`,
    )
    console.log('[dev] 已写入 .env')
    return
  }

  const content = readFileSync(path, 'utf8')
  const parsed = new Map<string, string>()
  for (const line of content.split(/\r?\n/)) {
    const match = /^\s*(\w+)\s*=(.*)$/.exec(line)
    if (match)
      parsed.set(match[1] as string, match[2].trim())
  }

  if (!isLocalMode()) {
    // 显式 LOCAL=0 时只补缺的键，不改已有值。
    const missing = Object.entries(values).filter(([key]) => parsed.get(key) === undefined)
    if (missing.length === 0)
      return
    const prefix = content.endsWith('\n')
      ? content
      : `${content}\n`
    writeFileSync(path, `${prefix}${missing.map(([key, value]) => `${key}=${value}`).join('\n')}\n`)
    console.log(`[dev] .env 已补充：${missing.map(([key]) => key).join(' / ')}`)
    return
  }

  // 覆盖前把原来的远程地址留一份，切回线上时不用重新找连接串。
  const current = parsed.get('DATABASE_URL')
  if (current && !isLocalUrl(current) && parsed.get('DATABASE_URL_REMOTE') === undefined) {
    values.DATABASE_URL_REMOTE = current
    console.log('[dev] 原 DATABASE_URL 已另存为 DATABASE_URL_REMOTE')
  }

  const next = upsertEnvValues(content, values)
  if (next !== content) {
    writeFileSync(path, next)
    console.log(`[dev] .env 已切到本地：${Object.keys(values).join(' / ')}`)
  }
}

function isLocalUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return [
      'localhost',
      '127.0.0.1',
      '::1',
      '0.0.0.0',
    ].includes(hostname)
  }
  catch {
    return false
  }
}

/** 端口检查，代理启动后用来确认真的连上了。 */
export async function ensureDatabaseReachable(databaseUrl: string): Promise<void> {
  const parsed = new URL(databaseUrl)
  const port = Number(parsed.port || 5432)
  if (!(await isPortOpen(parsed.hostname, port))) {
    throw new Error(`Postgres 已启动但 ${parsed.hostname}:${port} 不可连接；检查 pg_hba.conf 与监听地址`)
  }
}

interface ProxyHealth {
  ok: boolean
  pid?: number
  host?: string
  database?: string
}

async function getProxyHealth(endpoint: string): Promise<ProxyHealth | undefined> {
  try {
    const response = await fetch(new URL('/health', endpoint), {
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

function sleep(ms: number): Promise<void> {
  return new Promise(resolveSleep => setTimeout(resolveSleep, ms))
}

/**
 * 确保 `/sql` 代理在后台运行；`bun run dev` 用它把本地库接进 workerd。
 *
 * 已在运行且连着同一个库时直接复用；端口被别的库占用时报错，
 * 不静默连错库。
 */
export async function ensureProxyRunning(endpoint: string, databaseUrl: string): Promise<void> {
  const url = new URL(endpoint)
  if (!isLocalUrl(endpoint)) {
    console.log(`[dev] NEON_HTTP_ENDPOINT 不是本机地址，跳过开发代理：${endpoint}`)
    return
  }

  const host = new URL(databaseUrl).host
  const database = new URL(databaseUrl).pathname.slice(1)

  const health = await getProxyHealth(endpoint)
  if (health?.ok) {
    if (health.host === host && health.database === database) {
      console.log(`[dev] 复用已运行的代理（pid ${health.pid ?? '?'}）：${host}/${database}`)
      return
    }
    throw new Error(
      `端口 ${url.port} 已被另一个代理占用（pid ${health.pid ?? '?'}，连着 ${health.host ?? '?'}/${health.database ?? '?'}），`
      + `当前需要 ${host}/${database}。改 .env 的 NEON_HTTP_ENDPOINT 换端口`,
    )
  }

  const log = logPath('dev-db-proxy.log')
  const fd = openSync(log, 'a')
  const script = resolve(projectRoot, 'apps/scripts/src/cli.ts')
  const env = { ...process.env, DATABASE_URL: databaseUrl, NEON_HTTP_ENDPOINT: endpoint }

  if (process.platform === 'win32') {
    // `start` 让代理脱离父进程树：关掉 dev 终端不会带走它。
    const child = spawn('cmd.exe', [
      '/c',
      'start',
      '',
      '/b',
      process.execPath,
      script,
      'dev',
      'proxy',
    ], {
      cwd: projectRoot,
      detached: true,
      windowsHide: true,
      stdio: ['ignore', fd, fd],
      env,
    })
    child.unref()
  }
  else {
    const child = spawn(process.execPath, [script, 'dev', 'proxy'], {
      cwd: projectRoot,
      detached: true,
      stdio: ['ignore', fd, fd],
      env,
    })
    child.unref()
  }
  console.log('[dev] 启动 Neon 代理（日志 logs/dev-db-proxy.log）')

  for (let attempt = 0; attempt < 50; attempt++) {
    await sleep(200)
    const started = await getProxyHealth(endpoint)
    if (started?.ok) {
      console.log(`[dev] 代理就绪（pid ${started.pid ?? '?'}）：${endpoint} -> ${host}/${database}`)
      return
    }
  }

  throw new Error(`代理启动失败（${endpoint}），见 logs/dev-db-proxy.log`)
}
