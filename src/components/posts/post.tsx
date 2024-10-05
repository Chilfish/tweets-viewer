import { defineComponent, ref } from 'vue'
import { Card, CardContent } from '~/components/ui/card'
import { useTweetStore } from '~/stores/tweets'
import type { Tweet } from '~/types/tweets'
import { PostActions } from './actions'
import { Link } from './link'
import PostMedia from './media.vue'
import { PostProfile } from './profile'
import { PostText } from './text'

const PostContent = defineComponent({
  props: {
    text: {
      type: String,
      required: true,
    },
    quoutId: String as () => Tweet['quoted_status'],
    media: {
      type: Array as () => string[],
      default: () => [],
    },
  },
  emits: ['imgError'],
  setup({ text, media, quoutId }, { emit }) {
    return () => (
      <CardContent class="pb-2">
        <PostText text={text} />
        <PostMedia
          onError={() => emit('imgError')}
          media={media.filter(Boolean)}
        />
        {quoutId && (
          <p
            class="rounded-lg bg-gray-100 p-2 px-3 text-3.5 dark:bg-gray-800"
          >
            这是一条转发推文，查看
            {Link(`https://x.com/i/status/${quoutId}`, '原文')}
          </p>
        )}
      </CardContent>
    )
  },
})

export const Post = defineComponent({
  props: {
    tweet: {
      type: Object as () => Tweet,
      required: true,
    },
  },
  setup({ tweet }) {
    const tweetStore = useTweetStore()
    const curUser = tweetStore.user || 'i/web'
    const url = `https://twitter.com/${curUser}/status/${tweet.id}`
    const link = ref(url)

    return () => (
      <Card class="mx-auto min-w-full">
        <PostProfile time={tweet.created_at} />
        <PostContent
          text={tweet.full_text}
          quoutId={tweet.quoted_status}
          media={tweet.media}
          onImgError={() => {
            link.value = `https://web.archive.org/web/${url}`
          }}
        />
        <PostActions
          comment={tweet.reply_count}
          retweet={tweet.retweet_count + tweet.quote_count}
          like={tweet.favorite_count}
          view={tweet.views_count}
          link={link.value}
        />
      </Card>
    )
  },
})
