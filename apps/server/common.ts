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

  try {
    const res = await fetch(`https://p.chilfish.top/tweet/ins/${name}.json`)
    if (!res.ok) {
      console.error(`getData ${name}: HTTP ${res.status}`)
      return []
    }
    const rawData = await res.json() as EnrichedTweet[]
    rawData.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )

    console.log('getData', name, rawData.length)
    cachedData.set(name, rawData)
    return rawData
  }
  catch (error: any) {
    console.error(`getData ${name}:`, error.message)
    return []
  }
}

export async function setAllUsersInsData(users: SelectUser[]) {
  await Promise.all(users.map(user => getData(user.userName)))
}
