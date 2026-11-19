import type { InstagramSDK } from '@chilfish/gallery-dl-instagram'
import { ConfigError, UsageError } from '../cli/exit'
import { createSession } from './instagram'

/** 读取 Cookie 并建立抓取会话。 */
export async function openSession(): Promise<InstagramSDK> {
  const cookies = process.env.INSTAGRAM_COOKIES?.trim()
  if (!cookies) {
    throw new ConfigError('缺少环境变量 INSTAGRAM_COOKIES', {
      code: 'MISSING_ENV',
      hint: '在项目根目录 .env 里配置 INSTAGRAM_COOKIES（至少含 sessionid 与 csrftoken）',
      context: { name: 'INSTAGRAM_COOKIES' },
    })
  }
  return createSession(cookies)
}

/** 接受完整链接、`@账号` 或裸账号，统一成 IG 用户名。 */
export function normalizeAccount(input: string | undefined): string {
  if (!input) {
    throw new UsageError('缺少 IG 账号或链接', {
      hint: '示例：bun run ig ins export https://www.instagram.com/ritsu_mgmg/',
    })
  }

  let value = input.trim()
  const urlMatch = /instagram\.com\/([^/?#]+)/.exec(value)
  if (urlMatch) {
    value = urlMatch[1]!
  }
  value = value.replace(/^@/, '').replace(/\/+$/, '')

  if (!/^[\w.]+$/.test(value)) {
    throw new UsageError(`无法识别的 IG 账号：${input}`, {
      hint: '传完整链接、@账号 或裸账号',
      context: { input },
    })
  }
  return value
}
