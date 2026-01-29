import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  /** Sidebar collapse state */
  sidebarCollapsed: boolean
  /** Data display density */
  density: 'comfortable' | 'compact'

  _hasHydrated: boolean
}

interface AppActions {
  setSidebarCollapsed: (collapsed: boolean) => void
  setDensity: (density: AppState['density']) => void
  setHasHydrated: (state: boolean) => void
}

type AppStore = AppState & AppActions

export const useAppStore = create<AppStore>()(
  persist(
    set => ({
      sidebarCollapsed: false,
      density: 'comfortable',
      _hasHydrated: false,

      setSidebarCollapsed: collapsed => set({ sidebarCollapsed: collapsed }),
      setDensity: density => set({ density }),
      setHasHydrated: state => set({ _hasHydrated: state }),
    }),
    {
      name: 'tweets-viewer-app-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)
