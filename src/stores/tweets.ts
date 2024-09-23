import { useDateFormat } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef, triggerRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fallbackUser, notfountRetry, staticUrl } from '~/constant'
import type { Tweet, User } from '~/types/tweets'
import { buildSearch } from '~/utils/search'

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

  let retry = 0
  async function initTweets(name = route.params.name || fallbackUser) {
    console.log('Loading data for', name)

    const tweetJson = await fetch(`${staticUrl}/tweet/data-${name}.json`)
      .then(res => res.json())
      .catch(async () => {
        if (retry < notfountRetry) {
          retry++
          router.push({
            path: `@${fallbackUser}`,
          })
          await initTweets(fallbackUser)
        }
        else {
          console.error('Failed to load data for', name)
          router.push('/')
        }
      })

    setTweets(tweetJson.tweets.sort((a: any, b: any) => +b.id - +a.id))
    user.value = tweetJson.user
  }

  function parseDateRange() {
    const query = route.query
    if (query.from && query.to) {
      return {
        start: new Date(query.from as string).getTime(),
        end: new Date(query.to as string).getTime(),
      }
    }
    return getTweetsRange()
  }

  function getTweets() {
    const query = route.query
    if (query.q) {
      search()
      return searchTweets.value
    }
    else if (query.from && query.to) {
      const { start, end } = parseDateRange()
      getTweetsByDateRange(start, end)
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
    router.push({
      query: {},
      path: `/@${user.value?.name}` || '/',
    })
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

    const { start, end } = parseDateRange()

    searchTweets.value = searchFn
      .search(keyword)
      .map(id => tweets.value.find(t => t.id === id)!)
      .filter((t) => {
        const timestamp = new Date(t.created_at).getTime()
        return timestamp >= start && timestamp <= end
      })

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
        from: useDateFormat(start, 'YYYY-MM-DD').value,
        to: useDateFormat(end, 'YYYY-MM-DD').value,
      },
    })
  }

  // 获取往年今日的数据
  function getLastYearsTodayData() {
    const today = new Date()
    const todayStr = `${today.getMonth() + 1}-${today.getDate()}`
    const lastYearsToday = tweets.value.filter((item) => {
      const date = new Date(item.created_at)
      return `${date.getMonth() + 1}-${date.getDate()}` === todayStr
    })
    return lastYearsToday
  }

  return {
    user,
    tweets,
    searchText,
    searchTweets,
    initTweets,
    setTweets,
    getTweets,
    resetSearch,
    search,
    getTweetsRange,
    getTweetsByDateRange,
    getTweetsById,
    getLastYearsTodayData,
  }
})
