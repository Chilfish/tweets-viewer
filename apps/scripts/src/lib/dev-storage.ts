import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, openSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { AwsClient } from 'aws4fetch'
import { projectRoot } from './env'
import { isLocalMode, resolveStorage } from './local-config'

/**
 * `LOCAL=1` 时的本地对象存储编排（SILO）。
 *
 * SILO 是 MinIO 的维护分支，S3 API 与 `MINIO_*` 变量契约不变；
 * 健康检查仍是 `/minio/health/live`。与 Postgres、代理一样是独立后台进程，
 * dev 退出后继续运行。启动后建桶并设为匿名只读，浏览器才能直接取图。
 */

const DEFAULT_DATA_DIR = 'cache/silo-data'

export interface SiloResult {
  started: boolean
  endpoint: string
  bucket: string
  publicBase: string
  /** 没有启动时的原因（未安装 / 健康检查失败）。 */
  reason?: string
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

export function findSiloBinary(): string | undefined {
  const fromWhere = (name: string): string | undefined => (process.platform === 'win32'
    ? commandOutput('where', [name])?.split(/\r?\n/)[0]?.trim()
    : commandOutput('which', [name]))

  const candidates = [
    process.env.SILO_BIN,
    fromWhere('silo'),
    // 已装 MinIO 的机器同样可用；两者的 server 命令一致。
    process.env.MINIO_BIN,
    fromWhere('minio'),
    process.platform === 'win32' && process.env.SCOOP && join(process.env.SCOOP, 'apps', 'silo', 'current', 'silo.exe'),
    process.platform === 'win32' && join(process.env.USERPROFILE ?? '', 'scoop', 'apps', 'silo', 'current', 'silo.exe'),
    process.platform === 'win32' && join('C:\\', 'Scoop', 'apps', 'silo', 'current', 'silo.exe'),
    process.platform !== 'win32' && '/usr/local/bin/silo',
    process.platform !== 'win32' && '/opt/homebrew/bin/silo',
  ]

  return candidates.find(path => path !== undefined && path !== false && existsSync(path)) as string | undefined
}

async function healthy(endpoint: string): Promise<boolean> {
  try {
    const response = await fetch(`${endpoint}/minio/health/live`, {
      signal: AbortSignal.timeout(1500),
    })
    return response.ok
  }
  catch {
    return false
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolveSleep => setTimeout(resolveSleep, ms))
}

function logPath(): string {
  const path = resolve(projectRoot, 'logs', 'silo.log')
  mkdirSync(dirname(path), { recursive: true })
  return path
}

function readLogTail(path: string, lines = 10): string {
  if (!existsSync(path))
    return ''
  return readFileSync(path, 'utf8').trimEnd().split(/\r?\n/).slice(-lines).join('\n')
}

function signedFetch(url: string, init: RequestInit): Promise<Response> {
  const storage = resolveStorage()
  const client = new AwsClient({
    accessKeyId: storage.accessKeyId,
    secretAccessKey: storage.secretAccessKey,
    service: 's3',
    region: process.env.S3_REGION ?? 'us-east-1',
  })
  return client.fetch(url, init)
}

/** 创建桶并设为匿名只读；重复执行没有副作用。 */
export async function ensureLocalBucket(): Promise<void> {
  const storage = resolveStorage()
  const base = `${storage.endpoint}/${storage.bucket}`

  const created = await signedFetch(base, { method: 'PUT' })
  if (!created.ok && created.status !== 409) {
    console.warn(`[dev] 创建本地桶失败（HTTP ${created.status}）：${await created.text().catch(() => '')}`)
    return
  }

  const policy = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: {
          AWS: ['*'],
        },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${storage.bucket}/*`],
      },
    ],
  }
  const applied = await signedFetch(`${base}?policy`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(policy),
  })
  if (!applied.ok) {
    console.warn(`[dev] 设置本地桶匿名读失败（HTTP ${applied.status}）：页面取图会 403`)
  }
}

/** 启动 SILO 并准备桶；未安装时返回 `started: false` 与原因，不阻塞读库。 */
export async function ensureSiloRunning(
  options: { dataDir?: string } = {},
): Promise<SiloResult> {
  const storage = resolveStorage()
  const endpoint = storage.endpoint

  if (!isLocalMode()) {
    return {
      started: false,
      endpoint,
      bucket: storage.bucket,
      publicBase: storage.publicBase,
      reason: 'LOCAL 未开启',
    }
  }

  if (await healthy(endpoint)) {
    console.log(`[dev] SILO 已在运行（${endpoint}）`)
    await ensureLocalBucket()
    return {
      started: true,
      endpoint,
      bucket: storage.bucket,
      publicBase: storage.publicBase,
    }
  }

  const binary = findSiloBinary()
  if (!binary) {
    return {
      started: false,
      endpoint,
      bucket: storage.bucket,
      publicBase: storage.publicBase,
      reason: '未找到 silo 可执行文件（下载后加入 PATH，或用 SILO_BIN 指定路径）',
    }
  }

  const dataDir = resolve(options.dataDir ?? process.env.SILO_DATA ?? DEFAULT_DATA_DIR)
  mkdirSync(dataDir, { recursive: true })

  const parsed = new URL(endpoint)
  const port = parsed.port || '9000'
  const consolePort = process.env.SILO_CONSOLE_PORT ?? String(Number(port) + 1)
  const log = logPath()
  const fd = openSync(log, 'a')
  const env = {
    ...process.env,
    MINIO_ROOT_USER: storage.accessKeyId,
    MINIO_ROOT_PASSWORD: storage.secretAccessKey,
    MINIO_API_CORS_ALLOW_ORIGIN: process.env.MINIO_API_CORS_ALLOW_ORIGIN ?? '*',
  }
  const args = [
    'server',
    dataDir,
    '--address',
    `${parsed.hostname}:${port}`,
    '--console-address',
    `127.0.0.1:${consolePort}`,
  ]

  console.log(`[dev] 启动 SILO（${dataDir}）…`)
  const child = process.platform === 'win32'
    ? spawn('cmd.exe', [
        '/c',
        'start',
        '',
        '/b',
        binary,
        ...args,
      ], {
        cwd: projectRoot,
        detached: true,
        windowsHide: true,
        stdio: ['ignore', fd, fd],
        env,
      })
    : spawn(binary, args, {
        cwd: projectRoot,
        detached: true,
        stdio: ['ignore', fd, fd],
        env,
      })
  child.unref()

  for (let attempt = 0; attempt < 50; attempt++) {
    await sleep(200)
    if (await healthy(endpoint)) {
      console.log(`[dev] SILO 就绪：${endpoint}（数据 ${dataDir}）`)
      await ensureLocalBucket()
      return {
        started: true,
        endpoint,
        bucket: storage.bucket,
        publicBase: storage.publicBase,
      }
    }
  }

  const tail = readLogTail(log)
  throw new Error(`SILO 启动失败（${endpoint}）${tail
    ? `：\n${tail}`
    : '，见 logs/silo.log'}`)
}
