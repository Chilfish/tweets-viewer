<script setup lang="ts">
import { onBeforeMount } from 'vue'
import Loading from '~/components/icon/Loading'
import { useUsersStore } from '~/stores/users'
import { avatarUrl } from '~/utils'

const usersStore = useUsersStore()

onBeforeMount(async () => {
  await usersStore.fetchUsers()
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

    <Loading
      v-if="usersStore.users.length === 0"
      class="pt-2"
    />

    <template v-else>
      <RouterLink
        v-for="user in usersStore.users"
        :key="user.screenName"
        :to="`/@${user.screenName}`"
        class="flex items-center gap-2 rounded-2 p-2 transition-colors duration-200 hover:bg-gray-1 hover:dark:bg-gray-9"
      >
        <Avatar size="sm">
          <AvatarImage
            :alt="`User avatar for ${user.name}}`"
            :src="avatarUrl(user.screenName)"
          />
          <AvatarFallback>{{ user.name }}</AvatarFallback>
        </Avatar>
        @{{ user.name }}
      </RouterLink>
    </template>
  </ul>
</template>
