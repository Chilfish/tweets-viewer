import { describe, expect, it } from 'vitest'
import {
  applyLocalDefaults,
  isLocalMode,
  LOCAL_DATABASE_URL,
  LOCAL_PROXY_ENDPOINT,
  mergeData,
  parseDatabaseUrls,
  pubTime,
  snowId2millis,
  tweetUrl,
  uniqueObj,
} from '../utils'

describe('uniqueObj', () => {
  it('should deduplicate objects by key (keeps last)', () => {
    const items = [
      { id: 'a', value: 1 },
      { id: 'b', value: 2 },
      { id: 'a', value: 3 },
    ]
    const result = uniqueObj(items, 'id')
    expect(result).toHaveLength(2)
    // Map.set overwrites — so 'a' has value 3
    const itemA = result.find(r => r.id === 'a')
    expect(itemA!.value).toBe(3)
    const itemB = result.find(r => r.id === 'b')
    expect(itemB!.value).toBe(2)
  })

  it('should return empty array for empty input', () => {
    expect(uniqueObj([], 'id')).toEqual([])
  })

  it('should handle single-element arrays', () => {
    const items = [
      { id: 'x', value: 1 },
    ]
    expect(uniqueObj(items, 'id')).toEqual(items)
  })
})

describe('mergeData', () => {
  it('should merge and replace newer data by key', () => {
    const old = [
      { id: 'a', v: 1 },
      { id: 'b', v: 2 },
    ]
    const new_ = [
      { id: 'b', v: 20 },
      { id: 'c', v: 3 },
    ]
    const result = mergeData(old, new_, 'id')
    expect(result).toHaveLength(3)
    expect(result.find(r => r.id === 'b')!.v).toBe(20)
    expect(result.find(r => r.id === 'a')!.v).toBe(1)
  })

  it('should keep old data when no overlap', () => {
    const old = [
      { id: 'a', v: 1 },
    ]
    const new_ = [
      { id: 'b', v: 2 },
    ]
    const result = mergeData(old, new_, 'id')
    expect(result).toHaveLength(2)
  })
})

describe('tweetUrl', () => {
  it('should generate correct tweet URL', () => {
    expect(tweetUrl('123456')).toBe('https://twitter.com/i/status/123456')
  })

  it('should use custom username', () => {
    expect(tweetUrl('123456', 'alice')).toBe('https://twitter.com/alice/status/123456')
  })
})

describe('snowId2millis', () => {
  it('should convert snowflake ID to milliseconds', () => {
    const result = snowId2millis('1720000000000000000')
    expect(typeof result).toBe('bigint')
    expect(result).toBeGreaterThan(0n)
  })
})

describe('pubTime', () => {
  it('should return a valid Date from snowflake ID', () => {
    const date = pubTime('1720000000000000000')
    expect(date).toBeInstanceOf(Date)
    expect(date.getTime()).toBeGreaterThan(0)
  })
})

describe('parseDatabaseUrls', () => {
  it('should return a single url as-is', () => {
    expect(parseDatabaseUrls('postgresql://u:p@h/one')).toEqual(['postgresql://u:p@h/one'])
  })

  it('should split comma-separated urls and trim whitespace', () => {
    expect(parseDatabaseUrls('postgresql://h/one , postgresql://h/two'))
      .toEqual(['postgresql://h/one', 'postgresql://h/two'])
  })

  it('should drop empty entries and tolerate trailing commas', () => {
    expect(parseDatabaseUrls('postgresql://h/one,,  ,')).toEqual(['postgresql://h/one'])
  })

  it('should deduplicate while keeping the first occurrence order', () => {
    expect(parseDatabaseUrls('a, b, a, c, b')).toEqual(['a', 'b', 'c'])
  })

  it('should return empty array for empty/missing input', () => {
    expect(parseDatabaseUrls('')).toEqual([])
    expect(parseDatabaseUrls('   ')).toEqual([])
    expect(parseDatabaseUrls(undefined)).toEqual([])
    expect(parseDatabaseUrls(null)).toEqual([])
  })
})

describe('isLocalMode', () => {
  it('accepts the documented switch values', () => {
    expect(isLocalMode({ LOCAL: '1' })).toBe(true)
    expect(isLocalMode({ LOCAL: 'true' })).toBe(true)
    expect(isLocalMode({ LOCAL: ' YES ' })).toBe(true)
  })

  it('treats anything else as remote', () => {
    expect(isLocalMode({})).toBe(false)
    expect(isLocalMode({ LOCAL: '0' })).toBe(false)
    expect(isLocalMode({ LOCAL: 'false' })).toBe(false)
  })
})

describe('applyLocalDefaults', () => {
  it('leaves the environment untouched in remote mode', () => {
    const env = { DATABASE_URL: 'postgresql://u:p@ep-x.neon.tech/db' }
    expect(applyLocalDefaults(env)).toBe(env)
  })

  it('replaces a remote database URL with the local one', () => {
    const result = applyLocalDefaults({
      LOCAL: '1',
      DATABASE_URL: 'postgresql://u:p@ep-x.neon.tech/db',
    })
    expect(result.DATABASE_URL).toBe(LOCAL_DATABASE_URL)
    expect(result.NEON_HTTP_ENDPOINT).toBe(LOCAL_PROXY_ENDPOINT)
  })

  it('keeps a local database URL and its custom port', () => {
    const result = applyLocalDefaults({
      LOCAL: '1',
      DATABASE_URL: 'postgres://postgres@localhost:5433/other_db',
      NEON_HTTP_ENDPOINT: 'http://127.0.0.1:4445/sql',
    })
    expect(result.DATABASE_URL).toBe('postgres://postgres@localhost:5433/other_db')
    expect(result.NEON_HTTP_ENDPOINT).toBe('http://127.0.0.1:4445/sql')
  })

  it('falls back to the local proxy when the endpoint is remote', () => {
    const result = applyLocalDefaults({
      LOCAL: '1',
      DATABASE_URL: 'postgres://postgres@localhost:5432/tweets_dev',
      NEON_HTTP_ENDPOINT: 'https://ep-x.neon.tech/sql',
    })
    expect(result.NEON_HTTP_ENDPOINT).toBe(LOCAL_PROXY_ENDPOINT)
  })
})
