import type { IGPost, IGUserInfo, PaginatedResponse } from '@tweets-viewer/shared'
import type { DB } from '../'
import type { SelectInsPost, SelectInsUser } from '../schema'
import { PAGE_SIZE } from '@tweets-viewer/shared'
import { count, desc, eq } from 'drizzle-orm'
import { insPostsTable, insUsersTable } from '../schema'

const BATCH_SIZE = 1000

/** ?? upsert Instagram ?? */
export async function createInsPosts({ db, posts, username }: {
  db: DB
  posts: IGPost[]
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

/** upsert Instagram ?? */
export async function createInsUser({ db, user }: { db: DB, user: IGUserInfo }) {
  return db
    .insert(insUsersTable)
    .values({
      username: user.username,
      jsonData: user,
    })
    .onConflictDoUpdate({
      set: { jsonData: user },
      target: [insUsersTable.username],
    })
}

/** ? username ?????? */
export async function getInsUserByName(db: DB, username: string): Promise<IGUserInfo | null> {
  const rows = await db
    .select()
    .from(insUsersTable)
    .where(eq(insUsersTable.username, username))
  if (!rows.length)
    return null
  return mapToInsUserInfo(rows[0])
}

/** ???????? */
export async function getInsPosts({ db, username, page, pageSize = PAGE_SIZE }: {
  db: DB
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

function mapToInsUserInfo(row: SelectInsUser): IGUserInfo {
  return row.jsonData
}
