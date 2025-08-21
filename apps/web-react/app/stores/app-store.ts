import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  isDarkMode: boolean
  currentLayout: 'mobile' | 'desktop'
  sidebarCollapsed: boolean
}

interface AppActions {
  toggleDarkMode: () => void
  setDarkMode: (isDark: boolean) => void
  setCurrentLayout: (layout: 'mobile' | 'desktop') => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

type AppStore = AppState & AppActions

const initialState: AppState = {
  isDarkMode: false,
  currentLayout: 'desktop',
  sidebarCollapsed: false,
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...initialState,

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
