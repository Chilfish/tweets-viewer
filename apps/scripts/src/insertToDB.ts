import type { EnrichedTweet, EnrichedUser } from '@tweets-viewer/rettiwt-api'
import { neon } from '@neondatabase/serverless'
import { createTweets, createUser, schema } from '@tweets-viewer/database'
import { drizzle } from 'drizzle-orm/neon-http'
import { env } from '../../../env.server'
import { userId } from '../config'
import { readJson } from './utils'

const client = neon(env.DATABASE_URL)
const db = drizzle({ client, schema })

const { data: user } = await readJson<{ data: EnrichedUser }>(`user-${userId}.json`)
console.log(user)

const res = await createUser({ db, user })

console.log(res)

const tweets = await readJson<EnrichedTweet[]>(`data/${userId}/merged.json`)

await createTweets({ db, tweets, user })
