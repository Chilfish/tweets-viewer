import type { EnrichedUser } from '@tweets-viewer/tweet-types'
import type { DB } from '../'
import type { SelectUser } from '../schema'
import { and, eq, isNotNull, sql } from 'drizzle-orm'
import { usersTable } from '../schema'

export async function updateUser({ db, user }: { db: DB, user: EnrichedUser }) {
  return db
    .update(usersTable)
    .set({
      userName: user.userName!,
      restId: user.id,
      jsonData: user,
    })
    .where(eq(usersTable.userName, user.userName!))
}

export async function createUser({ db, user }: { db: DB, user: EnrichedUser }) {
  return db
    .insert(usersTable)
    .values({
      restId: user.id,
      userName: user.userName!,
      jsonData: user,
    })
    .onConflictDoUpdate({
      set: {
        restId: user.id,
        jsonData: user,
      },
      target: [usersTable.userName],
    })
}

export async function getAllUsers(db: DB): Promise<EnrichedUser[]> {
  const data = await db.select().from(usersTable)
  return data.map(mapToEnrichedUser)
}

export async function getDailyFetchUsers(db: DB): Promise<EnrichedUser[]> {
  const data = await db.select().from(usersTable).where(eq(usersTable.dailyFetch, true))
  return data.map(mapToEnrichedUser)
}

/** 每日 IG 增量：已关联 IG 且开启 daily_fetch 的账号 */
export async function getDailyFetchInsUsers(db: DB): Promise<{ userName: string, insUsername: string }[]> {
  const rows = await db
    .select({ userName: usersTable.userName, insUsername: usersTable.insUsername })
    .from(usersTable)
    .where(and(eq(usersTable.dailyFetch, true), isNotNull(usersTable.insUsername)))

  return rows.map(row => ({ userName: row.userName, insUsername: row.insUsername! }))
}

/** 读取整行用户记录，用于库间同步（`id` 不参与同步）。 */
export async function getUserRows(db: DB): Promise<SelectUser[]> {
  return db.select().from(usersTable)
}

/** 按 `userName` upsert 用户记录，`id` 保留本地值。 */
export async function upsertUserRows({ db, rows }: { db: DB, rows: SelectUser[] }): Promise<void> {
  if (rows.length === 0) {
    return
  }
  await db
    .insert(usersTable)
    .values(rows.map(({ id: _id, ...row }) => row))
    .onConflictDoUpdate({
      target: usersTable.userName,
      set: {
        restId: sql`excluded."restId"`,
        jsonData: sql`excluded."jsonData"`,
        dailyFetch: sql`excluded.daily_fetch`,
        insUsername: sql`excluded.ins_username`,
        insJsonData: sql`excluded.ins_json_data`,
      },
    })
}

/** 所有已关联 IG 的账号，不要求开启 `daily_fetch` */
export async function getLinkedInsUsers(
  db: DB,
): Promise<{ userName: string, insUsername: string, postsCount: number }[]> {
  const rows = await db
    .select({
      userName: usersTable.userName,
      insUsername: usersTable.insUsername,
      insJsonData: usersTable.insJsonData,
    })
    .from(usersTable)
    .where(isNotNull(usersTable.insUsername))

  return rows.map(row => ({
    userName: row.userName,
    insUsername: row.insUsername!,
    postsCount: row.insJsonData?.posts_count ?? 0,
  }))
}

/** 按 IG 用户名找对应的 users 行（IG → twitter 映射的唯一来源） */
export async function getUserByInsName(db: DB, insUsername: string): Promise<SelectUser | null> {
  const data = await db.select().from(usersTable).where(eq(usersTable.insUsername, insUsername))
  return data[0] ?? null
}

export async function getUserByName(db: DB, name: string): Promise<EnrichedUser | null> {
  const data = await db.select().from(usersTable).where(eq(usersTable.userName, name))
  if (!data?.length) {
    return null
  }
  return mapToEnrichedUser(data[0])
}

export function mapToEnrichedUser(user: SelectUser): EnrichedUser {
  return user.jsonData
}
