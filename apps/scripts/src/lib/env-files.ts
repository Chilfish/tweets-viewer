import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'dotenv'
import { devkit } from '../../dev.config'
import { projectRoot } from './env'

/** 线上模式文件：`LOCAL` 关闭时叠加在基础文件之上。 */
export const PROD_ENV_FILE = `${devkit.env.file}.prod`

/**
 * 读取 `.env.prod` 文件本身（不写 `process.env`）。
 *
 * 部署与「本地读线上库」都要显式拿线上值：运行时 `process.env` 在本地模式下
 * 已被改成本机地址，只有文件里的 `.prod` 段还保留线上配置。
 */
export function readProdEnv(): Record<string, string> {
  const file = join(projectRoot, PROD_ENV_FILE)
  return existsSync(file)
    ? parse(readFileSync(file))
    : {}
}
