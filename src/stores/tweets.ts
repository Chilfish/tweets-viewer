import type { QueryKey } from '@tanstack/vue-query'
import { useDateFormat } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ServerTweetService } from '~/services/server'
import type { Tweet } from '~/types'

export interface TweetsReturn {
  queryFn: () => Promise<Tweet[]>
  queryKey: QueryKey
}

export const useTweetStore = defineStore('tweets', () => {
  const router = useRouter()
  const route = useRoute()

  const page = computed(() => Number(route.query.page) || 0)

  const isLoading = ref(false)
  const isReverse = ref(route.query.new !== 'false')

  const screenName = computed(() => route.params.name as string)

  const tweetService = new ServerTweetService(screenName.value)

  watch(screenName, init, { immediate: true })

  watch(isReverse, (val) => {
    tweetService.isReverse = val
    router.push({
      query: {
        ...route.query,
        page: 0,
        new: val.toString(),
      },
    })
  })

  function init() {
    tweetService.isReverse = isReverse.value
    tweetService.changeName(screenName.value)
  }

  function parseDateRange() {
    const query = route.query
    if (query.from && query.to) {
      return {
        start: new Date(query.from as string).getTime(),
        end: new Date(query.to as string).getTime(),
      }
    }
    return {
      start: new Date().getTime(),
      end: new Date().getTime(),
    }
  }

  function search(): TweetsReturn {
    const keyword = route.query.q as string

    // const { start, end } = parseDateRange()
    return {
      queryFn: () =>
        tweetService.searchTweets(
          keyword,
          page.value,
          // start,
          // end,
        ),
      queryKey: ['tweets-search', page, keyword, isReverse],
    }
  }

  function getTweetsByDateRange(start?: number, end?: number): TweetsReturn {
    let { start: queryStart, end: queryEnd } = parseDateRange()
    if (start) queryStart = start
    if (end) queryEnd = end

    router.push({
      query: {
        ...route.query,
        q: undefined,
        from: useDateFormat(queryStart, 'YYYY-MM-DD').value,
        to: useDateFormat(queryEnd, 'YYYY-MM-DD').value,
      },
    })

    return {
      queryKey: [
        'tweets-date-range',
        screenName,
        queryStart,
        queryEnd,
        page,
        isReverse,
      ],
      queryFn: () =>
        tweetService.getByDateRange(queryStart, queryEnd, page.value),
    }
  }

  function getTweets(): TweetsReturn {
    return {
      queryKey: ['tweets-get', screenName, page, isReverse],
      queryFn: () => tweetService.getTweets(page.value),
    }
  }

  function nextPage() {
    router.push({
      query: {
        ...route.query,
        page: page.value + 1,
      },
    })
  }

  return {
    page,
    tweetService,
    isReverse,
    isLoading,
    screenName,
    getTweets,
    search,
    getTweetsByDateRange,
    parseDateRange,
    nextPage,
  }
})
