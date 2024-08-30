import { ChartColumn, ExternalLink, HeartIcon, MessageCircle, Repeat2 } from 'lucide-vue-next'
import { defineComponent } from 'vue'
import { Image } from '../Image'
import { PostProfile } from './profile'
import { PostText } from './text'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardFooter } from '~/components/ui/card'
import type { Tweet } from '~/types/tweets'

function isVideo(url: string) {
  return url.startsWith('https://video.twimg.com/')
}

const PostContent = defineComponent({
  props: {
    text: {
      type: String,
      required: true,
    },
    media: {
      type: Array as () => string[],
      default: () => [],
    },
  },
  setup({ text, media }) {
    return () => (
      <CardContent class="pb-2 space-y-2">
        <PostText text={text} />
        <div class="grid grid-cols-2 gap-2">
          {media.map(url => (
            isVideo(url)
              ? <video controls src={url} />
              : <Image src={url} />

          ))}
        </div>
      </CardContent>
    )
  },
})

const PostActions = defineComponent({
  props: {
    comment: Number,
    retweet: Number,
    like: Number,
    view: Number,
    link: String,
  },
  setup({ comment, retweet, like, view, link }) {
    return () => (
      <CardFooter class="flex justify-between pb-2">
        <Button variant="ghost" size="sm" class="text-muted-foreground">
          <MessageCircle class="mr-2 h-4 w-4" />
          {comment || 0}
        </Button>
        <Button variant="ghost" size="sm" class="text-muted-foreground">
          <Repeat2 class="mr-2 h-4 w-4" />
          {retweet || 0}
        </Button>
        <Button variant="ghost" size="sm" class="text-muted-foreground">
          <HeartIcon class="mr-2 h-4 w-4" />
          {like || 0}
        </Button>
        <Button variant="ghost" size="sm" class="text-muted-foreground">
          <ChartColumn class="mr-2 h-4 w-4" />
          {view || 0}
        </Button>

        <Button
          title="Open in new tab"
          variant="ghost"
          size="sm"
          class="text-muted-foreground"
          onClick={() => {
            if (!link)
              return
            window.open(link, '_blank')
          }}
        >
          <ExternalLink class="h-4 w-4" />
        </Button>
      </CardFooter>
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

export const QuoutedPost = defineComponent({
  props: {
    tweet: {
      type: Object as () => Tweet,
      required: true,
    },
  },
  setup({ tweet }) {
    return () => (
      <Card class="mx-auto">
        <PostProfile time={tweet.created_at} />

        <CardContent class="pb-2">
          <p class="py-2">
            Hello!
          </p>
          <Post tweet={tweet} />
        </CardContent>
        <PostActions />
      </Card>
    )
  },
})
