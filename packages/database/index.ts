import type { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

export type DB = ReturnType<typeof drizzle<typeof schema>>

export * from './modules/tweet'
export * from './modules/user'
export {
  schema,
}
