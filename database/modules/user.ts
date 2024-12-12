import type { DB } from '../../server/common'
import type { InsertUser } from '../schema'
import { usersTable } from '../schema'

export async function createUser({ db, user }: { db: DB, user: InsertUser }) {
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
