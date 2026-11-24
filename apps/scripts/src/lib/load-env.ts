import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadLayeredEnv } from '../../../../env.layer'

/** 仓库根目录（`apps/scripts/src/lib` 往上四层）。 */
export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')

/**
 * 独立脚本入口的环境加载。
 *
 * 这些脚本不经过 devkit CLI，`bunfig.toml` 又关掉了 Bun 的自动 `.env` 加载，
 * 所以入口第一行就要手动分层读一次：`.env` → `.env.dev` / `.env.prod`。
 * 模块级常量（Key、时间窗口）在 import 时读 `process.env`，环境必须先就位。
 */
loadLayeredEnv({ root: projectRoot })
