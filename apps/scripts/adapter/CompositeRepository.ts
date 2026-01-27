import type { InsertTweet } from '@tweets-viewer/database'
import type { User } from '@tweets-viewer/shared'
import type { ITweetRepository } from '../types'

export class CompositeRepository implements ITweetRepository {
  private repos: ITweetRepository[]

  constructor(repos: ITweetRepository[]) {
    this.repos = repos
  }

  /**
   * 获取最新时间策略：
   * 聚合所有存储层的数据，取【最晚】的那个时间。
   * 这样可以保证如果 DB 有数据但文件没有，或者反之，我们都能基于最新的状态继续同步，避免重复抓取。
   */
  async getUsersWithLatestTweetDate(): Promise<
    { restId: string, createdAt: Date }[]
  > {
    // 并行获取所有存储层的状态
    const allResults = await Promise.all(
      this.repos.map(r => r.getUsersWithLatestTweetDate()),
    )

    const userMap = new Map<string, Date>()

    // 合并策略：Key是restId，Value取最大的Date
    for (const resultList of allResults) {
      for (const item of resultList) {
        const existingDate = userMap.get(item.restId)
        if (!existingDate || item.createdAt > existingDate) {
          userMap.set(item.restId, item.createdAt)
        }
      }
    }

    return Array.from(userMap.entries()).map(([restId, createdAt]) => ({
      restId,
      createdAt,
    }))
  }

  /**
   * 保存策略：
   * 广播给所有存储层。只要有一个成功就算成功，或者要求全部成功（取决于业务需求）。
   * 这里我们使用 Promise.all 等待全部完成，记录错误但不中断流程。
   */
  async saveUserTweets(
    user: Pick<User, 'screenName'> & { tweetEnd: Date },
    tweets: InsertTweet[],
  ): Promise<number> {
    const results = await Promise.allSettled(
      this.repos.map(repo => repo.saveUserTweets(user, tweets)),
    )

    let successCount = 0
    results.forEach((res, index) => {
      if (res.status === 'fulfilled') {
        successCount = res.value // 假设所有 repo 返回的 count 是一样的
      }
      else {
        console.error(
          `[CompositeRepo] Repo at index ${index} failed to save:`,
          res.reason,
        )
      }
    })

    return successCount
  }
}
