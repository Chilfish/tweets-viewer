<script setup lang="ts">
import Loading from '~/components/icon/Loading'
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar'
import { RouterLink } from 'vue-router'
import { useUsersStore } from '~/stores/users'

const usersStore = useUsersStore()
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

    <Loading
      v-if="usersStore.users.length === 0"
      class="pt-2"
    />

    <template v-else>
      <RouterLink
        v-for="user in usersStore.users"
        :key="user.screenName"
        :to="`/@${user.screenName}/`"
        class="flex items-center gap-2 rounded-md p-2 transition-colors duration-200 hover:bg-accent hover:text-accent-foreground"
      >
        <Avatar size="sm">
          <AvatarImage
            :alt="`User avatar for ${user.name}}`"
            :src="user.avatarUrl"
          />
          <AvatarFallback>{{ user.name }}</AvatarFallback>
        </Avatar>
        @{{ user.name }}
      </RouterLink>
    </template>
  </ul>
</template>
