import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, sep } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { findForbiddenVars, findLocalAddresses, FORBIDDEN_VARS, LOCAL_MARKERS } from '../deploy-scan'

const roots: string[] = []

function makeRoot(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'deploy-scan-'))
  roots.push(root)
  for (const [path, content] of Object.entries(files)) {
    const target = join(root, path)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, content)
  }
  return root
}

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe('findLocalAddresses', () => {
  it('报告本机库、代理与对象存储地址，带文件与行号', () => {
    const root = makeRoot({
      'server/index.mjs': 'const a = 1\nconst url = "http://127.0.0.1:4444/sql"\n',
      'server/wrangler.json': '{\n  "DATABASE_URL": "postgres://postgres@localhost:5432/tweets_dev"\n}\n',
    })

    const hits = findLocalAddresses(root)

    expect(hits).toHaveLength(2)
    expect(hits).toContainEqual({ file: `server${sep}index.mjs`, line: 2, marker: '127.0.0.1:4444' })
    expect(hits.some(hit => hit.marker === 'postgres://postgres@localhost')).toBe(true)
  })

  it('openAPI 示例里的 localhost 不算本机资源', () => {
    const root = makeRoot({
      'server/openapi.mjs': 'servers: [{ url: "http://localhost:3000", description: "本地开发" }]',
    })

    expect(findLocalAddresses(root)).toEqual([])
  })

  it('只扫文本产物，二进制资产跳过', () => {
    const root = makeRoot({
      'server/asset.png': '127.0.0.1:4444',
    })

    expect(findLocalAddresses(root)).toEqual([])
  })

  it('空目录返回空数组', () => {
    expect(findLocalAddresses(makeRoot({ 'keep/.gitkeep': '' }))).toEqual([])
  })

  it('markers 可覆盖', () => {
    const root = makeRoot({ 'a.mjs': 'const x = "http://localhost:9000/tweets-viewer"' })

    expect(findLocalAddresses(root, ['localhost:9000'])).toHaveLength(1)
    expect(findLocalAddresses(root, LOCAL_MARKERS)).toHaveLength(1)
  })
})

describe('findForbiddenVars', () => {
  it('列出仍写在 vars 里的凭据', () => {
    const root = makeRoot({
      'wrangler.json': JSON.stringify({
        vars: { DATABASE_URL: 'postgres://x', TWEET_KEYS: 'k', IG_CDN_BASE: 'https://s3' },
      }),
    })

    expect(findForbiddenVars(join(root, 'wrangler.json'))).toEqual(['DATABASE_URL', 'TWEET_KEYS'])
  })

  it('没有 vars 段时返回空', () => {
    const root = makeRoot({
      'wrangler.json': JSON.stringify({ name: 'tweet-api' }),
    })

    expect(findForbiddenVars(join(root, 'wrangler.json'))).toEqual([])
  })

  it('拒绝清单覆盖三个线上凭据', () => {
    expect(FORBIDDEN_VARS).toEqual(['DATABASE_URL', 'NEON_HTTP_ENDPOINT', 'TWEET_KEYS'])
  })
})
