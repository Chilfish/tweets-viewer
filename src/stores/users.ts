import type { User } from '~/types'
import { useRouteParams } from '@vueuse/router'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fallbackUser } from '~/constant'
import { convertDate } from '~/utils/date'
import { request } from '~/utils/fetch'

export const useUsersStore = defineStore('users', () => {
  const users = ref<User[]>([])
  const name = useRouteParams<string>('name', fallbackUser)

  const curUser = computed<User>(() => {
    return users.value.find(user => user.screenName === name.value) || {
      screenName: fallbackUser,
      name: fallbackUser,
      avatarUrl: fallbackUser,
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
    const { data } = await request<User[]>('/users/get')
    data.forEach(convertDate)
    users.value = data
  }

  return {
    users,
    curUser,
    fetchUsers,
  }
})
