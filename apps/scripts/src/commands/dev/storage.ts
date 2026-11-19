import type { CommandSpec } from '../../cli/runtime'
import { CliError, ConfigError } from '../../cli/exit'
import { ensureSiloRunning } from '../../lib/dev-storage'
import { isLocalMode, resolveStorage } from '../../lib/local-config'

interface DevStorageData {
  endpoint: string
  bucket: string
  publicBase: string
  started: boolean
}

export const devStorageSpec: CommandSpec<DevStorageData> = {
  id: 'dev.storage',
  description: '启动本地对象存储（SILO）并准备桶',
  details: '只接受 `LOCAL=1`。启动后建桶并设为匿名只读，浏览器才能直接取图。\n'
    + '`bun run dev` 在本地模式下会自动走同一条路径。',
  examples: [
    'bun run ig dev storage',
    'bun run ig dev storage --json',
  ],
  async run(ctx) {
    if (!isLocalMode()) {
      throw new ConfigError('需要 LOCAL=1 才能启动本地对象存储', {
        code: 'NOT_LOCAL_MODE',
        hint: '在 .env 里写 LOCAL=1，或用 LOCAL=1 bun run ig dev storage',
      })
    }

    const storage = resolveStorage()

    if (ctx.dryRun) {
      ctx.log.info(`dry-run：将启动本地对象存储，公开读地址 ${storage.publicBase}（不启动服务）`)
      return {
        data: {
          endpoint: storage.endpoint,
          bucket: storage.bucket,
          publicBase: storage.publicBase,
          started: false,
        },
      }
    }

    const result = await ensureSiloRunning()
    if (!result.started) {
      throw new CliError(result.reason ?? '本地对象存储未就绪', {
        code: 'STORAGE_UNAVAILABLE',
        hint: '安装 SILO 并加入 PATH（或用 SILO_BIN 指定路径），然后重跑 bun run ig dev storage',
      })
    }

    ctx.log.info(`端点 ${result.endpoint}，公开读地址 ${result.publicBase}`)
    return {
      data: {
        endpoint: result.endpoint,
        bucket: result.bucket,
        publicBase: result.publicBase,
        started: true,
      },
      summary: `本地对象存储就绪：${result.publicBase}`,
    }
  },
}
