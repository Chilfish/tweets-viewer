import { formatDate } from '@tweets-viewer/shared'
import { defineComponent } from 'vue'
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
      <CardHeader class='flex flex-row items-center gap-2 py-2'>
        <Avatar>
          <AvatarImage alt={`User avatar for ${screenName}`} src={avatar} />
          <AvatarFallback>{screenName}</AvatarFallback>
        </Avatar>
        <div class='flex flex-wrap items-center'>
          <span class='text-3.5 font-semibold truncate max-w-36 sm:max-w-fit'>
            {name}
          </span>
          <a
            class='mx-2 font-medium text-3.2 link text-muted-foreground truncate max-w-[150px]'
            href={`https://twitter.com/${screenName}`}
            target='_blank'
            rel='noreferrer'
          >
            @{screenName}
          </a>
          <time
            class='text-3.2 text-muted-foreground truncate'
            title='东京时间'
          >
            {formatDate(time, { timezone: 'tokyo' })}
          </time>
        </div>
      </CardHeader>
    )
  },
})
