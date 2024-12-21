import type { User } from '~/types'
import { useRouteParams } from '@vueuse/router'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { request } from '~/utils/fetch'

export const useUsersStore = defineStore('users', () => {
  const users = ref<User[]>([])
  const name = useRouteParams<string>('name', '')

  const curUser = computed<User>(() => {
    return users.value.find(user => user.screenName === name.value) || {
      screenName: '',
      name: '',
      restId: '',
      avatarUrl: '',
      description: '',
      followersCount: 0,
      profileBannerUrl: '',
      bio: '',
      friendsCount: 0,
      statusesCount: 0,
      profileImageUrl: '',
      website: '',
      location: '',
      followingCount: 0,
      tweetStart: new Date(),
      birthday: new Date(),
      tweetEnd: new Date(),
      createdAt: new Date(),
    }
  })

  async function fetchUsers() {
    if (users.value.length > 0)
      return
    const { data } = await request<User[]>('/users/get', {
      id: 'get-users',
    })
    users.value = data
  }

  return {
    users,
    curUser,
    fetchUsers,
  }
})
