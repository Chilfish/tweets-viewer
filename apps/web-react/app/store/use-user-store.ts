import type { EnrichedUser } from '@tweets-viewer/rettiwt-api'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserState {
  /** All archived users */
  users: EnrichedUser[]
  /** Currently selected/active user */
  activeUser: EnrichedUser | null

  // Hydration status for Next.js/SSR safety
  _hasHydrated: boolean
  /** Whether the initial fetch of users has been completed in this session */
  isInitialized: boolean
}

interface UserActions {
  setUsers: (users: EnrichedUser[]) => void
  setActiveUser: (user: EnrichedUser | null) => void
  setHasHydrated: (state: boolean) => void
  setInitialized: (state: boolean) => void
}

type UserStore = UserState & UserActions

export const useUserStore = create<UserStore>()(
  persist(
    set => ({
      users: [],
      activeUser: null,
      _hasHydrated: false,
      isInitialized: false,

      setUsers: users => set({ users }),
      setActiveUser: activeUser => set({ activeUser }),
      setHasHydrated: state => set({ _hasHydrated: state }),
      setInitialized: state => set({ isInitialized: state }),
    }),
    {
      name: 'tweets-viewer-user-storage',
      // Only persist users and activeUser.
      // isInitialized and _hasHydrated will reset to false on page reload.
      partialize: state => ({
        users: state.users,
        activeUser: state.activeUser,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)
