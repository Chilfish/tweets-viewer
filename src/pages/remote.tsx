import { useFetch } from '@vueuse/core'
import { computed, defineComponent, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Loading from '~/components/icon/Loading'
import { Post } from '~/components/posts/post'
import { Button } from '~/components/ui/button'
import type { Tweet, UserInfo } from '~/types'

interface TweetWithUser {
  user: UserInfo
  tweets: Tweet[]
}

export default defineComponent({
  name: 'Remote',
  setup() {
    const route = useRoute()
    let { url, reverse } = route.query as {
      url: string
      reverse: string
    }
    if (url.startsWith('/')) {
      url = document.location.origin + url
    }

    const { data, isFinished, isFetching } = useFetch(
      url,
      {
        mode: 'cors',
        method: 'GET',
      },
      {
        initialData: [],
      },
    ).json<TweetWithUser>()

    const page = ref(0)
    const pageSize = 30
    const pagedTweets = ref<Tweet[]>([])
    const searchResult = ref<Tweet[]>([])
    const user = computed(() => data.value?.user || ({} as UserInfo))
    const tweets = computed(() => data.value?.tweets || [])
    const noMore = ref(false)

    function loadTweets() {
      const start = page.value * pageSize
      const end = start + pageSize
      const loadFrom = route.query.q ? searchResult.value : tweets.value
      const sliced = loadFrom.slice(start, end)

      noMore.value = sliced.length < pageSize

      pagedTweets.value = [...pagedTweets.value, ...sliced]
      page.value += 1
    }

    watch(isFinished, (finished) => {
      if (!finished) return

      if (reverse) tweets.value.reverse()

      loadTweets()
    })

    function searchTweets(query: string) {
      console.log('searching for:', query)
      page.value = 0
      if (query) {
        searchResult.value = tweets.value.filter((tweet) =>
          tweet.fullText
            .toLocaleLowerCase()
            .includes(query.toLocaleLowerCase()),
        )
      } else {
        searchResult.value = []
      }
      pagedTweets.value = []
      loadTweets()
    }

    watch([() => route.query.q, () => tweets.value], () => {
      if (!tweets.value?.length) return
      searchTweets((route.query.q as string).trim() || '')
    })

    return () => (
      <>
        <section class='flex flex-col gap-3'>
          {pagedTweets.value.map((tweet) => (
            <Post
              key={`${tweet.tweetId}-${page.value}`}
              tweet={tweet}
              user={user.value}
            />
          ))}
        </section>

        <Loading loading={isFetching.value} />

        {!noMore.value && (
          <Button
            class='m-4 p-2'
            size='lg'
            variant='ghost'
            onClick={loadTweets}
          >
            加载更多
          </Button>
        )}
      </>
    )
  },
})
