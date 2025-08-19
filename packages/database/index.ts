import type { drizzle } from 'drizzle-orm/neon-http'

export type DB = ReturnType<typeof drizzle>

export * from './modules/tweet'
export * from './modules/user'
export * from './schema'
export * from './services'
