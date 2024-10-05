import type { TweetKey } from '.'
import glob from 'fast-glob'
import { hash } from 'ohash'
import { config, staticFolder } from '.'
import { readJson, writeJson } from './utils'

await config.init()
const files = await glob(`${staticFolder}/data-*.json`)

for (const file of files) {
  console.log(`Hashing ${file}`)
  const filename = file.split('/').pop()?.split('.').shift()

  const tweets = await readJson(file)
  const version = hash(tweets)

  const key = `${filename}` as TweetKey
  const start = new Date(tweets[0].created_at).getTime()
  const end = new Date(tweets[tweets.length - 1].created_at).getTime()

  await config.set({ name: key, version, tweetRange: { start, end } })
}

await writeJson(`${staticFolder}/versions.json`, config.versions)
