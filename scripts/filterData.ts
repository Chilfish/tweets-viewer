import glob from 'fast-glob'

import { dir, readJson, uniqueObj, writeJson } from './utils'

interface User {
  name: string // as id
  screen_name: string
  avatar_url: string
}

const removed = [
  'bookmark_count',
  'bookmarked',
  'favorited',
  'retweeted',
  'url',
]

const includeRT = true
const name = process.argv[2]
if (!name) {
  console.error('Please provide a twitter name.')
  process.exit(1)
}
const folder = dir(`D:/Downloads/tweet-data/${name}`)

/**
 * data.json exported from https://github.com/prinsss/twitter-web-exporter
 */
const jsons = await glob(`${folder}/*.json`)
  .then(files => files.filter(name => !name.includes('data-')))

let data: any[] = []

if (!jsons.length) {
  console.error('No data found.')
  process.exit(1)
}

console.log(`Merging ${jsons.length} files...`, jsons)

for (const json of jsons) {
  const _data = await readJson(json)
  data.push(..._data)
}

const mergedData = uniqueObj(data, 'id').sort((a, b) => b.id.localeCompare(a.id))

console.log(mergedData.length, data.length)

await writeJson(`${folder}/data-merged.json`, mergedData)

data = data.map((el) => {
  // 一些错误的数据
  const isOther = el.screen_name && el.screen_name !== name && !el.full_text.startsWith('RT @')
  if (isOther) {
    console.log('Other:', el.screen_name, el.full_text)
    return null
  }

  if (el.full_text.startsWith('RT @') && !includeRT) {
    return null
  }

  removed.forEach((key) => {
    delete el[key]
  })

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

const userTweet = data.find(el => el.screen_name === name)

const user = {
  name: userTweet.screen_name,
  screen_name: userTweet.name,
  avatar_url: userTweet.profile_image_url,
} as User

data.forEach((el) => {
  delete el.screen_name
  delete el.name
  delete el.profile_image_url
})

await writeJson(`D:/Codes/static/tweet/data-${user.name}.json`, {
  user,
  tweets: data,
}, 'write', 0)

console.log(`Done! ${data.length} tweets saved.`)
