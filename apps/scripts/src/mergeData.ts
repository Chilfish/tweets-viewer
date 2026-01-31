import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { userId } from '../config'
import { cacheDir, readJson, writeJson } from './utils'

const dataPath = path.join(cacheDir, `data/${userId}`)

const jsons = await readdir(dataPath).then(files => files
  .filter(file => file.endsWith('.json'))
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

await writeJson(mergedData, path.join(dataPath, 'merged.json'))
