import { defineComponent } from 'vue'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { CardHeader } from '../ui/card'

export const PostProfile = defineComponent({
  setup() {
    return () => (
      <CardHeader class="flex flex-row items-center gap-2 pb-1">
        <Avatar>
          <AvatarImage alt="User avatar" src="/placeholder-avatar.jpg" />
          <AvatarFallback>J2D</AvatarFallback>
        </Avatar>
        <div class="flex items-center gap-2">
          <p class="font-semibold">Jane Doe</p>
          <p class="text-sm text-muted-foreground">@janedoe</p>
          <time
            class="text-sm text-muted-foreground hover:underline"
          >
            2021-08-01 12:00
          </time>
        </div>
      </CardHeader>
    )
  },
})
