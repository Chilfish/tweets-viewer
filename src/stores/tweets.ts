import { useDateFormat, useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRetryFetch } from '~/composables'
import { staticUrl } from '~/constant'
import { TweetService } from '~/db'
import type {
  Tweet,
  User,
} from '~/types/tweets'
import { usernameFromUrl } from '~/utils'

type TweetKey = `data-${string}`

interface TweetConfig {
  name: TweetKey
  version: string
  tweetRange: {
    start: number
    end: number
  }
}

export const tweetConfig = useStorage<TweetConfig[]>('tweetConfig', [])
export const newVersions = ref<TweetConfig[]>([])

function isSameVersion(name: string) {
  const oldVersions = tweetConfig.value
  const newKey: TweetKey = `data-${name}`
  const newVersion = newVersions.value.find(c => c.name === newKey)?.version
  const oldVersion = oldVersions.find(c => c.name === newKey)?.version

  if (newVersion === oldVersion) {
    return true
  }

  const newConfig = newVersions.value.find(c => c.name === newKey)
  if (!newConfig) {
    return false
  }

  const oldConfig = oldVersions.find(c => c.name === newKey)

  if (!oldConfig) {
    oldVersions.push(newConfig)
    return false
  }

  oldConfig.version = newConfig.version
  oldConfig.tweetRange = newConfig.tweetRange

  return false
}

export const useTweetStore = defineStore('tweets', () => {
  const user = ref<User | null>(null)
  const isInit = ref(false)

  const router = useRouter()
  const route = useRoute()

  const tweetService = new TweetService(usernameFromUrl())

  const pageState = reactive({
    page: 0,
  })

  const datePagination = reactive({
    page: 0,
  })

  const searchState = reactive({
    text: route.query.q as string,
    page: 0,
  })

  watch(() => route.params, async ({ name: newName }) => {
    if (!newName || newName === user.value?.name)
      return

    await initTweets(newName as string)
  })

  const isReverse = ref(tweetService.isReverse)
  watch(isReverse, (val) => {
    tweetService.isReverse = val
  })

  const curConfig = computed(() => {
    return tweetConfig.value.find(c => c.name === `data-${user.value?.name}`) || {
      name: `data-${user.value?.name}`,
      version: '0',
      tweetRange: {
        start: 0,
        end: 0,
      },
    }
  })

  function resetPages() {
    pageState.page = 0
    datePagination.page = 0
    searchState.page = 0
  }

  async function initTweets(name?: string) {
    isInit.value = false
    resetPages()

    if (!name)
      name = usernameFromUrl()

    console.log('Loading data for', name)
    tweetService.setUid(name)

    const fetcher = useRetryFetch((err) => {
      console.error(err)
      // router.push('/')
      isInit.value = true
    })

    if (newVersions.value.length === 0) {
      const versions = await fetcher<TweetConfig[]>(`${staticUrl}/tweet/versions.json`)
      if (!versions?.length) {
        return
      }
      newVersions.value = versions
    }

    if (isSameVersion(name)) {
      console.log('No new data')

      const curUser = await tweetService.getUser()
      user.value = curUser
      isInit.value = true
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
    const tweets = tweetJson.tweets.map(tweet => ({ ...tweet, uid: curUser.name }))

    console.log('fetch tweets', tweets.length)
    await tweetService.putData(curUser, tweets)

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
    return curConfig.value.tweetRange
  }

  async function getTweets() {
    const query = route.query
    if (query.q) {
      return await search()
    }
    else if (query.from && query.to) {
      const { start, end } = parseDateRange()
      return await getTweetsByDateRange(start, end)
    }

    const tweets = await tweetService
      .pagedTweets(pageState.page)
      .toArray()

    pageState.page++

    return tweets
  }

  let lastKeyword = ''
  async function search() {
    const keyword = route.query.q as string

    if (keyword !== lastKeyword) {
      searchState.page = 0
      lastKeyword = keyword
    }

    const { start, end } = parseDateRange()
    const pageSize = tweetService.pageSize

    const res = await tweetService.searchTweets(
      keyword,
    )
      .offset(searchState.page * pageSize)
      .limit(pageSize)
      .filter((t) => {
        const date = new Date(t.created_at).getTime()
        return date >= start && date <= end
      })
      .toArray()

    // console.log('searchTweets', searchState, res.length)

    searchState.page++
    // router.push({
    //   query: {
    //     ...route.query,
    //     q: keyword,
    //   },
    // })

    return res
  }

  async function getTweetsByDateRange(
    start: number,
    end: number,
  ) {
    const { page } = datePagination

    const data = await tweetService.tweetsByDateRange(
      tweetService.pagedTweets(page),
      start,
      end,
    )
    // console.log('getTweetsByDateRange', { start, end, page, pageSize }, data.length)

    datePagination.page++
    router.push({
      query: {
        ...route.query,
        from: useDateFormat(start, 'YYYY-MM-DD').value,
        to: useDateFormat(end, 'YYYY-MM-DD').value,
      },
    })

    return data
  }

  return {
    isInit,
    user,
    datePagination,
    searchState,
    tweetService,
    isReverse,
    curConfig,
    initTweets,
    getTweets,
    search,
    getTweetsByDateRange,
    resetPages,
  }
})
