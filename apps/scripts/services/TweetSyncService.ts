import type { InsertTweet } from '@tweets-viewer/database'
import type { ITweetRepository, ITweetSource } from '../types'
import pMap from 'p-map'

export class TweetSyncService {
  constructor(
    private readonly repository: ITweetRepository,
    private readonly source: ITweetSource,
  ) {}

  /**
   * 同步单个用户的推文
   */
  private async syncUser(uid: string, latestStoredDate: Date) {
    if (!uid)
      return { user: uid, count: 0 }

    console.log(
      `Starting sync for user ID: ${uid}, until: ${latestStoredDate.toISOString()}`,
    )

    let totalInserted = 0
    let userName = uid
    let lastTweetId = ''

    // 使用迭代器消费数据，业务逻辑控制何时停止
    const iterator = this.source.fetchTweetsIterator(uid)

    for await (const batch of iterator) {
      if (batch.tweets.length === 0)
        break

      // 1. 过滤掉已经存在的推文 (基于时间)
      const newTweets = batch.tweets.filter(
        t => t.createdAt.getTime() > latestStoredDate.getTime(),
      )

      if (newTweets.length === 0) {
        console.log(`Reached known tweets for ${uid}. Stopping.`)
        break
      }

      // 2. 重复检测 (API 可能会在分页边界返回重复数据)
      if (newTweets.at(-1)?.id === lastTweetId) {
        console.warn('Duplicate tweet detected at boundary. Stopping.')
        break
      }

      userName = batch.user.screenName || uid

      // 3. 转换为数据库模型
      const insertTweets: InsertTweet[] = newTweets.map(t => ({
        ...t,
        id: undefined, // Let DB handle ID
        tweetId: t.id,
        userId: userName,
      }))

      // 4. 持久化
      const inserted = await this.repository.saveUserTweets(
        {
          screenName: userName,
          tweetEnd: newTweets[0].createdAt, // 这一批次中最新的时间
        },
        insertTweets,
      )

      totalInserted += inserted
      lastTweetId = newTweets.at(-1)?.id || ''

      // 5. 检查是否所有的推文都比截止日期新，如果这一批次里有旧推文，说明已经追溯到了历史记录
      const oldestInBatch = batch.tweets.at(-1)?.createdAt
      if (
        oldestInBatch
        && oldestInBatch.getTime() <= latestStoredDate.getTime()
      ) {
        break
      }
    }

    return { user: userName, count: totalInserted }
  }

  /**
   * 批量同步所有用户
   */
  async syncAllUsers(concurrency = 1) {
    const users = await this.repository.getUsersWithLatestTweetDate()

    const results = await pMap(
      users,
      user =>
        this.syncUser(user.restId, user.createdAt).catch((err) => {
          console.error(`Failed to sync user ${user.restId}:`, err)
          return { user: user.restId, count: 0, error: err }
        }),
      { concurrency, stopOnError: false },
    )

    return results
  }
}
