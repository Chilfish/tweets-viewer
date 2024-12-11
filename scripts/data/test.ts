import { filterTweet, filterUser } from 'filter'

import quoteData from './quote.json'
import retweetData from './retweet.json'
import textData from './text_img.json'

const user = filterUser(textData, new Date('2001-07-10'))
const text = filterTweet(textData)
const retweet = filterTweet(retweetData)
const quoted = filterTweet(quoteData)

console.log(user)
console.log(text)
console.log(retweet)
console.log(quoted)
