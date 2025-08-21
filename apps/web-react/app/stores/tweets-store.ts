import { create } from 'zustand'
import { getTweets as fetchTweets } from '~/lib/mock-data'
import type { Tweet, User } from '~/types'

interface TweetsState {
  tweets: Tweet[]
  isLoading: boolean
  hasMore: boolean
  error: string | null
  page: number
  currentUser: User | null
}

interface TweetsActions {
  setCurrentUser: (user: User) => void
  loadTweets: (screenName: string, isFirstLoad?: boolean) => Promise<void>
  loadMoreTweets: (screenName: string) => Promise<void>
  reset: () => void
}

type TweetsStore = TweetsState & TweetsActions

const initialState: TweetsState = {
  tweets: [],
  isLoading: false,
  hasMore: true,
  error: null,
  page: 1,
  currentUser: null,
}

export const useTweetsStore = create<TweetsStore>((set, get) => ({
  ...initialState,

  setCurrentUser: (user) => {
    set({ currentUser: user })
  },

  loadTweets: async (screenName, isFirstLoad = true) => {
    const state = get()
    if (state.isLoading) return

    set({ isLoading: true, error: null })

    try {
      const result = await fetchTweets(
        screenName,
        isFirstLoad ? 1 : state.page,
        10,
      )

      set({
        tweets: isFirstLoad
          ? result.tweets
          : [...state.tweets, ...result.tweets],
        hasMore: result.hasMore,
        page: isFirstLoad ? 2 : state.page + 1,
        isLoading: false,
      })
    } catch (error) {
      set({
        error: 'Failed to load tweets. Please try again.',
        isLoading: false,
      })
      console.error('Error loading tweets:', error)
    }
  },

  loadMoreTweets: async (screenName) => {
    const state = get()
    if (!state.hasMore || state.isLoading) return

    await state.loadTweets(screenName, false)
  },

  reset: () => {
    set(initialState)
  },
}))
