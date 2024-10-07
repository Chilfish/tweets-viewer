import type { TweetKey, User } from '.'
import glob from 'fast-glob'
import { hash } from 'ohash'
import { config, dataFolders, staticFolder } from '.'
import { filterData, readFiles } from './filterData'
import { readJson, writeJson } from './utils'

function getUserInfo(data: any[], name: string) {
  const userTweet = data.find(el => el.screen_name === name)

  const user = {
    screen_name: userTweet.screen_name,
    name: userTweet.name,
    avatar_url: userTweet.profile_image_url,
  } as User

  return user
}

await config.init()

for await (const folder of dataFolders) {
  const data = await readFiles(folder)
  console.log(folder, data.length)

  const screen_name = folder.split('/').pop()
  if (!screen_name) {
    console.warn('No name found.')
    continue
  }

  const user = getUserInfo(data, screen_name)
  const filteredData = filterData(data, screen_name)

  await writeJson(`${staticFolder}/data-${user.screen_name}.json`, filteredData, 'write', 0)

  await config.set({
    name: `data-${user.screen_name}`,
    username: user.name,
  })
}

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

console.log('Done.')
