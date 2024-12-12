import type { QueryKey } from '@tanstack/vue-query'
import type { Tweet } from '~/types'
import { useDateFormat } from '@vueuse/core'
import { useRouteQuery } from '@vueuse/router'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ServerTweetService } from '~/services/server'
import { useUsersStore } from './users'

export interface TweetsReturn {
  queryFn: () => Promise<Tweet[]>
  queryKey: QueryKey
}

export const useTweetStore = defineStore('tweets', () => {
  const usersStore = useUsersStore()

  const router = useRouter()
  const route = useRoute()

  const page = useRouteQuery<number>('page', 0)
  const searchText = useRouteQuery<string>('q')

  const isLoading = ref(false)
  const isReverse = ref(true)

  const curUser = computed(() => usersStore.curUser)
  const screenName = computed(() => curUser.value.screenName)
  const tweetRange = computed(() => ({
    start: curUser.value.tweetStart.getTime(),
    end: curUser.value.tweetEnd.getTime(),
  }))

  const tweetService = new ServerTweetService(screenName.value)

  watch(page, (val) => {
    router.push({
      query: {
        ...route.query,
        page: val,
      },
    })
  })

  watch(() => route.params, async ({ name: newName }) => {
    if (!newName || newName === usersStore.curUser?.screenName)
      return

    tweetService.changeName(newName as string)
    resetPages()
  })

  watch(isReverse, (val) => {
    tweetService.isReverse = val
  })

  function resetPages() {
    page.value = 0
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
    searchText,
    tweetService,
    tweetRange,
    isReverse,
    isLoading,
    screenName,
    getTweets,
    search,
    getTweetsByDateRange,
    resetPages,
    parseDateRange,
    nextPage,
  }
})
