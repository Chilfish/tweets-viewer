import { create } from 'zustand'
import { getUser as fetchUser } from '~/lib/mock-data'
import type { User } from '~/types'

interface UserState {
  users: Record<string, User>
  isLoading: boolean
  error: string | null
}

interface UserActions {
  getUser: (screenName: string) => Promise<User>
  setUser: (screenName: string, user: User) => void
  clearError: () => void
}

type UserStore = UserState & UserActions

const initialState: UserState = {
  users: {},
  isLoading: false,
  error: null,
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
      const user = fetchUser(screenName)

      set((state) => ({
        users: { ...state.users, [screenName]: user },
        isLoading: false,
      }))

      return user
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

  clearError: () => {
    set({ error: null })
  },
}))
