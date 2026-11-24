import type { StageDefinition } from '@chilfish/devkit/pipeline'
import { runPipeline } from '@chilfish/devkit/pipeline'

/** 每个 Key 支撑的在飞用户数（抓取是延迟密集型，略高于 Key 数不会超额）。 */
const USERS_PER_KEY = 2

/** 低于 2 路并发就退化成串行，没有意义。 */
const MIN_CONCURRENCY = 2

/**
 * 进程级并发预算：`SYNC_CONCURRENCY` 显式覆盖，缺省 `Key 数 × 2`。
 *
 * X 的速率限制按 Key / 15 分钟窗口计，少量超额由 `RettiwtPool` 的 429 冷却
 * 轮换兜住；本地冒烟常把它设成 1。
 */
export function resolveSyncConcurrency(
  keysCount: number,
  env: Record<string, string | undefined> = process.env,
): number {
  const raw = Number(env.SYNC_CONCURRENCY)
  if (Number.isInteger(raw) && raw > 0) {
    return raw
  }
  return Math.max(MIN_CONCURRENCY, keysCount * USERS_PER_KEY)
}

/**
 * 单个归档库分到的并发数。
 *
 * 多个库会同时更新并共用同一批 Key，把预算按库数均分，进程内总在飞请求
 * 才不会随库数翻倍；每个库至少保留 1 路。
 */
export function shareConcurrency(budget: number, targets: number): number {
  const count = Math.max(1, Math.floor(targets) || 1)
  return Math.max(1, Math.floor(budget / count))
}

export interface BoundedStageOptions<T> {
  /** 阶段名，用于阶段状态与失败归因。 */
  name: string
  items: readonly T[]
  /** 唯一标识；用于把失败映射回具体条目。 */
  key: (item: T) => string
  /** 同时进行的条目上限。 */
  concurrency: number
  /**
   * 每派发一项前询问是否停止；返回 `true` 时后续条目直接跳过，
   * 已在运行的条目照常收尾（不会中途打断请求）。
   */
  shouldStop?: () => boolean
  /** 取消信号：未开始的条目不再派发，已在跑的条目由 devkit 取消。 */
  signal?: AbortSignal
  run: (item: T, context: { signal: AbortSignal }) => Promise<unknown>
}

export interface BoundedStageOutcome {
  /** `succeeded` 表示没有条目失败；`cancelled` 表示被信号中断。 */
  status: 'succeeded' | 'partial' | 'failed' | 'cancelled'
  failures: { key: string, message: string }[]
}

/**
 * 有界并发地跑一组条目，单条失败只记录不中断。
 *
 * 薄封装 `runPipeline`：单阶段 + 进程内 handler，状态机、重试与取消语义由
 * devkit 保证；调用方拿回失败清单，自行决定退出码。
 */
export async function runBoundedStage<T>(
  options: BoundedStageOptions<T>,
): Promise<BoundedStageOutcome> {
  const stage: StageDefinition<T> = {
    name: options.name,
    items: options.items,
    key: item => options.key(item),
    concurrency: options.concurrency,
    run: (item, context) => {
      if (options.shouldStop?.()) {
        return
      }
      return options.run(item, { signal: context.signal })
    },
  }

  const result = await runPipeline<T>({
    runId: options.name,
    stages: [stage],
    signal: options.signal,
  })

  return {
    status: result.status,
    failures: result.failures.map(failure => ({
      key: failure.key,
      message: failure.error.message,
    })),
  }
}

/**
 * 进程级请求闸门：同时执行的任务数不超过 `limit`，其余按到达顺序排队。
 *
 * 每日抓取会按库并发调用同一份抓取逻辑，而所有库共用同一个 Key 池；
 * 闸门做成进程级单例，总在飞请求才会是 `limit` 而不是 `库数 × limit`。
 * `@chilfish/devkit/pipeline` 只限制单个阶段的在飞条目，跨阶段共享的
 * 额度仍需这层闸门。
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
