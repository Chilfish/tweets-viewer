import { ExternalLink, HeartIcon, MessageCircle, Repeat2 } from 'lucide-vue-next'
import { defineComponent } from 'vue'
import { Button } from '../ui/button'
import { CardFooter } from '../ui/card'

const ActionButton = defineComponent({
  props: {
    count: Number,
  },
  setup({ count }, { slots }) {
    return () => (
      <Button
        variant="ghost"
        size="sm"
        class="text-muted-foreground"
      >
        {slots.default?.()}
        {count || 0}
      </Button>
    )
  },
})

export const PostActions = defineComponent({
  props: {
    comment: Number,
    retweet: Number,
    like: Number,
    view: Number,
    link: String,
  },
  setup(props) {
    const { comment, retweet, like, view } = props
    return () => (
      <CardFooter class="flex justify-between pb-2 lg:pr-30">
        <ActionButton
          class="hover:bg-#e1eef6 hover:text-#1d9bf0"
          count={comment}
        >
          <MessageCircle class="mr-2 h-4 w-4" />
        </ActionButton>

        <ActionButton
          class="hover:bg-#def1eb hover:text-#00ba7c"
          count={retweet}
        >
          <Repeat2 class="mr-2 h-4 w-4" />
        </ActionButton>

        <ActionButton
          class="hover:bg-#f7e0eb hover:text-#f9127e"
          count={like}
        >
          <HeartIcon class="mr-2 h-4 w-4" />
        </ActionButton>

        {/* <ActionButton
          class="hover:bg-#e1eef6 hover:text-#1d9bf0"
          count={view}
        >
          <ChartColumn class="mr-2 h-4 w-4" />
        </ActionButton> */}

        <Button
          as="a"
          // @ts-expect-error as is fine
          href={props.link}
          target="_blank"
          rel="noopener noreferrer"
          title="Open in new tab"
          variant="ghost"
          size="sm"
          class="text-muted-foreground"
        >
          <ExternalLink class="h-4 w-4" />
        </Button>
      </CardFooter>
    )
  },
})
