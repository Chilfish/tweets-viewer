import type { CommandSpec } from '../../cli/runtime'
import { Option } from 'commander'
import { runExport } from '../../lib/pipeline'
import { normalizeAccount, openSession } from '../../lib/session'

interface ExportData {
  insUsername: string
  fullname: string
  posts: number
  file: string
}

export const exportSpec: CommandSpec<ExportData> = {
  id: 'ins.export',
  description: '抓取账号资料与帖子，写 data/<账号>.json',
  details: '帖子媒体仍是 Instagram CDN 原链，带签名和过期时间；入库前要先跑 `ins media`。',
  examples: [
    'bun run ig ins export ritsu_mgmg',
    'bun run ig ins export ritsu_mgmg --max-posts 5',
    'bun run ig ins export https://www.instagram.com/ritsu_mgmg/',
  ],
  arguments: [
    { name: 'account', description: 'IG 账号、@账号 或完整链接' },
  ],
  options: [
    new Option('--include <list>', '抓取子类，默认 posts,reels'),
    new Option('--max-posts <n>', '每个子类最多抓多少条（快速验证用）'),
  ],
  async run(ctx) {
    const insUsername = normalizeAccount(ctx.args[0])
    const log = ctx.log.child(insUsername)
    const maxPosts = ctx.options.maxPosts === undefined
      ? undefined
      : ctx.integer('maxPosts', 0, 1)

    if (ctx.dryRun) {
      ctx.log.info(`dry-run：将抓取 @${insUsername} 的资料与帖子，写 data/${insUsername}.json`)
      return {
        data: {
          insUsername,
          fullname: '',
          posts: 0,
          file: '',
        },
      }
    }

    const session = await openSession()
    log.info('抓取帖子…')

    const { exported, file } = await runExport(session, insUsername, {
      include: ctx.options.include as string | undefined,
      maxPosts,
      log,
    })

    return {
      data: {
        insUsername,
        fullname: exported.user.fullName,
        posts: exported.posts.length,
        file,
      },
      summary: `@${insUsername}：${exported.posts.length} 条帖子 → ${file}`,
    }
  },
}
