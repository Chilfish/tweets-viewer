import type { ITweetRepository } from './types'
import path from 'node:path'
import { env } from '@tweets-viewer/shared/env.server'
import { CompositeRepository } from './adapter/CompositeRepository'
import { DrizzleRepository } from './adapter/DrizzleRepository'
import { RettiwtSource } from './adapter/RettiwtSource'
import { TweetSyncService } from './services/TweetSyncService'
import 'dotenv/config'

const root = path.resolve(__dirname, '../../')

function createRepository(): ITweetRepository {
  const repos: ITweetRepository[] = []

  // 选项 1: 数据库层
  repos.push(new DrizzleRepository(env.DATABASE_URL))
  // repos.push(new FileSystemRepository(path.join(root, 'data/tweets')))

  if (repos.length === 0) {
    throw new Error('No persistence layer enabled! Check your .env')
  }

  // 如果只有一个，直接返回；如果有多个，包装进 Composite
  return repos.length === 1 ? repos[0] : new CompositeRepository(repos)
}

async function main() {
  // 1. 初始化依赖
  const repository = createRepository()
  const tweetSource = new RettiwtSource(env.TWEET_KEY)

  // 2. 初始化服务
  const service = new TweetSyncService(repository, tweetSource)

  // 3. 执行
  console.time('SyncDuration')
  try {
    const results = await service.syncAllUsers(1)

    console.log('--- Sync Summary ---')
    results.forEach((r) => {
      if ('error' in r) {
        console.error(`[X] ${r.user}: Failed - ${r.error}`)
      }
      else {
        console.log(`[V] ${r.user}: +${r.count} tweets`)
      }
    })
  }
  catch (err) {
    console.error('Fatal error during sync:', err)
    process.exit(1)
  }
  finally {
    console.timeEnd('SyncDuration')
    process.exit(0)
  }
}

main()
