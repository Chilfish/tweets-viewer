import { describe, expect, it } from 'vitest'
import { createConcurrencyGate, resolveSyncConcurrency, runBoundedStage, shareConcurrency } from '../concurrency'

const tick = () => new Promise<void>(resolve => setTimeout(resolve, 0))

describe('resolveSyncConcurrency', () => {
  it('explicit SYNC_CONCURRENCY wins', () => {
    expect(resolveSyncConcurrency(3, { SYNC_CONCURRENCY: '5' })).toBe(5)
  })

  it('defaults to keys × 2', () => {
    expect(resolveSyncConcurrency(3, {})).toBe(6)
  })

  it('keeps at least two lanes', () => {
    expect(resolveSyncConcurrency(0, {})).toBe(2)
  })

  it('ignores invalid overrides', () => {
    expect(resolveSyncConcurrency(2, { SYNC_CONCURRENCY: '0' })).toBe(4)
    expect(resolveSyncConcurrency(2, { SYNC_CONCURRENCY: 'abc' })).toBe(4)
  })
})

describe('shareConcurrency', () => {
  it('splits the budget across targets', () => {
    expect(shareConcurrency(8, 2)).toBe(4)
  })

  it('keeps one lane per target when the budget is small', () => {
    expect(shareConcurrency(3, 5)).toBe(1)
  })

  it('treats invalid target counts as one', () => {
    expect(shareConcurrency(6, 0)).toBe(6)
    expect(shareConcurrency(6, Number.NaN)).toBe(6)
  })
})

describe('runBoundedStage', () => {
  it('visits every item exactly once', async () => {
    const seen: number[] = []
    const outcome = await runBoundedStage<number>({
      name: 'visit',
      items: [1, 2, 3, 4, 5],
      key: String,
      concurrency: 2,
      run: async (item) => {
        await tick()
        seen.push(item)
      },
    })

    expect(outcome.status).toBe('succeeded')
    expect(outcome.failures).toEqual([])
    expect(seen.slice().sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5])
  })

  it('never exceeds the concurrency limit', async () => {
    let active = 0
    let peak = 0

    await runBoundedStage<number>({
      name: 'limit',
      items: Array.from({ length: 12 }, (_, i) => i),
      key: String,
      concurrency: 3,
      run: async () => {
        active++
        peak = Math.max(peak, active)
        await tick()
        active--
      },
    })

    expect(peak).toBe(3)
  })

  it('records failures without stopping other items', async () => {
    const done: number[] = []
    const outcome = await runBoundedStage<number>({
      name: 'partial',
      items: [0, 1, 2, 3],
      key: String,
      concurrency: 2,
      run: async (item) => {
        if (item === 1) {
          throw new Error('boom')
        }
        done.push(item)
      },
    })

    expect(outcome.status).toBe('partial')
    expect(outcome.failures).toEqual([
      { key: '1', message: 'boom' },
    ])
    expect(done.slice().sort((a, b) => a - b)).toEqual([0, 2, 3])
  })

  it('stops dispatching new items after shouldStop turns true', async () => {
    const started: number[] = []
    let stop = false

    const outcome = await runBoundedStage<number>({
      name: 'soft-stop',
      items: [0, 1, 2, 3, 4],
      key: String,
      concurrency: 1,
      shouldStop: () => stop,
      run: async (item) => {
        started.push(item)
        await tick()
        if (item === 0) {
          stop = true
        }
      },
    })

    expect(outcome.status).toBe('succeeded')
    expect(started).toEqual([0])
  })

  it('stops dispatching new items after the signal aborts', async () => {
    const controller = new AbortController()
    const started: number[] = []

    const outcome = await runBoundedStage<number>({
      name: 'cancel',
      items: [0, 1, 2, 3, 4],
      key: String,
      concurrency: 1,
      signal: controller.signal,
      run: async (item) => {
        started.push(item)
        await tick()
        if (item === 0) {
          controller.abort()
        }
      },
    })

    expect(outcome.status).toBe('cancelled')
    expect(started).toEqual([0])
  })

  it('resolves immediately for an empty list', async () => {
    let called = false

    const outcome = await runBoundedStage<number>({
      name: 'empty',
      items: [],
      key: String,
      concurrency: 4,
      run: async () => {
        called = true
      },
    })

    expect(called).toBe(false)
    expect(outcome.status).toBe('succeeded')
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
