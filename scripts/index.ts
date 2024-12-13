import type { TweetData } from './filter'
import glob from 'fast-glob'
import pMap from 'p-map'
import { filterTweet, filterUser } from './filter'
import { isNotInImport, readJson, uniqueObj, writeJson } from './utils'

const dataFolder = `D:/Downloads/tweet-data`

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

  await writeJson(`${folder}/data-user.json`, {
    ...user,
    tweetStart: tweet[tweet.length - 1].createdAt,
    tweetEnd: tweet[0].createdAt,
    tweetCount: tweet.length,
  })
  await writeJson(`${folder}/data-tweet.json`, tweet)
}

if (isNotInImport(import.meta.filename)) {
  await pMap(dataFolders, main, { concurrency: 1 })
}
