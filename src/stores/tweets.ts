import { defineStore } from 'pinia'
import { computed, ref, shallowRef, triggerRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDateFormat } from '@vueuse/core'
import { buildSearch } from '~/utils/search'
import type { Tweet, User } from '~/types/tweets'

export const useTweetStore = defineStore('tweets', () => {
  const user = ref<User | null>(null)
  const tweets = shallowRef<Tweet[]>([])

  const router = useRouter()
  const route = useRoute()

  const searchTweets = shallowRef<Tweet[]>([])
  const searchQuery = computed(() => route.query.q as string)
  const searchText = ref(searchQuery.value)
  let searchFn: ReturnType<typeof buildSearch> | null = null

  watch(searchQuery, (query) => {
    if (query === searchText.value)
      return

    searchText.value = query
    search()
  })

  function getTweets() {
    if (searchQuery.value) {
      if (!searchTweets.value.length)
        search()
      return searchTweets.value
    }
    return tweets.value
  }
  function getTweetsById(id: string) {
    return tweets.value.find(t => t.id === id)
  }

  function getTweetsRange() {
    if (!tweets.value.length)
      return { start: Date.now(), end: Date.now() }

    // 新推文在前
    const start = new Date(tweets.value[tweets.value.length - 1].created_at).getTime()
    const end = new Date(tweets.value[0].created_at).getTime()
    return { start, end }
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

    router.push({
      query: {
        ...route.query,
        q: keyword,
      },
    })
  }

  function getTweetsByDateRange(start: number, end: number) {
    const data = tweets.value.filter((t) => {
      const timestamp = new Date(t.created_at).getTime()
      return timestamp >= start && timestamp <= end
    })
    searchTweets.value = data
    router.push({
      query: {
        ...route.query,
        q: `from:${useDateFormat(start, 'YYYY-MM-DD').value} to:${useDateFormat(end, 'YYYY-MM-DD').value}`,
      },
    })
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
    getTweetsRange,
    getTweetsByDateRange,
    getTweetsById,
  }
})
