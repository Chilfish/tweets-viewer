import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import { create } from 'zustand'

export type StreamStatus = 'idle' | 'fetching' | 'ready' | 'exhausted' | 'error'

interface TweetStreamState {
  /** The aggregated tweet list */
  tweets: EnrichedTweet[]
  /** Current stream status */
  status: StreamStatus
  /** Current sorting order */
  reverse: boolean
}

interface TweetStreamActions {
  setStatus: (status: StreamStatus) => void
  setReverse: (reverse: boolean) => void
  /** Append new tweets to the existing list (for infinity scroll) */
  appendTweets: (newTweets: EnrichedTweet[]) => void
  /** Set tweets for a fresh start */
  setTweets: (tweets: EnrichedTweet[]) => void
  /** Reset everything when switching users */
  resetStream: () => void
}

type TweetStore = TweetStreamState & TweetStreamActions

export const useTweetStore = create<TweetStore>()(set => ({
  tweets: [],
  status: 'idle',
  reverse: false,

  setStatus: status => set({ status }),
  setReverse: reverse => set({ reverse }),

  appendTweets: newTweets => set((state) => {
    // Basic de-duplication based on ID
    const existingIds = new Set(state.tweets.map(t => t.id))
    const uniqueNewTweets = newTweets.filter(t => !existingIds.has(t.id))

    return {
      tweets: [...state.tweets, ...uniqueNewTweets],
      status: 'ready',
    }
  }),

  setTweets: tweets => set({ tweets, status: 'ready' }),

  resetStream: () => set({
    tweets: [],
    status: 'idle',
  }),
}))
