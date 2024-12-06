import type { Tweet } from '@tweets-viewer/core'
import Loading from '@tweets-viewer/components/icon/Loading'
import { Post } from '@tweets-viewer/components/posts/post'
import { Button } from '@tweets-viewer/components/ui/button'
import { useEventListener, useFetch } from '@vueuse/core'
import { defineComponent, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

interface TweetWithUser extends Tweet {
  name: string
  screen_name: string
}

export default defineComponent({
  name: 'Remote',
  setup() {
    const { url, reverse } = useRoute().query as { url: string, reverse: string }
    const { data, isFinished, isFetching } = useFetch(url, {
      mode: 'cors',
      method: 'GET',
    }, {
      initialData: [],
    }).json<TweetWithUser[]>()

    const page = ref(0)
    const pageSize = 16
    const offset = 100
    const pagedTweets = ref<TweetWithUser[]>([])
    const noMore = ref(false)

    function loadMore() {
      if (!data.value?.length)
        return

      const start = page.value * pageSize
      const end = start + pageSize
      const sliced = [...data.value!].slice(start, end)
      noMore.value = sliced.length < pageSize

      pagedTweets.value = [...pagedTweets.value, ...sliced]
      page.value += 1
    }

    useEventListener('scroll', () => {
      if (window.scrollY + window.innerHeight >= document.body.offsetHeight - offset)
        loadMore()
    })
    watch(isFinished, (finished) => {
      if (!finished)
        return

      if (reverse)
        data.value!.reverse()

      loadMore()
    })

    return () => (
      <>
        <section
          class="flex flex-col gap-3"
        >
          {pagedTweets.value.map(tweet => (
            <Post
              key={tweet.id}
              tweet={tweet}
              user={{
                name: tweet.name,
                screen_name: tweet.screen_name,
              }}
            />
          ))}
        </section>

        <Loading loading={isFetching.value} />

        {!noMore.value && (
          <Button
            class="m-4 p-2"
            size="lg"
            variant="ghost"
            onClick={loadMore}
          >
            加载更多
          </Button>
        )}
      </>
    )
  },
})
