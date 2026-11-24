import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CDN_BASE,
  resolveCdnBase,
  resolveDatabaseUrl,
  resolveNeonEndpoint,
  resolveOnlineCdnBase,
  resolveRemoteDatabaseUrl,
} from '../local-config'

describe('resolveNeonEndpoint', () => {
  it('local=1 时保留本机代理', () => {
    expect(resolveNeonEndpoint('postgres://postgres@localhost:5432/tweets_dev', {
      LOCAL: '1',
      NEON_HTTP_ENDPOINT: 'http://127.0.0.1:4444/sql',
    })).toBe('http://127.0.0.1:4444/sql')
  })

  it('local=0 时忽略 .env 里残留的本机代理', () => {
    expect(resolveNeonEndpoint('postgres://u:p@remote.neon.tech/neondb', {
      NEON_HTTP_ENDPOINT: 'http://127.0.0.1:4444/sql',
    })).toBeUndefined()
  })

  it('local=0 时保留显式配置的远程端点', () => {
    expect(resolveNeonEndpoint('postgres://u:p@remote.neon.tech/neondb', {
      NEON_HTTP_ENDPOINT: 'https://proxy.example.com/sql',
    })).toBe('https://proxy.example.com/sql')
  })

  it('本机库始终回落到本机代理', () => {
    expect(resolveNeonEndpoint('postgres://postgres@localhost:5432/tweets_dev', {}))
      .toBe('http://127.0.0.1:4445/sql')
  })
})

describe('resolveCdnBase', () => {
  it('local=1 时指向本机桶', () => {
    expect(resolveCdnBase({
      LOCAL: '1',
      S3_ENDPOINT: 'http://127.0.0.1:9000',
      R2_BUCKET: 'tweets-viewer',
    })).toBe('http://127.0.0.1:9000/tweets-viewer')
  })

  it('local=0 时忽略 .env 里残留的本机桶地址', () => {
    expect(resolveCdnBase({
      IG_CDN_BASE: 'http://127.0.0.1:9000/tweets-viewer',
    })).toBe(DEFAULT_CDN_BASE)
  })

  it('local=0 时使用显式配置的线上 CDN', () => {
    expect(resolveCdnBase({ IG_CDN_BASE: 'https://cdn.example.com///' }))
      .toBe('https://cdn.example.com')
  })

  it('未配置时使用默认 CDN', () => {
    expect(resolveCdnBase({})).toBe(DEFAULT_CDN_BASE)
  })
})

describe('resolveDatabaseUrl', () => {
  it('local=1 时强制指向本机库', () => {
    expect(resolveDatabaseUrl({
      LOCAL: '1',
      DATABASE_URL: 'postgres://u:p@remote.neon.tech/neondb',
    })).toBe('postgres://postgres@localhost:5432/tweets_dev')
  })

  it('多地址取首个', () => {
    expect(resolveDatabaseUrl({
      DATABASE_URL: 'postgres://u:p@a.neon.tech/db, postgres://u:p@b.neon.tech/db',
    })).toBe('postgres://u:p@a.neon.tech/db')
  })
})

describe('resolveOnlineCdnBase', () => {
  it('local=1 时仍返回线上 CDN', () => {
    expect(resolveOnlineCdnBase({
      LOCAL: '1',
      IG_CDN_BASE: 'http://127.0.0.1:9000/tweets-viewer',
    })).toBe(DEFAULT_CDN_BASE)
  })

  it('非本机前缀原样使用', () => {
    expect(resolveOnlineCdnBase({ IG_CDN_BASE: 'https://cdn.example.com/' }))
      .toBe('https://cdn.example.com')
  })
})

describe('resolveRemoteDatabaseUrl', () => {
  it('优先读取 .env.prod 的 DATABASE_URL', () => {
    expect(resolveRemoteDatabaseUrl(
      {},
      { DATABASE_URL: 'postgres://u:p@remote.neon.tech/neondb' },
    )).toBe('postgres://u:p@remote.neon.tech/neondb')
  })

  it('.env.prod 指向本机时忽略', () => {
    expect(resolveRemoteDatabaseUrl(
      { DATABASE_URL: 'postgres://u:p@remote.neon.tech/neondb' },
      { DATABASE_URL: 'postgres://postgres@localhost:5432/tweets_dev' },
    )).toBe('postgres://u:p@remote.neon.tech/neondb')
  })

  it('回落到进程环境里的非本机地址', () => {
    expect(resolveRemoteDatabaseUrl(
      { DATABASE_URL: 'postgres://u:p@remote.neon.tech/neondb' },
      {},
    )).toBe('postgres://u:p@remote.neon.tech/neondb')
  })

  it('进程环境是本机地址时返回 undefined', () => {
    expect(resolveRemoteDatabaseUrl(
      { DATABASE_URL: 'postgres://postgres@localhost:5432/tweets_dev' },
      {},
    )).toBeUndefined()
  })

  it('两处都缺失时返回 undefined', () => {
    expect(resolveRemoteDatabaseUrl({}, {})).toBeUndefined()
  })
})
