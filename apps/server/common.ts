import type { DB } from '@tweets-viewer/database'
import type { SelectUser } from '@tweets-viewer/database/schema'
import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'

export const staticUrl
  // = 'http://127.0.0.1:8080'
  = 'https://p.chilfish.top'

export interface AppType {
  Variables: {
    db: DB
  }
  Bindings: {
    DATABASE_URL: string
    TWEET_KEY: string
  }
}

export const cachedData = new Map<string, EnrichedTweet[]>()

export async function getData(name: string) {
  if (cachedData.has(name)) {
    return cachedData.get(name) || []
  }

  const rawData = await fetch(`https://p.chilfish.top/tweet/ins/${name}.json`)
    .then(res => res.json())
    .catch((error) => {
      console.error(`getInsData error ${name}`, error.message)
      return null
    })
  if (!rawData) {
    return []
  }
  const tweets = rawData as EnrichedTweet[]
  tweets.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  console.log('getInsData', name, tweets.length)

  cachedData.set(name, tweets)
  return tweets
}

export async function setAllUsersInsData(users: SelectUser[]) {
  await Promise.all(users.map(user => getData(user.userName)))
}
