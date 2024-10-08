import type { Collection } from 'dexie'
import type { TweetService } from '.'
import type { Tweet } from '../types/tweets'
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
    })

    this.tweets = this.table('tweets')
  }
}

export class TweetDBService implements TweetService {
  private db: TwitterDB
  name: string
  pageSize = 10
  isReverse = true

  constructor(name: string) {
    this.db = new TwitterDB()
    this.name = name
  }

  private tweets() {
    const collection = this.db.tweets.filter(t => t.uid === this.name)
    return this.isReverse ? collection.reverse() : collection
  }

  private pagedTweets(page: number) {
    return this.tweets()
      .offset(page * this.pageSize)
      .limit(this.pageSize)
  }

  changeName(name: string) {
    this.name = name
  }

  async putData(tweets: TweetWithUid[]) {
    await this.db.transaction('rw', this.db.tweets, async () => {
      await this.db.tweets.bulkPut(tweets)
    })
  }

  async getTweets(page: number) {
    return this.pagedTweets(page).toArray()
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
        return `${date.getMonth() + 1}-${date.getDate()}` === todayStr && item.uid === this.name
      })
      .toArray()

    return lastYearsToday
  }

  async getByDateRange(
    start: number,
    end: number,
    page: number,
  ) {
    return await this.pagedTweets(page)
      .filter((t) => {
        const date = new Date(t.created_at).getTime()
        return date >= start && date <= end && t.uid === this.name
      })
      .toArray()
  }

  async searchTweets(
    keyword: string,
    page: number,
    start: number,
    end: number,
  ) {
    return await this.tweets()
      .filter((t) => {
        const regex = new RegExp(keyword, 'i')
        const isMatch = regex.test(t.full_text)
        return isMatch && t.uid === this.name
      })
      .offset(page * this.pageSize)
      .limit(this.pageSize)
      .filter((t) => {
        const date = new Date(t.created_at).getTime()
        return date >= start && date <= end
      })
      .toArray()
  }
}
