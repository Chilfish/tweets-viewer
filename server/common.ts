import type { drizzle } from 'drizzle-orm/neon-http'

export const staticUrl
// = 'http://127.0.0.1:8080'
= 'https://p.chilfish.top'

export type DB = ReturnType<typeof drizzle>

export interface AppType {
  Variables: {
    rateLimit: boolean
    db: DB
  }
  Bindings: {
    RATE_LIMITER: RateLimit
    DATABASE_URL: string
  }
}
