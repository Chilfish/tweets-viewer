import type { Tweet, TweetMedia, UserInfo } from '~/types'
import { useRouteParams } from '@vueuse/router'
import { Repeat2 } from 'lucide-vue-next'
import { computed, defineComponent, ref } from 'vue'
import { Card, CardContent } from '~/components/ui/card'
import { fallbackUser } from '~/constant'
import { tweetUrl } from '~/utils'
import { formatDate } from '~/utils/date'
import { PostActions } from './actions'
import PostMedia from './media.vue'
import { PostProfile } from './profile'
import { PostText } from './text'

const PostContent = defineComponent({
  props: {
    text: {
      type: String,
      required: true,
    },
    media: {
      type: Array as () => TweetMedia[],
      default: () => [],
    },
  },
  emits: ['imgError'],
  setup({ text, media }, { emit }) {
    return () => (
      <CardContent class="pb-2">
        <PostText text={text} />
        <PostMedia
          onError={() => emit('imgError')}
          media={media.filter(Boolean)}
        />
      </CardContent>
    )
  },
})

const PostCard = defineComponent({
  props: {
    tweet: {
      type: Object as () => Tweet,
      required: true,
    },
    user: {
      type: Object as () => UserInfo,
      required: true,
    },
    retweet: {
      type: Object as () => {
        name: string
        createdAt: Date
        id: string
      },
    },
  },
  setup({ tweet, user, retweet }) {
    const curUserName = useRouteParams<string>('name', fallbackUser)
    const url = tweetUrl(user.screenName, tweet.tweetId)
    const link = ref(url)
    const isQuote = tweet.quotedStatus !== null
    const isMainTweet = computed(() => curUserName.value === user.screenName || !!retweet)

    return () => (
      <Card
        class="mx-auto w-full pt-2"
      >
        {retweet && (
          <div
            class="flex cursor-pointer items-center px-6 text-gray-600 space-x-1.5 dark:text-gray-400 hover:text-main"
          >
            <Repeat2 />
            <a
              class="text-sm"
              href={tweetUrl(curUserName.value, retweet.id)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {`@${retweet.name} 在 ${formatDate(retweet.createdAt, { timezone: 'tokyo' })} 转推了`}
            </a>
          </div>
        )}

        <PostProfile
          time={new Date(tweet.createdAt)}
          name={user.name}
          screenName={user.screenName}
        />
        <PostContent
          text={tweet.fullText}
          media={tweet.media}
          onImgError={() => {
            link.value = `https://web.archive.org/web/${url}`
          }}
        />

        {isQuote && (
          <PostCard
            tweet={tweet.quotedStatus!.tweet}
            user={tweet.quotedStatus!.user}
            class="mx-4 mb-2 shadow-none w-90%!"
          />
        )}

        { isMainTweet.value && (
          <PostActions
            comment={tweet.replyCount}
            retweet={tweet.retweetCount + tweet.quoteCount}
            like={tweet.favoriteCount}
            view={tweet.viewsCount}
            link={link.value}
          />
        )}
      </Card>
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
      type: Object as () => UserInfo,
      required: true,
    },
  },
  setup({ tweet, user }) {
    const isRetweet = tweet.retweetedStatus !== null

    return () => (
      <PostCard
        tweet={isRetweet ? tweet.retweetedStatus!.tweet : tweet}
        user={isRetweet ? tweet.retweetedStatus!.user : user}
        retweet={isRetweet
          ? {
              name: user.name,
              createdAt: tweet.createdAt,
              id: tweet.tweetId,
            }
          : undefined}
      />
    )
  },
})
