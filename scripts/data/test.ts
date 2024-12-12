import { filterTweet, filterUser } from '../filter'

import quoteData from './quote.json'
import retweetCard from './retweet-card.json'
import retweetData from './retweet.json'
import textData from './text_img.json'

console.log(filterUser(textData, new Date('2001-07-10')))

console.log(filterTweet(textData))
console.log(filterTweet(retweetData))
console.log(filterTweet(quoteData))
console.log(filterTweet(retweetCard))
