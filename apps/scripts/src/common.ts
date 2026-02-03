import type { CursoredTweets, EnrichedUser } from '@tweets-viewer/rettiwt-api'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { RettiwtPool, TweetEnrichmentService, TwitterAPIClient } from '@tweets-viewer/rettiwt-api'
import { env } from '../../../env.server'
import { getLocalCache } from './localCache'
import { cacheDir, writeJson } from './utils'

export const userId = 'hina_suguta'

const KEYS = (env.TWEET_KEYS || '').split(',').filter(Boolean).map(key => key.trim())

const twitterPool = new RettiwtPool(KEYS)

export const apiClient = new TwitterAPIClient(twitterPool)
export const enrichmentService = new TweetEnrichmentService()

export const dataPath = path.join(cacheDir, `data/${userId}`)
export const rawPath = path.join(cacheDir, `raw/${userId}`)
export const cursorPath = path.join(dataPath, 'cursor.txt')
export const cursor = await readFile(cursorPath, 'utf8').then(d => d.trim()).catch(() => undefined)

if (!await stat(dataPath).then(() => true).catch(() => false)) {
  await mkdir(dataPath, { recursive: true })
}

if (!await stat(rawPath).then(() => true).catch(() => false)) {
  await mkdir(rawPath, { recursive: true })
}

apiClient.onFetchedresponse = async (key: string, data: any) => {
  console.log(`Fetched ${key} data`)
  await writeJson(data, `raw/${userId}/${key}-${cursor}.json`)
}

const user = await getLocalCache({
  type: 'user',
  id: userId,
  getter: () => apiClient.fetchUserDetailsRaw(userId),
})

if (!user?.id) {
  console.error('User not found')
  process.exit(104)
}

const enrichedUser: EnrichedUser = user

export {
  enrichedUser as user,
}

export async function writeCursor(data: CursoredTweets) {
  if (data.cursor) {
    await writeFile(cursorPath, data.cursor, 'utf8')
    console.log(`Cursor saved: ${data.cursor}`)
  }
}
