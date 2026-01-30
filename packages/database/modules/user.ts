import type { EnrichedUser } from '@tweets-viewer/rettiwt-api'
import type { DB } from '../'
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

export async function getUsers(db: DB) {
  return db.select().from(usersTable)
}
