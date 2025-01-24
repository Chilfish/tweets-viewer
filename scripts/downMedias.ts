import type { InsertTweet } from '../database'
import { utimes } from 'node:fs/promises'
import glob from 'fast-glob'
import { dataFolder } from '.'
import { formatDate } from '../src/utils/date'
import { downloadFiles, readJson, writeJson } from './utils'

interface Media {
  url: string
  name: string
}

async function findImg(folder: string) {
  const tweets = await readJson<InsertTweet[]>(`${folder}/data-tweet.json`)

  const media = tweets.map((tweet) => {
    if (!tweet.media)
      return null

    const { createdAt, tweetId } = tweet
    const date = formatDate(createdAt, { fmt: 'yyyyMMdd_HHmmss' })

    return tweet.media.map(({ url, type }, idx) => {
      const ext = type === 'photo' ? 'jpg' : 'mp4'
      const suffix = idx > 0 ? `-${idx}` : ''
      const name = `${date}-${tweetId}${suffix}.${ext}`
      return { url, name }
    })
  })
    .filter((media): media is Media[] => !!media)
    .flat()

  await writeJson(`${folder}/data-media.json`, media)

  return media
}

async function main() {
  const user = process.argv[2]
  const folder = `${dataFolder}/${user}`
  const mediaFolder = `${folder}/media`

  const media = await findImg(folder)

  console.log(`Downloading ${media.length} files... to ${mediaFolder}`)

  await downloadFiles(media, {
    dest: mediaFolder,
  })

  const mediaFiles = await glob(`${mediaFolder}/*`)
  // rewrite created time

  for (const file of mediaFiles) {
    const createdAt = file.split('/').pop()?.split('-')[0]

    if (!createdAt)
      continue

    const date = new Date(
      Number.parseInt(createdAt.substring(0, 4)), // year
      Number.parseInt(createdAt.substring(4, 6)) - 1, // month (0-based)
      Number.parseInt(createdAt.substring(6, 8)), // day
      Number.parseInt(createdAt.substring(9, 11)), // hours
      Number.parseInt(createdAt.substring(11, 13)), // minutes
      Number.parseInt(createdAt.substring(13, 15)), // seconds
    )

    await utimes(file, date, date)
  }

  console.log('Done', mediaFiles.length)
}

main()
