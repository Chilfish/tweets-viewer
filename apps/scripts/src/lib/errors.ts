import type { CommandGroup, CommandSpec } from '@chilfish/devkit/cli'
import { CliError, EXIT_CODES } from '@chilfish/devkit/cli'

/** devkit 0.2.0 只输出 `error.message`，这里保留旧的 `cause` 展开。 */
function describeError(error: Error): string {
  const cause = (error as { cause?: unknown }).cause
  return cause instanceof Error
    ? `${error.message}（原因：${cause.message}）`
    : error.message
}

/** 命令边界：把根因拼进消息，避免 Drizzle 等包装错误只剩外层描述。 */
export function withCauseExpansion(spec: CommandSpec): CommandSpec {
  return {
    ...spec,
    async run(ctx) {
      try {
        return await spec.run(ctx)
      }
      catch (error) {
        if (!(error instanceof Error) || !(error.cause instanceof Error)) {
          throw error
        }
        if (error instanceof CliError) {
          throw new CliError(describeError(error), {
            code: error.code,
            hint: error.hint,
            context: error.context,
            exitCode: error.exitCode,
          })
        }
        throw new CliError(describeError(error), {
          code: 'FAILED',
          exitCode: EXIT_CODES.failure,
        })
      }
    },
  }
}

export function withCauseExpansionGroup(group: CommandGroup): CommandGroup {
  return {
    ...group,
    commands: group.commands.map(withCauseExpansion),
  }
}
