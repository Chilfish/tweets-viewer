import type { EnrichedTweet, MediaDetails } from '@tweets-viewer/rettiwt-api'
import { create } from 'zustand'

interface MediaViewerState {
  tweet: EnrichedTweet | null
  items: MediaDetails[]
  currentIndex: number
  isOpen: boolean
  open: (tweet: EnrichedTweet, index: number) => void
  close: () => void
  setCurrentIndex: (index: number) => void
}

export const useMediaViewer = create<MediaViewerState>(set => ({
  tweet: null,
  items: [],
  currentIndex: 0,
  isOpen: false,
  open: (tweet, index) => set({
    tweet,
    items: tweet.media_details || [],
    currentIndex: index,
    isOpen: true,
  }),
  close: () => set({ isOpen: false, tweet: null, items: [] }),
  setCurrentIndex: index => set({ currentIndex: index }),
}))
