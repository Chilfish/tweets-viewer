import { describe, expect, it } from 'vitest'
import { createConcurrencyGate, forEachConcurrent } from '../concurrency'

const tick = () => new Promise<void>(resolve => setTimeout(resolve, 0))

describe('forEachConcurrent', () => {
  it('visits every item exactly once', async () => {
    const seen: number[] = []
    await forEachConcurrent([1, 2, 3, 4, 5], 2, async (item) => {
      await tick()
      seen.push(item)
    })

    expect(seen.slice().sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5])
  })

  it('never exceeds the concurrency limit', async () => {
    let active = 0
    let peak = 0
    await forEachConcurrent(Array.from({ length: 12 }, (_, i) => i), 3, async () => {
      active++
      peak = Math.max(peak, active)
      await tick()
      active--
    })

    expect(peak).toBe(3)
  })

  it('clamps the limit to the item count', async () => {
    let peak = 0
    let active = 0
    await forEachConcurrent([1, 2], 10, async () => {
      active++
      peak = Math.max(peak, active)
      await tick()
      active--
    })

    expect(peak).toBe(2)
  })

  it('stops dispatching new items after shouldStop turns true', async () => {
    const started: number[] = []
    let stop = false

    await forEachConcurrent([0, 1, 2, 3, 4, 5], 2, async (item) => {
      started.push(item)
      await tick()
      if (item === 0)
        stop = true
    }, {
      shouldStop: () => stop,
    })

    expect(started.length).toBeLessThan(6)
    expect(started).toContain(0)
  })

  it('resolves immediately for an empty list', async () => {
    let called = false
    await forEachConcurrent([], 4, async () => {
      called = true
    })

    expect(called).toBe(false)
  })
})

describe('createConcurrencyGate', () => {
  it('runs tasks concurrently up to the limit', async () => {
    const gate = createConcurrencyGate(2)
    let active = 0
    let peak = 0

    await Promise.all(Array.from({ length: 8 }, () => gate(async () => {
      active++
      peak = Math.max(peak, active)
      await tick()
      active--
    })))

    expect(peak).toBe(2)
  })

  it('releases the slot even when a task throws', async () => {
    const gate = createConcurrencyGate(1)

    await expect(gate(async () => {
      throw new Error('boom')
    })).rejects.toThrow('boom')

    await expect(gate(async () => 'ok')).resolves.toBe('ok')
  })

  it('treats a non-numeric limit as 1', async () => {
    const gate = createConcurrencyGate(Number.NaN)
    let active = 0
    let peak = 0

    await Promise.all(Array.from({ length: 4 }, () => gate(async () => {
      active++
      peak = Math.max(peak, active)
      await tick()
      active--
    })))

    expect(peak).toBe(1)
  })
})
