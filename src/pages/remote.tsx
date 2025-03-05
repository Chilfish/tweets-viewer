import { useEventListener, useFetch } from '@vueuse/core'
import { defineComponent, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Loading from '~/components/icon/Loading'
import { Post } from '~/components/posts/post'
import { Button } from '~/components/ui/button'
import { useUsersStore } from '~/stores/users'
import type { Tweet } from '~/types'

interface TweetWithUser extends Tweet {
  name: string
  screenName: string
}

export default defineComponent({
  name: 'Remote',
  setup() {
    const usersStore = useUsersStore()
    const { url, reverse } = useRoute().query as {
      url: string
      reverse: string
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
    ).json<TweetWithUser[]>()

    const page = ref(0)
    const pageSize = 16
    const offset = 100
    const pagedTweets = ref<TweetWithUser[]>([])
    const noMore = ref(false)

    function loadMore() {
      if (!data.value?.length) return

      const start = page.value * pageSize
      const end = start + pageSize
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      const sliced = [...data.value!].slice(start, end)
      noMore.value = sliced.length < pageSize

      pagedTweets.value = [...pagedTweets.value, ...sliced]
      page.value += 1
    }

    useEventListener('scroll', () => {
      if (
        window.scrollY + window.innerHeight >=
        document.body.offsetHeight - offset
      )
        loadMore()
    })
    watch(isFinished, (finished) => {
      if (!finished) return

      if (reverse) data.value?.reverse()

      loadMore()
    })

    return () => (
      <>
        <section class='flex flex-col gap-3'>
          {pagedTweets.value.map((tweet) => (
            <Post key={tweet.id} tweet={tweet} user={usersStore.curUser} />
          ))}
        </section>

        <Loading loading={isFetching.value} />

        {!noMore.value && (
          <Button class='m-4 p-2' size='lg' variant='ghost' onClick={loadMore}>
            加载更多
          </Button>
        )}
      </>
    )
  },
})
