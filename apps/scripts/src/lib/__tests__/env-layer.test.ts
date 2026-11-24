import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { loadLayeredEnv } from '../../../../../env.layer'

const FLAG = 'TEST_LAYER_LOCAL'
const KEYS = ['TEST_LAYER_BASE', 'TEST_LAYER_VALUE'] as const

const dirs: string[] = []

function setup(files: Record<string, string>): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'env-layer-'))
  dirs.push(dir)
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(path.join(dir, name), content)
  }
  return dir
}

afterEach(() => {
  delete process.env[FLAG]
  for (const key of KEYS) {
    delete process.env[key]
  }
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('loadLayeredEnv', () => {
  it('lOCAL=1 时叠加 .env.dev，后者覆盖基础文件', () => {
    process.env[FLAG] = '1'
    const root = setup({
      '.env': 'TEST_LAYER_BASE=base\nTEST_LAYER_VALUE=base',
      '.env.dev': 'TEST_LAYER_VALUE=dev',
      '.env.prod': 'TEST_LAYER_VALUE=prod',
    })

    const read = loadLayeredEnv({ root, localFlag: FLAG })

    expect(process.env.TEST_LAYER_BASE).toBe('base')
    expect(process.env.TEST_LAYER_VALUE).toBe('dev')
    expect(read.map(file => path.basename(file))).toEqual(['.env', '.env.dev'])
  })

  it('未开启本地标志时叠加 .env.prod', () => {
    process.env[FLAG] = '0'
    const root = setup({
      '.env': 'TEST_LAYER_BASE=base',
      '.env.dev': 'TEST_LAYER_VALUE=dev',
      '.env.prod': 'TEST_LAYER_VALUE=prod',
    })

    loadLayeredEnv({ root, localFlag: FLAG })

    expect(process.env.TEST_LAYER_VALUE).toBe('prod')
  })

  it('本地标志取基础文件，进程环境优先', () => {
    const root = setup({
      '.env': `${FLAG}=1\nTEST_LAYER_VALUE=base`,
      '.env.dev': 'TEST_LAYER_VALUE=dev',
    })

    loadLayeredEnv({ root, localFlag: FLAG })

    expect(process.env.TEST_LAYER_VALUE).toBe('dev')
  })

  it('进程环境里已有的变量不被文件覆盖', () => {
    process.env[FLAG] = '1'
    process.env.TEST_LAYER_VALUE = 'from-process'
    const root = setup({
      '.env': 'TEST_LAYER_VALUE=base',
      '.env.dev': 'TEST_LAYER_VALUE=dev',
    })

    loadLayeredEnv({ root, localFlag: FLAG })

    expect(process.env.TEST_LAYER_VALUE).toBe('from-process')
  })

  it('缺失的模式文件被跳过', () => {
    process.env[FLAG] = '1'
    const root = setup({ '.env': 'TEST_LAYER_BASE=base' })

    const read = loadLayeredEnv({ root, localFlag: FLAG })

    expect(process.env.TEST_LAYER_BASE).toBe('base')
    expect(read.map(file => path.basename(file))).toEqual(['.env'])
  })
})
