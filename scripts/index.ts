import type { TweetData } from './filter'
import glob from 'fast-glob'
import pMap from 'p-map'
import { filterTweet, filterUser } from './filter'
import { readJson, uniqueObj, writeJson } from './utils'

const dataFolder = `D:/Downloads/tweet-data`

const dataFolders = await glob(
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

for await (const folder of dataFolders) {
  const data = await readData(folder)

  const birthday = await glob(`${folder}/birthday_*`)
    .then(name => name[0]?.split('_').pop())

  console.log(folder, data.length, birthday)

  if (!data.length) {
    continue
  }

  const user = filterUser(data[0], new Date(birthday || ''))
  const tweet = data.map(filterTweet)

  await writeJson(`${folder}/data-user.json`, {
    ...user,
    tweetStart: tweet[0].created_at,
    tweetEnd: tweet[tweet.length - 1].created_at,
    tweetCount: tweet.length,
  })
  await writeJson(`${folder}/data-tweet.json`, tweet)
}
