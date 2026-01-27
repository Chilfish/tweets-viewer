import type { DB, InsertTweet } from '@tweets-viewer/database'
import type { User } from '@tweets-viewer/shared'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import type { ITweetRepository } from '../types'
import { writeFile } from 'node:fs/promises'
import { neon } from '@neondatabase/serverless'
import {

  getLatestTweets,

  updateUserTweets,
} from '@tweets-viewer/database'
import { drizzle } from 'drizzle-orm/neon-http'

export class DrizzleRepository implements ITweetRepository {
  private db: NeonHttpDatabase

  constructor(connectionString: string) {
    const client = neon(connectionString)
    this.db = drizzle({ client }) as unknown as NeonHttpDatabase // Adjust based on actual DB type export
  }

  async getUsersWithLatestTweetDate(): Promise<
    { restId: string, createdAt: Date }[]
  > {
    // 假设 getLatestTweets 返回的就是我们需要的数据结构
    const data = await getLatestTweets(this.db as unknown as DB)

    await writeFile(
      'data/tweets/users.json',
      JSON.stringify(data, null, 2),
      'utf8',
    )

    return data
  }

  async saveUserTweets(
    user: Pick<User, 'screenName'> & { tweetEnd: Date },
    tweets: InsertTweet[],
  ): Promise<number> {
    if (tweets.length === 0)
      return 0

    const { rowCount } = await updateUserTweets({
      db: this.db as unknown as DB,
      user,
      tweets,
    })
    return rowCount || 0
  }
}
