import { existsSync } from 'node:fs'
import glob from 'fast-glob'
import { dir, isNotInImport, readJson, uniqueObj, writeJson } from './utils'

export async function readFiles(folder: string) {
  const jsons = await glob(`${folder.replace(/\\/g, '/')}/*.json`)
    .then(files => files.filter(name => !name.includes('data-')))

  if (!jsons.length) {
    console.error(`No data found in ${folder}`)
    return []
  }

  const data: any[] = []
  for (const json of jsons) {
    const _data = await readJson(json)
    data.push(..._data)
  }

  const mergedData = uniqueObj(data, 'id')
  // .sort((a, b) => b.id.localeCompare(a.id))
  await writeJson(`${folder}/data-merged.json`, mergedData)

  return mergedData
}

export function filterData(
  data: any[],
  name: string | null = null,
) {
  const removedKeys = [
    'bookmark_count',
    'bookmarked',
    'favorited',
    'retweeted',
    'url',
    'profile_image_url',
  ]
  if (name)
    removedKeys.push(...['screen_name', 'name'])

  return data.map((el) => {
  // 一些错误的数据
    const isOther = name && el.screen_name && el.screen_name !== name && !el.full_text.startsWith('RT @')
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
    // .sort((a, b) => a.created_at.localeCompare(b.created_at))
}

if (isNotInImport(import.meta.filename)) {
  const path = process.argv[2]
  if (!existsSync(path)) {
    console.error('No data found.')
    process.exit(1)
  }

  const data = await readFiles(dir(path))
  const filteredData = filterData(data)

  await writeJson(`${path}/data-filtered.json`, filteredData, 'write', 0)
}
