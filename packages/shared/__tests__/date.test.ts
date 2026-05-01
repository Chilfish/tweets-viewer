import { describe, expect, it } from 'vitest'
import { convertDate, formatDate, getDate, now } from '../utils/date'

describe('now', () => {
  it('should return current date in Beijing timezone', () => {
    const result = now('beijing')
    expect(result).toBeInstanceOf(Date)
  })

  it('should return current date in Tokyo timezone', () => {
    const result = now('tokyo')
    expect(result).toBeInstanceOf(Date)
  })
})

describe('getDate', () => {
  it('should parse ISO string in Beijing timezone', () => {
    const result = getDate('2024-01-15T12:00:00Z', 'beijing')
    expect(result).toBeInstanceOf(Date)
  })

  it('should handle Date object', () => {
    const input = new Date('2024-01-15T12:00:00Z')
    const result = getDate(input)
    expect(result).toBeInstanceOf(Date)
  })
})

describe('formatDate', () => {
  it('should format date with default pattern', () => {
    const result = formatDate(new Date('2024-01-15T12:00:00Z'), { timezone: 'beijing' })
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  })

  it('should format date with custom pattern', () => {
    const result = formatDate(new Date('2024-01-15T12:00:00Z'), {
      timezone: 'beijing',
      fmt: 'yyyy-MM-dd',
    })
    expect(result).toBe('2024-01-15')
  })
})

describe('convertDate', () => {
  it('should convert date strings to Date objects', () => {
    const obj = { created_at: '2024-01-15T12:00:00Z', name: 'test' }
    convertDate(obj)
    expect(obj.created_at).toBeInstanceOf(Date)
    expect((obj.created_at as Date).toISOString()).toBe('2024-01-15T12:00:00.000Z')
    expect(typeof obj.name).toBe('string')
  })

  it('should skip null values', () => {
    const obj = { created_at: null as any, name: 'test' }
    convertDate(obj)
    expect(obj.created_at).toBeNull()
  })

  it('should handle nested objects', () => {
    const obj = { nested: { created_at: '2024-01-15T12:00:00Z' } }
    convertDate(obj)
    expect(obj.nested.created_at).toBeInstanceOf(Date)
  })

  it('should skip non-date strings', () => {
    const obj = { created_at: 'not-a-date', name: 'test' }
    convertDate(obj)
    expect(typeof obj.created_at).toBe('string')
  })

  it('should use custom keys', () => {
    const obj = { timestamp: '2024-01-15T12:00:00Z' }
    convertDate(obj, ['timestamp'])
    expect(obj.timestamp).toBeInstanceOf(Date)
  })
})
