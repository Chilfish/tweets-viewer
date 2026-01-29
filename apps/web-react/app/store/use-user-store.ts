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
}

interface UserActions {
  setUsers: (users: EnrichedUser[]) => void
  setActiveUser: (user: EnrichedUser | null) => void
  setHasHydrated: (state: boolean) => void
}

type UserStore = UserState & UserActions

export const useUserStore = create<UserStore>()(
  persist(
    set => ({
      users: [],
      activeUser: null,
      _hasHydrated: false,

      setUsers: users => set({ users }),
      setActiveUser: activeUser => set({ activeUser }),
      setHasHydrated: state => set({ _hasHydrated: state }),
    }),
    {
      name: 'tweets-viewer-user-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)
