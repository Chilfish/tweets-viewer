import type { Collection } from 'dexie'
import type { Tweet, User } from './types/tweets'
import Dexie from 'dexie'

interface TweetWithUid extends Tweet {
  uid: string
}

export type TweetCollection = Collection<TweetWithUid, string, TweetWithUid>

export class TwitterDB extends Dexie {
  tweets: Dexie.Table<TweetWithUid, string>
  users: Dexie.Table<User, string>

  constructor() {
    super('TwitterDB')

    this.version(1).stores({
      tweets: 'id, uid',
      users: 'name',
    })

    this.tweets = this.table('tweets')
    this.users = this.table('users')
  }
}

export class TweetService {
  private db: TwitterDB
  private uid: string

  constructor(uid: string) {
    this.db = new TwitterDB()
    this.uid = uid
  }

  private tweets() {
    return this.db.tweets
      .reverse()
      .filter(t => t.uid === this.uid)
  }

  setUid(uid: string) {
    this.uid = uid
  }

  async getUser() {
    return (await this.db.users.get(this.uid))!
  }

  async putData(user: User, tweets: TweetWithUid[]) {
    await this.db.transaction('rw', this.db.users, this.db.tweets, async () => {
      await this.db.users.put(user)
      await this.db.tweets.bulkPut(tweets)
    })
  }

  pagedTweets(page: number, pageSize: number) {
    return this.tweets()
      .offset(page * pageSize)
      .limit(pageSize)
  }

  /**
   * 获取往年今日的数据
   */
  async getLastYearsTodayData() {
    const today = new Date()
    const todayStr = `${today.getMonth() + 1}-${today.getDate()}`

    const lastYearsToday = await this.tweets()
      .filter((item) => {
        const date = new Date(item.created_at)
        return `${date.getMonth() + 1}-${date.getDate()}` === todayStr && item.uid === this.uid
      })
      .toArray()

    return lastYearsToday
  }

  async tweetsByDateRange(
    tweets: TweetCollection,
    start: number,
    end: number,
  ) {
    return await tweets
      .filter((t) => {
        const date = new Date(t.created_at).getTime()
        return date >= start && date <= end && t.uid === this.uid
      })
      .toArray()
  }

  searchTweets(keyword: string) {
    return this.tweets()
      .filter((t) => {
        const regex = new RegExp(keyword, 'i')
        const isMatch = regex.test(t.full_text)
        return isMatch && t.uid === this.uid
      })
  }
}
