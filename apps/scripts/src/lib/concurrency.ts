export interface ConcurrentOptions {
  /**
   * 每派发一项前询问是否停止；返回 `true` 时不再派发新任务，
   * 已在运行的任务照常完成（不会中途打断请求）。
   */
  shouldStop?: () => boolean
}

/**
 * 有界并发地处理一组任务。
 *
 * 共用一个索引派发，天然不重复；`limit` 会被夹到 `[1, items.length]`。
 * 单项异常向上抛：批量任务需要「单条失败跳过并记录」时，由 `worker` 自己 catch。
 */
export async function forEachConcurrent<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
  options: ConcurrentOptions = {},
): Promise<void> {
  if (items.length === 0) {
    return
  }

  const size = Math.max(1, Math.min(Math.floor(limit) || 1, items.length))
  let next = 0

  async function run(): Promise<void> {
    while (next < items.length) {
      if (options.shouldStop?.()) {
        return
      }
      const index = next++
      await worker(items[index]!, index)
    }
  }

  await Promise.all(Array.from({
    length: size,
  }, run))
}

/**
 * 并发闸门：同时执行的任务数不超过 `limit`，其余按到达顺序排队。
 *
 * 每日抓取会按库并发调用同一份抓取逻辑，而所有库共用同一个 Key 池；
 * 闸门做成进程级单例，总在飞请求才会是 `limit` 而不是 `库数 × limit`。
 */
export function createConcurrencyGate(limit: number): <T>(task: () => Promise<T>) => Promise<T> {
  const size = Math.max(1, Math.floor(limit) || 1)
  let active = 0
  const queue: (() => void)[] = []

  function release(): void {
    // 有排队者时把槽位直接转交，避免「先减后加」之间被新任务插队而超限。
    const next = queue.shift()
    if (next) {
      next()
    }
    else {
      active--
    }
  }

  return async function run<T>(task: () => Promise<T>): Promise<T> {
    if (active >= size) {
      await new Promise<void>(resolve => queue.push(resolve))
    }
    else {
      active++
    }

    try {
      return await task()
    }
    finally {
      release()
    }
  }
}
