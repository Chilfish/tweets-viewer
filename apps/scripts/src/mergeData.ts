import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { userId } from '../config'
import { cacheDir, readJson, writeJson } from './utils'

const dataPath = path.join(cacheDir, `data/${userId}`)

const jsons = await readdir(dataPath).then(files => files
  .filter(file => file.endsWith('.json') && !file.startsWith('merged'))
  .map(file => path.join(dataPath, file)),
)

if (!jsons.length) {
  console.error('No data found')
  process.exit(1)
}

const mergedData = await Promise.all(jsons.map(async (file) => {
  const data = await readJson<{ tweets: EnrichedTweet[] }>(file)
  return data.tweets
})).then(tweets => tweets.flat().filter(Boolean))

const uniqueTweetIds = Array.from(new Set(mergedData.map(tweet => tweet.id)))

const uniqueTweets = mergedData
  .filter(tweet => uniqueTweetIds.includes(tweet.id))
  .sort((a, b) => {
    const dateA = new Date(a.created_at)
    const dateB = new Date(b.created_at)
    return dateB.getTime() - dateA.getTime()
  })

await writeJson(uniqueTweets, path.join(dataPath, 'merged.json'))
