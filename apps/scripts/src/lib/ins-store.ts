import type { DB } from '@tweets-viewer/database'
import type { IGUserInfo } from '@tweets-viewer/shared'
import type { ExportFile } from './media'
import { createInsPosts, getUserByInsName, upsertInsUserInfo } from '@tweets-viewer/database'

/** 导出文件里的 user 形状 → `users.ins_json_data`。 */
export function toInsUserInfo(exported: ExportFile['user']): IGUserInfo {
  return {
    username: exported.userName,
    fullname: exported.fullName,
    avatar_url: exported.profileImage,
    verified: exported.isVerified,
    bio: exported.description,
    external_url: exported.url,
    followers_count: exported.followersCount,
    following_count: exported.followingsCount,
    posts_count: exported.statusesCount,
  }
}

/**
 * 解析 IG 账号对应的 twitter userName。
 *
 * `--twitter` 优先；否则查 `users.ins_username`。两处都没有时直接失败——
 * 静默跳过会让「什么都没写」看起来像成功。
 */
export async function resolveTwitterUsername(
  db: DB,
  insUsername: string,
  explicit?: string,
): Promise<string> {
  if (explicit) {
    return explicit
  }

  const row = await getUserByInsName(db, insUsername)
  if (!row) {
    throw new Error(
      `@${insUsername} 还没有绑定 twitter 用户：先用 --twitter 指定 users.userName，`
      + '或先给该 IG 账号登记一次',
    )
  }
  return row.userName
}

export interface ImportResult {
  twitterUsername: string
  inserted: number
  total: number
}

/** 写 `users.ins_username` / `users.ins_json_data` 与 `ins_posts`。 */
export async function importInsData({
  db,
  insUsername,
  twitterUsername,
  exported,
}: {
  db: DB
  insUsername: string
  twitterUsername: string
  exported: ExportFile
}): Promise<ImportResult> {
  await upsertInsUserInfo({
    db,
    twitterUsername,
    insUsername,
    user: toInsUserInfo(exported.user),
  })

  const { rowCount } = await createInsPosts({
    db,
    posts: exported.posts,
    username: twitterUsername,
  })

  return { twitterUsername, inserted: rowCount, total: exported.posts.length }
}
