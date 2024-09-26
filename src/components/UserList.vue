<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { proxyUrl } from '~/constant'
import { useTweetStore } from '~/stores/tweets'
import type { User } from '~/types/tweets'

const tweetStore = useTweetStore()
const users = ref<User[]>([])

onBeforeMount(async () => {
  users.value = await tweetStore.tweetService.getUsers()
})
</script>

<template>
  <ul
    class="flex flex-col text-3.5"
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
