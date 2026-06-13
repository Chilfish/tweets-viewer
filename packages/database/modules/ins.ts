import type { IGPost, IGUserInfo, PaginatedResponse } from '@tweets-viewer/shared'
import type { DB } from '../'
import type { SelectInsPost } from '../schema'
import { PAGE_SIZE } from '@tweets-viewer/shared'
import { count, desc, eq } from 'drizzle-orm'
import { insPostsTable, usersTable } from '../schema'

const BATCH_SIZE = 1000

// Upsert IG user info into users table.
// db: Database instance
// twitterUsername: The user's twitter userName (FK target for ins_posts)
// insUsername: The user's Instagram username
// user: IGUserInfo from SDK or import
export async function upsertInsUserInfo({
  db,
  twitterUsername,
  insUsername,
  user,
}: {
  db: DB
  twitterUsername: string
  insUsername: string
  user: IGUserInfo
}) {
  return db
    .update(usersTable)
    .set({
      insUsername,
      insJsonData: user,
    })
    .where(eq(usersTable.userName, twitterUsername))
}

/** Batch-upsert Instagram posts, referencing twitter username as FK */
export async function createInsPosts({ db, posts, username }: {
  db: DB
  posts: IGPost[]
  /** twitter userName (FK to users.userName) */
  username: string
}) {
  let insertedCount = 0
  for (let i = 0; i < posts.length; i += BATCH_SIZE) {
    const chunk = posts.slice(i, i + BATCH_SIZE)
    const { rowCount } = await db
      .insert(insPostsTable)
      .values(chunk.map(post => ({
        postId: post.id,
        userId: username,
        createdAt: post.created_at ? new Date(post.created_at) : new Date(),
        jsonData: post,
      })))
      .onConflictDoNothing()
    insertedCount += rowCount
  }
  return { rowCount: insertedCount }
}

/**
 * Get IG user info by twitter username.
 * Returns IGUserInfo from users.ins_json_data.
 */
export async function getInsUserByName(db: DB, twitterUsername: string): Promise<IGUserInfo | null> {
  const rows = await db
    .select({ insJsonData: usersTable.insJsonData })
    .from(usersTable)
    .where(eq(usersTable.userName, twitterUsername))
  if (!rows.length || !rows[0].insJsonData)
    return null
  return rows[0].insJsonData
}

/** Get IG user info by Instagram username */
export async function getInsUserByInsName(db: DB, insUsername: string): Promise<IGUserInfo | null> {
  const rows = await db
    .select({ insJsonData: usersTable.insJsonData })
    .from(usersTable)
    .where(eq(usersTable.insUsername, insUsername))
  if (!rows.length || !rows[0].insJsonData)
    return null
  return rows[0].insJsonData
}

/** Paginated IG posts by twitter username */
export async function getInsPosts({ db, username, page, pageSize = PAGE_SIZE }: {
  db: DB
  /** twitter userName */
  username: string
  page: number
  pageSize?: number
}): Promise<PaginatedResponse<IGPost>> {
  const offset = (page - 1) * pageSize

  const [totalResult, rows] = await Promise.all([
    db
      .select({ count: count() })
      .from(insPostsTable)
      .where(eq(insPostsTable.userId, username)),
    db
      .select()
      .from(insPostsTable)
      .where(eq(insPostsTable.userId, username))
      .orderBy(desc(insPostsTable.createdAt))
      .limit(pageSize)
      .offset(offset),
  ])

  const total = totalResult[0]?.count ?? 0

  return {
    data: rows.map(mapToInsPost),
    meta: {
      total,
      page,
      pageSize,
      hasMore: offset + rows.length < total,
    },
  }
}

function mapToInsPost(row: SelectInsPost): IGPost {
  return row.jsonData
}
