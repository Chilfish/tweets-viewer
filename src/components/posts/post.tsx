import { defineComponent } from 'vue'
import { PostProfile } from './profile'
import { PostText } from './text'
import PostMedia from './media.vue'
import { Link } from './link'
import { PostActions } from './actions'
import { Card, CardContent } from '~/components/ui/card'
import type { Tweet } from '~/types/tweets'

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
  setup({ text, media, quoutId }) {
    return () => (
      <CardContent class="pb-2 space-y-2">
        <PostText text={text} />
        <PostMedia media={media} />
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
    return () => (
      <Card class="mx-auto min-w-full">
        <PostProfile time={tweet.created_at} />
        <PostContent
          text={tweet.full_text}
          quoutId={tweet.quoted_status}
          media={tweet.media}
        />
        <PostActions
          comment={tweet.reply_count}
          retweet={tweet.retweet_count + tweet.quote_count}
          like={tweet.favorite_count}
          view={tweet.views_count}
          link={`https://twitter.com/i/status/${tweet.id}`}
        />
      </Card>
    )
  },
})
