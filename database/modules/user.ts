import type { InsertUser } from '../schema'
import { db } from '../db'
import { usersTable } from '../schema'

export async function createUser(user: InsertUser) {
  return db.insert(usersTable).values(user)
}

export async function getUsers() {
  return db.select().from(usersTable)
}
