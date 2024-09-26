<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { proxyUrl } from '~/constant'
import { useTweetStore } from '~/stores/tweets'

interface UserInfo {
  name: string
  screen_name: string
  avatar_url: string
}

const tweetStore = useTweetStore()
const users = ref<UserInfo[]>([])

onBeforeMount(async () => {
  users.value = await tweetStore.tweetService.getUsers()

  const otherUsers = Object.keys(tweetStore.tweetConfig.versions)
    .map((key) => {
      const name = key.split('-')[1]
      return {
        name,
        screen_name: name,
        avatar_url: `https://unavatar.io/twitter/${name}`,
      }
    })

  // unique by name
  users.value = [
    ...users.value,
    ...otherUsers.filter(user => !users.value.some(u => u.name === user.name)),
  ]
})
</script>

<template>
  <ul
    class="flex flex-col"
  >
    <p class="pb-2">
      切换用户，或是回
      <RouterLink to="/" class="link">
        首页
      </RouterLink>
    </p>

    <RouterLink
      v-for="user in users"
      :key="user.name"
      :to="`/@${user.name}`"
      class="flex items-center gap-2 rounded-2 p-2 transition-colors duration-200 hover:bg-gray-1 hover:dark:bg-gray-9"
    >
      <Avatar size="sm">
        <AvatarImage
          :alt="`User avatar for ${user.name}}`"
          :src="`${proxyUrl}${user.avatar_url}`"
        />
        <AvatarFallback>{{ user.name }}</AvatarFallback>
      </Avatar>
      @{{ user.screen_name }}
    </RouterLink>
  </ul>
</template>
