import type { User } from '.'
import glob from 'fast-glob'
import { config, dataFolders, staticFolder } from '.'
import { readJson, uniqueObj, writeJson } from './utils'

const removedKeys = [
  'bookmark_count',
  'bookmarked',
  'favorited',
  'retweeted',
  'url',
  'profile_image_url',
  'screen_name',
  'name',
]

async function readFiles(folder: string) {
  const jsons = await glob(`${folder}/*.json`)
    .then(files => files.filter(name => !name.includes('data-')))

  const data: any[] = []
  if (!jsons.length) {
    console.error('No data found.')
    return []
  }

  for (const json of jsons) {
    const _data = await readJson(json)
    data.push(..._data)
  }

  const mergedData = uniqueObj(data, 'id').sort((a, b) => b.id.localeCompare(a.id))
  await writeJson(`${folder}/data-merged.json`, mergedData)

  return data
}

function filterData(data: any[], name: string) {
  return data.map((el) => {
    // 一些错误的数据
    const isOther = el.screen_name && el.screen_name !== name && !el.full_text.startsWith('RT @')
    if (isOther) {
      // console.log('Other:', el.screen_name, el.full_text)
      return null
    }

    removedKeys.forEach(key => delete el[key])

    el.media = el.media.map((media: any) => {
      let url = media.original
      if (media.type === 'video')
        url = media.original

      return url || media
    })

    el.full_text = el.full_text
      .replace(/\xA0|\u3000/g, ' ') // 不可见空格

    el.views_count = +el.views_count || 0

    if (el.in_reply_to) {
      const tweet = data.find(tweet => tweet.id === el.in_reply_to)
      if (tweet) {
        el.in_reply_to = {
          id: tweet.id,
          name: tweet.name,
        }
      }
    }

    el.created_at = el.created_at
      .replace(/_/, ' ')
      .replace(/ [+-]\d+/, '')

    return el
  })
    .filter(Boolean)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
}

function getUserInfo(data: any[], name: string) {
  const userTweet = data.find(el => el.screen_name === name)

  const user = {
    name: userTweet.screen_name,
    screen_name: userTweet.name,
    avatar_url: userTweet.profile_image_url,
  } as User

  return user
}

await config.init()

for await (const folder of dataFolders) {
  const data = await readFiles(folder)
  console.log(folder, data.length)

  const name = folder.split('/').pop()
  if (!name) {
    console.warn('No name found.')
    continue
  }

  const user = getUserInfo(data, name)
  const filteredData = filterData(data, name)

  await writeJson(`${staticFolder}/data-${user.name}.json`, filteredData, 'write', 0)

  await config.set({
    name: `data-${user.name}`,
    screen_name: user.screen_name,
  })
}

console.log('Done.')
