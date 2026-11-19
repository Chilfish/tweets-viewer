import type { CommandSpec } from '@chilfish/devkit/cli'
import type { VerifyCheck } from '../../lib/pipeline'
import { Option } from 'commander'
import { getDb } from '../../lib/db'
import { isLocalMode } from '../../lib/local-config'
import { runExport, runImport, runMedia, runVerify } from '../../lib/pipeline'
import { normalizeAccount, openSession } from '../../lib/session'
import { hasStorageCredentials, uploadAccountMedia } from '../../lib/upload'

interface AddData {
  insUsername: string
  twitterUsername: string
  posts: number
  inserted: number
  media: { downloaded: number, skipped: number, failed: number }
  upload: { uploaded: number, skipped: number, failed: number }
  checks: VerifyCheck[]
  ok: boolean
}

export const addSpec: CommandSpec<AddData> = {
  id: 'ins.add',
  description: '端到端接入一个 IG 账号：抓取 → 下载媒体 → 上传 → 入库 → 对账',
  details: '抓取或下载失败会停下，不写库。媒体在入库前上传（LOCAL=1 写本机 SILO），\n'
    + '没有对象存储凭据时跳过上传与媒体可达性检查。入库按 `post_id` upsert，可重复执行。',
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
          + `  3. 上传媒体 → ${isLocalMode(process.env)
            ? '本机 SILO'
            : 'R2'}\n`
            + `  4. 入库 → users + ins_posts\n`
            + '  5. 对账',
      )
      return {
        data: {
          insUsername,
          twitterUsername: twitter ?? '',
          posts: 0,
          inserted: 0,
          media: { downloaded: 0, skipped: 0, failed: 0 },
          upload: { uploaded: 0, skipped: 0, failed: 0 },
          checks: [],
          ok: true,
        },
      }
    }

    const { db } = getDb()
    const session = await openSession()
    const log = ctx.log.child(insUsername)

    const { exported } = await runExport(session, insUsername, {
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

    // 媒体先上传再入库：顺序反了页面能打开，但每张图都是 404。
    let uploadAttempted = false
    const uploadCounts = { uploaded: 0, skipped: 0, failed: 0 }
    if (hasStorageCredentials()) {
      uploadAttempted = true
      const upload = await uploadAccountMedia(insUsername, {
        concurrency: ctx.integer('concurrency', 8, 1),
        log,
      })
      uploadCounts.uploaded = upload.uploaded
      uploadCounts.skipped = upload.skipped
      uploadCounts.failed = upload.failed.length
    }
    else {
      log.warn(`没有对象存储凭据，跳过上传；之后可跑 bun run ig ins upload ${insUsername}`)
    }

    const imported = await runImport(db, media.cdn, twitter)
    log.info(`@${insUsername} → @${imported.twitterUsername}：${imported.inserted}/${imported.total} 条`)

    const canCheckMedia = uploadAttempted && uploadCounts.failed === 0 && media.failed.length === 0
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
        upload: uploadCounts,
        checks: verify.checks,
        ok,
      },
      exitCode: ok
        ? 0
        : 1,
      summary: ok
        ? `@${insUsername} → @${imported.twitterUsername}：${imported.total} 条帖子，媒体 ${media.downloaded} 个，上传 ${uploadCounts.uploaded} 个`
        : `@${insUsername} 已入库，但对账未通过：${verify.checks.filter(check => !check.ok).map(check => check.name).join('、')}`,
    }
  },
}
