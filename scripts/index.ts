import type { Tweet } from '@/types'
import type { TweetData } from './filter'
import glob from 'fast-glob'
import pMap from 'p-map'
import { filterTweet, filterUser } from './filter'
import { isNotInImport, readJson, uniqueObj, writeJson } from './utils'

export const dataFolder = `D:/Downloads/tweet-data`

export const dataFolders = await glob(
  `${dataFolder}/*`,
  {
    onlyDirectories: true,
  },
)

async function readData(folder: string) {
  const files = await glob(`${folder}/*.json`)
    .then(files => files.filter(name => !name.includes('/data-')))

  if (!files.length) {
    console.error(`No data found in ${folder}`)
    return []
  }

  const data = (await pMap(files, file => readJson<TweetData[]>(file))).flatMap(d => d)

  const mergedData = uniqueObj(data, 'id')
    .sort((a, b) => {
      const idA = 'id' in a ? a.id : a.rest_id
      const idB = 'id' in b ? b.id : b.rest_id
      return idB.localeCompare(idA)
    })
  await writeJson(`${folder}/data-merged.json`, mergedData)

  return mergedData
}

async function mergeOld(
  folder: string,
  newData: Tweet[],
) {
  const oldFiles = await glob(`${folder}/data-old-*.json`)
  const oldData = (await pMap(oldFiles, file => readJson<Tweet[]>(file))).flatMap(d => d)

  // only add old data that is not in new data
  newData.push(
    ...oldData.filter(
      old => !newData.some(
        newD => newD.id === old.id,
      ),
    ),
  )

  return newData.sort((a, b) => b.id.localeCompare(a.id))
}

async function main(folder: string) {
  const data = await readData(folder)

  const birthday = await glob(`${folder}/birthday_*`)
    .then(name => name[0]?.split('_').pop())

  console.log(folder, data.length, birthday)

  if (!data.length) {
    return
  }

  const user = filterUser(data[0], new Date(birthday || ''))
  const tweet = data.map(filterTweet)

  const mergedData = await mergeOld(folder, tweet)

  await writeJson(`${folder}/data-user.json`, {
    ...user,
    tweetStart: tweet[tweet.length - 1].createdAt,
    tweetEnd: tweet[0].createdAt,
    tweetCount: tweet.length,
  })
  await writeJson(`${folder}/data-tweet.json`, mergedData)
}

if (isNotInImport(import.meta.filename)) {
  await pMap(
    dataFolders,
    async folder => main(folder)
      .catch(err => console.error(`Error in ${folder}`, err)),
    { concurrency: 1 },
  )
}
