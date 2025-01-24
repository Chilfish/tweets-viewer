import type { Tweet } from '@/types'
import glob from 'fast-glob'
import pMap from 'p-map'
import { filterTweet, filterUser } from '../database/services'
import { dataFolders } from './'
import {
  isNotInImport,
  mergeData,
  readJson,
  uniqueObj,
  writeJson,
} from './utils'

async function readData(folder: string) {
  const files = await glob(`${folder}/*.json`)
    .then(files => files.filter(name => !name.includes('/data-')))

  if (!files.length) {
    console.error(`No data found in ${folder}`)
    return []
  }

  const data = (await pMap(files, file => readJson<any[]>(file))).flatMap(d => d)

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

  // only add old data that is not in new data,
  // if the old data is in new data, it will be replaced
  const mergedData = mergeData(oldData, newData, 'id')
    .sort((a, b) => b.id.localeCompare(a.id))
    .map(tweet => ({
      ...tweet,
      userId: newData[0].userId,
    }))

  return mergedData
}

export async function mergeLocal(folder: string) {
  const data = await readData(folder)

  const birthday = await glob(`${folder}/birthday_*`)
    .then(name => name[0]?.split('_').pop())

  if (!data.length) {
    return
  }

  const user = filterUser(data[0], new Date(birthday || ''))
  const tweet = data
    .map(filterTweet)
    .filter(tweet => tweet.userId === user.screenName)

  const mergedData = await mergeOld(folder, tweet)

  console.log(folder, mergedData.length, birthday)

  await writeJson(`${folder}/data-user.json`, {
    ...user,
    tweetStart: mergedData[mergedData.length - 1].createdAt,
    tweetEnd: mergedData[0].createdAt,
    tweetCount: mergedData.length,
  })
  await writeJson(`${folder}/data-tweet.json`, mergedData)
}

if (isNotInImport(import.meta.filename)) {
  await pMap(
    dataFolders,
    async folder => mergeLocal(folder)
      .catch(err => console.error(`Error in ${folder}`, err)),
    { concurrency: 1 },
  )
}
