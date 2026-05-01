import { describe, expect, it } from 'vitest'
import { SimpleLRUCache } from '../utils/lru-cache'

describe('simpleLRUCache', () => {
  it('should store and retrieve values', () => {
    const cache = new SimpleLRUCache<string, number>(10)
    cache.set('a', 1)
    cache.set('b', 2)
    expect(cache.get('a')).toBe(1)
    expect(cache.get('b')).toBe(2)
  })

  it('should return undefined for missing keys', () => {
    const cache = new SimpleLRUCache<string, number>(10)
    expect(cache.get('missing')).toBeUndefined()
  })

  it('should evict oldest entries when capacity exceeded', () => {
    const cache = new SimpleLRUCache<string, number>(2)
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3)
    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBe(2)
    expect(cache.get('c')).toBe(3)
  })

  it('should promote recently accessed entries', () => {
    const cache = new SimpleLRUCache<string, number>(2)
    cache.set('a', 1)
    cache.set('b', 2)
    cache.get('a')
    cache.set('c', 3)
    expect(cache.get('a')).toBe(1)
    expect(cache.get('b')).toBeUndefined()
  })

  it('should clear all entries', () => {
    const cache = new SimpleLRUCache<string, number>(10)
    cache.set('a', 1)
    cache.set('b', 2)
    cache.clear()
    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBeUndefined()
  })
})
