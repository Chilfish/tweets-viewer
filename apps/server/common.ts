import type { DB } from '@tweets-viewer/database'

export const staticUrl =
  // = 'http://127.0.0.1:8080'
  'https://p.chilfish.top'

export interface AppType {
  Variables: {
    rateLimit: boolean
    db: DB
  }
  Bindings: {
    RATE_LIMITER: RateLimit
    DATABASE_URL: string
    TWEET_KEY: string
  }
}
