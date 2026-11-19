import type { CommandSpec } from '@chilfish/devkit/cli'
import type { VerifyCheck } from '../../lib/pipeline'
import { UsageError } from '@chilfish/devkit/cli'
import { Option } from 'commander'
import { getDb } from '../../lib/db'
import { runVerify } from '../../lib/pipeline'

interface VerifyData {
  twitterUsername: string
  total: number
  ok: boolean
  checks: VerifyCheck[]
}

export const verifySpec: CommandSpec<VerifyData> = {
  id: 'ins.verify',
  description: '对账：资料、条数、时间顺序、媒体可达',
  details: '任一检查失败时退出码为 1。`--no-media` 跳过媒体可达性检查，\n'
    + '用于本地还没上传 R2 的阶段。',
  examples: [
    'bun run ig ins verify ritsu_yumemita',
    'bun run ig ins verify ritsu_yumemita --no-media',
    'bun run ig ins verify ritsu_yumemita --json | jq .meta.mode',
  ],
  arguments: [
    { name: 'twitterName', description: 'twitter userName（不是 IG 账号）' },
  ],
  options: [
    new Option('--no-media', '跳过媒体可达性检查'),
  ],
  async run(ctx) {
    const twitterName = ctx.args[0]
    if (!twitterName) {
      throw new UsageError('缺少 twitter userName', {
        hint: '示例：bun run ig ins verify ritsu_yumemita',
      })
    }

    const { db } = getDb()
    const result = await runVerify(db, twitterName, {
      checkMedia: ctx.options.media !== false,
    })

    const ok = result.checks.every(check => check.ok)
    for (const check of result.checks) {
      const mark = check.ok ? '✓' : '✗'
      ctx.log.line(`${mark} ${check.name}${check.detail
        ? `：${check.detail}`
        : ''}`)
    }

    return {
      data: { ...result, ok },
      exitCode: ok ? 0 : 1,
      summary: ok
        ? `@${twitterName} 对账通过（${result.total} 条）`
        : `@${twitterName} 对账失败：${result.checks.filter(check => !check.ok).map(check => check.name).join('、')}`,
    }
  },
}
