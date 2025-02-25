import { defineComponent } from 'vue'
import { formatDate } from '~/utils/date'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { CardHeader } from '../ui/card'

export const PostProfile = defineComponent({
  props: {
    time: {
      type: Date,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    screenName: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      required: true,
    },
  },
  setup({ time, name, screenName, avatar }) {
    return () => (
      <CardHeader class="flex flex-row items-center gap-2 py-2">
        <Avatar size="sm">
          <AvatarImage
            alt={`User avatar for ${screenName}`}
            src={avatar}
          />
          <AvatarFallback>{screenName}</AvatarFallback>
        </Avatar>
        <div class="flex flex-wrap items-center">
          <p class="text-3.5 font-semibold">
            {name}
          </p>
          <a
            class="mx-2 text-3.2 text-muted-foreground hover:text-main hover:underline"
            href={`https://twitter.com/${screenName}`}
            target="_blank"
          >
            @
            {screenName}
          </a>
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
