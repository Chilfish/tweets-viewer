import type { CommandSpec } from '@chilfish/devkit/cli'
import { spawnSync } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { CliError } from '@chilfish/devkit/cli'
import { applyOnlineEnv, readOnlineTarget } from '@chilfish/devkit/env'
import { Option } from 'commander'
import { devkit } from '../../dev.config'
import { findForbiddenVars, findLocalAddresses } from '../lib/deploy-scan'
import { projectRoot } from '../lib/env'

const SERVER_ROOT = join(projectRoot, 'apps', 'server')
const OUTPUT_ROOT = join(SERVER_ROOT, '.output')
const WRANGLER_CONFIG = join(OUTPUT_ROOT, 'server', 'wrangler.json')

interface DeployData {
  databaseHost: string
  built: boolean
  deployed: boolean
}

export interface DeployOptions {
  /** `--no-deploy`：只构建并校验产物。 */
  noDeploy?: boolean
  /** 全局 `--dry-run`：只报告步骤，不构建、不部署。 */
  dryRun?: boolean
  log?: { info: (message: string) => void, warn: (message: string) => void }
}

function runStep(args: string[], label: string): void {
  const result = spawnSync(args[0] as string, args.slice(1), {
    cwd: SERVER_ROOT,
    env: process.env,
    stdio: 'inherit',
  })
  if (result.error) {
    throw new CliError(`${label} 启动失败：${result.error.message}`, {
      code: 'COMMAND_FAILED',
      hint: `手动跑一遍看细节：${args.join(' ')}`,
      cause: result.error,
    })
  }
  if (result.status !== 0) {
    throw new CliError(`${label} 失败（退出码 ${result.status ?? 'unknown'}）`, {
      code: 'COMMAND_FAILED',
      hint: `手动跑一遍看细节：${args.join(' ')}`,
      context: { status: result.status },
    })
  }
}

/**
 * 部署固定按线上处理：`.env` 里的 `LOCAL=1` 不会带进构建。
 *
 * 1. `readOnlineTarget` 只信文件里的 `DATABASE_URL_REMOTE`，本机地址直接拒绝；
 * 2. `applyOnlineEnv` 展开 `*_REMOTE`、置 `LOCAL=0`、清掉本机代理地址；
 * 3. 从零构建，扫描产物：凭据残留或本机地址 → 中止，不部署。
 */
export async function runDeploy(options: DeployOptions = {}): Promise<DeployData> {
  const log = options.log ?? console

  const target = readOnlineTarget({ config: devkit, cwd: projectRoot })
  applyOnlineEnv({ config: devkit, remote: target.remote })
  process.env.DATABASE_URL = target.databaseUrl
  const databaseHost = new URL(target.databaseUrl).host

  log.info(`部署固定按线上处理（LOCAL=0）→ ${databaseHost}`)

  if (options.dryRun) {
    log.info(`dry-run：将清空 apps/server/.output 并构建${options.noDeploy ? '（--no-deploy：不部署）' : ''}`)
    return { databaseHost, built: false, deployed: false }
  }

  // 上次构建残留的 vars 会被 nitro 合并进新产物，必须从零开始。
  rmSync(OUTPUT_ROOT, { recursive: true, force: true })
  runStep(['bun', 'run', 'build'], 'server build')

  if (!existsSync(WRANGLER_CONFIG)) {
    throw new CliError('构建没有产出 wrangler.json，无法部署', {
      code: 'MISSING_BUILD_OUTPUT',
      hint: `检查 ${WRANGLER_CONFIG}`,
    })
  }

  const forbidden = findForbiddenVars(WRANGLER_CONFIG)
  if (forbidden.length > 0) {
    throw new CliError(`构建产物里写着凭据：${forbidden.join('、')}`, {
      code: 'CREDENTIALS_IN_BUILD',
      hint: '凭据应通过 wrangler secret put 管理；检查 nitro.config.ts 的 vars 与 apps/server/wrangler.json',
      context: { vars: forbidden },
    })
  }

  const hits = findLocalAddresses(OUTPUT_ROOT)
  if (hits.length > 0) {
    for (const hit of hits.slice(0, 10)) {
      log.warn(`  - ${hit.file}:${hit.line} → ${hit.marker}`)
    }
    if (hits.length > 10) {
      log.warn(`  - … 另有 ${hits.length - 10} 处`)
    }
    throw new CliError('构建产物里有本机地址，已中止部署', {
      code: 'LOCAL_ADDRESSES_IN_BUILD',
      hint: '检查 .env 的 LOCAL / DATABASE_URL / NEON_HTTP_ENDPOINT 后重跑 bun run deploy',
      context: {
        hits: hits.slice(0, 10),
        total: hits.length,
      },
    })
  }

  if (options.noDeploy) {
    log.info('构建校验通过，已跳过部署')
    return { databaseHost, built: true, deployed: false }
  }

  runStep([
    'bun',
    'x',
    'nitro',
    'deploy',
    '--prebuilt',
  ], 'nitro deploy')
  return { databaseHost, built: true, deployed: true }
}

export const deploySpec: CommandSpec<DeployData> = {
  id: 'deploy',
  description: '构建并部署 API 到 Cloudflare Workers（固定线上环境）',
  details: '固定按线上处理，不受 `LOCAL` 开关影响。\n'
    + '\n'
    + '1. 强制 `LOCAL=0`，线上库取 `.env` 的 `DATABASE_URL_REMOTE`（本机地址直接拒绝）；\n'
    + '2. 清空 `apps/server/.output` 后从零构建（残留的 vars 会被合并进新产物）；\n'
    + '3. 产物里出现 `DATABASE_URL` / `TWEET_KEYS` 等凭据就中止——线上凭据走 Worker secret；\n'
    + '4. 产物里出现本机库 / 代理 / 对象存储地址就中止；\n'
    + '5. 以上通过才 `nitro deploy --prebuilt`。',
  examples: [
    'bun run deploy',
    'bun run ig deploy --no-deploy',
    'bun run ig deploy --dry-run',
  ],
  options: [
    new Option('--no-deploy', '只构建并校验产物，不执行部署'),
  ],
  async run(ctx) {
    const data = await runDeploy({
      noDeploy: ctx.options.deploy === false,
      dryRun: ctx.dryRun,
      log: ctx.log,
    })
    return {
      data,
      summary: data.deployed
        ? `已部署到 Cloudflare Workers（${data.databaseHost}）`
        : data.built
          ? '构建校验通过，未部署'
          : 'dry-run：未构建、未部署',
    }
  },
}
