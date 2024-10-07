<script setup lang="ts">
import { newVersions } from '~/stores/version'
import { avatarUrl } from '~/utils'

interface UserInfo {
  name: string
  screen_name: string
  avatar_url: string
}

const users = newVersions.value
  .map(({ name: key, username: screen_name }) => {
    const name = key.split('-')[1]
    return {
      name,
      screen_name,
      avatar_url: avatarUrl(name),
    } as UserInfo
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
          :src="avatarUrl(user.name)"
        />
        <AvatarFallback>{{ user.name }}</AvatarFallback>
      </Avatar>
      @{{ user.screen_name }}
    </RouterLink>
  </ul>
</template>
