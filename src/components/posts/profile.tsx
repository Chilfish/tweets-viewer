import { defineComponent } from 'vue'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { CardHeader } from '../ui/card'
import { useTweetStore } from '~/stores/tweets'
import { proxyUrl } from '~/constant'

export const PostProfile = defineComponent({
  props: {
    time: {
      type: String,
      required: true,
    },
  },
  setup({ time }) {
    const user = useTweetStore().user!

    return () => (
      <CardHeader class="flex flex-row items-center gap-2 pb-1">
        <Avatar size="sm">
          <AvatarImage
            alt={`User avatar for ${user.name}`}
            src={proxyUrl + user.avatar_url}
          />
          <AvatarFallback>{user.name}</AvatarFallback>
        </Avatar>
        <div class="flex flex-wrap items-center gap-2">
          <p class="text-3.5 font-semibold">
            {user.screen_name}
          </p>
          <a
            class="text-3.2 text-muted-foreground hover:underline"
            href={`https://twitter.com/${user.name}`}
            target="_blank"
          >
            @
            {user.name}
          </a>
          <span>·</span>
          <time
            class="text-3.2 text-muted-foreground"
          >
            {time}
          </time>
        </div>
      </CardHeader>
    )
  },
})
