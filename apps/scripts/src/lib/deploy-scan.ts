import { readdirSync, readFileSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

/** 参与扫描的文本产物；二进制资产不检查。 */
const TEXT_EXTENSIONS = new Set([
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.html',
  '.css',
  '.txt',
  '.xml',
  '.md',
])

/**
 * 本机资源特征：只认本项目的本地库、代理与对象存储。
 *
 * 不看裸 `localhost` —— OpenAPI 文档里写着 `http://localhost:3000`
 * 这类示例地址，属于正常内容，不该让部署中止。
 */
export const LOCAL_MARKERS = [
  'postgres://postgres@localhost',
  'postgresql://postgres@localhost',
  '127.0.0.1:4444',
  'localhost:4444',
  '127.0.0.1:9000',
  'localhost:9000',
  '5432/tweets_dev',
]

/** 线上配置里不该出现的 vars：凭据只走 Worker secret。 */
export const FORBIDDEN_VARS = ['DATABASE_URL', 'NEON_HTTP_ENDPOINT', 'TWEET_KEYS']

export interface LocalHit {
  file: string
  line: number
  marker: string
}

function textFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...textFiles(path))
      continue
    }
    if (entry.isFile() && TEXT_EXTENSIONS.has(extname(entry.name))) {
      files.push(path)
    }
  }
  return files
}

/** 扫描产物文本，返回所有命中本机地址的位置（文件相对 `root`）。 */
export function findLocalAddresses(root: string, markers: string[] = LOCAL_MARKERS): LocalHit[] {
  const hits: LocalHit[] = []
  for (const file of textFiles(root)) {
    const content = readFileSync(file, 'utf8')
    const lines = content.split('\n')
    for (const [index, line] of lines.entries()) {
      const marker = markers.find(candidate => line.includes(candidate))
      if (marker) {
        hits.push({
          file: relative(root, file),
          line: index + 1,
          marker,
        })
      }
    }
  }
  return hits
}

/** 读取部署用的 wrangler 配置，返回仍然写死在 `vars` 里的凭据键。 */
export function findForbiddenVars(wranglerJsonPath: string): string[] {
  const config = JSON.parse(readFileSync(wranglerJsonPath, 'utf8')) as {
    vars?: Record<string, unknown>
  }
  const vars = config.vars ?? {}
  return FORBIDDEN_VARS.filter(key => key in vars)
}
