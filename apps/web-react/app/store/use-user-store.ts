import type { EnrichedUser } from '@tweets-viewer/rettiwt-api'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserState {
  /** All archived users */
  users: EnrichedUser[]
  /** Currently selected/active user */
  activeUser: EnrichedUser | null
  /** UserNames of recently viewed users (newest first, capped) */
  recentUserNames: string[]

  // Hydration status for Next.js/SSR safety
  _hasHydrated: boolean
  /** Whether the initial fetch of users has been completed in this session */
  isInitialized: boolean
}

interface UserActions {
  setUsers: (users: EnrichedUser[]) => void
  setActiveUser: (user: EnrichedUser | null) => void
  /** Record a user visit into the recent list (dedupe + move to front + cap). */
  pushRecentUser: (userName: string) => void
  setHasHydrated: (state: boolean) => void
  setInitialized: (state: boolean) => void
}

type UserStore = UserState & UserActions

/** Keep the persisted recent list small — it only powers the home entry. */
const MAX_RECENT_USERS = 6

export const useUserStore = create<UserStore>()(
  persist(
    set => ({
      users: [],
      activeUser: null,
      recentUserNames: [],
      _hasHydrated: false,
      isInitialized: false,

      setUsers: users => set({ users }),
      setActiveUser: activeUser => set({ activeUser }),
      pushRecentUser: userName => set((state) => {
        const recent = [
          userName,
          ...state.recentUserNames.filter(name => name !== userName),
        ].slice(0, MAX_RECENT_USERS)
        return { recentUserNames: recent }
      }),
      setHasHydrated: state => set({ _hasHydrated: state }),
      setInitialized: state => set({ isInitialized: state }),
    }),
    {
      name: 'tweets-viewer-user-storage',
      // Only persist users, activeUser and recentUserNames.
      // isInitialized and _hasHydrated will reset to false on page reload.
      partialize: state => ({
        users: state.users,
        activeUser: state.activeUser,
        recentUserNames: state.recentUserNames,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)
