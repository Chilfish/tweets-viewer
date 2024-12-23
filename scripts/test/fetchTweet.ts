import {
  fetchTweet,
  fetchUser,
} from '../../database/services'
import {
  baseDir,
  cachedData,
  writeJson,
} from '../utils'
import 'dotenv/config'

async function _localTest() {
  const username = process.argv[2] || 'elonmusk'
  const isForce = process.argv.includes('--force')
  const tmpDir = baseDir('tmp')

  const userData = await cachedData(
    tmpDir(`fetch/user-${username}.json`),
    () => fetchUser(username),
    isForce,
  )

  const { tweets, user } = await cachedData(
    tmpDir(`fetch/tweets-${username}.json`),
    () => fetchTweet({
      id: userData.rest_id,
      endAt: new Date('2024-11-21'),
    }),
    isForce,
  )

  await writeJson(tmpDir(`user-${username}.json`), user)

  console.log('Fetched', tweets.length, 'tweets')
  await writeJson(tmpDir(`tweets-${username}.json`), tweets)
}

_localTest().catch(err => console.error(err.message, err.stack))
