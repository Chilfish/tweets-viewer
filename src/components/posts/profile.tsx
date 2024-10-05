import { defineComponent } from 'vue'
import { proxyUrl } from '~/constant'
import { tweetConfig, useTweetStore } from '~/stores/tweets'
import { avatarUrl } from '~/utils'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { CardHeader } from '../ui/card'

export const PostProfile = defineComponent({
  props: {
    time: {
      type: String,
      required: true,
    },
  },
  setup({ time }) {
    const username = useTweetStore().user
    const user = tweetConfig.value.find(c => c.name === `data-${username}`)

    return () => (
      <CardHeader class="flex flex-row items-center gap-2 pb-1">
        <Avatar size="sm">
          <AvatarImage
            alt={`User avatar for ${user?.screen_name}`}
            src={proxyUrl + avatarUrl(username)}
          />
          <AvatarFallback>{user?.screen_name}</AvatarFallback>
        </Avatar>
        <div class="flex flex-wrap items-center gap-2">
          <p class="text-3.5 font-semibold">
            {user?.screen_name}
          </p>
          <a
            class="text-3.2 text-muted-foreground hover:underline"
            href={`https://twitter.com/${username}`}
            target="_blank"
          >
            @
            {username}
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
