import { describe, expect, it } from 'vitest'
import { buildMediaHash, parseMediaHash } from '../media-hash'

describe('parseMediaHash', () => {
  it('解析 #media=N', () => {
    expect(parseMediaHash('#media=0')).toBe(0)
    expect(parseMediaHash('#media=12')).toBe(12)
  })

  it('空/无 # 前缀返回 null', () => {
    expect(parseMediaHash('')).toBeNull()
    expect(parseMediaHash('media=1')).toBeNull()
  })

  it('非 media 前缀返回 null', () => {
    expect(parseMediaHash('#foo=1')).toBeNull()
    expect(parseMediaHash('#/tweets/x')).toBeNull()
  })

  it('非整数/负数返回 null', () => {
    expect(parseMediaHash('#media=1.5')).toBeNull()
    expect(parseMediaHash('#media=-1')).toBeNull()
    expect(parseMediaHash('#media=abc')).toBeNull()
    expect(parseMediaHash('#media=')).toBeNull()
  })
})

describe('buildMediaHash', () => {
  it('构建 #media=N', () => {
    expect(buildMediaHash(0)).toBe('#media=0')
    expect(buildMediaHash(7)).toBe('#media=7')
  })

  it('round-trip 一致', () => {
    expect(parseMediaHash(buildMediaHash(3))).toBe(3)
  })
})
