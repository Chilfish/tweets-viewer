import { create } from 'zustand'
import { fetchUsers } from '~/lib/mock-data'
import type { User } from '~/types'

interface UserState {
  users: Record<string, User>
  curUser: User | null
  isLoading: boolean
  error: string | null
}

interface UserActions {
  getUser: (screenName: string) => Promise<User>
  setUser: (screenName: string, user: User) => void
  setCurUser: (screenName: string) => void
  findUserById: (userId: string) => User | null
  clearError: () => void
}

type UserStore = UserState & UserActions

const initialState: UserState = {
  users: {},
  isLoading: false,
  error: null,
  curUser: null,
}

export const useUserStore = create<UserStore>((set, get) => ({
  ...initialState,

  getUser: async (screenName) => {
    const state = get()

    // 如果已经缓存了用户数据，直接返回
    if (state.users[screenName]) {
      return state.users[screenName]
    }

    set({ isLoading: true, error: null })

    try {
      // 模拟异步获取用户数据
      await new Promise((resolve) => setTimeout(resolve, 300))
      const users = fetchUsers()

      set(() => ({
        users,
        isLoading: false,
      }))

      return users[screenName] || null
    } catch (error) {
      set({
        error: 'Failed to load user data. Please try again.',
        isLoading: false,
      })
      console.error('Error loading user:', error)
      throw error
    }
  },

  setUser: (screenName, user) => {
    set((state) => ({
      users: { ...state.users, [screenName]: user },
    }))
  },

  setCurUser: (screenName) => {
    set((state) => ({
      curUser: state.users[screenName] || null,
    }))
  },

  findUserById: (userId) => {
    const state = get()
    return (
      Object.values(state.users).find((user) => user.restId === userId) || null
    )
  },

  clearError: () => {
    set({ error: null })
  },
}))
