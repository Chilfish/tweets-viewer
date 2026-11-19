import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** 仓库根目录（`apps/scripts/src/lib` 往上四层）。 */
export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')

/** 归档中间产物目录：`<repo>/data` */
export const dataDir = path.join(projectRoot, 'data')
