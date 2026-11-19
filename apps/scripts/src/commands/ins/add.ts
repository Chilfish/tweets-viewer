import type { CommandSpec } from '../../cli/runtime'
import type { VerifyCheck } from '../../lib/pipeline'
import { Option } from 'commander'
import { getDb } from '../../lib/db'
import { runExport, runImport, runMedia, runVerify } from '../../lib/pipeline'
import { normalizeAccount, openSession } from '../../lib/session'
import { hasUploadCredentials } from '../../lib/upload'

interface AddData {
  insUsername: string
  twitterUsername: string
  posts: number
  inserted: number
  media: { downloaded: number, skipped: number, failed: number }
  checks: VerifyCheck[]
  ok: boolean
}

export const addSpec: CommandSpec<AddData> = {
  id: 'ins.add',
  description: '端到端接入一个 IG 账号：抓取 → 下载媒体 → 入库 → 对账',
  details: '前三步任何一步失败都会停下，不写库。入库按 `post_id` upsert，可重复执行。\n'
    + '媒体未上传时（没有 R2 凭据）跳过可达性检查，并提示上传命令。',
  examples: [
    'bun run ig ins add https://www.instagram.com/ritsu_mgmg --twitter ritsu_yumemita',
    'bun run ig ins add ritsu_mgmg --twitter ritsu_yumemita --dry-run',
  ],
  arguments: [
    { name: 'account', description: 'IG 账号、@账号 或完整链接' },
  ],
  options: [
    new Option('--twitter <name>', '目标 users.userName（首次接入时必填）'),
    new Option('--include <list>', '抓取子类，默认 posts,reels'),
    new Option('--max-posts <n>', '每个子类最多抓多少条（快速验证用）'),
    new Option('--concurrency <n>', '并发下载数，默认 16'),
  ],
  async run(ctx) {
    const insUsername = normalizeAccount(ctx.args[0])
    const twitter = ctx.options.twitter as string | undefined

    if (ctx.dryRun) {
      ctx.log.info(
        `dry-run：@${insUsername} → ${twitter
          ? `@${twitter}`
          : '（按 users.ins_username 反查）'}\n`
          + `  1. 抓取帖子与资料 → data/${insUsername}.json\n`
          + `  2. 下载媒体 → data/instagram/${insUsername}/\n`
          + `  3. 入库 → users + ins_posts\n`
          + '  4. 对账',
      )
      return {
        data: {
          insUsername,
          twitterUsername: twitter ?? '',
          posts: 0,
          inserted: 0,
          media: { downloaded: 0, skipped: 0, failed: 0 },
          checks: [],
          ok: true,
        },
      }
    }

    const { db } = getDb()
    const sdk = await openSession()
    const log = ctx.log.child(insUsername)

    const { exported } = await runExport(sdk, insUsername, {
      include: ctx.options.include as string | undefined,
      maxPosts: ctx.options.maxPosts === undefined
        ? undefined
        : ctx.integer('maxPosts', 0, 1),
      log,
    })

    const media = await runMedia(insUsername, exported, {
      concurrency: ctx.integer('concurrency', 16, 1),
      log,
    })

    const imported = await runImport(db, media.cdn, twitter)
    log.info(`@${insUsername} → @${imported.twitterUsername}：${imported.inserted}/${imported.total} 条`)

    const canCheckMedia = hasUploadCredentials() && media.failed.length === 0
    if (!canCheckMedia) {
      log.warn(`媒体还没确认可访问，跳过可达性检查；上传后重跑：bun run ig ins upload ${insUsername}`)
    }

    const verify = await runVerify(db, imported.twitterUsername, { checkMedia: canCheckMedia })
    for (const check of verify.checks) {
      log.line(`${check.ok ? '✓' : '✗'} ${check.name}${check.detail
        ? `：${check.detail}`
        : ''}`)
    }
    const ok = verify.checks.every(check => check.ok)

    return {
      data: {
        insUsername,
        twitterUsername: imported.twitterUsername,
        posts: exported.posts.length,
        inserted: imported.inserted,
        media: {
          downloaded: media.downloaded,
          skipped: media.skipped,
          failed: media.failed.length,
        },
        checks: verify.checks,
        ok,
      },
      exitCode: ok ? 0 : 1,
      summary: ok
        ? `@${insUsername} → @${imported.twitterUsername}：${imported.total} 条帖子，媒体 ${media.downloaded} 个`
        : `@${insUsername} 已入库，但对账未通过：${verify.checks.filter(check => !check.ok).map(check => check.name).join('、')}`,
    }
  },
}
