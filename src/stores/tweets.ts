import { defineStore } from 'pinia'
import { ref, shallowRef, triggerRef } from 'vue'
import type { Tweet, User } from '~/types/tweets'

export const useTweetStore = defineStore('tweets', () => {
  const user = ref<User | null>(null)
  const tweets = shallowRef<Tweet[]>([])

  function setTweets(newTweets: Tweet[]) {
    tweets.value = newTweets
    triggerRef(tweets)
  }

  return {
    user,
    tweets,
    setTweets,
  }
})
