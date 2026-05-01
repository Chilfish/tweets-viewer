import { describe, expect, it } from 'vitest'
import { mergeData, pubTime, snowId2millis, tweetUrl, uniqueObj } from '../utils'

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
    const items = [{ id: 'x', value: 1 }]
    expect(uniqueObj(items, 'id')).toEqual(items)
  })
})

describe('mergeData', () => {
  it('should merge and replace newer data by key', () => {
    const old = [{ id: 'a', v: 1 }, { id: 'b', v: 2 }]
    const new_ = [{ id: 'b', v: 20 }, { id: 'c', v: 3 }]
    const result = mergeData(old, new_, 'id')
    expect(result).toHaveLength(3)
    expect(result.find(r => r.id === 'b')!.v).toBe(20)
    expect(result.find(r => r.id === 'a')!.v).toBe(1)
  })

  it('should keep old data when no overlap', () => {
    const old = [{ id: 'a', v: 1 }]
    const new_ = [{ id: 'b', v: 2 }]
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
