import type { Tweet, TweetMedia } from '~/types'
import { defineComponent, ref } from 'vue'
import { Card, CardContent } from '~/components/ui/card'
import { useTweetStore } from '~/stores/tweets'
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
    quoutId: String,
    media: {
      type: Array as () => TweetMedia[],
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
    user: {
      type: Object as () => {
        name: string
        screenName: string
      },
    },
  },
  setup({ tweet, user }) {
    const curUser = useTweetStore().curConfig
    const username = user?.name || curUser.username || 'username'
    const screenName = user?.screenName || curUser.name.replace('data-', '') || 'i/web'

    const url = `https://twitter.com/${screenName}/status/${tweet.id}`
    const link = ref(url)

    return () => (
      <Card class="mx-auto min-w-full">
        <PostProfile
          time={new Date(tweet.createdAt)}
          name={username}
          screenName={screenName}
        />
        <PostContent
          text={tweet.fullText}
          quoutId={tweet.quotedStatus?.tweet.id}
          media={tweet.media}
          onImgError={() => {
            link.value = `https://web.archive.org/web/${url}`
          }}
        />
        <PostActions
          comment={tweet.replyCount}
          retweet={tweet.retweetCount + tweet.quoteCount}
          like={tweet.favoriteCount}
          view={tweet.viewsCount}
          link={link.value}
        />
      </Card>
    )
  },
})
