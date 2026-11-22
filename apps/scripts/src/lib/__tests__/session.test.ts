import { afterEach, describe, expect, it, vi } from 'vitest'
import { readIgProxy } from '../session'

describe('readIgProxy', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('优先使用 IG_PROXY', () => {
    vi.stubEnv('IG_PROXY', 'http://127.0.0.1:7890')
    vi.stubEnv('TWEET_PROXY', 'http://127.0.0.1:9999')
    expect(readIgProxy()).toBe('http://127.0.0.1:7890')
  })

  it('未配置 IG_PROXY 时回退 TWEET_PROXY', () => {
    vi.stubEnv('IG_PROXY', '')
    vi.stubEnv('TWEET_PROXY', 'http://127.0.0.1:7890')
    expect(readIgProxy()).toBe('http://127.0.0.1:7890')
  })

  it('两者都未配置时返回 undefined', () => {
    vi.stubEnv('IG_PROXY', '')
    vi.stubEnv('TWEET_PROXY', '')
    expect(readIgProxy()).toBeUndefined()
  })
})
