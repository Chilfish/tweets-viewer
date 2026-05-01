import { describe, expect, it } from 'vitest'
import { useUserStore } from '../use-user-store'

describe('useUserStore', () => {
  it('should initialize with correct defaults', () => {
    const state = useUserStore.getState()
    expect(state.users).toEqual([])
    expect(state.activeUser).toBeNull()
    expect(state.isInitialized).toBe(false)
  })

  it('should set users', () => {
    const users = [{ id: '1', userName: 'alice', fullName: 'Alice' }] as any
    useUserStore.getState().setUsers(users)
    expect(useUserStore.getState().users).toEqual(users)
  })

  it('should set active user', () => {
    const user = { id: '1', userName: 'alice', fullName: 'Alice' } as any
    useUserStore.getState().setActiveUser(user)
    expect(useUserStore.getState().activeUser).toEqual(user)
    useUserStore.getState().setActiveUser(null)
    expect(useUserStore.getState().activeUser).toBeNull()
  })

  it('should set initialized', () => {
    useUserStore.getState().setInitialized(true)
    expect(useUserStore.getState().isInitialized).toBe(true)
  })
})
