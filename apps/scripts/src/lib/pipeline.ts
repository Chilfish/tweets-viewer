import type { Logger } from '@chilfish/devkit/cli'
import type { DB } from '@tweets-viewer/database'
import type { IGPost } from '@tweets-viewer/shared'
import type { IgSession } from './instagram'
import type { ExportFile } from './media'
import { getInsPosts, getInsUserByName } from '@tweets-viewer/database'
import { importInsData, resolveTwitterUsername } from './ins-store'
import { collectUserInfo, collectUserPosts } from './instagram'
import { resolveCdnBase } from './local-config'
import {
  downloadExportMedia,
  readExportFile,
  rewriteToCdn,
  toExportedUser,
  writeCdnFile,
  writeExportFile,
} from './media'

export interface ExportOutcome {
  exported: ExportFile
  file: string
}

/** 抓取资料与帖子并落盘。 */
export async function runExport(
  session: IgSession,
  insUsername: string,
  options: { include?: string, since?: Date, maxPosts?: number, log?: Logger } = {},
): Promise<ExportOutcome> {
  const log = options.log
  const posts = await collectUserPosts(session, insUsername, {
    include: options.include,
    since: options.since,
    maxPosts: options.maxPosts,
    onProgress: count => log?.info(`已抓取 ${count} 条`),
  })
  if (posts.length === 0) {
    throw new Error(`@${insUsername} 没有抓到帖子（检查 Cookie、账号是否私密）`)
  }

  const info = await collectUserInfo(session, insUsername)
  const exported: ExportFile = {
    user: toExportedUser(info),
    posts,
  }
  const file = await writeExportFile(insUsername, exported)
  log?.info(`已写入 ${file}（${posts.length} 条）`)

  return { exported, file }
}

export async function loadExport(file: string): Promise<ExportFile> {
  return readExportFile(file)
}

export interface MediaOutcome {
  cdnFile: string
  cdn: ExportFile
  downloaded: number
  skipped: number
  failed: { label: string, error: string }[]
}

/** 下载媒体并把地址改写成 CDN 形式。 */
export async function runMedia(
  insUsername: string,
  exported: ExportFile,
  options: { concurrency?: number, log?: Logger } = {},
): Promise<MediaOutcome> {
  const result = await downloadExportMedia(insUsername, exported, options)
  const cdn = rewriteToCdn(insUsername, exported, resolveCdnBase())
  const cdnFile = await writeCdnFile(insUsername, cdn)
  options.log?.info(`已写入 ${cdnFile}`)

  return {
    cdnFile,
    cdn,
    downloaded: result.downloaded,
    skipped: result.skipped,
    failed: result.failed,
  }
}

export interface ImportOutcome {
  twitterUsername: string
  inserted: number
  total: number
}

export async function runImport(
  db: DB,
  exported: ExportFile,
  twitterUsername?: string,
): Promise<ImportOutcome> {
  const insUsername = exported.user.userName
  const resolved = await resolveTwitterUsername(db, insUsername, twitterUsername)
  const result = await importInsData({
    db,
    insUsername,
    twitterUsername: resolved,
    exported,
  })
  return { twitterUsername: result.twitterUsername, inserted: result.inserted, total: result.total }
}

export interface VerifyCheck {
  name: string
  ok: boolean
  detail?: string
}

export interface VerifyOutcome {
  twitterUsername: string
  total: number
  checks: VerifyCheck[]
}

async function headOk(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10_000),
    })
    return response.ok
  }
  catch {
    return false
  }
}

/** 对账：资料存在、条数非零、时间严格递减、（可选）媒体可达。 */
export async function runVerify(
  db: DB,
  twitterUsername: string,
  options: { checkMedia?: boolean } = {},
): Promise<VerifyOutcome> {
  const user = await getInsUserByName(db, twitterUsername)

  const posts: IGPost[] = []
  for (let page = 1; page <= 50; page++) {
    const result = await getInsPosts({
      db,
      username: twitterUsername,
      page,
      pageSize: 1000,
    })
    posts.push(...result.data)
    if (!result.meta.hasMore) {
      break
    }
  }

  const checks: VerifyCheck[] = []

  checks.push({
    name: '`users.ins_json_data` 存在',
    ok: user !== null,
    detail: user
      ? `@${user.username}`
      : '为空',
  })

  checks.push({
    name: '`ins_posts` 有数据',
    ok: posts.length > 0,
    detail: `${posts.length} 条`,
  })

  const parsed = posts.map(post => (post.created_at
    ? new Date(post.created_at).getTime()
    : Number.NaN))
  const datesOk = parsed.every((value, index) => Number.isFinite(value) && (index === 0 || value <= parsed[index - 1]!))
  checks.push({
    name: '`created_at` 可解析且按时间倒序',
    ok: posts.length > 0 && datesOk,
    detail: datesOk ? '通过' : '存在无法解析或逆序的时间',
  })

  const mediaSamples = posts
    .flatMap(post => post.media.map(item => item.display_url))
    .filter(Boolean)
    .slice(0, 3)

  if (options.checkMedia !== false) {
    const mediaResults = await Promise.all(mediaSamples.map(headOk))
    checks.push({
      name: '抽样媒体可达',
      ok: mediaResults.length > 0 && mediaResults.every(Boolean),
      detail: mediaResults.length === 0
        ? '没有可抽样的媒体'
        : `${mediaResults.filter(Boolean).length}/${mediaResults.length} 通过`,
    })

    checks.push({
      name: '头像可达',
      ok: Boolean(user?.avatar_url) && await headOk(user!.avatar_url!),
      detail: user?.avatar_url ?? '为空',
    })
  }
  else {
    checks.push({
      name: '媒体可达性',
      ok: true,
      detail: '已跳过（媒体未上传）',
    })
  }

  return { twitterUsername, total: posts.length, checks }
}
