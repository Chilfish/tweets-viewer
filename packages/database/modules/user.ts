import type { EnrichedUser } from '@tweets-viewer/rettiwt-api'
import type { DB } from '../'
import type { SelectUser } from '../schema'
import { eq } from 'drizzle-orm'
import { usersTable } from '../schema'

export async function updateUser({ db, user }: { db: DB, user: EnrichedUser }) {
  return db
    .update(usersTable)
    .set({
      userName: user.userName,
      restId: user.id,
      jsonData: user,
    })
    .where(eq(usersTable.userName, user.userName))
}

export async function createUser({ db, user }: { db: DB, user: EnrichedUser }) {
  return db
    .insert(usersTable)
    .values({
      restId: user.id,
      userName: user.userName,
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
