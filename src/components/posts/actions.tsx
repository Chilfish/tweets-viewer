import { ExternalLink, HeartIcon, MessageCircle, Repeat2 } from 'lucide-vue-next'
import { defineComponent } from 'vue'
import { Button } from '../ui/button'
import { CardFooter } from '../ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

const ActionButton = defineComponent({
  props: {
    count: Number,
  },
  setup({ count }, { slots }) {
    return () => (
      <Button
        variant="ghost"
        size="sm"
        class="h-9 rounded-full px-3 transition-colors duration-200 center gap-2"
      >
        {slots.default?.()}
        <span class="text-sm font-medium text-muted-foreground">
          {count?.toLocaleString() || 0}
        </span>
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
      <CardFooter class="flex justify-between px-2 py-1">
        <ActionButton
          class="group hover:(bg-#e1eef6/80 text-#1d9bf0)"
          count={comment}
        >
          <MessageCircle class="h-5 w-5 transition-transform group-hover:scale-110" />
        </ActionButton>

        <ActionButton
          class="group hover:(bg-#def1eb/80 text-#00ba7c)"
          count={retweet}
        >
          <Repeat2 class="h-5 w-5 transition-transform group-hover:scale-110" />
        </ActionButton>

        <ActionButton
          class="group hover:(bg-#f7e0eb/80 text-#f9127e)"
          count={like}
        >
          <HeartIcon class="h-5 w-5 transition-transform group-hover:scale-110" />
        </ActionButton>

        {/* <ActionButton
          class="hover:bg-#e1eef6 hover:text-#1d9bf0"
          count={view}
        >
          <ChartColumn class="mr-2 h-4 w-4" />
        </ActionButton> */}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              as="a"
              href={props.link}
              target="_blank"
              rel="noopener noreferrer"
              variant="ghost"
              size="sm"
              class="h-9 w-9 rounded-full p-0 transition-colors duration-200 hover:bg-#e1eef6/80 hover:text-#1d9bf0"
            >
              <ExternalLink class="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>在新标签页中打开</p>
          </TooltipContent>
        </Tooltip>
      </CardFooter>
    )
  },
})
