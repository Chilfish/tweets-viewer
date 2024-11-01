import { defineComponent } from 'vue'
import { avatarUrl } from '~/utils'
import { formatDate } from '~/utils/date'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { CardHeader } from '../ui/card'

export const PostProfile = defineComponent({
  props: {
    time: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    screen_name: {
      type: String,
      required: true,
    },
  },
  setup({ time, name, screen_name }) {
    return () => (
      <CardHeader class="flex flex-row items-center gap-2 pb-1">
        <Avatar size="sm">
          <AvatarImage
            alt={`User avatar for ${screen_name}`}
            src={avatarUrl(screen_name)}
          />
          <AvatarFallback>{screen_name}</AvatarFallback>
        </Avatar>
        <div class="flex flex-wrap items-center gap-2">
          <p class="text-3.5 font-semibold">
            {name}
          </p>
          <a
            class="text-3.2 text-muted-foreground hover:underline"
            href={`https://twitter.com/${screen_name}`}
            target="_blank"
          >
            @
            {screen_name}
          </a>
          <span>·</span>
          <time
            class="text-3.2 text-muted-foreground"
            title="东京时间"
          >
            {formatDate(time, { timezone: 'tokyo' })}
          </time>
        </div>
      </CardHeader>
    )
  },
})
