import { useDateFormat, useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRetryFetch } from '~/composables'
import { fallbackUser, staticUrl } from '~/constant'
import { db } from '~/db'
import type { DataVersion, Tweet, User, VersionKey } from '~/types/tweets'
import { buildSearch } from '~/utils/search'

export const useTweetStore = defineStore('tweets', () => {
  const user = ref<User | null>(null)
  const isInit = ref(false)

  const router = useRouter()
  const route = useRoute()

  const versionStore = useStorage<DataVersion>('dataVersion', {})

  const tweetRange = ref({ start: Date.now(), end: Date.now() })
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

  function checkVersion(version: DataVersion) {
    const oldVersions = versionStore.value
    for (const key in version) {
      if (oldVersions[key as VersionKey] !== version[key as VersionKey]) {
        versionStore.value = version
        return true
      }
    }
    return false
  }

  async function initTweets(name = route.params.name as string || fallbackUser) {
    console.log('Loading data for', name)
    const fetcher = useRetryFetch((err) => {
      console.error(err)
      router.push('/')
      isInit.value = true
    })

    const versions = await fetcher<DataVersion>(`${staticUrl}/tweet/versions.json`)
    if (!versions) {
      return
    }

    if (!checkVersion(versions)) {
      console.log('No new data')
      isInit.value = true

      const curUser = (await db.users.get(name))!
      user.value = curUser

      if (route.params.name !== curUser.name) {
        router.push(`/@${curUser.name}`)
      }

      console.log('User', curUser)
      return
    }

    const tweetJson = await fetcher<{
      user: User
      tweets: Tweet[]
    }>(`${staticUrl}/tweet/data-${name}.json`)
    if (!tweetJson) {
      return
    }

    const curUser = tweetJson.user
    await db.users.put(curUser)
    await db.tweets.bulkPut(tweetJson.tweets.map(tweet => ({ ...tweet, uid: curUser.name })))

    user.value = curUser
    isInit.value = true
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

  async function getTweets() {
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

    return await db.tweets.toArray()
  }

  async function getTweetsPages(page: number, pageSize: number) {
    console.log('getTweetsPages', page, pageSize)
    return await db.tweets.offset(page * pageSize).limit(pageSize).toArray()
  }

  async function getTweetsById(id: string) {
    return await db.tweets.filter(t => t.id === id).toArray()
  }

  function getTweetsRange() {
    // if (!tweets.value.length)
    //   return { start: Date.now(), end: Date.now() }

    // // 新推文在前
    // const start = new Date(tweets.value[tweets.value.length - 1].created_at).getTime()
    // const end = new Date(tweets.value[0].created_at).getTime()
    // return { start, end }
    return tweetRange.value
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
  async function getLastYearsTodayData() {
    const today = new Date()
    const todayStr = `${today.getMonth() + 1}-${today.getDate()}`

    const lastYearsToday = await db.tweets.filter((item) => {
      const date = new Date(item.created_at)
      return `${date.getMonth() + 1}-${date.getDate()}` === todayStr
    }).toArray()

    return lastYearsToday
  }

  return {
    isInit,
    user,
    // tweets,
    searchText,
    searchTweets,
    initTweets,
    getTweets,
    getTweetsPages,
    resetSearch,
    search,
    getTweetsRange,
    getTweetsByDateRange,
    getTweetsById,
    getLastYearsTodayData,
  }
})
