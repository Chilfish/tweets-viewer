/**
 * 统一 fixture 加载器：fixture 顶层为 `{ _meta, data }`，此处统一解包 `data`
 * （无包裹时原样返回）。fixtures 目录：`__tests__/fixtures`。
 */
import fs from 'node:fs'
import path from 'node:path'

const FIXTURES_DIR = path.resolve(import.meta.dirname, '..', 'fixtures')

interface WrappedFixture {
  _meta?: { source?: string, exportedAt?: string, schema?: string }
  data?: unknown
  testCases?: unknown
}

export function loadFixture<T = unknown>(rel: string): T {
  const filepath = path.join(FIXTURES_DIR, rel)
  const raw = fs.readFileSync(filepath, 'utf8')
  const parsed = JSON.parse(raw) as WrappedFixture
  return (parsed.data ?? parsed.testCases ?? parsed) as T
}
