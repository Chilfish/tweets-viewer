import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { RettiwtPool, TweetEnrichmentService, TwitterAPIClient } from '@tweets-viewer/rettiwt-api'
import { userId } from '../config'
import { getLocalCache } from './localCache'
import { cacheDir, writeJson } from './utils'

const KEYS = (process.env.TWEET_KEYS || '').split(',').filter(Boolean)

const twitterPool = new RettiwtPool(KEYS)

const apiClient = new TwitterAPIClient(twitterPool)
const enrichmentService = new TweetEnrichmentService()

const dataPath = path.join(cacheDir, `data/${userId}`)
const rawPath = path.join(cacheDir, `raw/${userId}`)
const cursorPath = path.join(dataPath, 'cursor.txt')
const cursor = await readFile(cursorPath, 'utf8').catch(() => undefined)

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
  process.exit(1)
}

const rawTweets = await apiClient.fetchUserTimelineRaw(user.id, cursor)
if (!rawTweets.tweets.length) {
  console.error('No tweets found')
  process.exit(1)
}

const enrichedTweets = enrichmentService.enrichUserTimelineTweets(rawTweets.tweets, user.id)

await writeJson({
  tweets: enrichedTweets,
  cursor: rawTweets.cursor,
}, `data/${userId}/timeline-${user.userName}-${Date.now()}.json`)

await writeFile(cursorPath, rawTweets.cursor, 'utf8')
