import { useDateFormat, useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRetryFetch } from '~/composables'
import { staticUrl } from '~/constant'
import { TweetService } from '~/db'
import type {
  DataVersion,
  Tweet,
  User,
  VersionKey,
} from '~/types/tweets'
import { usernameFromUrl } from '~/utils'

interface TweetStore {
  versions: DataVersion
  tweetRange: {
    start: number
    end: number
  }
}

export const useTweetStore = defineStore('tweets', () => {
  const user = ref<User | null>(null)
  const isInit = ref(false)

  const router = useRouter()
  const route = useRoute()

  const tweetService = new TweetService(usernameFromUrl())

  const tweetStore = useStorage<TweetStore>('tweetStore', {
    versions: {},
    tweetRange: {
      start: Date.now(),
      end: Date.now(),
    },
  })

  const pageState = reactive({
    page: 0,
    pageSize: 10,
  })

  const datePagination = reactive({
    page: 0,
    pageSize: 10,
  })

  const searchState = reactive({
    text: route.query.q as string,
    page: 0,
    pageSize: 10,
  })

  watch(() => route.params, async ({ name: newName }) => {
    if (!newName || newName === user.value?.name)
      return
    console.log('name changed', newName)

    resetPages()
    tweetService.setUid(newName as string)
    user.value = await tweetService.getUser()
  })

  function resetPages() {
    pageState.page = 0
    datePagination.page = 0
    searchState.page = 0
  }

  function checkVersion(version: DataVersion, name: string) {
    const oldVersions = tweetStore.value.versions
    const key: VersionKey = `data-${name}`

    if (oldVersions[key] === version[key]) {
      return false
    }

    tweetStore.value.versions[key] = version[key]

    return true
  }

  async function initTweets(name: string) {
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

    if (!checkVersion(versions, name)) {
      console.log('No new data')
      isInit.value = true

      const curUser = await tweetService.getUser()
      user.value = curUser

      // if (route.params.name !== curUser.name) {
      //   router.push(`/@${curUser.name}`)
      // }

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
    const tweets = tweetJson.tweets.map(tweet => ({ ...tweet, uid: curUser.name }))

    await tweetService.putData(curUser, tweets)

    getTweetsRange(tweets)
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
    return tweetStore.value.tweetRange
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
      .pagedTweets(pageState.page, pageState.pageSize)
      .toArray()

    pageState.page++

    return tweets
  }

  function getTweetsRange(tweets: Tweet[]) {
    // 新推文在前
    const end = new Date(tweets[tweets.length - 1].created_at)
    const start = new Date(tweets[0].created_at)

    tweetStore.value.tweetRange = {
      start: start.getTime(),
      end: end.getTime(),
    }

    // console.log('Tweets range', { start, end })
    return tweetStore.value.tweetRange
  }

  let lastKeyword = ''
  async function search() {
    const keyword = route.query.q as string

    if (keyword !== lastKeyword) {
      searchState.page = 0
      lastKeyword = keyword
    }

    const { start, end } = parseDateRange()
    const { page, pageSize } = searchState

    const res = await tweetService.searchTweets(
      keyword,
    )
      .offset(page * pageSize)
      .limit(pageSize)
      .filter((t) => {
        const date = new Date(t.created_at).getTime()
        return date >= start && date <= end
      })
      .toArray()

    console.log('searchTweets', searchState, res.length)

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
    const { page, pageSize } = datePagination

    const data = await tweetService.tweetsByDateRange(
      tweetService.pagedTweets(page, pageSize),
      start,
      end,
    )
    console.log('getTweetsByDateRange', { start, end, page, pageSize }, data.length)

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
    tweetStore,
    tweetService,
    initTweets,
    getTweets,
    search,
    getTweetsByDateRange,
    resetPages,
  }
})
