import type { InsertTweet } from '@tweets-viewer/database'
import type { Tweet, User } from '@tweets-viewer/shared'

// 核心业务实体扩展
export interface UserWithTimeline extends User {
  tweetStart: Date
  tweetEnd: Date
}

export interface FetchResult {
  tweets: Tweet[]
  user: User
  nextCursor?: string
  hasMore: boolean
}

// 依赖倒置：数据源接口
export interface ITweetSource {
  fetchUser: (username: string) => Promise<User>
  /**
   * 使用生成器模式，将分页逻辑抽象为流
   */
  fetchTweetsIterator: (
    username: string,
    cursor?: string,
  ) => AsyncGenerator<FetchResult, void, unknown>
}

// 依赖倒置：持久层接口
export interface ITweetRepository {
  getUsersWithLatestTweetDate: () => Promise<{ restId: string, createdAt: Date }[]>
  saveUserTweets: (
    user: Pick<User, 'screenName'> & { tweetEnd: Date },
    tweets: InsertTweet[],
  ) => Promise<number>
}

// 配置接口
export interface AppConfig {
  databaseUrl: string
  tweetApiKey?: string
}
