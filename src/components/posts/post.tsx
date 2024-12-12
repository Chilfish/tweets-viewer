import type { Tweet, TweetMedia, UserInfo } from '~/types'
import { Repeat2 } from 'lucide-vue-next'
import { defineComponent, ref } from 'vue'
import { Card, CardContent } from '~/components/ui/card'
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
  },
  setup({ tweet, user }) {
    const url = `https://twitter.com/${user.screenName}/status/${tweet.id}`
    const link = ref(url)

    return () => (
      <Card class="mx-auto min-w-full">
        <PostProfile
          time={new Date(tweet.createdAt)}
          name={user.name}
          screenName={user.screenName}
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
      <div class="w-full">
        {isRetweet
          ? (
              <>
                <div
                  class="flex items-center text-gray-600 space-x-1.5 dark:text-gray-400"
                >
                  <Repeat2 />
                  <span class="text-sm">
                    {user.name}
                    {' '}
                    转推了
                  </span>
                </div>
                <PostCard
                  tweet={tweet.retweetedStatus!.tweet}
                  user={tweet.retweetedStatus!.user}
                />
              </>
            )
          : (
              <PostCard
                tweet={tweet}
                user={user}
              />
            )}
      </div>
    )
  },
})
