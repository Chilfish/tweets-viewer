import type { IUser } from '../data/User'
import type { ITweetDetailsResponse } from '../raw/tweet/Details'

export type * from './card'
export type * from './entities'
export type * from './media'
export type * from './tweet'
export type * from './user'

export type RawTweet = ITweetDetailsResponse['data']['tweetResult']['result']

export type RawUser = IUser
