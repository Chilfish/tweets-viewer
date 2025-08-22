import { create } from 'zustand'
import { getUsers } from '~/lib/users-api'
import type { User } from '~/types'

interface UserState {
  users: User[]
  curUser: User | null
  isLoading: boolean
  error: string | null
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
}

export const useUserStore = create<UserStore>((set, get) => ({
  ...initialState,

  fetchUsers: async () => {
    set({ isLoading: true, error: null })
    const users = await getUsers()
    set({ users, isLoading: false, error: null })
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
