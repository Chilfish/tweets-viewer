import type { CommandResult, EnvelopeError } from './envelope'
import type { Logger, LogLevel } from './logger'
import { Command, CommanderError, Help, Option } from 'commander'
import { describeEnvironment, isLocalMode } from '../lib/local-config'
import { buildEnvelope, serializeEnvelope } from './envelope'
import { CliError, EXIT_CODES, UsageError } from './exit'
import { createLogger } from './logger'

/** commander 的帮助标题与提示默认是英文；统一换成中文。 */
const HELP_TITLES: Record<string, string> = {
  'Usage:': '用法：',
  'Options:': '选项：',
  'Global Options:': '全局选项：',
  'Commands:': '命令：',
  'Arguments:': '参数：',
}

function localizeHelpText(text: string): string {
  return text
    .replace(/^(用法：|命令：|选项：|全局选项：|参数：) /gm, '$1')
    .replace(/display help for command/g, '显示某条命令的帮助')
    .replace(/\((choices|default): ([^()]*)\)/g, (_match, label: string, value: string) => (
      `（${label === 'choices'
        ? '可选'
        : '默认'}：${value}）`
    ))
}

class ChineseHelp extends Help {
  override styleTitle(text: string): string {
    return super.styleTitle(HELP_TITLES[text] ?? text)
  }

  override formatHelp(cmd: Command, helper: Help): string {
    return localizeHelpText(super.formatHelp(cmd, helper))
  }
}

/** 帮助与全局选项都要挂到每一层命令上：commander 不会自动继承。 */
function applySharedSettings(command: Command): void {
  command.createHelp = (): Help => new ChineseHelp()
  command.helpOption('-h, --help', '显示帮助')
  addGlobalOptions(command)
  command.exitOverride()
  command.configureOutput({
    writeOut: text => process.stdout.write(text),
    writeErr: text => process.stderr.write(text),
  })
  const originalHelp = command.helpInformation.bind(command)
  command.helpInformation = (context?: unknown): string => {
    for (const child of command.commands) {
      if (child.name() === 'help')
        child.description('显示某条命令的帮助')
    }
    return originalHelp(context as Parameters<typeof originalHelp>[0])
  }
}

/** 一条命令的静态描述，runtime 用它生成 commander 子命令与 describe 输出。 */
export interface CommandSpec<T = unknown> {
  /** 稳定 id，形如 `ins.import`，写进信封与日志前缀。 */
  id: string
  /** 一行说明，中文，动词开头。 */
  description: string
  /** 更长的说明，`--help` 的正文。 */
  details?: string
  /** 用法示例，`--help` 的 Examples 段。 */
  examples?: string[]
  /** 额外选项；全局选项由 runtime 注入。 */
  options?: Option[]
  /** 位置参数，如 `ins import <file>`。 */
  arguments?: { name: string, description: string, required?: boolean }[]
  /** 业务实现。dry-run 时 runtime 传入 ctx.dryRun，命令自己保证只读。 */
  run: (ctx: CommandContext) => Promise<CommandResult<T> | void>
}

export interface CommandContext {
  /** 解析后的业务选项（不含全局选项）。 */
  options: Record<string, unknown>
  /** 位置参数，按 spec.arguments 顺序。 */
  args: string[]
  /** 日志器，前缀为命令 id。 */
  log: Logger
  /** 是否 dry-run；命令内不得写库 / 写文件 / 上传。 */
  dryRun: boolean
  /** 是否 JSON 输出模式；为真时不要往 stdout 写任何别的东西。 */
  json: boolean
  /** 读取一个必填字符串选项，缺失或空时抛 UsageError。 */
  requireString: (name: string) => string
  /** 读取一个整数选项并校验下界。 */
  integer: (name: string, fallback: number, min?: number) => number
  /** 读取一个布尔选项。 */
  flag: (name: string) => boolean
}

type RuntimeFlag = 'json' | 'quiet' | 'dryRun' | 'logLevel' | 'logFile'

const GLOBAL_OPTION_KEYS = new Set<RuntimeFlag>([
  'json',
  'quiet',
  'dryRun',
  'logLevel',
  'logFile',
])

let VERSION = '0.0.0'

export function setVersion(version: string): void {
  VERSION = version
}

interface GlobalValues {
  json: boolean
  quiet: boolean
  dryRun: boolean
  logLevel: LogLevel
  logFile?: string
}

function readGlobal(command: Command): GlobalValues {
  const options = command.optsWithGlobals() as Record<string, unknown>
  const level = options.logLevel
  if (level !== undefined && level !== 'debug' && level !== 'info' && level !== 'warn' && level !== 'error') {
    throw new UsageError(`--log-level 只能是 debug / info / warn / error，收到 ${String(level)}`, {
      context: { option: 'logLevel', value: level },
    })
  }
  return {
    json: options.json === true,
    quiet: options.quiet === true,
    dryRun: options.dryRun === true,
    logLevel: (level ?? 'info') as LogLevel,
    logFile: typeof options.logFile === 'string'
      ? options.logFile
      : undefined,
  }
}

function addGlobalOptions(command: Command): Command {
  return command
    .addOption(new Option('--json', '输出单行 JSON 信封（{ok,command,data,error,meta}）到 stdout'))
    .addOption(new Option('--quiet', '只保留警告与错误'))
    .addOption(new Option('--dry-run', '只读：不写库、不写文件、不上传'))
    .addOption(new Option('--log-level <level>', '日志等级：debug / info / warn / error，默认 info'))
    .addOption(new Option('--log-file <path>', '把日志以 NDJSON 追加写入文件'))
}

/** 去掉全局选项后的剩余选项，作为命令自己的 options 交给 run。 */
function commandOptions(command: Command): Record<string, unknown> {
  const raw = command.opts() as Record<string, unknown>
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (GLOBAL_OPTION_KEYS.has(key as RuntimeFlag))
      continue
    result[key] = value
  }
  return result
}

function kebab(name: string): string {
  return name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
}

function createContext(spec: CommandSpec, command: Command, globals: GlobalValues): CommandContext {
  const options = commandOptions(command)
  const log = createLogger({
    name: spec.id,
    level: globals.logLevel,
    quiet: globals.quiet,
    file: globals.logFile,
    silentOutput: globals.json,
  })

  return {
    options,
    args: command.args.slice(),
    log,
    dryRun: globals.dryRun,
    json: globals.json,
    requireString(name) {
      const value = options[name]
      if (typeof value !== 'string' || value.length === 0) {
        throw new UsageError(`缺少 --${kebab(name)}`, {
          hint: `看 bun run ig ${spec.id.replaceAll('.', ' ')} --help`,
          context: { option: name },
        })
      }
      return value
    },
    integer(name, fallback, min = 0) {
      const raw = options[name]
      if (raw === undefined)
        return fallback
      const value = Number(raw)
      if (!Number.isInteger(value) || value < min) {
        throw new UsageError(`--${kebab(name)} 需要是 >= ${min} 的整数`, {
          context: { option: name, value: raw },
        })
      }
      return value
    },
    flag(name) {
      return options[name] === true
    },
  }
}

function toEnvelopeError(error: unknown): { payload: EnvelopeError, exitCode: number } {
  if (error instanceof CliError) {
    return {
      payload: {
        code: error.code,
        message: error.message,
        ...(error.hint
          ? { hint: error.hint }
          : {}),
        ...(error.context
          ? { context: error.context }
          : {}),
      },
      exitCode: error.exitCode,
    }
  }
  const message = error instanceof Error
    ? error.message
    : String(error)
  return {
    payload: { code: 'FAILED', message },
    exitCode: EXIT_CODES.failure,
  }
}

function buildMeta(globals: GlobalValues, startTime: number): {
  mode: 'local' | 'remote'
  durationMs: number
  dryRun: boolean
  version: string
} {
  return {
    mode: isLocalMode()
      ? 'local'
      : 'remote',
    durationMs: Date.now() - startTime,
    dryRun: globals.dryRun,
    version: VERSION,
  }
}

/** `--json` 模式下 stdout 只能有一行信封，console 输出改道 stderr。 */
function redirectConsoleToStderr(): () => void {
  const saved = {
    log: console.log,
    info: console.info,
    debug: console.debug,
    table: console.table,
  }
  const toErr = (...args: unknown[]): void => {
    process.stderr.write(`${args.map(item => (typeof item === 'string'
      ? item
      : JSON.stringify(item))).join(' ')}\n`)
  }
  console.log = toErr
  console.info = toErr
  console.debug = toErr
  console.table = toErr
  return () => Object.assign(console, saved)
}

/** 命令主体调用 `process.exit` 时抛这个，runtime 转成退出码而不是立刻杀进程。 */
class CommandExit extends Error {
  readonly code: number
  constructor(code: number) {
    super(`命令以退出码 ${code} 结束`)
    this.name = 'CommandExit'
    this.code = code
  }
}

function interceptProcessExit(): () => void {
  const original = process.exit.bind(process)
  process.exit = ((code?: number) => {
    throw new CommandExit(typeof code === 'number'
      ? code
      : EXIT_CODES.ok)
  }) as typeof process.exit
  return () => {
    process.exit = original
  }
}

/** 给一条命令挂上统一的执行包装：环境横幅、信封、退出码。 */
function attachRunner(command: Command, spec: CommandSpec, startTime: number): Command {
  command.action(async (...actionArgs: unknown[]) => {
    const self = actionArgs[actionArgs.length - 1] as Command
    let globals: GlobalValues
    let ctx: CommandContext
    try {
      globals = readGlobal(self)
      ctx = createContext(spec, self, globals)
    }
    catch (error) {
      const { payload, exitCode } = toEnvelopeError(error)
      process.stderr.write(`${payload.message}\n`)
      if (payload.hint)
        process.stderr.write(`下一步：${payload.hint}\n`)
      process.exitCode = exitCode
      return
    }

    if (!globals.json)
      ctx.log.info(describeEnvironment())

    const restoreConsole = globals.json
      ? redirectConsoleToStderr()
      : null
    const restoreExit = interceptProcessExit()
    try {
      const result = (await spec.run(ctx)) ?? {}
      const ok = (result.exitCode ?? EXIT_CODES.ok) === 0
      if (globals.json) {
        process.stdout.write(`${serializeEnvelope(buildEnvelope({
          command: spec.id,
          ok,
          data: result.data,
          meta: buildMeta(globals, startTime),
        }))}\n`)
      }
      else if (result.summary) {
        ctx.log.line(result.summary)
      }
      process.exitCode = result.exitCode ?? EXIT_CODES.ok
    }
    catch (error) {
      if (error instanceof CommandExit) {
        if (globals.json) {
          process.stdout.write(`${serializeEnvelope(buildEnvelope({
            command: spec.id,
            ok: error.code === 0,
            ...(error.code === 0
              ? {}
              : {
                  error: { code: 'EXITED', message: '命令以非零退出码结束' },
                }),
            meta: buildMeta(globals, startTime),
          }))}\n`)
        }
        process.exitCode = error.code
        return
      }

      const { payload, exitCode } = toEnvelopeError(error)
      if (globals.json) {
        process.stdout.write(`${serializeEnvelope(buildEnvelope({
          command: spec.id,
          ok: false,
          error: payload,
          meta: buildMeta(globals, startTime),
        }))}\n`)
      }
      else {
        ctx.log.error(payload.message)
        if (payload.hint)
          ctx.log.line(`下一步：${payload.hint}`)
        if (globals.logLevel === 'debug' && error instanceof Error && error.stack) {
          ctx.log.debug(error.stack)
        }
      }
      process.exitCode = exitCode
    }
    finally {
      restoreExit()
      restoreConsole?.()
    }
  })
  return command
}

/** 把 spec 建成 commander 子命令并挂到 parent 上。 */
export function registerCommand(parent: Command, spec: CommandSpec): Command {
  const startTime = Date.now()
  const name = spec.id.split('.').at(-1) ?? spec.id
  const command = parent.command(name).description(spec.description)
  applySharedSettings(command)
  const helpExtras: string[] = []
  if (spec.details)
    helpExtras.push(spec.details)
  if (spec.examples && spec.examples.length > 0) {
    helpExtras.push(`示例：\n${spec.examples.map(line => `  ${line}`).join('\n')}`)
  }
  if (helpExtras.length > 0)
    command.addHelpText('after', `\n${helpExtras.join('\n\n')}`)
  for (const option of spec.options ?? []) command.addOption(option)
  for (const argument of spec.arguments ?? []) {
    if (argument.required === false)
      command.argument(`[${argument.name}]`, argument.description)
    else command.argument(`<${argument.name}>`, argument.description)
  }
  return attachRunner(command, spec, startTime)
}

export interface CliGroup {
  name: string
  description: string
  commands: CommandSpec[]
}

export interface DescribeCommand {
  id: string
  description: string
  details?: string
  examples?: string[]
  options: { flags: string, description: string, default?: unknown, choices?: string[] }[]
  arguments: { name: string, description: string, required: boolean }[]
}

/** 命令树的结构化描述，`describe` 子命令用。 */
export function describeCli(
  groups: CliGroup[],
  version: string,
  rootCommands: CommandSpec[] = [],
): {
  name: string
  version: string
  exitCodes: { code: number, meaning: string }[]
  globalOptions: { flags: string, description: string }[]
  commands: DescribeCommand[]
  groups: { name: string, description: string, commands: DescribeCommand[] }[]
} {
  const toDescribed = (spec: CommandSpec): DescribeCommand => ({
    id: spec.id,
    description: spec.description,
    ...(spec.details
      ? { details: spec.details }
      : {}),
    ...(spec.examples
      ? { examples: spec.examples }
      : {}),
    options: (spec.options ?? []).map(option => ({
      flags: option.flags,
      description: option.description,
      ...(option.defaultValue !== undefined
        ? { default: option.defaultValue }
        : {}),
      ...(option.argChoices
        ? { choices: option.argChoices }
        : {}),
    })),
    arguments: (spec.arguments ?? []).map(argument => ({
      name: argument.name,
      description: argument.description,
      required: argument.required !== false,
    })),
  })

  return {
    name: 'ig',
    version,
    exitCodes: [
      { code: 0, meaning: '成功 / 已收敛' },
      { code: 1, meaning: '运行期失败（部分批次失败也算）' },
      { code: 2, meaning: '用法错误：未知参数、缺必填、非法取值' },
      { code: 3, meaning: '配置缺失：DATABASE_URL / INSTAGRAM_COOKIES 未配置' },
    ],
    globalOptions: [
      { flags: '--json', description: '输出单行 JSON 信封到 stdout' },
      { flags: '--quiet', description: '只保留警告与错误' },
      { flags: '--dry-run', description: '只读：不写库、不写文件、不上传' },
      { flags: '--log-level <level>', description: 'debug / info / warn / error，默认 info' },
      { flags: '--log-file <path>', description: '把日志以 NDJSON 追加写入文件' },
      { flags: '-h, --help', description: '显示帮助' },
      { flags: '-V, --version', description: '显示版本' },
    ],
    commands: rootCommands.map(toDescribed),
    groups: groups.map(group => ({
      name: group.name,
      description: group.description,
      commands: group.commands.map(toDescribed),
    })),
  }
}

/** 构建整个 CLI 树。 */
export function buildCli(
  groups: CliGroup[],
  version: string,
  rootCommands: CommandSpec[] = [],
): Command {
  setVersion(version)
  const program = new Command()
  program
    .name('ig')
    .description('Instagram 归档流水线')
    .version(version, '-V, --version', '显示版本')
    .showHelpAfterError('（加 --help 看完整用法）')
  applySharedSettings(program)
  program.enablePositionalOptions()

  const describeCommand = program
    .command('describe')
    .description('输出完整命令树（JSON），供 agent 自举')
  applySharedSettings(describeCommand)
  describeCommand.action(() => {
    process.stdout.write(`${JSON.stringify(describeCli(groups, version, rootCommands), null, 2)}\n`)
  })

  for (const group of groups) {
    const groupCommand = program.command(group.name).description(group.description)
    applySharedSettings(groupCommand)
    for (const spec of group.commands) registerCommand(groupCommand, spec)
  }

  for (const spec of rootCommands) registerCommand(program, spec)

  return program
}

/** 执行 CLI 并统一处理 commander 自身的错误。 */
export async function runCli(program: Command, argv: string[]): Promise<void> {
  program.commands.forEach((command) => {
    if (command.name() === 'help')
      command.description('显示某条命令的帮助')
  })
  try {
    await program.parseAsync(argv, { from: 'user' })
  }
  catch (error) {
    if (error instanceof CommanderError) {
      const helpCodes = new Set(['commander.helpDisplayed', 'commander.help', 'commander.version'])
      if (helpCodes.has(error.code)) {
        process.exitCode = EXIT_CODES.ok
        return
      }
      process.exitCode = EXIT_CODES.usage
      return
    }
    throw error
  }
}
