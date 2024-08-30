import { defineStore } from 'pinia'
import { computed, ref, shallowRef, triggerRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Tweet, User } from '~/types/tweets'
import { buildSearch } from '~/utils/search'

export const useTweetStore = defineStore('tweets', () => {
  const user = ref<User | null>(null)
  const tweets = shallowRef<Tweet[]>([])
  const searchTweets = shallowRef<Tweet[]>([])
  const router = useRouter()
  const route = useRoute()

  const searchQuery = computed(() => route.query.q as string)
  const searchText = ref(searchQuery.value)
  let searchFn: ReturnType<typeof buildSearch> | null = null

  function getTweets() {
    console.log('getTweets', searchQuery.value)
    if (searchQuery.value) {
      search()
      return searchTweets.value
    }
    return tweets.value
  }
  function setTweets(newTweets: Tweet[]) {
    tweets.value = newTweets
    triggerRef(tweets)
  }
  function resetSearch() {
    searchTweets.value = []
    searchText.value = ''
    router.push({ query: {} })
  }

  function search() {
    if (!searchFn) {
      searchFn = buildSearch(tweets.value.map(t => ({
        id: t.id,
        text: t.full_text,
      })))
    }

    const keyword = searchText.value
    if (!keyword) {
      return
    }

    searchTweets.value = searchFn
      .search(keyword)
      .map(id => tweets.value.find(t => t.id === id)!)

    router.push({ query: { q: keyword } })
  }

  return {
    user,
    tweets,
    searchText,
    searchTweets,
    setTweets,
    getTweets,
    resetSearch,
    search,
  }
})
