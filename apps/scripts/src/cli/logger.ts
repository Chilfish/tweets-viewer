import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}
const LEVEL_LABEL: Record<LogLevel, string> = {
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
}

export interface LoggerOptions {
  /** 日志前缀，沿用 `[ig]` 风格；一般等于命令 id。 */
  name: string
  /** 低于该等级的行不输出，默认 info。 */
  level?: LogLevel
  /** 只留汇总：抑制 info/debug，保留 warn/error。 */
  quiet?: boolean
  /** 追加写入 NDJSON（每行一个对象，带时间与等级）。 */
  file?: string
  /** `--json` 时由 runtime 独占 stdout，命令的数据结果只走信封。 */
  silentOutput?: boolean
  /** 注入的输出函数，测试用。 */
  write?: (stream: 'out' | 'err', line: string) => void
}

export interface Logger {
  readonly name: string
  debug: (message: string, fields?: Record<string, unknown>) => void
  info: (message: string, fields?: Record<string, unknown>) => void
  warn: (message: string, fields?: Record<string, unknown>) => void
  error: (message: string, fields?: Record<string, unknown>) => void
  /** 无等级前缀的原始行（表格、汇总），走 stderr。 */
  line: (message: string) => void
  /** 命令的数据输出，走 stdout；`--json` 时命令不应再调用。 */
  output: (message: string) => void
  /** 子前缀，例如 `ins.import` → `ins.import/ritsu_mgmg`。 */
  child: (suffix: string) => Logger
}

function defaultWrite(stream: 'out' | 'err', line: string): void {
  if (stream === 'err')
    process.stderr.write(`${line}\n`)
  else process.stdout.write(`${line}\n`)
}

/**
 * 创建命令日志器。
 *
 * 人读日志一律写 stderr，stdout 只留给命令的数据输出，
 * 这样 `account=$(bun run ig ins verify x 2>/dev/null)` 不会被日志污染。
 */
export function createLogger(options: LoggerOptions): Logger {
  const { name } = options
  const threshold = LEVEL_RANK[options.level ?? 'info']
  const write = options.write ?? defaultWrite
  const file = options.file
  let fileReady = false

  function emit(level: LogLevel, message: string, fields?: Record<string, unknown>): void {
    if (options.quiet && LEVEL_RANK[level] < LEVEL_RANK.warn)
      return
    if (LEVEL_RANK[level] < threshold)
      return

    const prefix = level === 'info'
      ? `[${name}]`
      : `[${name}] ${LEVEL_LABEL[level]}`
    const suffix = fields && Object.keys(fields).length > 0
      ? ` ${JSON.stringify(fields)}`
      : ''
    write('err', `${prefix} ${message}${suffix}`)

    if (file) {
      try {
        if (!fileReady) {
          mkdirSync(dirname(file), { recursive: true })
          fileReady = true
        }
        appendFileSync(
          file,
          `${JSON.stringify({
            time: new Date().toISOString(),
            level,
            name,
            message,
            ...fields,
          })}\n`,
          'utf8',
        )
      }
      catch {
        // 日志落盘失败不能改变命令结果。
      }
    }
  }

  return {
    name,
    debug: (message, fields) => emit('debug', message, fields),
    info: (message, fields) => emit('info', message, fields),
    warn: (message, fields) => emit('warn', message, fields),
    error: (message, fields) => emit('error', message, fields),
    line: (message) => {
      if (options.quiet)
        return
      if (threshold > LEVEL_RANK.info)
        return
      write('err', message)
    },
    output: (message) => {
      if (options.silentOutput)
        return
      write('out', message)
    },
    child: suffix => createLogger({ ...options, name: `${name}/${suffix}` }),
  }
}
