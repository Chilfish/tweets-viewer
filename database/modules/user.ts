import { eq } from 'drizzle-orm'
import type { DB } from '../'
import type { InsertUser } from '../schema'
import { usersTable } from '../schema'

export async function updateUser({ db, user }: { db: DB; user: InsertUser }) {
  return db
    .update(usersTable)
    .set(user)
    .where(eq(usersTable.screenName, user.screenName))
}

export async function createUser({ db, user }: { db: DB; user: InsertUser }) {
  return db
    .insert(usersTable)
    .values(user)
    .onConflictDoUpdate({
      set: user,
      target: [usersTable.screenName],
    })
}

export async function getUsers(db: DB) {
  return db.select().from(usersTable)
}
