import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'

/** 仓库根目录（`apps/scripts/src/lib` 往上四层）。 */
export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')

/** 归档中间产物目录：`<repo>/data` */
export const dataDir = path.join(projectRoot, 'data')

/** 加载根目录 `.env`。脚本与 CLI 共用，缺失时不报错。 */
export function loadEnv(): void {
  const file = path.join(projectRoot, '.env')
  if (existsSync(file)) {
    config({ path: file, quiet: true })
  }
}
