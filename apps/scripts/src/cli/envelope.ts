/** 一个命令的运行结果。runtime 用它拼 JSON 信封与退出码。 */
export interface CommandResult<T = unknown> {
  /** 交给 JSON 信封 data 字段；人读模式下忽略。 */
  data?: T
  /** 非 0 时作为退出码；缺省 0。 */
  exitCode?: number
  /** 人读模式下的收尾摘要行。 */
  summary?: string
}

export interface EnvelopeError {
  code: string
  message: string
  hint?: string
  context?: Record<string, unknown>
}

export interface EnvelopeMeta {
  mode: 'local' | 'remote'
  durationMs: number
  dryRun: boolean
  version: string
}

export interface Envelope<T = unknown> {
  ok: boolean
  command: string
  data: T | null
  error: EnvelopeError | null
  meta: EnvelopeMeta
}

export function buildEnvelope<T>(input: {
  command: string
  ok: boolean
  data?: T
  error?: EnvelopeError | null
  meta: EnvelopeMeta
}): Envelope<T> {
  return {
    ok: input.ok,
    command: input.command,
    data: input.ok
      ? (input.data ?? null)
      : null,
    error: input.ok
      ? null
      : (input.error ?? { code: 'FAILED', message: '未知错误' }),
    meta: input.meta,
  }
}

/** 单行 JSON：agent 只需要一行，方便 `| jq`。 */
export function serializeEnvelope(envelope: Envelope): string {
  return JSON.stringify(envelope)
}
