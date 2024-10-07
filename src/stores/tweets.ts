import { useDateFormat } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRetryFetch } from '~/composables'
import { staticUrl } from '~/constant'
import { TweetService } from '~/db'
import type { Tweet } from '~/types/tweets'
import { usernameFromUrl } from '~/utils'
import { fetchVersion, isSameVersion, tweetConfig } from './version'

export const useTweetStore = defineStore('tweets', () => {
  const screenName = ref('')
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
    if (!newName || newName === screenName.value)
      return

    await initTweets(newName as string)
  })

  const isReverse = ref(tweetService.isReverse)
  watch(isReverse, (val) => {
    tweetService.isReverse = val
  })

  const curConfig = computed(() => tweetConfig.value.find(c => c.name === `data-${screenName.value}`)
    || {
      name: `data-${screenName.value}`,
      version: '0',
      username: screenName.value,
      tweetRange: {
        start: 0,
        end: 0,
      },
    },
  )

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
    screenName.value = name

    await fetchVersion()

    if (isSameVersion(name)) {
      console.log('No new data')
      screenName.value = name
      isInit.value = true
      return
    }

    const fetcher = useRetryFetch((err) => {
      console.error(err)
      // router.push('/')
      isInit.value = true
    })

    const tweetJson = await fetcher<Tweet[]>(`${staticUrl}/tweet/data-${name}.json`)
    if (!tweetJson) {
      return
    }

    const tweets = tweetJson.map(tweet => ({ ...tweet, uid: name }))

    console.log('fetch tweets', tweets.length)
    await tweetService.putData(tweets)
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

  function curUser() {
    return curConfig.value.name.replace('data-', '')
  }

  return {
    isInit,
    datePagination,
    searchState,
    tweetService,
    isReverse,
    curConfig,
    fetchVersion,
    initTweets,
    getTweets,
    search,
    getTweetsByDateRange,
    resetPages,
    curUser,
  }
})
