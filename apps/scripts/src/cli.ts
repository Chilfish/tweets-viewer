#!/usr/bin/env bun
/**
 * Instagram 归档流水线的唯一入口。
 *
 *   bun run ig --help
 *   bun run ig describe --json
 *   bun run ig ins add https://www.instagram.com/ritsu_mgmg --twitter ritsu_yumemita
 *
 * 命令实现在 `commands/`，参数解析 / 帮助 / 日志 / 退出码 / JSON 信封
 * 由 `cli/runtime.ts` 统一处理。命令表见 docs/engineering/ig-cli.md。
 */
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildCli, runCli } from './cli/runtime'
import { groups, rootCommands } from './commands'
import { loadEnv } from './lib/env'

loadEnv()

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const packageJson = JSON.parse(readFileSync(join(appRoot, 'package.json'), 'utf8')) as { version: string }

await runCli(buildCli(groups, packageJson.version, rootCommands), process.argv.slice(2))
