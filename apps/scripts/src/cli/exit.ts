/**
 * 统一的进程退出码。命令不自己调用 `process.exit`，
 * 由 runtime 根据返回值或抛出的错误映射。
 *
 * 0  成功 / 已收敛
 * 1  运行期失败（批量任务里部分项失败也走这里）
 * 2  用法错误：未知参数、缺必填、非法取值
 * 3  配置缺失：DATABASE_URL / INSTAGRAM_COOKIES 之类没有配
 */
export const EXIT_CODES = {
  ok: 0,
  failure: 1,
  usage: 2,
  config: 3,
} as const

export type ExitCode = typeof EXIT_CODES[keyof typeof EXIT_CODES]

export interface CliErrorOptions {
  /** 稳定短码，写进 JSON 信封的 error.code（如 MISSING_ENV / INVALID_ARGUMENT）。 */
  code?: string
  /** 可直接照抄的下一步命令，写给人和 agent 看。 */
  hint?: string
  /** 机器可读的上下文，进信封的 error.context。 */
  context?: Record<string, unknown>
  exitCode?: ExitCode
  cause?: unknown
}

/** 命令内部用这个抛错；runtime 负责转成信封与退出码。 */
export class CliError extends Error {
  readonly code: string
  readonly hint?: string
  readonly context?: Record<string, unknown>
  readonly exitCode: ExitCode

  constructor(message: string, options: CliErrorOptions = {}) {
    super(message, options.cause === undefined
      ? undefined
      : { cause: options.cause })
    this.name = 'CliError'
    this.code = options.code ?? 'FAILED'
    this.hint = options.hint
    this.context = options.context
    this.exitCode = options.exitCode ?? EXIT_CODES.failure
  }
}

/** 参数用法错误，退出码 2。 */
export class UsageError extends CliError {
  constructor(message: string, options: CliErrorOptions = {}) {
    super(message, { code: 'INVALID_ARGUMENT', exitCode: EXIT_CODES.usage, ...options })
    this.name = 'UsageError'
  }
}

/** 缺少环境变量 / 凭据，退出码 3。 */
export class ConfigError extends CliError {
  constructor(message: string, options: CliErrorOptions = {}) {
    super(message, { code: 'MISSING_CONFIG', exitCode: EXIT_CODES.config, ...options })
    this.name = 'ConfigError'
  }
}

/** 读取必填环境变量，缺失时抛 ConfigError（带可照抄的下一步）。 */
export function requireEnvVar(name: string, hint?: string): string {
  const value = process.env[name]
  if (!value) {
    throw new ConfigError(`缺少环境变量 ${name}`, {
      code: 'MISSING_ENV',
      hint: hint ?? `在项目根目录 .env 里配置 ${name}`,
      context: { name },
    })
  }
  return value
}
