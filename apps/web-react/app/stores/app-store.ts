import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MediaItem } from '~/stores/media-store'
import type { Tweet, TweetMedia, UserInfo } from '@tweets-viewer/shared'

// 推文媒体模态框状态 (用于 media-grid)
interface TweetMediaModalState {
  isOpen: boolean
  currentMediaItems: MediaItem[]
  currentMediaIndex: number
  currentTweet: Tweet | null
  currentUser: UserInfo | null
}

// 媒体预览模态框状态 (用于 tweet-card)
interface MediaPreviewModalState {
  isOpen: boolean
  currentMediaItems: TweetMedia[]
  currentMediaIndex: number
}

interface AppState {
  isDarkMode: boolean
  currentLayout: 'mobile' | 'desktop'
  sidebarCollapsed: boolean
  tweetMediaModal: TweetMediaModalState
  mediaPreviewModal: MediaPreviewModalState
}

interface AppActions {
  // 通用应用状态
  toggleDarkMode: () => void
  setDarkMode: (isDark: boolean) => void
  setCurrentLayout: (layout: 'mobile' | 'desktop') => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void

  // 推文媒体模态框 (用于 media-grid)
  openTweetMediaModal: (params: {
    mediaItems: MediaItem[]
    startIndex: number
    tweet: Tweet
    user: UserInfo
  }) => void
  closeTweetMediaModal: () => void
  setTweetMediaIndex: (index: number) => void

  // 媒体预览模态框 (用于 tweet-card)
  openMediaPreviewModal: (params: {
    mediaItems: TweetMedia[]
    startIndex: number
  }) => void
  closeMediaPreviewModal: () => void
  setMediaPreviewIndex: (index: number) => void
}

type AppStore = AppState & AppActions

const initialState: AppState = {
  isDarkMode: false,
  currentLayout: 'desktop',
  sidebarCollapsed: false,
  tweetMediaModal: {
    isOpen: false,
    currentMediaItems: [],
    currentMediaIndex: 0,
    currentTweet: null,
    currentUser: null,
  },
  mediaPreviewModal: {
    isOpen: false,
    currentMediaItems: [],
    currentMediaIndex: 0,
  },
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...initialState,

      // 通用应用状态管理
      toggleDarkMode: () => {
        set((state) => ({ isDarkMode: !state.isDarkMode }))
      },

      setDarkMode: (isDark) => {
        set({ isDarkMode: isDark })
      },

      setCurrentLayout: (layout) => {
        set({ currentLayout: layout })
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
      },

      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed })
      },

      // 推文媒体模态框管理 (用于 media-grid)
      openTweetMediaModal: ({ mediaItems, startIndex, tweet, user }) => {
        set({
          tweetMediaModal: {
            isOpen: true,
            currentMediaItems: mediaItems,
            currentMediaIndex: startIndex,
            currentTweet: tweet,
            currentUser: user,
          },
        })
      },

      closeTweetMediaModal: () => {
        set((state) => ({
          tweetMediaModal: {
            ...state.tweetMediaModal,
            isOpen: false,
          },
        }))
      },

      setTweetMediaIndex: (index) => {
        set((state) => ({
          tweetMediaModal: {
            ...state.tweetMediaModal,
            currentMediaIndex: index,
          },
        }))
      },

      // 媒体预览模态框管理 (用于 tweet-card)
      openMediaPreviewModal: ({ mediaItems, startIndex }) => {
        set({
          mediaPreviewModal: {
            isOpen: true,
            currentMediaItems: mediaItems,
            currentMediaIndex: startIndex,
          },
        })
      },

      closeMediaPreviewModal: () => {
        set((state) => ({
          mediaPreviewModal: {
            ...state.mediaPreviewModal,
            isOpen: false,
          },
        }))
      },

      setMediaPreviewIndex: (index) => {
        set((state) => ({
          mediaPreviewModal: {
            ...state.mediaPreviewModal,
            currentMediaIndex: index,
          },
        }))
      },
    }),
    {
      name: 'app-settings',
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    },
  ),
)
