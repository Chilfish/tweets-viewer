import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { parse } from 'dotenv'

/**
 * 环境文件分层（与 devkit 0.2.0 的 `loadEnvFile` 同一套语义）：
 *
 * 1. 先读基础文件 `.env`；
 * 2. 本地标志开启时叠加 `.env.dev`，否则叠加 `.env.prod`；缺失的模式文件跳过；
 * 3. 后面的文件覆盖前面的；
 * 4. 进程环境里已有的变量始终优先。
 *
 * 本地标志本身只看进程环境与基础文件——模式文件不参与判定，否则
 * `.env.dev` 里写 `LOCAL=1` 也无法把自己选出来。
 */
export interface LayeredEnvOptions {
  /** 仓库根目录，默认当前工作目录。 */
  root?: string
  /** 基础文件名，默认 `.env`。 */
  file?: string
  /** 本地模式变量名，默认 `LOCAL`。 */
  localFlag?: string
}

/** 本地标志：`1` / `true` / `yes`（大小写与首尾空白无关）。 */
export function isLocalFlagValue(value: string | undefined): boolean {
  const normalized = (value ?? '').trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes'
}

function readEnvFile(file: string): Record<string, string> {
  return existsSync(file)
    ? parse(readFileSync(file))
    : {}
}

/**
 * 按分层规则加载环境文件到 `process.env`（已有变量不覆盖）。
 *
 * 返回实际读取的文件列表，便于日志说明来源。
 */
export function loadLayeredEnv(options: LayeredEnvOptions = {}): string[] {
  const root = options.root ?? process.cwd()
  const file = options.file ?? '.env'
  const flag = options.localFlag ?? 'LOCAL'

  const basePath = path.resolve(root, file)
  const base = readEnvFile(basePath)
  const local = process.env[flag] !== undefined
    ? isLocalFlagValue(process.env[flag])
    : isLocalFlagValue(base[flag])

  const modePath = path.resolve(root, `${file}.${local ? 'dev' : 'prod'}`)
  const mode = readEnvFile(modePath)

  const read = existsSync(basePath)
    ? [basePath]
    : []
  if (existsSync(modePath)) {
    read.push(modePath)
  }

  for (const [key, value] of Object.entries({
    ...base,
    ...mode,
  })) {
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }

  return read
}
