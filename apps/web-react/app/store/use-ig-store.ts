import type { IGPost } from '@tweets-viewer/shared'
import { create } from 'zustand'

export type StreamStatus = 'idle' | 'fetching' | 'ready' | 'exhausted' | 'error'

interface IGStreamState {
  posts: IGPost[]
  status: StreamStatus
}

interface IGStreamActions {
  setStatus: (status: StreamStatus) => void
  appendPosts: (newPosts: IGPost[]) => void
  resetStream: () => void
}

type IGStore = IGStreamState & IGStreamActions

export const useIGStore = create<IGStore>()(set => ({
  posts: [],
  status: 'idle',

  setStatus: status => set({ status }),

  appendPosts: newPosts => set((state) => {
    const existingIds = new Set(state.posts.map(p => p.id))
    const uniqueNew = newPosts.filter(p => !existingIds.has(p.id))
    return {
      posts: [...state.posts, ...uniqueNew],
      status: 'ready',
    }
  }),

  resetStream: () => set({ posts: [], status: 'idle' }),
}))
