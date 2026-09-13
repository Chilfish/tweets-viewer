import { RettiwtConfig } from '../models/RettiwtConfig'
import { FetcherService } from '../services/public/FetcherService'

/**
 * 所有 API Key 都因 429 被耗尽时抛出。
 *
 * 保留明确的 `status`，让上层能够快速中止，而不是继续重试把限流打得更死。
 */
export class RettiwtRateLimitError extends Error {
  public readonly status = 429

  public constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'RettiwtRateLimitError'
  }
}

/**
 * 所有 API Key 都被 X 拒绝时抛出。
 *
 * - `401`：cookie 失效（X 返回 `code 32 Could not authenticate you`）
 * - `403`：出口 IP 被判定为不可信（数据中心 IP 常见），或账号被限制
 *
 * 两种都是 key 级失败，换 key 可能有用；全部试完则抛出，让上层一次失败就中止，
 * 而不是把每个用户都重试一遍。
 */
export class RettiwtAuthError extends Error {
  public readonly status: number

  public constructor(message: string, status: number = 401, options?: ErrorOptions) {
    super(message, options)
    this.name = 'RettiwtAuthError'
    this.status = status
  }
}

// 定义业务函数的签名：接收一个 Fetcher，返回任意 Promise
type Task<T> = (fetcher: FetcherService) => Promise<T>

export interface RettiwtPoolOptions {
  /**
   * 代理地址（`http(s)://` 或 `socks://`），透传给 RettiwtConfig；不传则直连。
   *
   * 用于绕开数据中心出口 IP 被 X 拒绝（403）的情况。
   */
  proxy?: string
}

export class RettiwtPool {
  private keys: string[]
  private currentIndex: number = 0
  // 缓存实例，避免重复 new Config 的开销
  private instanceCache: Map<string, FetcherService> = new Map()
  private proxy?: string

  constructor(keys: string[], options: RettiwtPoolOptions = {}) {
    if (!keys.length)
      throw new Error('API Keys cannot be empty')
    this.keys = keys
    this.proxy = options.proxy
  }

  /**
   * 核心高阶函数
   * @param task 具体的业务逻辑，例如：(fetcher) => fetcher.request(...)
   * @param attempt 当前重试次数（内部使用）
   */
  public async run<T>(task: Task<T>, attempt: number = 0): Promise<T> {
    // 1. 获取当前 Key 和对应的 Fetcher 实例
    const currentKey = this.getKey()
    const fetcher = this.getOrCreateFetcher(currentKey)

    try {
      // 2. 执行业务逻辑
      return await task(fetcher)
    }
    catch (error: any) {
      const status = this.getErrorStatus(error)

      // 3. 错误过滤：key 级失败就换 key 再试。401/403（key 被拒）与 429（限流）都属此列。
      if (status === 401 || status === 403 || status === 429) {
        // 防止无限递归：轮完所有 Key 还是失败，说明没有一把可用，直接抛出
        if (attempt >= this.keys.length) {
          const detail = `[RettiwtPool] All ${this.keys.length} keys exhausted (last: HTTP ${status}). Last Error: ${error.message}`
          throw status === 429
            ? new RettiwtRateLimitError(detail, { cause: error })
            : new RettiwtAuthError(detail, status, { cause: error })
        }

        console.warn(`[RettiwtPool] Key ending in ...${currentKey.slice(-10)} rejected with ${status}. Rotating...`)

        // 4. 轮询到下一个 Key
        this.rotateKey()

        // 5. 递归重试
        return this.run(task, attempt + 1)
      }

      // 其他错误（404/500 等）与 Key 无关，直接抛出，不要换 Key 重试
      throw error
    }
  }

  private getKey(): string {
    return this.keys[this.currentIndex]!
  }

  private rotateKey(): void {
    this.currentIndex = (this.currentIndex + 1) % this.keys.length
  }

  private getOrCreateFetcher(key: string): FetcherService {
    if (!this.instanceCache.has(key)) {
      const config = new RettiwtConfig({
        apiKey: key,
        proxy: this.proxy,
      })
      this.instanceCache.set(key, new FetcherService(config))
    }
    return this.instanceCache.get(key)!
  }

  /**
   * 从 Axios / TwitterError / 自定义错误中提取 HTTP 状态码。
   */
  private getErrorStatus(error: any): number | undefined {
    return error?.response?.status ?? error?.status ?? error?.statusCode
  }
}
