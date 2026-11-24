#!/usr/bin/env bun
/**
 * tweets-viewer.ts — 推文 / Instagram 归档只读 API 的命令行客户端。
 *
 * 用法：bun tweets-viewer.ts <命令> [参数...]
 * 运行环境：Bun 1.3+ 或 Node 22.18+（原生 TypeScript），无第三方依赖。
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const DEFAULT_BASE_URL = 'https://tweet-api.chilfish.top'
const JST_OFFSET_MS = 9 * 60 * 60 * 1000
const REQUEST_TIMEOUT_MS = 45_000
const DOWNLOAD_TIMEOUT_MS = 60_000

const VALUE_FLAGS = new Set(['page', 'size', 'cursor', 'name', 'start', 'end', 'out'])
const BOOLEAN_FLAGS = new Set(['reverse', 'no-replies', 'json'])

function paint(text: string, code: string, stream: NodeJS.WriteStream = process.stdout): string {
  const enabled = Boolean(stream.isTTY) && !process.env.NO_COLOR
  return enabled ? `\u001B[${code}m${text}\u001B[0m` : text
}

const cyan = (text: string) => paint(text, '36')
const gray = (text: string) => paint(text, '90')
const yellow = (text: string) => paint(text, '33')
const green = (text: string) => paint(text, '32')
const red = (text: string) => paint(text, '31', process.stderr)

class CliError extends Error {
  readonly exitCode: number

  constructor(message: string, exitCode = 2) {
    super(message)
    this.name = 'CliError'
    this.exitCode = exitCode
  }
}

interface ParsedArgs {
  command: string
  positionals: string[]
  flags: Map<string, string | boolean>
}

function parseBooleanFlag(name: string, raw: string): boolean {
  if (raw === 'true' || raw === '1')
    return true
  if (raw === 'false' || raw === '0')
    return false
  throw new CliError(`--${name} 只接受 true/false/1/0（收到 ${raw}）`)
}

function parseArgs(argv: string[]): ParsedArgs {
  const positionals: string[] = []
  const flags = new Map<string, string | boolean>()
  let stopFlags = false

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]!

    if (stopFlags) {
      positionals.push(token)
      continue
    }

    if (token === '--') {
      stopFlags = true
      continue
    }

    if (token.startsWith('--')) {
      const equals = token.indexOf('=')
      const name = equals === -1 ? token.slice(2) : token.slice(2, equals)

      if (!VALUE_FLAGS.has(name) && !BOOLEAN_FLAGS.has(name))
        throw new CliError(`未知参数 --${name}（运行 help 查看支持的开关）`)

      if (equals !== -1) {
        const raw = token.slice(equals + 1)
        flags.set(name, BOOLEAN_FLAGS.has(name) ? parseBooleanFlag(name, raw) : raw)
        continue
      }

      if (VALUE_FLAGS.has(name)) {
        const value = argv[i + 1]
        if (value === undefined || value.startsWith('--'))
          throw new CliError(`参数 --${name} 缺少值`)
        flags.set(name, value)
        i++
      }
      else {
        flags.set(name, true)
      }
      continue
    }

    if (token.startsWith('-') && token !== '-')
      throw new CliError(`未知参数 ${token}（只支持 --flag 风格）`)

    positionals.push(token)
  }

  const [command = 'help', ...rest] = positionals
  return { command: command.toLowerCase(), positionals: rest, flags }
}

function assertAllowedFlags(command: string, flags: Map<string, string | boolean>, allowed: readonly string[]): void {
  for (const name of flags.keys()) {
    if (!allowed.includes(name))
      throw new CliError(`命令 ${command} 不支持 --${name}`)
  }
}

function stringFlag(flags: Map<string, string | boolean>, name: string): string | undefined {
  const value = flags.get(name)
  if (value === undefined)
    return undefined
  if (typeof value !== 'string')
    throw new CliError(`--${name} 需要一个值`)
  return value
}

function booleanFlag(flags: Map<string, string | boolean>, name: string): boolean | undefined {
  const value = flags.get(name)
  if (value === undefined)
    return undefined
  if (typeof value !== 'boolean')
    throw new CliError(`--${name} 是开关，不接收值`)
  return value
}

function requirePositional(positionals: string[], index: number, usage: string): string {
  const value = positionals[index]
  if (!value)
    throw new CliError(`用法: ${usage}`)
  return value
}

function resolveName(value: string, label = 'name'): string {
  let name = value.trim()

  if (/^https?:\/\//i.test(name)) {
    try {
      const url = new URL(name)
      name = url.pathname.split('/').filter(Boolean).pop() ?? ''
    }
    catch {
      throw new CliError(`非法 ${label} "${value}"：无法解析链接`)
    }
  }

  name = name.replace(/^@/, '')

  if (!/^[A-Za-z0-9_]+$/.test(name) || name.length > 50) {
    throw new CliError(
      `非法 ${label} "${value}"：只接受 X Screen Name（[A-Za-z0-9_]+，最长 50 字符）。`
      + ` 点号/连字符不合法；可以直接粘贴 x.com 链接或 @句柄。`,
    )
  }

  return name
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

function applyPagination(query: URLSearchParams, flags: Map<string, string | boolean>): void {
  const page = stringFlag(flags, 'page')
  const size = stringFlag(flags, 'size')
  const cursor = stringFlag(flags, 'cursor')

  if (page !== undefined) {
    const parsed = Number(page)
    if (!Number.isInteger(parsed) || parsed < 1)
      throw new CliError(`--page 需为 >= 1 的整数（收到 ${page}）`)
    query.set('page', String(parsed))
  }

  if (size !== undefined) {
    const parsed = Number(size)
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100)
      throw new CliError(`--size 需为 1-100 的整数（收到 ${size}）`)
    query.set('pageSize', String(parsed))
  }

  if (cursor !== undefined) {
    if (!/^\d{1,19}$/.test(cursor))
      throw new CliError(`--cursor 需为 1-19 位十进制 snowflake id（收到 ${cursor}）`)
    if (page !== undefined)
      throw new CliError('--cursor 与 --page 不能同时使用：跳页用 --page，续载用 --cursor')
    query.set('cursor', cursor)
  }

  const reverse = booleanFlag(flags, 'reverse')
  if (reverse !== undefined)
    query.set('reverse', String(reverse))
}

function applyDateRange(query: URLSearchParams, flags: Map<string, string | boolean>): void {
  const start = stringFlag(flags, 'start')
  const end = stringFlag(flags, 'end')

  if (start === undefined && end === undefined)
    return

  if (start === undefined || end === undefined)
    throw new CliError('--start 与 --end 必须成对提供')

  if (!isIsoDate(start))
    throw new CliError(`--start 日期格式应为 YYYY-MM-DD（收到 ${start}）`)
  if (!isIsoDate(end))
    throw new CliError(`--end 日期格式应为 YYYY-MM-DD（收到 ${end}）`)
  if (start > end)
    throw new CliError(`--start 晚于 --end（${start} > ${end}）`)

  query.set('start', start)
  query.set('end', end)
}

function withQuery(path: string, query: URLSearchParams): string {
  const suffix = query.toString()
  return suffix ? `${path}?${suffix}` : path
}

let cachedSkillVersion: string | undefined

async function skillVersion(): Promise<string> {
  if (cachedSkillVersion)
    return cachedSkillVersion

  try {
    const skillFile = fileURLToPath(new URL('../SKILL.md', import.meta.url))
    const markdown = await readFile(skillFile, 'utf8')
    const match = markdown.match(/^\s*version:\s*"([0-9]+\.[0-9]+\.[0-9]+)"\s*$/m)
    cachedSkillVersion = match?.[1] ?? 'unknown'
  }
  catch {
    cachedSkillVersion = 'unknown'
  }

  return cachedSkillVersion
}

async function requestJson(path: string): Promise<unknown> {
  const baseUrl = (process.env.TWEETS_VIEWER_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '')
  const url = `${baseUrl}${path}`
  const userAgent = `tweets-viewer-skill/${await skillVersion()}`

  let response: Response
  try {
    response = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': userAgent },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new CliError(`请求失败：${message}\n${url}`, 1)
  }

  const text = await response.text()
  let body: unknown
  try {
    body = text ? JSON.parse(text) : undefined
  }
  catch {
    body = text
  }

  if (!response.ok) {
    const detail = typeof body === 'object' && body !== null && 'error' in body
      ? String((body as { error: unknown }).error)
      : text.slice(0, 300)
    throw new CliError(`请求失败 HTTP ${response.status}：${detail}\n${url}`, 1)
  }

  return body
}

function asObject(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: '\'',
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"',
}

function decodeHtml(value: string): string {
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z][a-z\d]+);/gi, (entity, body: string) => {
    if (body.startsWith('#')) {
      const isHex = body[1] === 'x' || body[1] === 'X'
      const code = Number.parseInt(body.slice(isHex ? 2 : 1), isHex ? 16 : 10)
      if (!Number.isFinite(code) || code < 0 || code > 0x10FFFF)
        return entity
      return String.fromCodePoint(code)
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? entity
  })
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function formatJst(value: string | undefined): string | undefined {
  if (!value)
    return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime()))
    return value

  const jst = new Date(date.getTime() + JST_OFFSET_MS)
  return `${jst.getUTCFullYear()}-${pad(jst.getUTCMonth() + 1)}-${pad(jst.getUTCDate())}`
    + ` ${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())}`
}

function indentBlock(value: string): string {
  return value.split('\n').map(line => `    ${line}`).join('\n')
}

function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
}

function printCursor(meta: Record<string, unknown>, itemCount: number): void {
  if (meta.hasMore === true) {
    const cursor = meta.nextCursor
    if (cursor !== undefined && cursor !== null)
      console.log(yellow(`nextCursor: ${String(cursor)}`))
    else
      console.log(yellow('hasMore=true 但未返回 nextCursor；改用 --page 翻页'))
    return
  }

  if (itemCount > 0)
    console.log(gray('(无更多：hasMore=false)'))
}

function printTweet(value: unknown, index: number): void {
  const tweet = asObject(value)
  const user = asObject(tweet.user)
  const screenName = asString(user.screen_name) ?? '?'
  const displayName = asString(user.name)
  const prefix = index > 0 ? `[${index}] ` : ''

  console.log(cyan(`${prefix}@${screenName}${displayName ? ` (${displayName})` : ''}`))

  const meta: string[] = []
  const createdAt = formatJst(asString(tweet.created_at))
  if (createdAt)
    meta.push(`${createdAt} JST`)

  const lang = asString(tweet.lang)
  if (lang)
    meta.push(`lang=${lang}`)

  const counters: Array<[string, string]> = [
    ['like_count', 'likes'],
    ['retweet_count', 'rt'],
    ['reply_count', 'replies'],
    ['view_count', 'views'],
  ]
  for (const [key, label] of counters) {
    const count = asNumber(tweet[key])
    if (count !== undefined)
      meta.push(`${label}=${count}`)
  }

  if (meta.length > 0)
    console.log(gray(`    ${meta.join('  ')}`))

  const text = decodeHtml(asString(tweet.text) ?? '').trim()
  if (text)
    console.log(indentBlock(text))

  const url = asString(tweet.url)
  if (url)
    console.log(gray(`    ${url}`))

  const media = asArray(tweet.media_details)
  if (media.length > 0) {
    console.log(gray(`    media x${media.length}`))
    media.forEach((item, mediaIndex) => {
      const detail = asObject(item)
      const type = asString(detail.type) ?? 'media'
      const cover = asString(detail.media_url_https)
      const variants = asArray(asObject(detail.video_info).variants)
      const video = variants
        .map(variant => asObject(variant))
        .find(variant => asString(variant.content_type) === 'video/mp4' && asString(variant.url))
      const link = cover ?? asString(video?.url) ?? ''
      console.log(gray(`      [${mediaIndex + 1}] [${type}] ${link}`))
      if (video && cover)
        console.log(gray(`          video: ${String(video.url)}`))
    })
  }

  if (tweet.retweeted_original_id)
    console.log(gray(`    RT event ${String(tweet.retweeted_original_id)}`))

  const quoted = asObject(tweet.quoted_tweet)
  const quotedUrl = asString(quoted.url)
  if (quotedUrl)
    console.log(gray(`    quote ${quotedUrl}`))
  else if (tweet.quoted_tweet_id)
    console.log(gray(`    quote ${String(tweet.quoted_tweet_id)}`))

  console.log()
}

function printTweetPage(payload: unknown, label: string): void {
  const root = asObject(payload)
  const tweets = asArray(root.data)
  const meta = asObject(root.meta)

  console.log(cyan(`# ${label} → 本页 ${tweets.length} 条`))

  if (meta.total !== undefined) {
    console.log(gray(
      `    total=${String(meta.total)}  page=${String(meta.page)}  `
      + `pageSize=${String(meta.pageSize)}  hasMore=${String(meta.hasMore)}`,
    ))
  }

  console.log()
  tweets.forEach((tweet, index) => printTweet(tweet, index + 1))
  printCursor(meta, tweets.length)

  if (tweets.length === 0)
    console.log(yellow('本页无结果（该用户可能未归档，或过滤条件过窄）'))
}

function printUser(value: unknown, index: number): void {
  const user = asObject(value)
  const userName = asString(user.userName) ?? '?'
  const fullName = asString(user.fullName) ?? ''
  const prefix = index > 0 ? `[${index}] ` : ''

  console.log(cyan(`${prefix}@${userName}  ${fullName}`.trimEnd()))

  const counters: Array<[string, string]> = [
    ['followersCount', 'followers'],
    ['followingsCount', 'following'],
    ['statusesCount', 'statuses'],
    ['likeCount', 'likes'],
  ]
  const meta: string[] = []
  for (const [key, label] of counters) {
    const count = asNumber(user[key])
    if (count !== undefined)
      meta.push(`${label}=${count}`)
  }
  if (user.isVerified !== undefined)
    meta.push(`verified=${String(user.isVerified)}`)
  if (meta.length > 0)
    console.log(gray(`    ${meta.join('  ')}`))

  const extra: string[] = []
  const rawLocation = user.location
  const location = typeof rawLocation === 'string'
    ? rawLocation
    : asString(asObject(rawLocation).location)
  if (location)
    extra.push(`location=${location}`)

  const createdAt = formatJst(asString(user.createdAt))
  if (createdAt)
    extra.push(`created=${createdAt} JST`)

  const profileUrl = asString(user.url)
  if (profileUrl)
    extra.push(profileUrl)

  if (extra.length > 0)
    console.log(gray(`    ${extra.join('  ')}`))

  const description = decodeHtml(asString(user.description) ?? '').trim()
  if (description)
    console.log(indentBlock(description))

  const pinned = asArray(user.pinnedTweets)
  if (pinned.length > 0)
    console.log(gray(`    pinned: ${pinned.map(String).join(', ')}`))

  console.log()
}

function printStats(payload: unknown, name: string): void {
  const rows = asArray(payload).map(row => asObject(row))

  if (rows.length === 0) {
    console.log(yellow(`无归档记录（@${name}）`))
    return
  }

  const total = rows.reduce((sum, row) => sum + (asNumber(row.count) ?? 0), 0)
  const max = Math.max(1, ...rows.map(row => asNumber(row.count) ?? 0))

  console.log(cyan(`# @${name} 归档统计  → ${rows.length} 年 / 共 ${total} 条`))
  for (const row of rows) {
    const year = String(row.year ?? '?')
    const count = asNumber(row.count) ?? 0
    const bar = '*'.repeat(Math.max(1, Math.round((count / max) * 40)))
    console.log(`    ${year}  ${String(count).padStart(6)}  ${bar}`)
  }
}

function printIns(payload: unknown, name: string): void {
  const root = asObject(payload)
  const user = root.user === null || root.user === undefined ? undefined : asObject(root.user)

  if (user) {
    const counts: string[] = []
    const counters: Array<[string, string]> = [
      ['posts_count', 'posts'],
      ['followers_count', 'followers'],
      ['following_count', 'following'],
    ]
    for (const [key, label] of counters) {
      const count = asNumber(user[key])
      if (count !== undefined)
        counts.push(`${label}=${count}`)
    }

    console.log(cyan(`@${asString(user.username) ?? '?'}  ${asString(user.fullname) ?? ''}  verified=${String(user.verified)}`))
    if (counts.length > 0)
      console.log(gray(`    ${counts.join('  ')}`))

    const bio = decodeHtml(asString(user.bio) ?? '').trim()
    if (bio)
      console.log(indentBlock(bio))

    const externalUrl = asString(user.external_url)
    if (externalUrl)
      console.log(gray(`    ${externalUrl}`))
  }
  else {
    console.log(yellow(`无 IG 用户信息（@${name} 未映射 IG 数据）`))
  }

  console.log()

  const postsRoot = asObject(root.posts)
  const posts = asArray(postsRoot.data)
  const meta = asObject(postsRoot.meta)

  console.log(cyan(`# IG 帖子 @${name} → 本页 ${posts.length} 条`))
  if (meta.total !== undefined) {
    console.log(gray(
      `    total=${String(meta.total)}  page=${String(meta.page)}  `
      + `pageSize=${String(meta.pageSize)}  hasMore=${String(meta.hasMore)}`,
    ))
  }
  console.log()

  posts.forEach((item, index) => {
    const post = asObject(item)
    const createdAt = formatJst(asString(post.created_at))
    const type = asString(post.type) ?? 'post'
    console.log(cyan(`[${index + 1}] ${type}  ${createdAt ? `${createdAt} JST  ` : ''}${asString(post.url) ?? ''}`.trimEnd()))
    console.log(gray(`    likes=${String(post.likes)}  verified=${String(post.verified)}`))

    const location = asString(post.location_name)
    if (location)
      console.log(gray(`    location=${location}`))

    const tags = asArray(post.tags)
    if (tags.length > 0)
      console.log(gray(`    tags: ${tags.map(String).join(', ')}`))

    const description = decodeHtml(asString(post.description) ?? '').trim()
    if (description)
      console.log(indentBlock(description))

    for (const mediaItem of asArray(post.media)) {
      const media = asObject(mediaItem)
      const link = asString(media.video_url) ?? asString(media.display_url) ?? ''
      console.log(gray(`    - [${asString(media.type) ?? 'media'}] ${link}`))
    }

    const audio = asObject(post.audio)
    const audioTitle = asString(audio.title)
    if (audioTitle)
      console.log(gray(`    audio: ${audioTitle} — ${asString(audio.artist) ?? ''}`.trimEnd()))

    console.log()
  })

  if (posts.length === 0)
    console.log(yellow('无 IG 帖子（该用户未归档 IG 数据）'))

  if (meta.hasMore === true)
    console.log(gray('(还有更多：用 --page 翻页)'))
  else if (posts.length > 0)
    console.log(gray('(无更多：hasMore=false)'))
}

function printStatus(payload: unknown): void {
  const root = asObject(payload)
  const message = asString(root.message) ?? ''
  const today = asString(root.today)
  console.log(cyan(`${message}${today ? `  today=${today}` : ''}`.trim()))

  const sizes = asObject(root.tweetsSize)
  const entries = Object.entries(sizes).sort(([a], [b]) => a.localeCompare(b))

  if (entries.length === 0) {
    console.log(gray('    tweetsSize 为空（该实例未缓存用户）'))
    return
  }

  console.log(cyan(`# 缓存用户  → ${entries.length} 个`))
  for (const [name, count] of entries)
    console.log(`    ${name.padEnd(24)} ${String(count).padStart(6)}`)
}

async function downloadImage(url: string, out: string): Promise<void> {
  const target = resolve(out)
  await mkdir(dirname(target), { recursive: true })

  let response: Response
  try {
    response = await fetch(url, {
      headers: { 'User-Agent': `tweets-viewer-skill/${await skillVersion()}` },
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
    })
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new CliError(`图片下载失败：${message}`, 1)
  }

  if (!response.ok)
    throw new CliError(`图片下载失败 HTTP ${response.status}：${url}`, 1)

  await writeFile(target, new Uint8Array(await response.arrayBuffer()))
  console.log(green(`已保存: ${target}`))
}

async function cmdTweets(positionals: string[], flags: Map<string, string | boolean>): Promise<void> {
  const allowed = ['page', 'size', 'cursor', 'reverse', 'start', 'end', 'no-replies', 'json']
  assertAllowedFlags('tweets', flags, allowed)

  const name = resolveName(requirePositional(positionals, 0, 'tweets <name> [--page N|--cursor C] [--size N] [--reverse] [--start D --end D] [--no-replies]'))
  const query = new URLSearchParams()
  applyPagination(query, flags)
  applyDateRange(query, flags)
  if (booleanFlag(flags, 'no-replies') === true)
    query.set('noReplies', 'true')

  const data = await requestJson(withQuery(`/v3/tweets/get/${name}`, query))
  if (booleanFlag(flags, 'json'))
    printJson(data)
  else
    printTweetPage(data, `推文 @${name}`)
}

async function cmdMedias(positionals: string[], flags: Map<string, string | boolean>): Promise<void> {
  const allowed = ['page', 'size', 'cursor', 'reverse', 'start', 'end', 'json']
  assertAllowedFlags('medias', flags, allowed)

  const name = resolveName(requirePositional(positionals, 0, 'medias <name> [--page N|--cursor C] [--size N] [--reverse] [--start D --end D]'))
  const query = new URLSearchParams()
  applyPagination(query, flags)
  applyDateRange(query, flags)

  const data = await requestJson(withQuery(`/v3/tweets/medias/${name}`, query))
  if (booleanFlag(flags, 'json'))
    printJson(data)
  else
    printTweetPage(data, `媒体 @${name}`)
}

async function cmdSearch(positionals: string[], flags: Map<string, string | boolean>): Promise<void> {
  const allowed = ['page', 'size', 'cursor', 'reverse', 'name', 'json']
  assertAllowedFlags('search', flags, allowed)

  const keyword = requirePositional(positionals, 0, 'search "q" [--name U] [--page N|--cursor C] [--size N] [--reverse]')
  if (keyword.length < 1 || keyword.length > 200)
    throw new CliError('搜索关键词需为 1-200 字符')

  const query = new URLSearchParams({ q: keyword })
  applyPagination(query, flags)

  const rawName = stringFlag(flags, 'name')
  const name = rawName === undefined ? undefined : resolveName(rawName)
  if (name !== undefined)
    query.set('name', name)

  const data = await requestJson(withQuery('/v3/tweets/search', query))
  if (booleanFlag(flags, 'json'))
    printJson(data)
  else
    printTweetPage(data, `搜索 [${name ? `@${name}` : '全库'}] ${keyword}`)
}

async function cmdToday(positionals: string[], flags: Map<string, string | boolean>): Promise<void> {
  const allowed = ['page', 'size', 'cursor', 'reverse', 'json']
  assertAllowedFlags('today', flags, allowed)

  const name = resolveName(requirePositional(positionals, 0, 'today <name> [--page N|--cursor C] [--size N]'))
  const query = new URLSearchParams()
  applyPagination(query, flags)

  const data = await requestJson(withQuery(`/v3/tweets/get/${name}/last-years-today`, query))
  if (booleanFlag(flags, 'json'))
    printJson(data)
  else
    printTweetPage(data, `那年今日 @${name}`)
}

async function cmdTodayAll(positionals: string[], flags: Map<string, string | boolean>): Promise<void> {
  const allowed = ['page', 'size', 'cursor', 'reverse', 'json']
  assertAllowedFlags('today-all', flags, allowed)

  const query = new URLSearchParams()
  applyPagination(query, flags)

  const data = await requestJson(withQuery('/v3/tweets/last-years-today', query))
  if (booleanFlag(flags, 'json'))
    printJson(data)
  else
    printTweetPage(data, '那年今日（全量）')
}

async function cmdStats(positionals: string[], flags: Map<string, string | boolean>): Promise<void> {
  assertAllowedFlags('stats', flags, ['json'])

  const name = resolveName(requirePositional(positionals, 0, 'stats <name>'))
  const data = await requestJson(`/v3/tweets/stats/${name}`)
  if (booleanFlag(flags, 'json'))
    printJson(data)
  else
    printStats(data, name)
}

async function cmdUsers(positionals: string[], flags: Map<string, string | boolean>): Promise<void> {
  assertAllowedFlags('users', flags, ['json'])

  const data = await requestJson('/v3/users/all')
  if (booleanFlag(flags, 'json')) {
    printJson(data)
    return
  }

  const users = asArray(data)
  console.log(cyan(`# 归档用户  → ${users.length} 个`))
  console.log()
  users.forEach((user, index) => printUser(user, index + 1))
}

async function cmdUser(positionals: string[], flags: Map<string, string | boolean>): Promise<void> {
  assertAllowedFlags('user', flags, ['json'])

  const name = resolveName(requirePositional(positionals, 0, 'user <name>'))
  const data = await requestJson(`/v3/users/get/${name}`)
  if (booleanFlag(flags, 'json'))
    printJson(data)
  else
    printUser(data, 0)
}

async function cmdIns(positionals: string[], flags: Map<string, string | boolean>): Promise<void> {
  assertAllowedFlags('ins', flags, ['page', 'json'])

  const name = resolveName(requirePositional(positionals, 0, 'ins <name>   （name 为 X 用户名，非 IG 用户名）'))

  const query = new URLSearchParams()
  const page = stringFlag(flags, 'page')
  if (page !== undefined) {
    const parsed = Number(page)
    if (!Number.isInteger(parsed) || parsed < 1)
      throw new CliError(`--page 需为 >= 1 的整数（收到 ${page}）`)
    query.set('page', String(parsed))
  }

  const data = await requestJson(withQuery(`/v3/ins/${name}`, query))
  if (booleanFlag(flags, 'json'))
    printJson(data)
  else
    printIns(data, name)
}

async function cmdImage(positionals: string[], flags: Map<string, string | boolean>): Promise<void> {
  assertAllowedFlags('image', flags, ['name', 'out', 'json'])

  const query = new URLSearchParams()
  const name = stringFlag(flags, 'name')
  if (name !== undefined)
    query.set('name', resolveName(name))

  const data = await requestJson(withQuery('/v3/image/get', query))
  if (booleanFlag(flags, 'json')) {
    printJson(data)
    return
  }

  const root = asObject(data)
  const url = asString(root.url)
  if (!url) {
    console.log(yellow('未取到图片'))
    return
  }

  console.log(cyan(`随机图片: ${url}`))
  if (root.tweet)
    printTweet(root.tweet, 0)

  const out = stringFlag(flags, 'out')
  if (out !== undefined)
    await downloadImage(url, out)
}

async function cmdStatus(positionals: string[], flags: Map<string, string | boolean>): Promise<void> {
  assertAllowedFlags('status', flags, ['json'])

  const data = await requestJson('/')
  if (booleanFlag(flags, 'json'))
    printJson(data)
  else
    printStatus(data)
}

function printHelp(): void {
  console.log(`
用法: bun tweets-viewer.ts <命令> [参数...]

命令:
  tweets     <name>    用户推文（日期范围、排除回复、游标续载）
  medias     <name>    含图片/视频的推文（排除转推）
  search     "q"       关键词搜索（--name 限定用户，缺省全库）
  today      <name>    单用户「那年今日」（保留转推）
  today-all            全量「那年今日」（排除转推）
  stats      <name>    按年统计
  users                全部归档用户
  user       <name>    单个用户资料
  ins        <name>    IG 用户信息 + 帖子（name 为 X 用户名）
  image                随机归档图片（--name / --out）
  status               服务状态
  help                 本帮助

通用开关:
  --page N       页码，从 1 开始
  --size N       每页 1-100（默认 10；ins 固定 15）
  --cursor C     1-19 位 snowflake 游标（与 --page 二选一）
  --reverse      旧→新（默认新→旧）；可写 --reverse=false
  --start DATE   起始日期 YYYY-MM-DD（与 --end 成对）
  --end DATE     结束日期 YYYY-MM-DD
  --no-replies   排除回复（仅 tweets）
  --name U       限定用户（仅 search / image）
  --out FILE     图片保存路径（仅 image）
  --json         输出原始 JSON

环境变量:
  TWEETS_VIEWER_BASE_URL   API 基址（默认 ${DEFAULT_BASE_URL}）

示例:
  bun tweets-viewer.ts tweets ttisrn_0710 --size 20
  bun tweets-viewer.ts tweets https://x.com/ttisrn_0710 --start 2026-01-01 --end 2026-09-17
  bun tweets-viewer.ts search "こんびず" --name ttisrn_0710
  bun tweets-viewer.ts today-all --size 20
  bun tweets-viewer.ts image --name ttisrn_0710 --out ./random.jpg
`.trim())
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2)

  if (argv.length === 0 || argv[0] === 'help' || argv[0] === '-h' || argv[0] === '--help') {
    printHelp()
    return
  }

  const { command, positionals, flags } = parseArgs(argv)

  switch (command) {
    case 'tweets':
      await cmdTweets(positionals, flags)
      break
    case 'medias':
      await cmdMedias(positionals, flags)
      break
    case 'search':
      await cmdSearch(positionals, flags)
      break
    case 'today':
      await cmdToday(positionals, flags)
      break
    case 'today-all':
      await cmdTodayAll(positionals, flags)
      break
    case 'stats':
      await cmdStats(positionals, flags)
      break
    case 'users':
      await cmdUsers(positionals, flags)
      break
    case 'user':
      await cmdUser(positionals, flags)
      break
    case 'ins':
      await cmdIns(positionals, flags)
      break
    case 'image':
      await cmdImage(positionals, flags)
      break
    case 'status':
      await cmdStatus(positionals, flags)
      break
    default:
      console.error(red(`未知命令: ${command}`))
      printHelp()
      process.exit(2)
  }
}

main().catch((error: unknown) => {
  if (error instanceof CliError) {
    console.error(red(error.message))
    process.exit(error.exitCode)
  }

  const message = error instanceof Error ? error.message : String(error)
  console.error(red(message))
  process.exit(1)
})
