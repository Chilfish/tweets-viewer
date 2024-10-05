import type { Collection } from 'dexie'
import type { Tweet } from './types/tweets'
import Dexie from 'dexie'

interface TweetWithUid extends Tweet {
  uid: string
}

export type TweetCollection = Collection<TweetWithUid, string, TweetWithUid>

export class TwitterDB extends Dexie {
  tweets: Dexie.Table<TweetWithUid, string>

  constructor() {
    super('TwitterDB')

    this.version(1).stores({
      tweets: 'id, uid',
      users: 'name',
    })

    this.tweets = this.table('tweets')
  }
}

export class TweetService {
  private db: TwitterDB
  private uid: string

  pageSize = 10
  /**
   * 是否倒序，以最新的在前，默认为 true
   */
  isReverse = true

  constructor(uid: string) {
    this.db = new TwitterDB()
    this.uid = uid
  }

  private tweets() {
    const collection = this.db.tweets.filter(t => t.uid === this.uid)
    return this.isReverse ? collection.reverse() : collection
  }

  setUid(uid: string) {
    this.uid = uid
  }

  async putData(tweets: TweetWithUid[]) {
    await this.db.transaction('rw', this.db.tweets, async () => {
      await this.db.tweets.bulkPut(tweets)
    })
  }

  pagedTweets(page: number) {
    return this.tweets()
      .offset(page * this.pageSize)
      .limit(this.pageSize)
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
