import type { EnrichedUser } from '@tweets-viewer/tweet-types'
import type { DB } from '../'
import type { SelectUser } from '../schema'
import { and, eq, isNotNull } from 'drizzle-orm'
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
