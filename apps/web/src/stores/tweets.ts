import type { QueryKey } from '@tanstack/vue-query'
import type { Tweet } from '@tweets-viewer/core'
import { getSearch, usernameFromUrl } from '@tweets-viewer/core'
import { useDateFormat } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ServerTweetService } from '../services/server'
import { fetchVersion, tweetConfig } from './version'

export interface TweetsReturn {
  queryFn: () => Promise<Tweet[]>
  queryKey: QueryKey
}

export const useTweetStore = defineStore('tweets', () => {
  const screenName = ref('')
  const isInit = ref(false)

  const router = useRouter()
  const route = useRoute()

  const tweetService = new ServerTweetService(usernameFromUrl())
  const page = ref(Number.parseInt(getSearch('page')) || 0)
  watch(page, (val) => {
    router.push({
      query: {
        ...route.query,
        page: val,
      },
    })
  })
  const searchText = ref(route.query.q as string)

  watch(() => route.params, async ({ name: newName }) => {
    if (!newName || newName === screenName.value)
      return

    await initTweets(newName as string)
    resetPages()
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
        end: Date.now(),
      },
    },
  )

  function resetPages() {
    page.value = 0
  }

  async function initTweets(name?: string) {
    isInit.value = false

    if (!name)
      name = usernameFromUrl()
    tweetService.changeName(name)
    screenName.value = name

    await fetchVersion()
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

  function search(): TweetsReturn {
    const keyword = route.query.q as string

    // const { start, end } = parseDateRange()
    return {
      queryFn: () => tweetService.searchTweets(
        keyword,
        page.value,
        // start,
        // end,
      ),
      queryKey: ['tweets-search', page, keyword, isReverse],
    }
  }

  function getTweetsByDateRange(
    start?: number,
    end?: number,
  ): TweetsReturn {
    let { start: queryStart, end: queryEnd } = parseDateRange()
    if (start)
      queryStart = start
    if (end)
      queryEnd = end

    router.push({
      query: {
        ...route.query,
        q: undefined,
        from: useDateFormat(queryStart, 'YYYY-MM-DD').value,
        to: useDateFormat(queryEnd, 'YYYY-MM-DD').value,
      },
    })

    return {
      queryKey: ['tweets-date-range', screenName, queryStart, queryEnd, page, isReverse],
      queryFn: () => tweetService.getByDateRange(queryStart, queryEnd, page.value),
    }
  }

  function getTweets(): TweetsReturn {
    return {
      queryKey: ['tweets-get', screenName, page, isReverse],
      queryFn: () => tweetService.getTweets(page.value),
    }
  }

  function curUser() {
    return curConfig.value.name.replace('data-', '')
  }

  function nextPage() {
    page.value++

    router.push({
      query: {
        ...route.query,
        page: page.value,
      },
    })
  }

  return {
    page,
    isInit,
    searchText,
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
    parseDateRange,
    nextPage,
  }
})
