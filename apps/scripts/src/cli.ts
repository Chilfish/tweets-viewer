#!/usr/bin/env bun
/**
 * Instagram 归档流水线的唯一入口。
 *
 *   bun run ig --help
 *   bun run ig describe --json
 *   bun run ig ins add https://www.instagram.com/ritsu_mgmg --twitter ritsu_yumemita
 *
 * 命令实现在 `commands/`，参数解析 / 帮助 / 日志 / 退出码 / JSON 信封
 * 由 `@chilfish/devkit/cli` 统一处理。命令表见 docs/engineering/ig-cli.md。
 */
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildCli, runCli } from '@chilfish/devkit/cli'
import { createDevCommands } from '@chilfish/devkit/commands'
import { devkit } from '../dev.config'
import { groups, rootCommands } from './commands'
import { withCauseExpansion, withCauseExpansionGroup } from './lib/errors'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const packageJson = JSON.parse(readFileSync(join(appRoot, 'package.json'), 'utf8')) as { version: string }

// 保留项目的中文 describe 文案（迁移不改现有输出）。
const labels = {
  exitCodes: [
    { code: 0, meaning: '成功 / 已收敛' },
    { code: 1, meaning: '运行期失败（部分批次失败也算）' },
    { code: 2, meaning: '用法错误：未知参数、缺必填、非法取值' },
    { code: 3, meaning: '配置缺失：DATABASE_URL / INSTAGRAM_COOKIES 未配置' },
  ],
  globalOptions: [
    { flags: '--json', description: '输出单行 JSON 信封到 stdout' },
    { flags: '--quiet', description: '只保留警告与错误' },
    { flags: '--dry-run', description: '只读：不写库、不写文件、不上传' },
    { flags: '--log-level <level>', description: 'debug / info / warn / error，默认 info' },
    { flags: '--log-file <path>', description: '把日志以 NDJSON 追加写入文件' },
    { flags: '-h, --help', description: '显示帮助' },
    { flags: '-V, --version', description: '显示版本' },
  ],
}

const devGroup = createDevCommands(devkit, {
  strings: {
    groupDescription: '本地环境：Postgres、Neon HTTP 代理与对象存储',
    commands: {
      db: { description: '本地库初始化：启动 Postgres、建库、跑迁移、对齐 .env' },
      proxy: { description: '前台启动 Neon HTTP 兼容代理，把 /sql 转发到本机 Postgres' },
      storage: { description: '启动本地对象存储（SILO）并准备桶' },
    },
  },
})

await runCli(
  buildCli({
    config: devkit,
    version: packageJson.version,
    groups: [
      ...groups.map(withCauseExpansionGroup),
      devGroup,
    ],
    rootCommands: rootCommands.map(withCauseExpansion),
    labels,
  }),
  process.argv.slice(2),
)
