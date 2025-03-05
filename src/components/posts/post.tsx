import { useRouteParams } from '@vueuse/router'
import { Repeat2 } from 'lucide-vue-next'
import { computed, defineComponent, ref } from 'vue'
import { Card, CardContent } from '~/components/ui/card'
import { fallbackUser } from '~/constant'
import type { Tweet, TweetMedia, UserInfo } from '~/types'
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
      <CardContent class='px-4 pb-2'>
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
    const isMainTweet = computed(
      () => curUserName.value === user.screenName || !!retweet,
    )

    return () => (
      <Card class='mx-auto w-full border-b-0 transition-all duration-200 last:border-b first:rounded-t-xl last:rounded-b-xl hover:bg-card/80'>
        {retweet && (
          <div class='flex cursor-pointer items-center gap-2 px-6 pt-3 text-gray-600 transition-colors space-x-1.5 dark:text-gray-400 hover:text-primary'>
            <Repeat2 class='h-4 w-4' />
            <a
              class='text-sm hover:underline'
              href={tweetUrl(curUserName.value, retweet.id)}
              target='_blank'
              rel='noopener noreferrer'
            >
              {`@${retweet.name} 在 ${formatDate(retweet.createdAt, { timezone: 'tokyo' })} 转推了`}
            </a>
          </div>
        )}

        <PostProfile
          time={new Date(tweet.createdAt)}
          name={user.name}
          screenName={user.screenName}
          avatar={user.avatarUrl}
        />
        <PostContent
          text={tweet.fullText}
          media={tweet.media}
          onImgError={() => {
            link.value = `https://web.archive.org/web/${url}`
          }}
        />

        {isQuote && (
          <div class='mx-4 mb-4 overflow-hidden border rounded-xl bg-background/50'>
            <PostCard
              tweet={tweet.quotedStatus?.tweet}
              user={tweet.quotedStatus?.user}
              class='shadow-none border-0!'
            />
          </div>
        )}

        {isMainTweet.value && (
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
        tweet={isRetweet ? tweet.retweetedStatus?.tweet : tweet}
        user={isRetweet ? tweet.retweetedStatus?.user : user}
        retweet={
          isRetweet
            ? {
                name: user.name,
                createdAt: tweet.createdAt,
                id: tweet.tweetId,
              }
            : undefined
        }
      />
    )
  },
})
