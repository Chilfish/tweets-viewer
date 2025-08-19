import { formatDate } from '@tweets-viewer/shared'
import { useRouteParams } from '@vueuse/router'
import { Repeat2 } from 'lucide-vue-next'
import { computed, defineComponent, ref } from 'vue'
import { Card, CardContent } from '~/components/ui/card'
import type { ReTweet, Tweet, TweetMedia, UserInfo } from '~/types'
import { tweetUrl } from '~/utils'
import { PostActions } from './actions'
import PostMedia from './media.vue'
import { PostProfile } from './profile'
import { PostText } from './text'

const PostContent = defineComponent({
  name: 'PostContent',
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

const RetweetCard = defineComponent({
  name: 'RetweetCard',
  props: {
    retweet: {
      type: Object as () => ReTweet,
      required: true,
    },
    originalUser: {
      type: Object as () => UserInfo,
      required: true,
    },
    retweetAt: {
      type: Date,
      required: true,
    },
  },
  setup({ retweet, originalUser, retweetAt }) {
    const { user, tweet } = retweet
    const url = tweetUrl(originalUser.screenName, tweet.tweetId)
    const link = ref(url)

    return () => (
      <Card class='mx-auto w-full'>
        <div class='flex items-center gap-2 p-3'>
          <Repeat2 class='h-4 w-4' />
          <a
            class='text-sm hover:underline'
            href={tweetUrl(originalUser.screenName, tweet.tweetId)}
            target='_blank'
            rel='noopener noreferrer'
          >
            {`@${originalUser.name} 在 ${formatDate(retweetAt, { timezone: 'tokyo' })} 转推了`}
          </a>
        </div>

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

const PostCard = defineComponent({
  name: 'PostCard',
  props: {
    tweet: {
      type: Object as () => Tweet,
      required: true,
    },
    user: {
      type: Object as () => UserInfo,
      required: true,
    },
    showActions: {
      type: Boolean,
      default: true,
    },
  },
  setup({ tweet, user, showActions }) {
    const curUserName = useRouteParams<string>('name', '')
    const url = tweetUrl(user.screenName, tweet.tweetId)
    const link = ref(url)
    const isQuote = tweet.quotedStatus !== null
    const isMainTweet = computed(
      () => curUserName.value === '' || curUserName.value === user.screenName,
    )

    return () => (
      <Card class='mx-auto py-2 w-full transition-all duration-200 first:rounded-t-xl last:rounded-b-xl hover:bg-card/80'>
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

        {isQuote && tweet.quotedStatus && (
          <div class='mx-4 mb-4 overflow-hidden border rounded-xl bg-background/50'>
            <PostCard
              tweet={tweet.quotedStatus.tweet}
              user={tweet.quotedStatus.user}
              showActions={false}
              class='shadow-none border-0! bg-background'
            />
          </div>
        )}

        {isMainTweet.value && showActions && (
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
  name: 'Post',
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
      <>
        {isRetweet && tweet.retweetedStatus ? (
          <RetweetCard
            retweet={tweet.retweetedStatus}
            retweetAt={tweet.createdAt}
            originalUser={user}
          />
        ) : (
          <PostCard tweet={tweet} user={user} />
        )}
      </>
    )
  },
})
