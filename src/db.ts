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

export const db = new TwitterDB()

export function pagedTweets(page: number, pageSize: number) {
  return db.tweets.offset(page * pageSize).limit(pageSize)
}

/**
 * 获取往年今日的数据
 */
export async function getLastYearsTodayData() {
  const today = new Date()
  const todayStr = `${today.getMonth() + 1}-${today.getDate()}`

  const lastYearsToday = await db.tweets.filter((item) => {
    const date = new Date(item.created_at)
    return `${date.getMonth() + 1}-${date.getDate()}` === todayStr
  }).toArray()

  return lastYearsToday
}

export async function tweetsByDateRange(
  collection: TweetCollection,
  start: number,
  end: number,
) {
  return await collection.filter((t) => {
    const date = new Date(t.created_at).getTime()
    return date >= start && date <= end
  }).toArray()
}

export function searchTweets(
  keyword: string,
) {
  return db.tweets.filter((t) => {
    const regex = new RegExp(keyword, 'i')
    const isMatch = regex.test(t.full_text)

    return isMatch
  })
}
