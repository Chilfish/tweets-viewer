import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getUsers } from '~/lib/users-api'
import type { User } from '~/types'

const TWENTY_FOUR_HOURS_IN_MS = 24 * 60 * 60 * 1000

interface UserState {
  users: User[]
  curUser: User | null
  isLoading: boolean
  error: string | null
  lastFetched: number | null
}

interface UserActions {
  fetchUsers: () => Promise<void>
  getUser: (screenName: string) => Promise<User | null>
  setUser: (screenName: string, user: User) => void
  setCurUser: (screenName: string) => void
  findUserById: (userId: string) => User | null
  clearError: () => void
}

type UserStore = UserState & UserActions

const initialState: UserState = {
  users: [],
  isLoading: false,
  error: null,
  curUser: null,
  lastFetched: null,
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchUsers: async () => {
        const { users, lastFetched } = get()
        if (
          users.length > 0 &&
          lastFetched &&
          Date.now() - lastFetched < TWENTY_FOUR_HOURS_IN_MS
        ) {
          return
        }

        set({ isLoading: true, error: null })
        try {
          const fetchedUsers = await getUsers()
          set({
            users: fetchedUsers,
            isLoading: false,
            error: null,
            lastFetched: Date.now(),
          })
        } catch (e) {
          set({ isLoading: false, error: 'Failed to fetch users.' })
        }
      },

      getUser: async (screenName) => {
        const state = get()
        const user =
          state.users.find((user) => user.screenName === screenName) || null

        if (user) {
          set({ curUser: user })
          return user
        }

        return null
      },

      setUser: (screenName, user) => {
        set((state) => ({
          users: { ...state.users, [screenName]: user },
        }))
      },

      setCurUser: (screenName) => {
        set((state) => ({
          curUser: state.users.find((u) => u.screenName === screenName) || null,
        }))
      },

      findUserById: (userId) => {
        const state = get()
        return state.users.find((user) => user.restId === userId) || null
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'tweets-viewer-user-storage',
      partialize: (state) => ({
        users: state.users,
        lastFetched: state.lastFetched,
      }),
    },
  ),
)
