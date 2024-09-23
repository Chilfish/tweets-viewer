import type { Tweet, User } from './types/tweets'

import Dexie from 'dexie'

interface TweetWithUid extends Tweet {
  uid: string
}

export class TwitterDB extends Dexie {
  tweets: Dexie.Table<TweetWithUid, string>
  users: Dexie.Table<User, string>

  constructor() {
    super('TwitterDB')

    this.version(1).stores({
      tweets: 'id, uid, full_text',
      users: 'name',
    })

    this.tweets = this.table('tweets')
    this.users = this.table('users')
  }
}

export const db = new TwitterDB()
