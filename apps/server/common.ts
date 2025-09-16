import type { DB, SelectUser } from '@tweets-viewer/database'
import type { Tweet } from '@tweets-viewer/shared'

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

export const cachedData = new Map<string, Tweet[]>()

export async function getData(name: string) {
  const rawData = await fetch(`https://p.chilfish.top/tweet/ins/${name}.json`)
    .then((res) => res.json())
    .catch((error) => {
      console.error('getInsData error ' + name, error.message)
      return null
    })
  if (!rawData) {
    return []
  }
  const tweets = rawData as Tweet[]
  tweets.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  console.log('getInsData', name, tweets.length)

  cachedData.set(name, tweets)
  return tweets
}

export async function setAllUsersInsData(users: SelectUser[]) {
  await Promise.all(users.map((user) => getData(user.screenName)))
}
