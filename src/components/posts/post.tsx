import { ExternalLink, HeartIcon, MessageCircle, Repeat2 } from 'lucide-vue-next'
import { defineComponent } from 'vue'
import { Image } from '../Image'
import { PostProfile } from './profile'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardFooter } from '~/components/ui/card'
import type { Tweet } from '~/types/tweets'

const PostContent = defineComponent({
  setup() {
    return () => (
      <CardContent class="pb-2 space-y-2">
        <p>Just had an amazing day at the beach! 🏖️ #SummerVibes</p>
        <div class="grid grid-cols-2 gap-2">
          <Image
            alt="Beach"
            src="https://github.com/Chilfish.png?ts="
          />
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
    link: String,
  },
  setup({ comment, retweet, like, link }) {
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
      <Card class="mx-auto">
        <PostProfile />
        <PostContent />
        <PostActions />
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
        <PostProfile />

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
